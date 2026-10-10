"use client";

import Link from "next/link";
import type { CSSProperties } from "react";
import type { ModuleLink } from "@/lib/content/types";
import { useProgress } from "@/lib/progress";
import { ArrowRightIcon, CheckIcon, PlayIcon } from "../Icons";

/** "Pick up where you left off": the module read most recently, if any. */
export function ContinueReading({ links }: { links: ModuleLink[] }) {
  const progress = useProgress();
  const link = links.find((item) => item.key === progress.lastKey);
  const entry = link ? progress.modules[link.key] : undefined;
  if (!link || !entry) return null;

  const percent = Math.round((entry.furthest ?? entry.scrolled ?? 0) * 100);
  const href = entry.sectionId && !entry.done ? `${link.href}#${entry.sectionId}` : link.href;
  const index = links.indexOf(link);
  const next = entry.done ? links[index + 1] : undefined;

  return (
    <section className="container continue rise" style={{ "--i": 2 } as CSSProperties} aria-label="Continue reading">
      <div className="continue__card">
        <div className="continue__meter" aria-hidden="true">
          <span style={{ width: `${entry.done ? 100 : percent}%` }} />
        </div>
        <div className="continue__body">
          <p className="continue__eyebrow">{entry.done ? "Last finished" : "Pick up where you left off"}</p>
          <p className="continue__title">
            {link.title}
            {entry.done && (
              <span className="chip chip--highlight">
                <CheckIcon /> Done
              </span>
            )}
          </p>
          <p className="continue__trail">
            {link.programTitle} · Course {link.courseNumber} · Module {link.number}
            {!entry.done && entry.sectionTitle ? ` · ${entry.sectionTitle}` : ""}
          </p>
        </div>
        <div className="continue__actions">
          {!entry.done && <span className="continue__percent">{percent}% read</span>}
          {next ? (
            <Link href={next.href} className="btn btn--primary">
              Next: {next.title} <ArrowRightIcon />
            </Link>
          ) : (
            <Link href={href} className="btn btn--primary">
              <PlayIcon /> {entry.done ? "Read again" : "Resume"}
            </Link>
          )}
        </div>
      </div>
    </section>
  );
}
