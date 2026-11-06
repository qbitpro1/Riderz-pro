/**
 * BRAND NORMALIZATION
 *
 * A marketplace seller types their brand by hand ("RECOIL", " Recoil ", "recoil audio"…). Without
 * this, a seller's RECOIL speakers were keyed `mp-recoil` and showed as a second "RECOIL" next to
 * the house brand in every brand list and count. Every brand key goes through `normalizeBrand`, so
 * one brand is one key wherever it is counted (the header pills and the sidebar filter alike).
 *
 * Pure and dependency-light so it can be unit tested and used on server and client.
 */

import { slugify } from "@/lib/format";
import { BRANDS, type BrandSlug } from "./brands";
import type { MarketplaceBrandKey } from "./types";

/** Trimmed, lower-case, single-spaced: the form two brand texts are compared in. */
export const brandText = (s: string): string => s.trim().replace(/\s+/g, " ").toLowerCase();

/** URL-safe slug of a brand text (the same rule marketplace keys always used, so old links still work). */
const slug = (s: string): string => slugify(brandText(s)).slice(0, 60);

type HouseBrand = { slug: string; name: string };

/**
 * The key a brand text is filed under: a house brand's slug when the text names one (by name or by
 * slug, case- and space-insensitive), otherwise a stable `mp-…` key, so two sellers typing the same
 * brand differently still share one key.
 */
export function normalizeBrand(
  raw: string,
  house: readonly HouseBrand[] = BRANDS,
): { key: BrandSlug | MarketplaceBrandKey; name: string } {
  const text = brandText(raw);
  const s = slug(raw);
  const match = house.find((b) => brandText(b.name) === text || b.slug === s);
  if (match) return { key: match.slug as BrandSlug, name: match.name };
  return { key: `mp-${s || "brand"}` as MarketplaceBrandKey, name: raw.trim().replace(/\s+/g, " ") || "Brand" };
}

/**
 * Brand counts for a list of items, one entry per brand key, most products first. Used for the
 * header brand pills so they count exactly what the sidebar's brand facet counts.
 */
export function brandCounts<T extends { brand: string; brandName: string }>(
  items: readonly T[],
): { key: string; name: string; count: number }[] {
  const out = new Map<string, { key: string; name: string; count: number }>();
  for (const i of items) {
    const cur = out.get(i.brand);
    if (cur) cur.count += 1;
    else out.set(i.brand, { key: i.brand, name: i.brandName, count: 1 });
  }
  return [...out.values()].sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));
}
