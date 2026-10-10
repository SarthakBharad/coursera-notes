"use client";

import { useEffect, useMemo, useRef } from "react";
import type { TocEntry } from "@/lib/content/types";
import { formatMinutes } from "@/lib/content/text";
import { ListIcon } from "../Icons";
import { useActiveSection, useScrollProgress } from "./ReaderProvider";

interface Group {
  entry: TocEntry;
  children: TocEntry[];
}

function groupToc(toc: TocEntry[]): Group[] {
  const groups: Group[] = [];
  for (const entry of toc) {
    const last = groups[groups.length - 1];
    if (entry.depth === 3 && last) last.children.push(entry);
    else groups.push({ entry, children: [] });
  }
  return groups;
}

function TimeLeft({ minutes }: { minutes: number }) {
  const progress = useScrollProgress();
  const left = progress >= 0.99 ? 0 : Math.max(1, Math.round(minutes * (1 - progress)));
  const percent = Math.round(progress * 100);
  return (
    <div className="toc__meter">
      <div className="toc__meter-bar" aria-hidden="true">
        <span style={{ transform: `scaleX(${progress})` }} />
      </div>
      <p className="toc__meter-text">
        <span>{percent}% read</span>
        <span>{left > 0 ? `${formatMinutes(left)} left` : "Finished"}</span>
      </p>
    </div>
  );
}

function TocList({ toc, onNavigate }: { toc: TocEntry[]; onNavigate?: () => void }) {
  const activeId = useActiveSection();
  const groups = useMemo(() => groupToc(toc), [toc]);
  const activeGroup = groups.find((group) => group.entry.id === activeId || group.children.some((child) => child.id === activeId));

  return (
    <ol className="toc__list">
      {groups.map((group) => {
        const open = group === activeGroup;
        return (
          <li key={group.entry.id} className="toc__group" data-open={open}>
            <a
              href={`#${group.entry.id}`}
              className="toc__link toc__link--top"
              aria-current={activeId === group.entry.id ? "location" : undefined}
              data-in-group={open || undefined}
              onClick={onNavigate}
            >
              {group.entry.kicker && <span className="toc__kicker">{group.entry.kicker}</span>}
              <span>{group.entry.text}</span>
            </a>
            {group.children.length > 0 && (
              <div className="toc__sub-wrap">
                <ol className="toc__sub">
                  {group.children.map((child) => (
                    <li key={child.id}>
                      <a
                        href={`#${child.id}`}
                        className="toc__link toc__link--sub"
                        aria-current={activeId === child.id ? "location" : undefined}
                        tabIndex={open ? undefined : -1}
                        onClick={onNavigate}
                      >
                        {child.num && <span className="toc__num">{child.num}</span>}
                        <span>{child.text}</span>
                      </a>
                    </li>
                  ))}
                </ol>
              </div>
            )}
          </li>
        );
      })}
    </ol>
  );
}

/** "On this page" rail for wide screens; keeps the current section in view. */
export function TableOfContents({ toc, minutes }: { toc: TocEntry[]; minutes: number }) {
  const ref = useRef<HTMLElement>(null);
  const activeId = useActiveSection();

  useEffect(() => {
    const container = ref.current;
    const link = container?.querySelector<HTMLElement>('[aria-current="location"]');
    if (!container || !link) return;
    const top = link.offsetTop - container.offsetTop;
    if (top < container.scrollTop + 40 || top > container.scrollTop + container.clientHeight - 80) {
      container.scrollTo({ top: Math.max(0, top - container.clientHeight / 3), behavior: "smooth" });
    }
  }, [activeId]);

  return (
    <nav ref={ref} className="toc" aria-label="On this page">
      <p className="toc__label">On this page</p>
      <TimeLeft minutes={minutes} />
      <TocList toc={toc} />
    </nav>
  );
}

/** Floating "Contents" button with a bottom sheet, for narrow screens. */
export function MobileContents({ toc, minutes }: { toc: TocEntry[]; minutes: number }) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const progress = useScrollProgress();
  const close = () => dialogRef.current?.close();

  return (
    <>
      <button type="button" className="contents-fab" onClick={() => dialogRef.current?.showModal()} aria-label="Open contents">
        <ListIcon />
        <span>Contents</span>
        <span className="contents-fab__pct">{Math.round(progress * 100)}%</span>
      </button>
      <dialog
        ref={dialogRef}
        className="sheet"
        aria-label="Contents"
        onClick={(event) => {
          if (event.target === dialogRef.current) close();
        }}
      >
        <div className="sheet__panel toc">
          <div className="sheet__head">
            <p className="toc__label">On this page</p>
            <button type="button" className="btn btn--ghost btn--small" onClick={close}>
              Close
            </button>
          </div>
          <TimeLeft minutes={minutes} />
          <TocList toc={toc} onNavigate={close} />
        </div>
      </dialog>
    </>
  );
}
