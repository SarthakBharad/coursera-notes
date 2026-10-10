import type { Element, ElementContent, Properties, Text } from "hast";

export function h(tagName: string, properties: Properties, children: ElementContent[] = []): Element {
  return { type: "element", tagName, properties, children };
}

export function text(value: string): Text {
  return { type: "text", value };
}

export function isElement(node: unknown, tagName?: string | string[]): node is Element {
  if (!node || typeof node !== "object" || (node as Element).type !== "element") return false;
  if (!tagName) return true;
  const name = (node as Element).tagName;
  return Array.isArray(tagName) ? tagName.includes(name) : name === tagName;
}

export function isWhitespace(node: ElementContent): boolean {
  return node.type === "text" && node.value.trim() === "";
}

export function hasClass(node: Element, className: string): boolean {
  const value = node.properties.className;
  return Array.isArray(value) ? value.includes(className) : value === className;
}

/** Extra, non-rendered info the pipeline attaches to heading elements. */
export interface HeadingInfo {
  kicker?: string;
  num?: string;
  text: string;
}

export function setHeadingInfo(node: Element, info: HeadingInfo): void {
  const data = (node.data ?? {}) as Record<string, unknown>;
  data.heading = info;
  node.data = data as Element["data"];
}

export function getHeadingInfo(node: Element): HeadingInfo | undefined {
  const data = node.data as Record<string, unknown> | undefined;
  return data?.heading as HeadingInfo | undefined;
}
