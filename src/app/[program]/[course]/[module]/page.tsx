import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeftIcon, ArrowRightIcon, CalendarIcon, ClockIcon, LayersIcon, TextIcon } from "@/components/Icons";
import { DoneMark } from "@/components/program/ProgramClient";
import { DoneButton, EndCard, TextSizeControl } from "@/components/reader/ModuleActions";
import { ReaderProvider, ReadingProgressBar } from "@/components/reader/ReaderProvider";
import { MobileContents, TableOfContents } from "@/components/reader/TableOfContents";
import { findModule, getPrograms } from "@/lib/content/loader";
import { formatDate, formatMinutes, formatNumber } from "@/lib/content/text";
import { getModuleDocument } from "@/lib/markdown/document";
import { hastToReact } from "@/lib/markdown/render";
import "katex/dist/katex.min.css";

type Params = { program: string; course: string; module: string };

export const dynamicParams = false;

export function generateStaticParams(): Params[] {
  return getPrograms().flatMap((program) =>
    program.courses.flatMap((course) =>
      course.modules
        .filter((module) => module.hasNotes)
        .map((module) => ({ program: program.slug, course: course.slug, module: module.slug })),
    ),
  );
}

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { program, course, module } = await params;
  const found = findModule(program, course, module);
  if (!found) return {};
  return {
    title: `${found.module.title} — ${found.program.shortTitle}`,
    description: found.module.description,
  };
}

/** The notes' own "Table of Contents" section is left out of the side rail, which already is one. */
const CONTENTS_HEADING = /^(table of )?contents$/i;

export default async function ModulePage({ params }: { params: Promise<Params> }) {
  const { program: programSlug, course: courseSlug, module: moduleSlug } = await params;
  const found = findModule(programSlug, courseSlug, moduleSlug);
  if (!found) notFound();
  const { program, course, module, previous, next } = found;

  const notes = await getModuleDocument(module);
  const toc = notes.toc.filter((entry, index, all) => {
    if (entry.depth === 2) return !CONTENTS_HEADING.test(entry.text);
    // drop sub-entries that sit under a dropped "Contents" heading
    const parent = all.slice(0, index).reverse().find((candidate) => candidate.depth === 2);
    return !parent || !CONTENTS_HEADING.test(parent.text);
  });
  const parts = toc.filter((entry) => entry.depth === 2).length;
  const updated = formatDate(module.updated);
  const programHref = `/${program.slug}`;

  return (
    <ReaderProvider moduleKey={module.key} toc={toc}>
      <ReadingProgressBar />
      <div className="reader">
        <aside className="reader__left" aria-label="Course">
          <nav className="course-nav" aria-label={`Modules in course ${course.number}`}>
            <Link href={`${programHref}#course-${course.number}`} className="course-nav__back">
              <ArrowLeftIcon /> {program.shortTitle}
            </Link>
            <p className="course-nav__eyebrow">Course {course.number}</p>
            <p className="course-nav__title">{course.title}</p>
            <ol className="course-nav__list">
              {course.modules.map((item) =>
                item.hasNotes && item.href ? (
                  <li key={item.number}>
                    <Link href={item.href} className="course-nav__item" aria-current={item.key === module.key ? "page" : undefined}>
                      <DoneMark moduleKey={item.key} />
                      <span>
                        <span className="course-nav__num">Module {item.number}</span>
                        {item.title}
                      </span>
                    </Link>
                  </li>
                ) : (
                  <li key={item.number}>
                    <span className="course-nav__item course-nav__item--planned">
                      <span className="done-mark" data-state="planned" aria-hidden="true" />
                      <span>
                        <span className="course-nav__num">Module {item.number}</span>
                        {item.title}
                      </span>
                    </span>
                  </li>
                ),
              )}
            </ol>
          </nav>
        </aside>

        <article id="article" className="reader__main">
          <header className="module-hero">
            <nav aria-label="Breadcrumb">
              <ol className="crumbs">
                <li>
                  <Link href="/">Programs</Link>
                </li>
                <li>
                  <Link href={programHref}>{program.shortTitle}</Link>
                </li>
                <li>
                  <Link href={`${programHref}#course-${course.number}`}>Course {course.number}</Link>
                </li>
              </ol>
            </nav>
            <p className="module-hero__kicker">
              <span>Module {module.number}</span> {course.title}
            </p>
            <h1 className="display module-hero__title">{module.title}</h1>
            {module.description && <p className="module-hero__desc">{module.description}</p>}
            <ul className="module-hero__meta">
              <li>
                <ClockIcon /> {formatMinutes(module.readingMinutes)} read
              </li>
              <li>
                <TextIcon /> {formatNumber(module.wordCount)} words
              </li>
              {parts > 0 && (
                <li>
                  <LayersIcon /> {parts} sections
                </li>
              )}
              {updated && (
                <li>
                  <CalendarIcon /> Updated {updated}
                </li>
              )}
            </ul>
            <div className="module-hero__actions">
              <DoneButton moduleKey={module.key} />
              <TextSizeControl />
            </div>
          </header>

          <div className="prose">{hastToReact(notes.tree)}</div>

          <footer className="module-end">
            <EndCard moduleKey={module.key} number={module.number} next={next} programHref={programHref} />
            {(previous || next) && (
              <nav className="pager" aria-label="Other modules">
                {previous ? (
                  <Link href={previous.href} className="pager__link pager__link--prev">
                    <span className="pager__dir">
                      <ArrowLeftIcon /> Previous
                    </span>
                    <span className="pager__title">{previous.title}</span>
                    <span className="pager__meta">
                      Course {previous.courseNumber} · Module {previous.number}
                    </span>
                  </Link>
                ) : (
                  <span />
                )}
                {next && (
                  <Link href={next.href} className="pager__link pager__link--next">
                    <span className="pager__dir">
                      Next <ArrowRightIcon />
                    </span>
                    <span className="pager__title">{next.title}</span>
                    <span className="pager__meta">
                      Course {next.courseNumber} · Module {next.number}
                    </span>
                  </Link>
                )}
              </nav>
            )}
          </footer>
        </article>

        <aside className="reader__right" aria-label="On this page">
          <TableOfContents toc={toc} minutes={module.readingMinutes} />
        </aside>
      </div>
      <MobileContents toc={toc} minutes={module.readingMinutes} />
    </ReaderProvider>
  );
}
