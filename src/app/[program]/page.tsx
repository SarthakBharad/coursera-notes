import type { Metadata } from "next";
import type { CSSProperties } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRightIcon, ExternalIcon } from "@/components/Icons";
import { DoneMark, ProgramRing, ProgramStart } from "@/components/program/ProgramClient";
import { getModuleLinks, getProgram, getPrograms } from "@/lib/content/loader";
import { formatMinutes, plural } from "@/lib/content/text";

type Params = { program: string };

export const dynamicParams = false;

export function generateStaticParams(): Params[] {
  return getPrograms().map((program) => ({ program: program.slug }));
}

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const program = getProgram((await params).program);
  if (!program) return {};
  return { title: program.shortTitle, description: program.description };
}

const STATUS_LABEL = {
  "in-progress": "In progress",
  completed: "Completed",
  paused: "Paused",
  planned: "Planned",
} as const;

export default async function ProgramPage({ params }: { params: Promise<Params> }) {
  const program = getProgram((await params).program);
  if (!program) notFound();

  const links = getModuleLinks(program);
  const optionalCount = program.courses.filter((course) => course.optional).length;

  return (
    <>
      <div className="glow" aria-hidden="true" />
      <section className="container program-hero">
        <nav aria-label="Breadcrumb">
          <ol className="crumbs rise">
            <li>
              <Link href="/">Programs</Link>
            </li>
            <li aria-current="page">{program.shortTitle}</li>
          </ol>
        </nav>

        <div className="program-hero__chips rise">
          <span className="chip">{program.provider}</span>
          <span className="chip chip--accent">{program.kind}</span>
          <span className="chip chip--muted">{STATUS_LABEL[program.status]}</span>
        </div>
        <h1 className="display program-hero__title rise" style={{ "--i": 1 } as CSSProperties}>
          {program.shortTitle}
        </h1>
        {program.shortTitle !== program.title && <p className="program-hero__full rise">{program.title}</p>}
        {program.description && (
          <p className="program-hero__lead rise" style={{ "--i": 2 } as CSSProperties}>
            {program.description}
          </p>
        )}

        <div className="program-hero__actions rise" style={{ "--i": 3 } as CSSProperties}>
          <ProgramStart links={links} />
          {program.url && (
            <a href={program.url} className="btn" target="_blank" rel="noopener noreferrer">
              Open on Coursera <ExternalIcon />
            </a>
          )}
        </div>

        <dl className="stats rise" style={{ "--i": 4 } as CSSProperties}>
          <div className="stat">
            <dt>Courses</dt>
            <dd>
              {program.stats.courses}
              {optionalCount > 0 && <small> + {optionalCount} optional</small>}
            </dd>
          </div>
          <div className="stat">
            <dt>Modules with notes</dt>
            <dd>{program.stats.modulesWithNotes}</dd>
          </div>
          <div className="stat">
            <dt>Reading time</dt>
            <dd>{program.stats.readingMinutes ? formatMinutes(program.stats.readingMinutes) : "—"}</dd>
          </div>
          <div className="stat stat--ring">
            <dt>Marked done</dt>
            <dd>
              {links.length > 0 ? <ProgramRing keys={links.map((link) => link.key)} size={48} /> : <span className="stat__none">No notes yet</span>}
            </dd>
          </div>
        </dl>
      </section>

      <section className="container roadmap" aria-labelledby="roadmap-title">
        <h2 id="roadmap-title" className="display roadmap__title">
          Courses
        </h2>
        <ol className="roadmap__list">
          {program.courses.map((course) => {
            const hasNotes = course.notesCount > 0;
            return (
              <li key={course.number} id={`course-${course.number}`} className="course" data-has-notes={hasNotes}>
                <span className="course__num display" aria-hidden="true">
                  {course.number}
                </span>
                <div className="course__card">
                  <div className="course__head">
                    <div>
                      <p className="course__eyebrow">
                        Course {course.number}
                        {course.optional && " · Optional"}
                      </p>
                      <h3 className="display course__title">{course.title}</h3>
                    </div>
                    <div className="course__meta">
                      {course.modules.length > 0 ? (
                        <span className={hasNotes ? "chip chip--accent" : "chip chip--muted"}>
                          {course.notesCount} of {plural(course.modules.length, "module")} written
                        </span>
                      ) : (
                        <span className="chip chip--muted">No notes yet</span>
                      )}
                      {course.url && (
                        <a href={course.url} className="course__link" target="_blank" rel="noopener noreferrer" aria-label={`${course.title} on Coursera`}>
                          Coursera <ExternalIcon />
                        </a>
                      )}
                    </div>
                  </div>

                  {course.modules.length > 0 ? (
                    <ol className="modules">
                      {course.modules.map((module) =>
                        module.hasNotes && module.href ? (
                          <li key={module.number} className="module-row">
                            <Link href={module.href} className="module-row__inner">
                              <DoneMark moduleKey={module.key} />
                              <span className="module-row__num">{String(module.number).padStart(2, "0")}</span>
                              <span className="module-row__text">
                                <span className="module-row__title">{module.title}</span>
                                {module.description && <span className="module-row__desc">{module.description}</span>}
                              </span>
                              <span className="module-row__meta">
                                {formatMinutes(module.readingMinutes)}
                                <ArrowRightIcon />
                              </span>
                            </Link>
                          </li>
                        ) : (
                          <li key={module.number} className="module-row module-row--planned">
                            <div className="module-row__inner">
                              <span className="done-mark" data-state="planned" aria-hidden="true" />
                              <span className="module-row__num">{String(module.number).padStart(2, "0")}</span>
                              <span className="module-row__text">
                                <span className="module-row__title">{module.title}</span>
                              </span>
                              <span className="module-row__meta">Not written yet</span>
                            </div>
                          </li>
                        ),
                      )}
                    </ol>
                  ) : (
                    <p className="course__empty">Notes for this course will appear here once I write them.</p>
                  )}
                </div>
              </li>
            );
          })}
        </ol>
      </section>
    </>
  );
}
