import "server-only";

import { ALL_MODELS, findModelBySlug } from "@/lib/data/vehicles";
import { norm } from "@/lib/search/match";

/**
 * Plain keyword search shared by both assistants (the model writes the query; we rank).
 * Words in the title count most, then brand and category, then fitment and the rest.
 */

const STOP = new Set(["for", "the", "a", "an", "and", "or", "of", "my", "car", "with", "in", "to", "best", "good", "show", "me", "some", "any", "please"]);
/** A few spellings shoppers use. */
const ALIASES: Record<string, string> = { mats: "mat", covers: "cover", lights: "light", cams: "cam", dashcam: "dash cam", seatcover: "seat cover", led: "led", ambient: "ambient" };

export function words(q: string): string[] {
  return norm(q)
    .split(" ")
    .flatMap((w) => (ALIASES[w] ?? w).split(" "))
    .filter((w) => w.length > 1 && !STOP.has(w));
}

export type Searchable = { title: string; brand: string; category: string; extra: string; fitment: string[]; price: number | null };

/** Score of one item for these words; 0 = no match. */
export function score(item: Searchable, ws: string[]): number {
  if (ws.length === 0) return 1;
  const title = norm(item.title);
  const brand = norm(item.brand);
  const cat = norm(item.category);
  const extra = norm(`${item.extra} ${item.fitment.map((s) => modelLabel(s) ?? s).join(" ")}`);
  let s = 0;
  let hits = 0;
  for (const w of ws) {
    const stem = w.endsWith("s") && w.length > 3 ? w.slice(0, -1) : w;
    const has = (t: string) => t.includes(stem);
    const pts = (has(title) ? 4 : 0) + (has(brand) ? 2 : 0) + (has(cat) ? 3 : 0) + (has(extra) ? 1 : 0);
    if (pts > 0) hits++;
    s += pts;
  }
  // Most of the words should match something.
  return hits >= Math.ceil(ws.length / 2) ? s + hits * 2 : 0;
}

export const modelLabel = (slug: string) => {
  const m = findModelBySlug(slug);
  return m ? `${m.brand} ${m.name}` : null;
};

/** Does an item listed for `fitment` fit this car? null = the listing doesn't say. */
export function fits(fitment: string[], carSlug: string | null): boolean | null {
  if (!carSlug) return null;
  if (fitment.includes("universal")) return true;
  if (fitment.length === 0) return null;
  return fitment.includes(carSlug);
}

/** "creta", "hyundai creta", "scorpio n" → matching car models (slug + name). */
export function findCars(q: string, limit = 6): { slug: string; name: string; years: string; variants: string[] }[] {
  const ws = norm(q).split(" ").filter(Boolean);
  if (ws.length === 0) return [];
  return ALL_MODELS.map((m) => {
    const hay = norm(`${m.brand} ${m.name} ${m.slug.replace(/-/g, " ")}`);
    const hit = ws.filter((w) => hay.includes(w)).length;
    return { m, hit };
  })
    .filter((x) => x.hit === ws.length || (ws.length > 1 && x.hit >= ws.length - 1 && norm(x.m.name).split(" ").some((w) => ws.includes(w))))
    .sort((a, b) => b.hit - a.hit)
    .slice(0, limit)
    .map(({ m }) => ({
      slug: m.slug,
      name: `${m.brand} ${m.name}`,
      years: m.years.length ? `${m.years[m.years.length - 1]}–${m.years[0]}` : "",
      variants: m.variants.slice(0, 8),
    }));
}
