/**
 * Shapes of the content tree. Everything here is plain, serialisable data so it
 * can be handed from server components to client components unchanged.
 */

export type ProgramStatus = "in-progress" | "completed" | "paused" | "planned";

/** Raw contents of content/<program>/program.json (see program.schema.json). */
export interface ProgramFile {
  title: string;
  shortTitle?: string;
  provider: string;
  kind: string;
  order?: number;
  status?: ProgramStatus;
  description?: string;
  url?: string;
  courses: {
    title: string;
    url?: string;
    optional?: boolean;
    modules?: string[];
  }[];
}

export interface ModuleEntry {
  /** Stable id used for progress tracking: "<program>/<course>/<module>". */
  key: string;
  number: number;
  slug: string;
  title: string;
  description?: string;
  /** ISO date (YYYY-MM-DD) from frontmatter, if given. */
  updated?: string;
  hasNotes: boolean;
  /** Site path of the reading page; only set when there are notes. */
  href?: string;
  wordCount: number;
  readingMinutes: number;
  /** Absolute path of the markdown file (server only). */
  sourcePath?: string;
  /** Folder that relative image paths are resolved against (server only). */
  assetDir?: string;
}

export interface CourseEntry {
  number: number;
  slug: string;
  title: string;
  url?: string;
  optional: boolean;
  modules: ModuleEntry[];
  /** Number of modules that have notes. */
  notesCount: number;
}

export interface ProgramStats {
  courses: number;
  coursesWithNotes: number;
  modulesWithNotes: number;
  words: number;
  readingMinutes: number;
}

export interface ProgramEntry {
  slug: string;
  title: string;
  shortTitle: string;
  provider: string;
  kind: string;
  order: number;
  status: ProgramStatus;
  description?: string;
  url?: string;
  courses: CourseEntry[];
  stats: ProgramStats;
}

/** Client-safe summary of a program for the home page cards. */
export interface ProgramSummary {
  slug: string;
  title: string;
  shortTitle: string;
  provider: string;
  kind: string;
  status: ProgramStatus;
  description?: string;
  stats: ProgramStats;
  courses: { number: number; title: string; optional: boolean; notesCount: number; moduleCount: number }[];
  /** Keys of every module with notes, for progress. */
  moduleKeys: string[];
  /** First module with notes, if any. */
  firstHref?: string;
}

/** One entry in a module's "On this page" list. */
export interface TocEntry {
  id: string;
  depth: 2 | 3;
  /** Heading text without any "Part 3:" kicker or "3.1" number. */
  text: string;
  /** e.g. "Part 3" for "Part 3: Computer Language". */
  kicker?: string;
  /** e.g. "3.1" for "3.1 What does a computer calculate?". */
  num?: string;
}

/** A slim, client-safe description of a module with notes. */
export interface ModuleLink {
  key: string;
  href: string;
  title: string;
  number: number;
  readingMinutes: number;
  programSlug: string;
  programTitle: string;
  courseNumber: number;
  courseTitle: string;
}

export type SearchDocKind = "program" | "course" | "module" | "section";

export interface SearchDoc {
  id: string;
  kind: SearchDocKind;
  title: string;
  /** Where the result sits, e.g. "Google IT Support › Course 1 › Introduction to IT". */
  trail: string;
  href: string;
  text: string;
}
