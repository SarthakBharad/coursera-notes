"use client";

import Link from "next/link";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import type { ModuleLink } from "@/lib/content/types";
import { setDone, useProgress } from "@/lib/progress";
import { storageKeys } from "@/lib/site";
import { ArrowRightIcon, CheckIcon, TypeIcon } from "../Icons";

export function DoneButton({ moduleKey, size }: { moduleKey: string; size?: "large" }) {
  const progress = useProgress();
  const done = !!progress.modules[moduleKey]?.done;
  return (
    <button
      type="button"
      className={`btn done-btn ${done ? "btn--highlight" : ""} ${size === "large" ? "" : "btn--small"}`}
      data-done={done}
      aria-pressed={done}
      onClick={() => setDone(moduleKey, !done)}
    >
      <span className="done-btn__box" aria-hidden="true">
        <CheckIcon />
      </span>
      {done ? "Done" : "Mark as done"}
    </button>
  );
}

const SIZES = [
  { id: "s", label: "Small" },
  { id: "m", label: "Medium" },
  { id: "l", label: "Large" },
] as const;
type Size = (typeof SIZES)[number]["id"];

/** The text size lives on <html data-text-size>, set before paint by ThemeScript. */
function subscribeTextSize(onChange: () => void): () => void {
  const observer = new MutationObserver(onChange);
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ["data-text-size"] });
  return () => observer.disconnect();
}
function readTextSize(): Size {
  const value = document.documentElement.dataset.textSize;
  return value === "s" || value === "l" ? value : "m";
}
function applyTextSize(size: Size): void {
  const root = document.documentElement;
  if (size === "m") delete root.dataset.textSize;
  else root.dataset.textSize = size;
  try {
    if (size === "m") window.localStorage.removeItem(storageKeys.textSize);
    else window.localStorage.setItem(storageKeys.textSize, size);
  } catch {
    // ignore: the size still applies for this visit
  }
}

/** "Aa" menu for the reading text size, remembered per browser. */
export function TextSizeControl() {
  const [open, setOpen] = useState(false);
  const size = useSyncExternalStore(subscribeTextSize, readTextSize, () => "m" as Size);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (event: PointerEvent) => {
      if (!ref.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("pointerdown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div className="text-size" ref={ref}>
      <button
        type="button"
        className="btn btn--small"
        aria-expanded={open}
        aria-haspopup="true"
        onClick={() => setOpen((value) => !value)}
      >
        <TypeIcon /> Text size
      </button>
      {open && (
        <div className="text-size__menu" role="group" aria-label="Text size">
          {SIZES.map((option) => (
            <button
              key={option.id}
              type="button"
              className="text-size__option"
              data-size={option.id}
              aria-pressed={size === option.id}
              onClick={() => applyTextSize(option.id)}
            >
              <span aria-hidden="true">Aa</span>
              {option.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/** Closing card at the end of a module: mark it done and move on. */
export function EndCard({ moduleKey, number, next, programHref }: { moduleKey: string; number: number; next?: ModuleLink; programHref: string }) {
  const progress = useProgress();
  const done = !!progress.modules[moduleKey]?.done;
  return (
    <section className="end-card" data-done={done} aria-label="End of module">
      <p className="end-card__eyebrow">End of module {number}</p>
      <p className="end-card__title display">{done ? "Nicely done." : "Finished reading?"}</p>
      <p className="end-card__text">
        {done
          ? "This module is marked as done. Its progress shows up on the program page and the home page."
          : "Mark the module as done to keep track of your progress across the program."}
      </p>
      <div className="end-card__actions">
        <DoneButton moduleKey={moduleKey} size="large" />
        {next ? (
          <Link href={next.href} className="btn btn--primary">
            Next: {next.title} <ArrowRightIcon />
          </Link>
        ) : (
          <Link href={programHref} className="btn">
            Back to all courses <ArrowRightIcon />
          </Link>
        )}
      </div>
      {done && (
        <span className="end-card__stamp" aria-hidden="true">
          <CheckIcon />
        </span>
      )}
    </section>
  );
}
