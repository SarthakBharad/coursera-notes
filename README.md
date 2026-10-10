<div align="center">

# Sarthak's Coursera Notes

**My Coursera study notes, turned into a fast, searchable reading site.**

[![Next.js](https://img.shields.io/badge/Next.js-App_Router-000000?logo=nextdotjs&logoColor=white)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![pnpm](https://img.shields.io/badge/pnpm-F69220?logo=pnpm&logoColor=white)](https://pnpm.io/)
[![Markdown](https://img.shields.io/badge/notes-Markdown-3E0F8D?logo=markdown&logoColor=white)](content/)
[![Vercel](https://img.shields.io/badge/deployed_on-Vercel-000000?logo=vercel&logoColor=white)](https://vercel.com/)

<!-- Live site: replace with your Vercel URL -->
<!-- **[View the site →](https://your-site.vercel.app)** -->

</div>

<!-- Add a screenshot once the site is live: -->
<!-- ![Home page](docs/screenshot-home.png) -->

## About

A static website for reading the notes I write while working through Coursera programs. The home page lists every program I'm taking, each program page shows its full course roadmap, and every module of notes gets its own focused reading page.

Notes are plain Markdown files in `content/`. They're turned into HTML at build time, so the finished site is just static files with no server and no database. Visits are counted with [Vercel Web Analytics](https://vercel.com/docs/analytics), which uses no cookies and only records anonymous page views.

## Programs

| Program | Provider | Type | Status |
|---|---|---|---|
| Google IT Support | Google | Professional Certificate | In progress |
| Data Structures and Algorithms | UC San Diego | Specialization | In progress |
| Digital Technologies and the Future of Manufacturing | University of Michigan | Specialization | In progress |

More will be added as I take them.

## Features

**Browse**
- Program picker on the home page, with filters, a course track per program and reading progress
- Course roadmap for each program, listing every course and module, including ones without notes yet

**Read**
- Sticky "On this page" list that follows your scroll, a reading progress bar and estimated time left
- Callout boxes: Key idea, Analogy, Clarification, Going further, Try it, Tip, Note, Example, Warning
- Exercise answers hidden behind a "Reveal answers" button, so you can try them first
- Syntax-highlighted code, LaTeX maths and zoomable images with captions

**Find**
- Search across programs, courses, modules and every section (`Ctrl K`, `⌘ K` or `/`)

**Track**
- Mark modules as done and pick up where you left off
- Progress is stored in your browser's localStorage and never leaves your machine

**Look and feel**
- Light and dark mode, adjustable text size
- Palette `#3E0F8D` `#9564DD` `#E4DA72` `#EEEEEE`
- [Stardom](https://www.fontshare.com/fonts/stardom) for headings and [General Sans](https://www.fontshare.com/fonts/general-sans) for body text, both from Fontshare

## Tech stack

- [Next.js](https://nextjs.org/) (App Router) with static export
- TypeScript and React
- Markdown pipeline with GitHub Flavored Markdown, maths, custom callouts, figures and code highlighting
- [pnpm](https://pnpm.io/) for package management
- Hosted on [Vercel](https://vercel.com/), with Vercel Web Analytics

## Getting started

You need **Node.js 20.9 or newer** and **pnpm**.

```sh
git clone https://github.com/<your-username>/<repo-name>.git
cd <repo-name>
pnpm install
pnpm dev          # http://localhost:3000
```

### Scripts

| Command | What it does |
|---|---|
| `pnpm dev` | Starts the dev server at `localhost:3000` |
| `pnpm build` | Builds the static site into `out/` |
| `pnpm start` | Serves `out/` locally to check the production build |
| `pnpm check:content` | Prints the content tree and warns about missing images or frontmatter |
| `pnpm typecheck` | Runs the TypeScript compiler without emitting |
| `pnpm lint` | Runs ESLint |

## Adding notes

### Content layout

```
content/
  google-it-support/                         ← one folder per program (folder name = URL)
    program.json                             ← program and course titles
    01-technical-support-fundamentals/       ← course 1 (number prefix = course number)
      01-introduction-to-it/                 ← module 1, folder form (use when there are images)
        index.md
        images/and-gate.png
      02-hardware.md                         ← module 2, single-file form
```

1. Put the module's Markdown in the right course folder, named `NN-something`. The number sets the order and matches the module title in `program.json`.
2. Start the file with frontmatter:

   ```yaml
   ---
   title: Hardware
   description: One sentence that appears under the title and in search.
   updated: 2026-10-24
   ---
   ```

   If there's no `title`, the first `# Heading` is used instead.

3. Put images next to the notes and reference them with relative paths. The quoted text becomes the caption:

   ```md
   ![The AND gate](images/and-gate.png "The AND gate, from the course reading")
   ```

4. Run `pnpm dev` and open the page. `pnpm check:content` flags anything that's missing.

### Writing conventions

| Write this | Get this |
|---|---|
| `## Part 3: Something` | "Part 3" shown as a label above the heading |
| `### 3.1 Something` | "3.1" shown as a number badge |
| `> **Key idea:** A byte is 8 bits.` | A Key idea callout |
| `> **Analogy — two switches, one light:** …` | A callout with a subtitle (text after the dash) |
| `> [!NOTE]`, `> [!TIP]`, `> [!WARNING]` | GitHub-style alerts, rendered as callouts |
| `## Answers…` (top level) | Hidden behind "Reveal answers"; every Try it box links to it |
| ` ```python ` | Syntax-highlighted code block |
| `$O(n \log n)$` / `$$ … $$` | Inline / block maths (write `\$` for a literal dollar sign) |
| `## Table of Contents` | Kept in the page, left out of the side rail |

The full list of callout labels lives in `src/lib/markdown/callout-kinds.ts`.

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

`modules` is optional. Listing them shows the modules that don't have notes yet on the program page.

## Project structure

```
content/                  notes, images and program.json files
scripts/                  copy-media (content images → public/media), check-content
src/app/                  routes: home, [program], [program]/[course]/[module], search-index.json
src/app/fonts/            bundled Stardom and General Sans
src/components/           header, search, theme toggle, home/, program/, reader/
src/lib/content/          reads content/ into typed programs → courses → modules
src/lib/markdown/         Markdown pipeline and React rendering
src/lib/site.ts           site name and URL
src/styles/               tokens (palette, light/dark), base, home, program, reader, prose, search
```

## Deploying

1. Import the repository in Vercel (**Add New → Project**). Next.js is detected automatically, so no settings need changing.
2. Every push to `main` redeploys the site.
3. Once the site has its final address, set `url` in `src/lib/site.ts`.

## License

The source code is released under the [MIT License](LICENSE).

The MIT License covers the code only. It does not cover the notes or images in `content/`, or the bundled fonts in `src/app/fonts/`.

## Disclaimer

These are my personal study notes. Course material, including images taken from Coursera readings, belongs to Coursera and the respective course providers. This project is not affiliated with or endorsed by Coursera, Google, UC San Diego or the University of Michigan.

Fonts: Stardom and General Sans by [Indian Type Foundry](https://www.indiantypefoundry.com/), distributed through [Fontshare](https://www.fontshare.com/) under the ITF Free Font License.