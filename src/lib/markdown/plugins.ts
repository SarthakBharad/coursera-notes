/**
 * Small rehype plugins that give the notes their structure: heading kickers and
 * anchors, callout boxes, figures with captions, scrollable tables, a
 * spoiler-protected answers section, and safe external links.
 */
import fs from "node:fs";
import path from "node:path";
import type { Element, ElementContent, Root } from "hast";
import { toString } from "hast-util-to-string";
import { imageSize } from "image-size";
import { visit, SKIP } from "unist-util-visit";
import { mediaUrl } from "../content/loader";
import { CALLOUT_KINDS, GITHUB_ALERTS, type CalloutKind } from "./callout-kinds";
import { h, hasClass, isElement, isWhitespace, setHeadingInfo, text } from "./hast";

/* ------------------------------------------------------------------------ */
/* Headings                                                                  */
/* ------------------------------------------------------------------------ */

const KICKER = /^((?:Part|Chapter|Unit|Lesson|Week|Section|Module|Appendix)\s+[\dIVXLA-Z]+)\s*[:.—–-]\s+/;
const NUMBER = /^(\d+(?:\.\d+)+)\.?\s+/;

/**
 * "Part 3: Computer Language" -> kicker "Part 3" + "Computer Language".
 * "3.1 What does…"             -> number "3.1" + "What does…".
 * Also appends a "#" link so every section can be linked to.
 */
export function rehypeHeadings() {
  return (tree: Root) => {
    visit(tree, "element", (node) => {
      if (!isElement(node, ["h2", "h3", "h4"])) return;
      const id = typeof node.properties.id === "string" ? node.properties.id : undefined;
      const first = node.children[0];
      let kicker: string | undefined;
      let num: string | undefined;

      if (first?.type === "text") {
        const kickerMatch = node.tagName === "h2" ? KICKER.exec(first.value) : null;
        const numberMatch = node.tagName !== "h2" ? NUMBER.exec(first.value) : null;
        if (kickerMatch?.[1]) {
          kicker = kickerMatch[1];
          first.value = first.value.slice(kickerMatch[0].length);
          node.children.unshift(h("span", { className: ["h-kicker"] }, [text(kicker)]));
        } else if (numberMatch?.[1]) {
          num = numberMatch[1];
          first.value = first.value.slice(numberMatch[0].length);
          node.children.unshift(h("span", { className: ["h-num"] }, [text(num)]));
        }
      }

      const content = node.children.filter((child) => !(isElement(child, "span") && (hasClass(child, "h-kicker") || hasClass(child, "h-num"))));
      setHeadingInfo(node, { kicker, num, text: toString({ type: "root", children: content }).trim() });

      if (id) {
        node.children.push(
          h("a", { className: ["h-anchor"], href: `#${id}`, ariaLabel: "Link to this section" }, [text("#")]),
        );
      }
      return SKIP;
    });
  };
}

/* ------------------------------------------------------------------------ */
/* Callouts                                                                  */
/* ------------------------------------------------------------------------ */

const NAME_TO_KIND = new Map<string, CalloutKind>();
for (const [kind, config] of Object.entries(CALLOUT_KINDS) as [CalloutKind, (typeof CALLOUT_KINDS)[CalloutKind]][]) {
  for (const name of config.names) NAME_TO_KIND.set(name, kind);
}
const NAME_PATTERN = new RegExp(
  `^(${[...NAME_TO_KIND.keys()].sort((a, b) => b.length - a.length).join("|")})\\b\\s*(.*)$`,
  "is",
);

function cleanSubtitle(rest: string): string | undefined {
  const cleaned = rest
    .trim()
    .replace(/^[—–-]\s*/, "")
    .replace(/:\s*$/, "")
    .replace(/^\((.*)\)$/s, "$1")
    .trim();
  return cleaned || undefined;
}

function trimLeading(children: ElementContent[]): void {
  while (children[0] && isWhitespace(children[0])) children.shift();
  const first = children[0];
  if (first?.type === "text") first.value = first.value.replace(/^[\s:]+/, "");
}

function detectCallout(blockquote: Element): { kind: CalloutKind; subtitle?: string } | null {
  const paragraph = blockquote.children.find((child): child is Element => isElement(child));
  if (!paragraph || !isElement(paragraph, "p")) return null;
  const lead = paragraph.children[0];

  // GitHub alert: > [!NOTE]
  if (lead?.type === "text") {
    const alert = /^\[!(\w+)\]\s*/.exec(lead.value);
    const kind = alert?.[1] ? GITHUB_ALERTS[alert[1].toUpperCase()] : undefined;
    if (alert && kind) {
      lead.value = lead.value.slice(alert[0].length);
      trimLeading(paragraph.children);
      if (paragraph.children.length === 0) blockquote.children.splice(blockquote.children.indexOf(paragraph), 1);
      return { kind };
    }
    return null;
  }

  // Bold lead-in: > **Key idea:** ...
  if (!isElement(lead, "strong")) return null;
  const match = NAME_PATTERN.exec(toString(lead).trim());
  const name = match?.[1]?.toLowerCase();
  const kind = name ? NAME_TO_KIND.get(name) : undefined;
  if (!match || !kind) return null;

  paragraph.children.shift();
  trimLeading(paragraph.children);
  if (paragraph.children.length === 0) blockquote.children.splice(blockquote.children.indexOf(paragraph), 1);
  return { kind, subtitle: cleanSubtitle(match[2] ?? "") };
}

