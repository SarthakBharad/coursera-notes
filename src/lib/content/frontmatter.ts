import { parse as parseYaml } from "yaml";

export interface Frontmatter {
  title?: string;
  description?: string;
  updated?: string;
}

export interface ParsedSource {
  data: Frontmatter;
  body: string;
}

const FRONTMATTER = /^\uFEFF?---\r?\n([\s\S]*?)\r?\n---[ \t]*(?:\r?\n|$)/;
const LEADING_H1 = /^\s*#[ \t]+(.+?)[ \t]*#*[ \t]*(?:\r?\n|$)/;

function asString(value: unknown): string | undefined {
  if (typeof value === "string") return value.trim() || undefined;
  if (typeof value === "number") return String(value);
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  return undefined;
}

/**
 * Splits optional YAML frontmatter from a markdown file.
 *
 * If there is no `title` in the frontmatter and the body starts with a single
 * `# Heading`, that heading becomes the title and is removed from the body, so
 * the page never shows the same title twice.
 */
export function parseSource(raw: string, file: string): ParsedSource {
  let body = raw;
  let data: Frontmatter = {};

  const match = FRONTMATTER.exec(raw);
  if (match) {
    body = raw.slice(match[0].length);
    let parsed: unknown;
    try {
      parsed = parseYaml(match[1] ?? "");
    } catch (error) {
      throw new Error(`Invalid frontmatter in ${file}: ${(error as Error).message}`);
    }
    if (parsed && typeof parsed === "object") {
      const record = parsed as Record<string, unknown>;
      data = {
        title: asString(record.title),
        description: asString(record.description),
        updated: asString(record.updated),
      };
    }
  }

  if (!data.title) {
    const h1 = LEADING_H1.exec(body);
    if (h1?.[1]) {
      data.title = h1[1].trim();
      body = body.slice(h1[0].length);
    }
  }

  return { data, body };
}
