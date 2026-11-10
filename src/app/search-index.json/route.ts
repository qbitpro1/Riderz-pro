import { buildSearchIndex } from "@/lib/search";

/**
 * The site search index, built from the database (products) and the site's pages. The search
 * panel fetches it the first time it opens, so the catalogue never ships in the page bundle.
 * Browsers and CDNs may keep it for a minute.
 */
export const dynamic = "force-dynamic";

export async function GET() {
  return Response.json(await buildSearchIndex(), { headers: { "Cache-Control": "public, max-age=60, s-maxage=60" } });
}
