/**
 * Reads the content/ folder and turns it into a typed tree of programs,
 * courses and modules. Runs on the server only (at build time for the static
 * export, or per request in `next dev`).
 *
 *   content/
 *     <program-slug>/
 *       program.json                     program + course titles (see program.schema.json)
 *       01-<course-slug>/                course 1
 *         01-<module-slug>/index.md      module 1 (folder form, for notes with images)
 *         01-<module-slug>/images/…      images, referenced as images/foo.png
 *         02-<module-slug>.md            module 2 (single-file form)
 */
import fs from "node:fs";
import path from "node:path";
import { parseSource } from "./frontmatter";
import { countWords, readingMinutes, slugify, splitNumbered, titleFromSlug } from "./text";
import type { CourseEntry, ModuleEntry, ModuleLink, ProgramEntry, ProgramFile, ProgramStatus } from "./types";

export const CONTENT_DIR = path.join(process.cwd(), "content");

const STATUSES: ProgramStatus[] = ["in-progress", "completed", "paused", "planned"];
const MODULE_FILE_NAMES = ["index.md", "notes.md", "README.md"];

function listDir(dir: string): fs.Dirent[] {
  try {
    return fs.readdirSync(dir, { withFileTypes: true });
  } catch {
    return [];
  }
}

function readProgramFile(dir: string): ProgramFile | null {
  const file = path.join(dir, "program.json");
  if (!fs.existsSync(file)) return null;
  let parsed: ProgramFile;
  try {
    parsed = JSON.parse(fs.readFileSync(file, "utf8")) as ProgramFile;
  } catch (error) {
    throw new Error(`Could not parse ${file}: ${(error as Error).message}`);
  }
  if (!parsed.title || !parsed.provider || !parsed.kind || !Array.isArray(parsed.courses)) {
    throw new Error(`${file} needs "title", "provider", "kind" and a "courses" array.`);
  }
  return parsed;
}

/** Finds the markdown file for a module folder. */
function findModuleFile(dir: string): string | null {
  for (const name of MODULE_FILE_NAMES) {
    const candidate = path.join(dir, name);
    if (fs.existsSync(candidate)) return candidate;
  }
  const markdown = listDir(dir).filter((entry) => entry.isFile() && entry.name.toLowerCase().endsWith(".md"));
  return markdown.length === 1 && markdown[0] ? path.join(dir, markdown[0].name) : null;
}

interface WrittenModule {
  number: number;
  slug: string;
  sourcePath: string;
  assetDir: string;
}

function findWrittenModules(courseDir: string): WrittenModule[] {
  const found: WrittenModule[] = [];
  for (const entry of listDir(courseDir)) {
    if (entry.name.startsWith(".") || entry.name.startsWith("_")) continue;
    const isMarkdown = entry.isFile() && entry.name.toLowerCase().endsWith(".md");
    const numbered = splitNumbered(isMarkdown ? entry.name.slice(0, -3) : entry.name);
    if (!numbered) continue;
    const full = path.join(courseDir, entry.name);
    if (isMarkdown) {
      found.push({ ...numbered, sourcePath: full, assetDir: courseDir });
    } else if (entry.isDirectory()) {
      const file = findModuleFile(full);
      if (file) found.push({ ...numbered, sourcePath: file, assetDir: full });
    }
  }
  return found.sort((a, b) => a.number - b.number);
}

function loadModule(programSlug: string, courseSlug: string, written: WrittenModule, plannedTitle?: string): ModuleEntry {
  const raw = fs.readFileSync(written.sourcePath, "utf8");
  const { data, body } = parseSource(raw, written.sourcePath);
  const wordCount = countWords(body);
  const slug = written.slug;
  return {
    key: `${programSlug}/${courseSlug}/${slug}`,
    number: written.number,
    slug,
    title: data.title ?? plannedTitle ?? titleFromSlug(slug),
    description: data.description,
    updated: data.updated,
    hasNotes: true,
    href: `/${programSlug}/${courseSlug}/${slug}`,
    wordCount,
    readingMinutes: readingMinutes(wordCount),
    sourcePath: written.sourcePath,
    assetDir: written.assetDir,
  };
}

function plannedModule(programSlug: string, courseSlug: string, number: number, title: string): ModuleEntry {
  const slug = slugify(title);
  return {
    key: `${programSlug}/${courseSlug}/${slug}`,
    number,
    slug,
    title,
    hasNotes: false,
    wordCount: 0,
    readingMinutes: 0,
  };
}

