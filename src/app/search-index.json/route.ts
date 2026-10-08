import { PUBLIC_SEARCH_INDEX } from "@/lib/search";

/**
 * The site search index, built once at build time and served as a static
 * file. The search panel fetches it the first time it opens, so the brand
 * catalogues it is built from never ship in the page bundle.
 */
export const dynamic = "force-static";

export function GET() {
  return Response.json(PUBLIC_SEARCH_INDEX);
}
