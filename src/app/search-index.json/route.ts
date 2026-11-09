import { publicSearchIndex } from "@/lib/search";

/**
 * The site search index. The search panel fetches it the first time it opens. It includes
 * every live seller product, so it is built per request (sellers' changes show at once).
 */
export const dynamic = "force-dynamic";

export async function GET() {
  return Response.json(await publicSearchIndex(), { headers: { "Cache-Control": "public, max-age=60" } });
}
