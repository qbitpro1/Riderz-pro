import "server-only";

import type { CatalogItem } from "@/lib/catalog/types";
import { getCatalog } from "@/lib/server/catalog";

/**
 * Server-side lookup from store slugs to their catalogue items (from the database). The service
 * pages name products by slug; this resolves them to the one card, skipping hidden or missing ones.
 */
export async function itemsBySlug(slugs: readonly string[]): Promise<CatalogItem[]> {
  const bySlug = new Map((await getCatalog()).map((i) => [i.slug, i]));
  return slugs.map((s) => bySlug.get(s)).filter((i): i is CatalogItem => Boolean(i));
}
