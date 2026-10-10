/**
 * Copies every non-markdown file under content/ (images, PDFs, …) to
 * public/media/, keeping the same folder structure, so the notes can link to
 * images that sit right next to them. Runs automatically before `dev` and `build`.
 */
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const contentDir = path.join(root, "content");
const outDir = path.join(root, "public", "media");
const SKIP = new Set([".md", ".json"]);

function copyTree(from: string, to: string): number {
  let copied = 0;
  for (const entry of fs.readdirSync(from, { withFileTypes: true })) {
    if (entry.name.startsWith(".")) continue;
    const source = path.join(from, entry.name);
    const target = path.join(to, entry.name);
    if (entry.isDirectory()) {
      copied += copyTree(source, target);
    } else if (entry.isFile() && !SKIP.has(path.extname(entry.name).toLowerCase())) {
      fs.mkdirSync(to, { recursive: true });
      fs.copyFileSync(source, target);
      copied++;
    }
  }
  return copied;
}

fs.rmSync(outDir, { recursive: true, force: true });
const count = fs.existsSync(contentDir) ? copyTree(contentDir, outDir) : 0;
console.log(`[media] copied ${count} file${count === 1 ? "" : "s"} from content/ to public/media/`);
