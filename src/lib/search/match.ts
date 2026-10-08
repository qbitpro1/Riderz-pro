/**
 * SITE SEARCH — MATCHING
 *
 * The scoring and the shapes the search panel works with. Holds no catalogue
 * data: the index itself is built server-side in `./index` and fetched by the
 * panel from `/search-index.json`, so nothing confidential reaches the browser.
 */

export type SearchKind =
  | "Car"
  | "Product"
  | "Category"
  | "Service"
  | "Build"
  | "My Car"
  | "Brand"
  | "RECOIL"
  | "Autoform";

export type SearchEntry = {
  id: string;
  kind: SearchKind;
  title: string;
  meta: string;
  href: string;
  keywords: string;
};

/** Brand shortcuts for the search panel — name, destination and product count. */
export type SearchBrand = { slug: string; name: string; href: string; count: number };

export type SearchIndex = { entries: SearchEntry[]; brands: SearchBrand[] };

export function norm(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9 ]/g, " ").replace(/\s+/g, " ").trim();
}

export const SEARCH_SUGGESTIONS = [
  "Thar accessories",
  "Creta facelift",
  "Fortuner lift kit",
  "SPL4200",
  "4 channel amplifier",
  "Autoform seat covers",
  "6.5 midrange",
  "BMW ambient lighting",
  "7D mats",
  "Sound deadening",
  "Used cars in Bengaluru",
];

export function searchAll(index: SearchEntry[], query: string, limit = 8): SearchEntry[] {
  const q = norm(query);
  if (q.length < 2) return [];
  const terms = q.split(" ");

  return index.map((entry) => {
    const haystack = `${norm(entry.title)} ${entry.keywords}`;
    let score = 0;
    for (const term of terms) {
      if (!haystack.includes(term)) return { entry, score: -1 };
      score += norm(entry.title).startsWith(term) ? 6 : norm(entry.title).includes(term) ? 4 : 1;
    }
    // Nudge shopping intent above listings when both match equally, and let an
    // exact model number outrank everything.
    if (entry.kind === "My Car") score += 2;
    if (entry.kind === "Category") score += 1;
    // A brand name should land on the brand, not on the first of its 250 SKUs.
    if (entry.kind === "Brand") score += 3;
    if (entry.kind === "RECOIL" && terms.some((t) => norm(entry.title).split(" ")[0] === t)) score += 12;
    return { entry, score };
  })
    .filter((r) => r.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((r) => r.entry);
}
