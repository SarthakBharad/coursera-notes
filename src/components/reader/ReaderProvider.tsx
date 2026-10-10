"use client";

import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import type { TocEntry } from "@/lib/content/types";
import { getModuleProgress, updateModule } from "@/lib/progress";
import { CloseIcon, PlayIcon } from "../Icons";

const ActiveSection = createContext<string | null>(null);
const ScrollProgress = createContext(0);

/** id of the section currently at the top of the screen. */
export function useActiveSection(): string | null {
  return useContext(ActiveSection);
}

/** How far through the article the reader is, 0..1. */
export function useScrollProgress(): number {
  return useContext(ScrollProgress);
}

const ACTIVE_OFFSET = 140;

/**
 * Watches scrolling on a module page: works out the current section and how
 * far through the reader is, and saves both so the reader can come back to
 * the same spot later (a "continue where you left off" prompt).
 */
export function ReaderProvider({ moduleKey, toc, children }: { moduleKey: string; toc: TocEntry[]; children: ReactNode }) {
  const [activeId, setActiveId] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [resume, setResume] = useState<{ id: string; title: string } | null>(null);
  const latest = useRef({ progress: 0, activeId: null as string | null });

  // Record the visit and offer to resume where the reader stopped last time.
  useEffect(() => {
    const saved = getModuleProgress(moduleKey);
    updateModule(moduleKey, { visitedAt: Date.now() }, { markLast: true });
    if (!window.location.hash && saved?.sectionId && !saved.done && (saved.scrolled ?? 0) > 0.03) {
      // localStorage only exists after mount, so this can't be initial state.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setResume({ id: saved.sectionId, title: saved.sectionTitle ?? "where you stopped" });
    }
  }, [moduleKey]);

  useEffect(() => {
    const article = document.getElementById("article");
    if (!article) return;
    const titles = new Map(toc.map((entry) => [entry.id, entry.kicker ? `${entry.kicker}: ${entry.text}` : entry.text]));
    const headings = toc.map((entry) => document.getElementById(entry.id)).filter((el): el is HTMLElement => !!el);

    let frame = 0;
    let scrolled = false;
    let lastSave = 0;

    const save = () => {
      if (!scrolled) return;
      const { progress: value, activeId: id } = latest.current;
      updateModule(moduleKey, {
        scrolled: Math.round(value * 1000) / 1000,
        sectionId: id ?? undefined,
        sectionTitle: id ? titles.get(id) : undefined,
      });
    };

    const measure = () => {
      frame = 0;
      const rect = article.getBoundingClientRect();
      const span = Math.max(article.offsetHeight - window.innerHeight, 1);
      const value = Math.min(Math.max(-rect.top / span, 0), 1);
      let id: string | null = null;
      // At the very bottom the last sections can't reach the top of the screen,
      // so count any heading that is on screen as reached.
      const line = value >= 0.995 ? window.innerHeight - 80 : ACTIVE_OFFSET;
      for (const heading of headings) {
        if (heading.getBoundingClientRect().top <= line) id = heading.id;
        else break;
      }
      latest.current = { progress: value, activeId: id };
      setActiveId(id);
      setProgress((previous) => (Math.abs(previous - value) < 0.001 ? previous : value));

      // The "welcome back" prompt goes away once the reader moves on their own.
      if (scrolled && value > 0.05) setResume(null);

      const now = Date.now();
      if (scrolled && now - lastSave > 1500) {
        lastSave = now;
        save();
      }
    };

    const onScroll = () => {
      scrolled = true;
      if (!frame) frame = requestAnimationFrame(measure);
    };
    const onResize = () => {
      if (!frame) frame = requestAnimationFrame(measure);
    };
    const onHide = () => {
      if (document.visibilityState === "hidden") save();
    };

    // Lazy images and the answers section change the article's height without a scroll.
    const resizeObserver = new ResizeObserver(onResize);
    resizeObserver.observe(article);

    measure();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onResize);
    document.addEventListener("visibilitychange", onHide);
    window.addEventListener("pagehide", save);
    return () => {
      cancelAnimationFrame(frame);
      resizeObserver.disconnect();
      save();
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onResize);
      document.removeEventListener("visibilitychange", onHide);
      window.removeEventListener("pagehide", save);
    };
  }, [moduleKey, toc]);

  const jump = () => {
    if (!resume) return;
    document.getElementById(resume.id)?.scrollIntoView({ behavior: "smooth", block: "start" });
    history.replaceState(null, "", `#${resume.id}`);
    setResume(null);
  };

  return (
    <ActiveSection.Provider value={activeId}>
      <ScrollProgress.Provider value={progress}>
        {children}
        {resume && (
          <div className="toast" role="status">
            <div className="toast__text">
              <span className="toast__eyebrow">Welcome back</span>
              <span>
                Continue at <strong>{resume.title}</strong>?
              </span>
            </div>
            <button type="button" className="btn btn--highlight btn--small" onClick={jump}>
              <PlayIcon /> Jump there
            </button>
            <button type="button" className="icon-btn toast__close" onClick={() => setResume(null)} aria-label="Dismiss">
              <CloseIcon />
            </button>
          </div>
        )}
      </ScrollProgress.Provider>
    </ActiveSection.Provider>
  );
}

/** Thin bar under the header that fills as you read. */
export function ReadingProgressBar() {
  const progress = useScrollProgress();
  return (
    <div className="read-bar" aria-hidden="true">
      <span style={{ transform: `scaleX(${progress})` }} />
    </div>
  );
}
