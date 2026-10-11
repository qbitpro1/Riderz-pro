import { CATALOG } from "@/lib/catalog";
import type { CatalogItem } from "@/lib/catalog/types";

/**
 * Server-side lookup from a store slug to its unified catalogue item. The legacy
 * service pages still name products by slug; this resolves them to the one card.
 */
const BY_SLUG = new Map(CATALOG.map((i) => [i.slug, i]));

export function itemsBySlug(slugs: readonly string[]): CatalogItem[] {
  return slugs.map((s) => BY_SLUG.get(s)).filter((i): i is CatalogItem => Boolean(i));
}
