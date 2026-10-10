import { slug as githubSlug } from "github-slugger";

/** URL-safe slug, same rules GitHub uses for heading anchors. */
export function slugify(text: string): string {
  return githubSlug(text).replace(/-{2,}/g, "-").replace(/^-|-$/g, "");
}

/** "introduction-to-it" -> "Introduction To It". Only a fallback; titles normally come from metadata. */
export function titleFromSlug(slug: string): string {
  return slug
    .split(/[-_]+/)
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

/** Splits "01-introduction-to-it" into 1 and "introduction-to-it". */
export function splitNumbered(name: string): { number: number; slug: string } | null {
  const match = /^(\d+)[-_. ]+(.+)$/.exec(name);
  if (!match?.[1] || !match[2]) return null;
  return { number: Number.parseInt(match[1], 10), slug: slugify(match[2]) };
}

/** Rough word count of a markdown body, ignoring code fences, URLs and table rules. */
export function countWords(markdown: string): number {
  const text = markdown
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/!\[[^\]]*\]\([^)]*\)/g, " ")
    .replace(/\]\([^)]*\)/g, "]")
    .replace(/^\|?[\s:|-]+\|?$/gm, " ");
  return text.match(/[\p{L}\p{N}][\p{L}\p{N}'’.-]*/gu)?.length ?? 0;
}

/** Reading time in minutes at a relaxed study pace. */
export function readingMinutes(words: number): number {
  return words === 0 ? 0 : Math.max(1, Math.round(words / 200));
}

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

/**
 * "2026-10-10" -> "10 Oct 2026". Formatted by hand rather than with
 * toLocaleDateString so the server and the browser always agree.
 */
export function formatDate(iso: string | undefined): string | undefined {
  if (!iso) return undefined;
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso);
  if (!match) return iso;
  const [, year, month, day] = match;
  return `${Number(day)} ${MONTHS[Number(month) - 1] ?? month} ${year}`;
}

/** 15230 -> "15,230" (by hand, for the same reason as formatDate). */
export function formatNumber(value: number): string {
  return String(Math.round(value)).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

export function plural(count: number, one: string, many = `${one}s`): string {
  return `${formatNumber(count)} ${count === 1 ? one : many}`;
}

/** 75 -> "1 h 15 min", 40 -> "40 min". */
export function formatMinutes(minutes: number): string {
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return rest === 0 ? `${hours} h` : `${hours} h ${rest} min`;
}