export function rehypeCallouts() {
  return (tree: Root) => {
    visit(tree, "element", (node, index, parent) => {
      if (!isElement(node, "blockquote") || index === undefined || !parent) return;
      const found = detectCallout(node);
      if (!found) return;
      const title: ElementContent[] = [h("span", { className: ["callout-label"] }, [text(CALLOUT_KINDS[found.kind].label)])];
      if (found.subtitle) title.push(h("span", { className: ["callout-sub"] }, [text(found.subtitle)]));
      parent.children[index] = h("aside", { className: ["callout"], dataCallout: found.kind }, [
        h("p", { className: ["callout-title"] }, title),
        h("div", { className: ["callout-body"] }, node.children.filter((child) => !isWhitespace(child))),
      ]);
      // Revisit the new <aside> so callouts nested inside this one are found too.
      return index;
    });
  };
}

/* ------------------------------------------------------------------------ */
/* Images and figures                                                        */
/* ------------------------------------------------------------------------ */

const sizeCache = new Map<string, { width: number; height: number } | null>();

function readSize(file: string): { width: number; height: number } | null {
  if (sizeCache.has(file)) return sizeCache.get(file) ?? null;
  let size: { width: number; height: number } | null = null;
  try {
    const result = imageSize(fs.readFileSync(file));
    if (result.width && result.height) size = { width: result.width, height: result.height };
  } catch {
    size = null;
  }
  sizeCache.set(file, size);
  return size;
}

function isExternal(src: string): boolean {
  return /^(?:[a-z][a-z\d+.-]*:|\/\/|\/|#)/i.test(src);
}

/**
 * Resolves relative image paths against the module folder, adds width/height
 * (no layout shift) and lazy loading, and turns a paragraph that holds only an
 * image into a <figure>. The caption is the image title ("...") or, failing
 * that, its alt text.
 */
export function rehypeFigures(options: { assetDir: string; sourceFile: string }) {
  return (tree: Root) => {
    visit(tree, "element", (node) => {
      if (!isElement(node, "img")) return;
      const src = typeof node.properties.src === "string" ? node.properties.src : "";
      if (src && !isExternal(src)) {
        const file = path.resolve(options.assetDir, decodeURIComponent(src));
        if (!fs.existsSync(file)) {
          console.warn(`[notes] Missing image "${src}" in ${path.relative(process.cwd(), options.sourceFile)}`);
        }
        node.properties.src = mediaUrl(file);
        const size = readSize(file);
        if (size) {
          node.properties.width = size.width;
          node.properties.height = size.height;
        }
      }
      node.properties.loading = "lazy";
      node.properties.decoding = "async";
    });

    visit(tree, "element", (node, index, parent) => {
      if (!isElement(node, "p") || index === undefined || !parent) return;
      const meaningful = node.children.filter((child) => !isWhitespace(child));
      const only = meaningful[0];
      if (meaningful.length !== 1 || !isElement(only)) return;
      let image: Element | null = null;
      if (only.tagName === "img") image = only;
      else if (only.tagName === "a" && only.children.length === 1 && isElement(only.children[0], "img")) image = only.children[0];
      if (!image) return;

      const title = typeof image.properties.title === "string" ? image.properties.title : undefined;
      const alt = typeof image.properties.alt === "string" ? image.properties.alt : undefined;
      delete image.properties.title;
      const caption = title ?? alt;
      const children: ElementContent[] = [only];
      if (caption) children.push(h("figcaption", {}, [text(caption)]));
      parent.children[index] = h("figure", { className: ["figure"] }, children);
      return SKIP;
    });
  };
}

/* ------------------------------------------------------------------------ */
/* Tables                                                                    */
/* ------------------------------------------------------------------------ */

/** Wraps tables so wide ones scroll sideways on small screens instead of overflowing. */
export function rehypeTables() {
  return (tree: Root) => {
    visit(tree, "element", (node, index, parent) => {
      if (!isElement(node, "table") || index === undefined || !parent) return;
      if (isElement(parent, "div") && hasClass(parent, "table-wrap")) return;
      parent.children[index] = h("div", { className: ["table-wrap"] }, [node]);
      return SKIP;
    });
  };
}

/* ------------------------------------------------------------------------ */
/* Answers                                                                   */
/* ------------------------------------------------------------------------ */

const ANSWERS = /^(answers?|solutions?)\b/i;

/**
 * A top-level "## Answers…" section is hidden behind a "Reveal answers" button
 * so the exercises can be tried first. Every "Try it" callout gets a link to it.
 */
export function rehypeAnswers() {
  return (tree: Root) => {
    const children = tree.children;
    const start = children.findIndex((node) => isElement(node, "h2") && ANSWERS.test(toString(node).replace(/#$/, "").trim()));
    if (start === -1) return;
    const heading = children[start] as Element;
    const id = typeof heading.properties.id === "string" ? heading.properties.id : undefined;

    let end = start + 1;
    while (end < children.length && !isElement(children[end], ["h1", "h2"])) end++;
    const body = children.slice(start + 1, end).filter((node) => node.type !== "text" || node.value.trim() !== "") as ElementContent[];
    children.splice(start + 1, end - start - 1, h("div", { className: ["answers"], dataAnswers: "" }, body));

    if (!id) return;
    visit(tree, "element", (node) => {
      if (isElement(node, "aside") && node.properties.dataCallout === "try-it") {
        node.children.push(h("a", { className: ["callout-answers"], href: `#${id}` }, [text("Check your answers ↓")]));
        return SKIP;
      }
    });
  };
}

/* ------------------------------------------------------------------------ */
/* Links                                                                     */
/* ------------------------------------------------------------------------ */

/** External links open in a new tab. */
export function rehypeLinks() {
  return (tree: Root) => {
    visit(tree, "element", (node) => {
      if (!isElement(node, "a")) return;
      const href = typeof node.properties.href === "string" ? node.properties.href : "";
      if (/^https?:\/\//i.test(href)) {
        node.properties.target = "_blank";
        node.properties.rel = ["noopener", "noreferrer"];
      }
    });
  };
}
