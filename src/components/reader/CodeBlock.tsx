"use client";

import { useRef, useState, type ComponentProps } from "react";
import { CheckIcon, CopyIcon } from "../Icons";

/** A code block with a language tag and a copy button. */
export function CodeBlock(props: ComponentProps<"pre">) {
  const ref = useRef<HTMLPreElement>(null);
  const [copied, setCopied] = useState(false);
  const language = (props as Record<string, unknown>)["data-language"];
  const label = typeof language === "string" && language !== "plaintext" && language !== "text" ? language : null;

  const copy = async () => {
    const text = ref.current?.innerText ?? "";
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      // Clipboard can be blocked; nothing else to do.
    }
  };

  return (
    <div className="code-block">
      {label && <span className="code-block__lang">{label}</span>}
      <pre ref={ref} {...props} />
      <button type="button" className="code-block__copy" onClick={copy} aria-label={copied ? "Copied" : "Copy code"}>
        {copied ? <CheckIcon /> : <CopyIcon />}
      </button>
    </div>
  );
}
