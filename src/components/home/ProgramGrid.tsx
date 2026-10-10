"use client";

import Link from "next/link";
import { useState, type CSSProperties } from "react";
import { formatMinutes, plural } from "@/lib/content/text";
import type { ProgramSummary } from "@/lib/content/types";
import { percentDone, useProgress } from "@/lib/progress";
import { ArrowRightIcon } from "../Icons";

type Filter = "all" | "notes" | "empty";

const FILTERS: { id: Filter; label: string; test: (program: ProgramSummary) => boolean }[] = [
  { id: "all", label: "All", test: () => true },
  { id: "notes", label: "With notes", test: (program) => program.stats.modulesWithNotes > 0 },
  { id: "empty", label: "No notes yet", test: (program) => program.stats.modulesWithNotes === 0 },
];

function courseState(course: ProgramSummary["courses"][number]): "empty" | "partial" | "full" {
  if (course.notesCount === 0) return "empty";
  return course.moduleCount > 0 && course.notesCount >= course.moduleCount ? "full" : "partial";
}

function ProgramCard({ program, index }: { program: ProgramSummary; index: number }) {
  const progress = useProgress();
  const hasNotes = program.stats.modulesWithNotes > 0;
  const percent = percentDone(progress, program.moduleKeys);
  const required = program.courses.filter((course) => !course.optional);
  const optional = program.courses.length - required.length;

  return (
    <li className="program-card rise" style={{ "--i": index + 3 } as CSSProperties} data-accent={index % 3}>
      <Link href={`/${program.slug}`} className="program-card__link">
        <span className="program-card__initial" aria-hidden="true">
          {program.shortTitle.charAt(0)}
        </span>
        <span className="program-card__top">
          <span className="chip">{program.provider}</span>
          <span className="program-card__kind">{program.kind}</span>
        </span>

        <span className="program-card__titles">
          <span className="program-card__title display">{program.shortTitle}</span>
          {program.shortTitle !== program.title && <span className="program-card__full">{program.title}</span>}
        </span>

        {program.description && <span className="program-card__desc">{program.description}</span>}

        <span className="track" aria-hidden="true">
          {program.courses.map((course) => (
            <span
              key={course.number}
              className="track__seg"
              data-state={courseState(course)}
              data-optional={course.optional}
              style={{ "--fill": course.moduleCount ? course.notesCount / course.moduleCount : course.notesCount ? 1 : 0 } as CSSProperties}
              title={`Course ${course.number}: ${course.title}`}
            />
          ))}
        </span>
        <span className="program-card__stats">
          {plural(required.length, "course")}
          {optional > 0 && ` + ${optional} optional`} · {hasNotes ? plural(program.stats.modulesWithNotes, "module") + " of notes" : "no notes yet"}
          {hasNotes && ` · ${formatMinutes(program.stats.readingMinutes)}`}
        </span>

        <span className="program-card__foot">
          {hasNotes ? (
            <span className="program-card__progress">
              <span className="ring" style={{ "--value": percent, "--size": "38px" } as CSSProperties}>
                <span className="ring__label">{percent}%</span>
              </span>
              <span>{percent === 100 ? "All read" : percent > 0 ? "read so far" : "Not started"}</span>
            </span>
          ) : (
            <span className="chip chip--muted">Notes coming soon</span>
          )}
          <span className="program-card__cta">
            {hasNotes ? "Read notes" : "See courses"} <ArrowRightIcon />
          </span>
        </span>
      </Link>
    </li>
  );
}

export function ProgramGrid({ programs }: { programs: ProgramSummary[] }) {
  const [filter, setFilter] = useState<Filter>("all");
  const active = FILTERS.find((item) => item.id === filter) ?? FILTERS[0]!;
  const shown = programs.filter(active.test);

  return (
    <>
      <div className="programs__head">
        <div>
          <h2 id="programs-title" className="display programs__title">Choose a program</h2>
          <p className="programs__sub">Every certificate and specialization I&rsquo;m working through, with its full course list.</p>
        </div>
        <div className="filters" role="group" aria-label="Filter programs">
          {FILTERS.map((item) => {
            const count = programs.filter(item.test).length;
            return (
              <button
                key={item.id}
                type="button"
                className="filter"
                aria-pressed={filter === item.id}
                onClick={() => setFilter(item.id)}
                disabled={count === 0 && item.id !== "all"}
              >
                {item.label}
                <span className="filter__count">{count}</span>
              </button>
            );
          })}
        </div>
      </div>
      <ul className="program-grid">
        {shown.map((program, index) => (
          <ProgramCard key={program.slug} program={program} index={programs.indexOf(program) >= 0 ? programs.indexOf(program) : index} />
        ))}
      </ul>
    </>
  );
}
