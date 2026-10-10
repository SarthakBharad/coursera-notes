"use client";

import MiniSearch, { type SearchResult } from "minisearch";
import { useRouter } from "next/navigation";
import {
  Fragment,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
  type KeyboardEvent,
  type ReactNode,
} from "react";
import type { SearchDoc, SearchDocKind } from "@/lib/content/types";
import { BookIcon, CloseIcon, EnterIcon, GridIcon, HashIcon, LayersIcon, SearchIcon } from "./Icons";

const KIND_LABEL: Record<SearchDocKind, string> = {
  program: "Program",
  course: "Course",
  module: "Module",
  section: "Section",
};

const KIND_ICON: Record<SearchDocKind, (props: { className?: string }) => ReactNode> = {
  program: GridIcon,
  course: LayersIcon,
  module: BookIcon,
  section: HashIcon,
};

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/** Wraps every matched term in <mark>. */
function highlight(text: string, terms: string[]): ReactNode {
  if (terms.length === 0) return text;
  const pattern = new RegExp(
    `(?<![\\p{L}\\p{N}])(${terms.map(escapeRegExp).sort((a, b) => b.length - a.length).join("|")})`,
    "giu",
  );
  return text.split(pattern).map((part, index) =>
    index % 2 === 1 ? <mark key={index}>{part}</mark> : <Fragment key={index}>{part}</Fragment>,
  );
}

/** A short excerpt around the first match. */
function snippet(text: string, terms: string[], radius = 60, length = 170): string {
  if (!text) return "";
  const lower = text.toLowerCase();
  const hits = terms
    .map((term) => lower.search(new RegExp(`(?<![\\p{L}\\p{N}])${escapeRegExp(term.toLowerCase())}`, "u")))
    .filter((index) => index >= 0);
  const first = hits.length ? Math.min(...hits) : 0;
  let start = Math.max(0, first - radius);
  if (start > 0) {
    const space = text.indexOf(" ", start);
    if (space !== -1 && space < first) start = space + 1;
  }
  const end = Math.min(text.length, start + length);
  return `${start > 0 ? "… " : ""}${text.slice(start, end).trim()}${end < text.length ? " …" : ""}`;
}

type Hit = { doc: SearchDoc; terms: string[] };

const noSubscribe = () => () => {};
/** "⌘" on Apple devices, "Ctrl" elsewhere (and during server rendering). */
function useModifierLabel(): string {
  return useSyncExternalStore(
    noSubscribe,
    () => (/Mac|iPhone|iPad/.test(navigator.platform || navigator.userAgent) ? "⌘" : "Ctrl"),
    () => "Ctrl",
  );
}

