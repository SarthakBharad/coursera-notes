import fs from "node:fs";
import type { Root } from "hast";
import { readModuleBody } from "../content/loader";
import type { ModuleEntry, TocEntry } from "../content/types";
import { extractSections, extractToc, markdownToHast, type Section } from "./pipeline";

export interface ModuleDocument {
  tree: Root;
  toc: TocEntry[];
  sections: Section[];
}

const cache = new Map<string, { mtime: number; document: Promise<ModuleDocument> }>();

/**
 * Parses a module's notes once and shares the result between its page and the
 * search index. Re-parses automatically when the file changes (in dev).
 */
export function getModuleDocument(module: ModuleEntry): Promise<ModuleDocument> {
  if (!module.sourcePath || !module.assetDir) throw new Error(`Module ${module.key} has no notes file.`);
  const mtime = fs.statSync(module.sourcePath).mtimeMs;
  const cached = cache.get(module.key);
  if (cached && cached.mtime === mtime) return cached.document;

  const document = markdownToHast(readModuleBody(module), {
    assetDir: module.assetDir,
    sourceFile: module.sourcePath,
  }).then((tree) => ({
    tree,
    toc: extractToc(tree),
    sections: extractSections(tree, module.title),
  }));
  cache.set(module.key, { mtime, document });
  return document;
}
