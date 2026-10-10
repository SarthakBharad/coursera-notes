import type { CSSProperties } from "react";
import { ByteBoard } from "@/components/home/ByteBoard";
import { ContinueReading } from "@/components/home/ContinueReading";
import { ProgramGrid } from "@/components/home/ProgramGrid";
import { ArrowRightIcon } from "@/components/Icons";
import { getModuleLinks, getPrograms } from "@/lib/content/loader";
import { toProgramSummary } from "@/lib/content/summaries";
import { formatMinutes, plural } from "@/lib/content/text";

export default function HomePage() {
  const programs = getPrograms();
  const links = getModuleLinks();
  const courses = programs.reduce((sum, program) => sum + program.stats.courses, 0);
  const minutes = programs.reduce((sum, program) => sum + program.stats.readingMinutes, 0);

  return (
    <>
      <div className="glow" aria-hidden="true" />
      <section className="container hero">
        <div className="hero__text">
          <p className="eyebrow rise">
            <span className="eyebrow__dot" aria-hidden="true" />
            {plural(programs.length, "program")} · {plural(courses, "course")} · {plural(links.length, "module")} written
          </p>
          <h1 className="display hero__title rise" style={{ "--i": 1 } as CSSProperties}>
            Notes from <span className="marker">every course</span> I&rsquo;m taking on Coursera.
          </h1>
          <p className="hero__lead rise" style={{ "--i": 2 } as CSSProperties}>
            Each module rewritten in plain language, with analogies, clarifications, exercises and a glossary. Pick a
            program to start reading. Your progress is saved in this browser.
          </p>
          <div className="hero__actions rise" style={{ "--i": 3 } as CSSProperties}>
            <a href="#programs" className="btn btn--primary">
              Browse programs <ArrowRightIcon />
            </a>
            {minutes > 0 && <span className="hero__note">{formatMinutes(minutes)} of reading so far</span>}
          </div>
        </div>
        <ByteBoard />
      </section>

      <ContinueReading links={links} />

      <section id="programs" className="container programs" aria-labelledby="programs-title">
        <ProgramGrid programs={programs.map(toProgramSummary)} />
      </section>
    </>
  );
}