export function SearchPalette() {
  const router = useRouter();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const [docs, setDocs] = useState<SearchDoc[] | null>(null);
  const [failed, setFailed] = useState(false);
  const modKey = useModifierLabel();
  const loading = useRef(false);

  const loadIndex = useCallback(() => {
    if (docs || loading.current) return;
    loading.current = true;
    fetch("/search-index.json")
      .then((response) => {
        if (!response.ok) throw new Error(String(response.status));
        return response.json() as Promise<SearchDoc[]>;
      })
      .then(setDocs)
      .catch(() => setFailed(true))
      .finally(() => {
        loading.current = false;
      });
  }, [docs]);

  const open = useCallback(() => {
    const dialog = dialogRef.current;
    if (!dialog || dialog.open) return;
    dialog.showModal();
    setIsOpen(true);
    loadIndex();
    requestAnimationFrame(() => inputRef.current?.select());
  }, [loadIndex]);

  const close = useCallback(() => {
    dialogRef.current?.close();
  }, []);

  // Ctrl/⌘ K anywhere, or "/" when not typing, opens the palette.
  useEffect(() => {
    const onKey = (event: globalThis.KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      const typing = !!target && (target.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName));
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        if (dialogRef.current?.open) close();
        else open();
      } else if (event.key === "/" && !typing && !event.metaKey && !event.ctrlKey && !event.altKey) {
        event.preventDefault();
        open();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, close]);

  const engine = useMemo(() => {
    if (!docs) return null;
    const search = new MiniSearch<SearchDoc>({
      fields: ["title", "text", "trail"],
      storeFields: ["title"],
      searchOptions: {
        // A result whose title starts with the word you typed ranks higher.
        boostDocument: (_id, term, stored) =>
          typeof stored?.title === "string" && stored.title.toLowerCase().startsWith(term) ? 1.8 : 1,
        boost: { title: 4, trail: 1.5 },
        prefix: (term) => term.length >= 2,
        fuzzy: (term) => (term.length >= 5 ? 0.2 : false),
        combineWith: "AND",
      },
    });
    search.addAll(docs);
    return search;
  }, [docs]);

  const byId = useMemo(() => new Map((docs ?? []).map((doc) => [doc.id, doc])), [docs]);

  const hits: Hit[] = useMemo(() => {
    const q = query.trim();
    if (!engine || !q) return [];
    const kindWeight: Record<SearchDocKind, number> = { program: 1.6, course: 1.3, module: 1.4, section: 1 };
    return engine
      .search(q)
      .map((result: SearchResult) => ({ result, doc: byId.get(String(result.id)) }))
      .filter((entry): entry is { result: SearchResult; doc: SearchDoc } => !!entry.doc)
      .sort((a, b) => b.result.score * kindWeight[b.doc.kind] - a.result.score * kindWeight[a.doc.kind])
      .slice(0, 24)
      .map(({ result, doc }) => ({ doc, terms: result.terms }));
  }, [engine, byId, query]);

  const programs = useMemo(() => (docs ?? []).filter((doc) => doc.kind === "program"), [docs]);
  const visible: Hit[] = query.trim() ? hits : programs.map((doc) => ({ doc, terms: [] }));

  useEffect(() => {
    listRef.current?.querySelector<HTMLElement>(`[data-index="${active}"]`)?.scrollIntoView({ block: "nearest" });
  }, [active]);

  const go = (href: string) => {
    close();
    router.push(href);
  };

  const onInputKey = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActive((index) => Math.min(index + 1, Math.max(visible.length - 1, 0)));
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActive((index) => Math.max(index - 1, 0));
    } else if (event.key === "Enter") {
      const hit = visible[active];
      if (hit) {
        event.preventDefault();
        go(hit.doc.href);
      }
    }
  };

  const status = !docs
    ? failed
      ? "Search isn't available right now."
      : "Loading notes…"
    : query.trim() && hits.length === 0
      ? `Nothing matches “${query.trim()}”.`
      : null;

  return (
    <>
      <button type="button" className="search-trigger" onClick={open} aria-label="Search notes" aria-keyshortcuts="Control+K Meta+K /">
        <SearchIcon />
        <span className="search-trigger__label">Search notes…</span>
        <span className="search-trigger__keys" aria-hidden="true">
          <kbd>{modKey}</kbd>
          <kbd>K</kbd>
        </span>
      </button>

      <dialog
        ref={dialogRef}
        className="palette"
        aria-label="Search notes"
        onClose={() => {
          setIsOpen(false);
          setQuery("");
        }}
        onClick={(event) => {
          if (event.target === dialogRef.current) close();
        }}
      >
        {isOpen && (
          <div className="palette__panel">
            <div className="palette__field">
              <SearchIcon />
              <input
                ref={inputRef}
                type="search"
                value={query}
                onChange={(event) => {
                  setQuery(event.target.value);
                  setActive(0);
                }}
                onKeyDown={onInputKey}
                placeholder="Search programs, modules and sections…"
                aria-label="Search"
                aria-controls="palette-results"
                aria-activedescendant={visible[active] ? `palette-option-${active}` : undefined}
                role="combobox"
                aria-expanded="true"
                autoComplete="off"
                autoFocus
                spellCheck={false}
              />
              <button type="button" className="icon-btn palette__close" onClick={close} aria-label="Close search">
                <CloseIcon />
              </button>
            </div>

            <div className="palette__body">
              {!query.trim() && docs && <p className="palette__heading">Programs</p>}
              {status && <p className="palette__status">{status}</p>}
              <ul ref={listRef} id="palette-results" className="palette__list" role="listbox" aria-label="Results">
                {visible.map((hit, index) => {
                  const KindIcon = KIND_ICON[hit.doc.kind];
                  const excerpt = hit.doc.kind === "section" || hit.doc.kind === "module" ? snippet(hit.doc.text, hit.terms) : "";
                  return (
                    <li
                      key={hit.doc.id}
                      id={`palette-option-${index}`}
                      data-index={index}
                      role="option"
                      aria-selected={index === active}
                      className="palette__item"
                      onMouseMove={() => setActive(index)}
                      onClick={() => go(hit.doc.href)}
                    >
                      <span className="palette__icon" data-kind={hit.doc.kind}>
                        <KindIcon />
                      </span>
                      <span className="palette__text">
                        <span className="palette__title">{highlight(hit.doc.title, hit.terms)}</span>
                        <span className="palette__trail">
                          <span className="palette__kind">{KIND_LABEL[hit.doc.kind]}</span> {hit.doc.trail}
                        </span>
                        {excerpt && <span className="palette__excerpt">{highlight(excerpt, hit.terms)}</span>}
                      </span>
                      <EnterIcon className="palette__enter" />
                    </li>
                  );
                })}
              </ul>
            </div>

            <div className="palette__foot" aria-hidden="true">
              <span>
                <kbd>↑</kbd>
                <kbd>↓</kbd> move
              </span>
              <span>
                <kbd>Enter</kbd> open
              </span>
              <span>
                <kbd>Esc</kbd> close
              </span>
            </div>
          </div>
        )}
      </dialog>
    </>
  );
}
