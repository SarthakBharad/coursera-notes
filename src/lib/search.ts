import { getPrograms } from "./content/loader";
import type { SearchDoc } from "./content/types";
import { getModuleDocument } from "./markdown/document";

/** Everything the search box can find: programs, courses, modules and every H2/H3 section. */
export async function buildSearchIndex(): Promise<SearchDoc[]> {
  const docs: SearchDoc[] = [];

  for (const program of getPrograms()) {
    docs.push({
      id: `p:${program.slug}`,
      kind: "program",
      title: program.shortTitle,
      trail: `${program.provider} · ${program.kind}`,
      href: `/${program.slug}`,
      text: [program.title, program.description].filter(Boolean).join(". "),
    });

    for (const course of program.courses) {
      docs.push({
        id: `c:${program.slug}/${course.slug}`,
        kind: "course",
        title: course.title,
        trail: `${program.shortTitle} › Course ${course.number}`,
        href: `/${program.slug}#course-${course.number}`,
        text: course.modules.map((module) => module.title).join(" · "),
      });

      for (const mod of course.modules) {
        if (!mod.hasNotes || !mod.href) continue;
        const { sections } = await getModuleDocument(mod);
        const intro = sections.find((section) => !section.id)?.text ?? "";
        docs.push({
          id: `m:${mod.key}`,
          kind: "module",
          title: mod.title,
          trail: `${program.shortTitle} › Course ${course.number} › Module ${mod.number}`,
          href: mod.href,
          text: [mod.description, intro].filter(Boolean).join(" "),
        });

        for (const section of sections) {
          if (!section.id) continue;
          docs.push({
            id: `s:${mod.key}#${section.id}`,
            kind: "section",
            title: section.title,
            trail: `${program.shortTitle} › ${mod.title}`,
            href: `${mod.href}#${section.id}`,
            text: section.text,
          });
        }
      }
    }
  }

  return docs;
}
