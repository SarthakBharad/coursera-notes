"use client";

import Link from "next/link";
import type { CSSProperties } from "react";
import type { ModuleLink } from "@/lib/content/types";
import { percentDone, useProgress } from "@/lib/progress";
import { ArrowRightIcon, CheckIcon, PlayIcon } from "../Icons";

/** Start / continue button for a program: resumes the last module read in it, or the first unread one. */
export function ProgramStart({ links }: { links: ModuleLink[] }) {
  const progress = useProgress();
  if (links.length === 0) return null;

  const keys = links.map((link) => link.key);
  const last = progress.lastKey && keys.includes(progress.lastKey) ? progress.modules[progress.lastKey] : undefined;
  const lastLink = last ? links.find((link) => link.key === progress.lastKey) : undefined;
  const firstUnread = links.find((link) => !progress.modules[link.key]?.done);
  const allDone = !firstUnread;

  if (lastLink && last && !last.done) {
    const href = last.sectionId ? `${lastLink.href}#${last.sectionId}` : lastLink.href;
    return (
      <Link href={href} className="btn btn--primary">
        <PlayIcon /> Continue: {lastLink.title}
      </Link>
    );
  }
  const target = firstUnread ?? links[0]!;
  const started = keys.some((key) => progress.modules[key]);
  return (
    <Link href={target.href} className="btn btn--primary">
      {allDone ? "Read again from the start" : started ? `Next: ${target.title}` : "Start reading"} <ArrowRightIcon />
    </Link>
  );
}

export function ProgramRing({ keys, size = 44 }: { keys: string[]; size?: number }) {
  const progress = useProgress();
  const percent = percentDone(progress, keys);
  return (
    <span className="ring" style={{ "--value": percent, "--size": `${size}px` } as CSSProperties} role="img" aria-label={`${percent}% of modules marked as done`}>
      <span className="ring__label">{percent}%</span>
    </span>
  );
}

/** The status circle in front of a module: empty, part-read, or done. */
export function DoneMark({ moduleKey }: { moduleKey: string }) {
  const progress = useProgress();
  const entry = progress.modules[moduleKey];
  const state = entry?.done ? "done" : (entry?.furthest ?? 0) > 0.02 ? "started" : "none";
  const label = state === "done" ? "Done" : state === "started" ? `${Math.round((entry?.furthest ?? 0) * 100)}% read` : "Not started";
  return (
    <span
      className="done-mark"
      data-state={state}
      style={{ "--value": Math.round((entry?.furthest ?? 0) * 100) } as CSSProperties}
      title={label}
    >
      {state === "done" && <CheckIcon />}
      <span className="visually-hidden">{label}</span>
    </span>
  );
}
