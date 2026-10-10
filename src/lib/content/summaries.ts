import type { ProgramEntry, ProgramSummary } from "./types";

export function toProgramSummary(program: ProgramEntry): ProgramSummary {
  const withNotes = program.courses.flatMap((course) => course.modules.filter((module) => module.hasNotes));
  return {
    slug: program.slug,
    title: program.title,
    shortTitle: program.shortTitle,
    provider: program.provider,
    kind: program.kind,
    status: program.status,
    description: program.description,
    stats: program.stats,
    courses: program.courses.map((course) => ({
      number: course.number,
      title: course.title,
      optional: course.optional,
      notesCount: course.notesCount,
      moduleCount: course.modules.length,
    })),
    moduleKeys: withNotes.map((module) => module.key),
    firstHref: withNotes[0]?.href,
  };
}
