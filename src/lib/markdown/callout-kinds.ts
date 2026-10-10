/**
 * Callout boxes. A blockquote whose first words are bold and match one of the
 * names below becomes a styled callout:
 *
 *   > **Key idea:** A byte is 8 bits.
 *   > **Analogy — two switches, one light:** ...   (the part after the dash becomes a subtitle)
 *   > **Try it (gates):** ...                       (so does a part in brackets)
 *
 * GitHub-style alerts work too: `> [!NOTE]`, `> [!TIP]`, `> [!IMPORTANT]`, `> [!WARNING]`, `> [!CAUTION]`.
 * Add a new kind here, then give it an icon in components/reader/Callout.tsx
 * and colours in styles/prose.css.
 */
export const CALLOUT_KINDS = {
  "key-idea": { label: "Key idea", names: ["key idea", "key point", "important", "remember"] },
  analogy: { label: "Analogy", names: ["analogy"] },
  clarification: { label: "Clarification", names: ["clarification", "correction"] },
  "going-further": { label: "Going further", names: ["going further", "deep dive", "bonus"] },
  "try-it": { label: "Try it", names: ["try it", "exercise", "practice", "quiz"] },
  tip: { label: "Tip", names: ["tip", "hint"] },
  note: { label: "Note", names: ["note", "info"] },
  example: { label: "Example", names: ["example"] },
  warning: { label: "Watch out", names: ["warning", "caution", "watch out", "careful"] },
} as const;

export type CalloutKind = keyof typeof CALLOUT_KINDS;

export const GITHUB_ALERTS: Record<string, CalloutKind> = {
  NOTE: "note",
  TIP: "tip",
  IMPORTANT: "key-idea",
  WARNING: "warning",
  CAUTION: "warning",
};

export function isCalloutKind(value: unknown): value is CalloutKind {
  return typeof value === "string" && value in CALLOUT_KINDS;
}
