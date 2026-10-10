"use client";

import { useEffect, useState, type ReactNode } from "react";
import { SparkIcon } from "../Icons";

/** Hides the answers section until the reader asks for it, so the exercises can be tried first. */
export function RevealAnswers({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);

  // Printing should always include the answers.
  useEffect(() => {
    const show = () => setOpen(true);
    window.addEventListener("beforeprint", show);
    return () => window.removeEventListener("beforeprint", show);
  }, []);

  return (
    <div className="reveal" data-open={open}>
      <div className="reveal__content" aria-hidden={!open} inert={!open}>
        {children}
      </div>
      {!open && (
        <div className="reveal__cover">
          <p>Try the exercises first. The answers are hidden so they don&rsquo;t give anything away.</p>
          <button type="button" className="btn btn--highlight" onClick={() => setOpen(true)}>
            <SparkIcon /> Reveal answers
          </button>
        </div>
      )}
    </div>
  );
}
