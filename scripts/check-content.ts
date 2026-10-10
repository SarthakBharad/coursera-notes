/**
 * Prints the content tree as the site sees it and flags common mistakes:
 *   pnpm check:content
 */
import fs from "node:fs";
import path from "node:path";
import { CONTENT_DIR, getPrograms } from "../src/lib/content/loader";
import { formatMinutes } from "../src/lib/content/text";

let warnings = 0;
const warn = (message: string) => {
  warnings++;
  console.log(`  ! ${message}`);
};

for (const entry of fs.readdirSync(CONTENT_DIR, { withFileTypes: true })) {
  if (entry.isDirectory() && !entry.name.startsWith(".") && !fs.existsSync(path.join(CONTENT_DIR, entry.name, "program.json"))) {
    warn(`content/${entry.name}/ has no program.json, so it is ignored`);
  }
}

for (const program of getPrograms()) {
  console.log(`\n${program.shortTitle}  (/${program.slug})`);
  for (const course of program.courses) {
    console.log(`  Course ${course.number}: ${course.title}${course.optional ? " (optional)" : ""}`);
    for (const mod of course.modules) {
      const status = mod.hasNotes ? `${formatMinutes(mod.readingMinutes)}  ${mod.href}` : "not written yet";
      console.log(`    Module ${mod.number}: ${mod.title}  —  ${status}`);
      if (mod.hasNotes && mod.sourcePath) {
        const body = fs.readFileSync(mod.sourcePath, "utf8");
        for (const match of body.matchAll(/!\[[^\]]*\]\(([^)\s]+)/g)) {
          const src = match[1] ?? "";
          if (/^(https?:|\/|data:)/.test(src)) continue;
          if (!fs.existsSync(path.resolve(mod.assetDir ?? "", decodeURIComponent(src)))) {
            warn(`missing image "${src}" in ${path.relative(process.cwd(), mod.sourcePath)}`);
          }
        }
        if (!/^\uFEFF?---\r?\n/.test(body)) warn(`${path.relative(process.cwd(), mod.sourcePath)} has no frontmatter (title/description)`);
      }
    }
  }
}

console.log(warnings ? `\n${warnings} warning(s).` : "\nAll good.");
