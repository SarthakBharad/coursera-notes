import type { Element, Root, RootContent } from "hast";
import { toString } from "hast-util-to-string";
import rehypeKatex from "rehype-katex";
import rehypePrettyCode, { type Options as PrettyCodeOptions } from "rehype-pretty-code";
import rehypeRaw from "rehype-raw";
import rehypeSlug from "rehype-slug";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import remarkParse from "remark-parse";
import remarkRehype from "remark-rehype";
import { unified } from "unified";
import type { TocEntry } from "../content/types";
import { getHeadingInfo, hasClass, isElement } from "./hast";
import { rehypeAnswers, rehypeCallouts, rehypeFigures, rehypeHeadings, rehypeLinks, rehypeTables } from "./plugins";

const prettyCode: PrettyCodeOptions = {
  // Colours for both themes are emitted as CSS variables; styles/prose.css picks one.
  theme: { light: "catppuccin-latte", dark: "catppuccin-mocha" },
  keepBackground: false,
  defaultLang: { block: "plaintext" },
};

export interface RenderOptions {
  /** Folder that relative image paths are resolved against. */
  assetDir: string;
  /** Markdown file, for warnings. */
  sourceFile: string;
}

/** Markdown (GFM + math) -> HTML syntax tree with all of the site's enhancements applied. */
export async function markdownToHast(markdown: string, options: RenderOptions): Promise<Root> {
  const processor = unified()
    .use(remarkParse)
    .use(remarkGfm)
    .use(remarkMath)
    .use(remarkRehype, { allowDangerousHtml: true })
    .use(rehypeRaw)
    .use(rehypeKatex)
    .use(rehypeSlug)
    .use(rehypeHeadings)
    .use(rehypeCallouts)
    .use(rehypeFigures, options)
    .use(rehypeTables)
    .use(rehypeAnswers)
    .use(rehypeLinks)
    .use(rehypePrettyCode, prettyCode);

  const mdast = processor.parse(markdown);
  return (await processor.run(mdast)) as Root;
}

/** H2 and H3 headings for the "On this page" list. */
export function extractToc(tree: Root): TocEntry[] {
  const toc: TocEntry[] = [];
  for (const node of tree.children) {
    if (!isElement(node, ["h2", "h3"])) continue;
    const id = node.properties.id;
    const info = getHeadingInfo(node);
    if (typeof id !== "string" || !info) continue;
    toc.push({ id, depth: node.tagName === "h2" ? 2 : 3, text: info.text, kicker: info.kicker, num: info.num });
  }
  return toc;
}

export interface Section {
  id: string;
  title: string;
  text: string;
}

function plainText(node: RootContent): string {
  if (node.type === "text") return node.value;
  if (node.type !== "element") return "";
  // Heading anchors and rendered maths would only add noise to search results.
  if (hasClass(node, "h-anchor") || hasClass(node, "katex")) return "";
  const inner = node.children.map((child) => plainText(child)).join("");
  return isBlock(node) ? ` ${inner} ` : inner;
}

const BLOCKS = new Set(["p", "li", "td", "th", "tr", "div", "aside", "figure", "figcaption", "pre", "blockquote", "h2", "h3", "h4", "table", "ul", "ol"]);
function isBlock(node: Element): boolean {
  return BLOCKS.has(node.tagName);
}

/** Splits a module into its H2/H3 sections, as plain text, for the search index. */
export function extractSections(tree: Root, introTitle: string): Section[] {
  const sections: Section[] = [];
  let current: Section = { id: "", title: introTitle, text: "" };
  for (const node of tree.children) {
    if (isElement(node, ["h2", "h3"]) && typeof node.properties.id === "string") {
      if (current.text.trim()) sections.push(current);
      const info = getHeadingInfo(node);
      current = { id: node.properties.id, title: info?.text ?? toString(node), text: "" };
      continue;
    }
    current.text += ` ${plainText(node)}`;
  }
  if (current.text.trim()) sections.push(current);
  return sections.map((section) => ({ ...section, text: section.text.replace(/\s+/g, " ").trim() }));
}
