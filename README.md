# Sarthak's Coursera Notes

A static website for reading my Coursera study notes. The home page lists every program I'm taking; each program page shows its full course list, and each module of notes gets its own reading page.

Built with **Next.js (App Router) + TypeScript**, managed with **pnpm**. Notes are plain Markdown files in `content/`, turned into HTML at build time, so the finished site is just static files in `out/`.

## Features

- **Program picker** on the home page, with filters, a course "track" per program and reading progress
- **Course roadmap** per program: every course and module, including the ones without notes yet
- **Reader** with a sticky "On this page" list that follows your scroll, a reading progress bar, time left, and the module list of the current course
- **Callout boxes** for Key idea / Analogy / Clarification / Going further / Try it / Tip / Note / Example / Warning
- **Answers hidden** behind a "Reveal answers" button so you can try the exercises first
- **Search** across programs, courses, modules and every section (`Ctrl K`, `⌘ K` or `/`)
- **Progress**: mark modules as done, "continue where you left off", all saved in your browser (localStorage, nothing leaves your machine)
- Light and dark mode, adjustable text size, zoomable images, syntax-highlighted code, LaTeX maths
- Palette `#3E0F8D` `#9564DD` `#E4DA72` `#EEEEEE`, Stardom for headings and General Sans for body text (both from Fontshare, bundled in `src/app/fonts/`)

## Getting started

You need Node.js 20.9 or newer and pnpm.

```powershell
pnpm install
pnpm dev          # http://localhost:3000
```

Other scripts:

| Command | What it does |
|---|---|
| `pnpm build` | Builds the static site into `out/` |
| `pnpm start` | Serves `out/` locally to check the production build |
| `pnpm check:content` | Prints the content tree and warns about missing images or frontmatter |
| `pnpm typecheck` | TypeScript check |
| `pnpm lint` | ESLint |

## Deploying (Vercel)

1. Push the folder to a GitHub repository.
2. In Vercel, **Add New → Project** and import the repo. Vercel detects Next.js; no settings need changing.
3. Every push to `main` redeploys the site.

When the site has its final address, put it in `src/lib/site.ts` (`url`).

## Adding notes

```
content/
  google-it-support/                         ← one folder per program (the folder name is the URL)
    program.json                             ← program + course titles
    01-technical-support-fundamentals/       ← course 1 (number prefix = course number)
      01-introduction-to-it/                 ← module 1, folder form (use this when there are images)
        index.md
        images/and-gate.png
      02-hardware.md                         ← module 2, single-file form
```

1. Put the module's Markdown in the right course folder, named `NN-something`. The number decides the order and which module title from `program.json` it matches.
2. Start the file with frontmatter:

   ```yaml
   ---
   title: Hardware
   description: One sentence that appears under the title and in search.
   updated: 2026-10-24
   ---
   ```

   If there's no `title`, a leading `# Heading` is used instead.
3. Put images next to the notes and reference them relatively. The text in quotes becomes the caption:

   ```md
   ![The AND gate](images/and-gate.png "The AND gate, from the course reading")
   ```
4. Run `pnpm dev` and open the page. `pnpm check:content` flags anything that's missing.

### Writing conventions the site understands

- `## Part 3: Something` shows "Part 3" as a label above the heading; `### 3.1 Something` shows "3.1" as a number badge.
- Callouts are blockquotes that start with a bold label:

  ```md
  > **Key idea:** A byte is 8 bits.
  > **Analogy — two switches, one light:** ...   (text after the dash becomes a subtitle)
  > **Try it (gates):** ...
  ```

  GitHub alerts (`> [!NOTE]`, `> [!TIP]`, `> [!WARNING]` …) work too. The list of labels is in `src/lib/markdown/callout-kinds.ts`.
- A top-level `## Answers…` section is hidden behind a "Reveal answers" button, and every "Try it" box links to it.
- Code blocks get syntax highlighting when you name the language (` ```python `).
- Maths: `$O(n \log n)$` inline, `$$ … $$` for a block. Write `\$` for a literal dollar sign.
- A `## Table of Contents` section in the notes is kept in the page but left out of the side rail.

### Adding a program

Create `content/<slug>/program.json`. VS Code autocompletes the fields from `program.schema.json`:

```json
{
  "$schema": "../../program.schema.json",
  "title": "Full name as on Coursera",
  "shortTitle": "Short name",
  "provider": "University or company",
  "kind": "Specialization",
  "order": 4,
  "status": "in-progress",
  "description": "One or two sentences.",
  "url": "https://www.coursera.org/…",
  "courses": [
    { "title": "Course one", "modules": ["Module 1 title", "Module 2 title"] },
    { "title": "Course two" }
  ]
}
```

`modules` is optional. Listing them shows the not-yet-written modules on the program page.

## Project structure

```
content/                  notes, images and program.json files
scripts/                  copy-media (content images → public/media), check-content
src/app/                  routes: home, [program], [program]/[course]/[module], search-index.json
src/components/           header, search, theme toggle, home/, program/, reader/
src/lib/content/          reads content/ into typed programs → courses → modules
src/lib/markdown/         Markdown pipeline (GFM, maths, callouts, figures, code) and React rendering
src/styles/               tokens (palette, light/dark), base, home, program, reader, prose, search
```