function loadProgram(slug: string, dir: string): ProgramEntry | null {
  const meta = readProgramFile(dir);
  if (!meta) return null;

  // Course folders on disk, keyed by their number prefix.
  const courseDirs = new Map<number, { slug: string; dir: string }>();
  for (const entry of listDir(dir)) {
    if (!entry.isDirectory()) continue;
    const numbered = splitNumbered(entry.name);
    if (numbered) courseDirs.set(numbered.number, { slug: numbered.slug, dir: path.join(dir, entry.name) });
  }

  const courseCount = Math.max(meta.courses.length, ...courseDirs.keys(), 0);
  const courses: CourseEntry[] = [];

  for (let number = 1; number <= courseCount; number++) {
    const info = meta.courses[number - 1];
    const onDisk = courseDirs.get(number);
    const title = info?.title ?? titleFromSlug(onDisk?.slug ?? `course-${number}`);
    const courseSlug = onDisk?.slug ?? slugify(title);

    const planned = info?.modules ?? [];
    const written = onDisk ? findWrittenModules(onDisk.dir) : [];
    const writtenByNumber = new Map(written.map((module) => [module.number, module]));
    const moduleCount = Math.max(planned.length, ...writtenByNumber.keys(), 0);

    const modules: ModuleEntry[] = [];
    for (let m = 1; m <= moduleCount; m++) {
      const notes = writtenByNumber.get(m);
      const plannedTitle = planned[m - 1];
      if (notes) modules.push(loadModule(slug, courseSlug, notes, plannedTitle));
      else if (plannedTitle) modules.push(plannedModule(slug, courseSlug, m, plannedTitle));
    }

    courses.push({
      number,
      slug: courseSlug,
      title,
      url: info?.url,
      optional: info?.optional ?? false,
      modules,
      notesCount: modules.filter((module) => module.hasNotes).length,
    });
  }

  const withNotes = courses.flatMap((course) => course.modules.filter((module) => module.hasNotes));
  const words = withNotes.reduce((sum, module) => sum + module.wordCount, 0);

  return {
    slug,
    title: meta.title,
    shortTitle: meta.shortTitle ?? meta.title,
    provider: meta.provider,
    kind: meta.kind,
    order: meta.order ?? Number.MAX_SAFE_INTEGER,
    status: meta.status && STATUSES.includes(meta.status) ? meta.status : "in-progress",
    description: meta.description,
    url: meta.url,
    courses,
    stats: {
      courses: courses.filter((course) => !course.optional).length,
      coursesWithNotes: courses.filter((course) => course.notesCount > 0).length,
      modulesWithNotes: withNotes.length,
      words,
      readingMinutes: withNotes.reduce((sum, module) => sum + module.readingMinutes, 0),
    },
  };
}

let cache: ProgramEntry[] | null = null;

/** All programs, sorted by `order` then title. Cached in production builds. */
export function getPrograms(): ProgramEntry[] {
  if (cache && process.env.NODE_ENV === "production") return cache;
  const programs: ProgramEntry[] = [];
  for (const entry of listDir(CONTENT_DIR)) {
    if (!entry.isDirectory() || entry.name.startsWith(".") || entry.name.startsWith("_")) continue;
    const program = loadProgram(entry.name, path.join(CONTENT_DIR, entry.name));
    if (program) programs.push(program);
  }
  programs.sort((a, b) => a.order - b.order || a.title.localeCompare(b.title));
  cache = programs;
  return programs;
}

export function getProgram(slug: string): ProgramEntry | undefined {
  return getPrograms().find((program) => program.slug === slug);
}

export interface ModuleLocation {
  program: ProgramEntry;
  course: CourseEntry;
  module: ModuleEntry;
  /** Previous and next modules with notes, across course boundaries. */
  previous?: ModuleLink;
  next?: ModuleLink;
}

export function toModuleLink(program: ProgramEntry, course: CourseEntry, module: ModuleEntry): ModuleLink {
  return {
    key: module.key,
    href: module.href ?? `/${program.slug}`,
    title: module.title,
    number: module.number,
    readingMinutes: module.readingMinutes,
    programSlug: program.slug,
    programTitle: program.shortTitle,
    courseNumber: course.number,
    courseTitle: course.title,
  };
}

/** Every module that has notes, in reading order, as client-safe links. */
export function getModuleLinks(program?: ProgramEntry): ModuleLink[] {
  const programs = program ? [program] : getPrograms();
  return programs.flatMap((p) =>
    p.courses.flatMap((course) =>
      course.modules.filter((module) => module.hasNotes).map((module) => toModuleLink(p, course, module)),
    ),
  );
}

export function findModule(programSlug: string, courseSlug: string, moduleSlug: string): ModuleLocation | undefined {
  const program = getProgram(programSlug);
  const course = program?.courses.find((c) => c.slug === courseSlug);
  const entry = course?.modules.find((m) => m.slug === moduleSlug && m.hasNotes);
  if (!program || !course || !entry) return undefined;

  const ordered = getModuleLinks(program);
  const index = ordered.findIndex((link) => link.key === entry.key);
  return {
    program,
    course,
    module: entry,
    previous: index > 0 ? ordered[index - 1] : undefined,
    next: index >= 0 ? ordered[index + 1] : undefined,
  };
}

/** Body of a module's markdown file with the frontmatter removed. */
export function readModuleBody(module: ModuleEntry): string {
  if (!module.sourcePath) throw new Error(`Module ${module.key} has no notes file.`);
  return parseSource(fs.readFileSync(module.sourcePath, "utf8"), module.sourcePath).body;
}

/** Public URL for a file inside content/ (copied to public/media by `pnpm media`). */
export function mediaUrl(absolutePath: string): string {
  const relative = path.relative(CONTENT_DIR, absolutePath).split(path.sep).map(encodeURIComponent).join("/");
  return `/media/${relative}`;
}
