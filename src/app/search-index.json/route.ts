import { buildSearchIndex } from "@/lib/search";

// Written to out/search-index.json at build time; the search box fetches it on first open.
export const dynamic = "force-static";

export async function GET() {
  return Response.json(await buildSearchIndex());
}
