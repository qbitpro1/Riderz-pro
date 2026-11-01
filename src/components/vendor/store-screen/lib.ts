import type { ScreenProduct } from "./types";

export const IDLE_MS = 120_000;
export const COUNTDOWN_S = 20;
export const MAX_QTY = 99;
export const LOW_STOCK = 5;
export const COMPARE_MAX = 3;

export type SortKey = "featured" | "price-asc" | "price-desc" | "discount";

export const SORTS: { key: SortKey; label: string }[] = [
  { key: "featured", label: "Featured" },
  { key: "price-asc", label: "Price: low to high" },
  { key: "price-desc", label: "Price: high to low" },
  { key: "discount", label: "Biggest discount" },
];

/** The car a customer picked. */
export type Car = { slug: string; name: string; brand: string };

export const offPct = (p: { mrp: number; price: number }) =>
  p.mrp > p.price ? Math.round(((p.mrp - p.price) / p.mrp) * 100) : 0;

/** How many of a product one order may hold. */
export const maxFor = (p: ScreenProduct) => Math.min(p.stock, MAX_QTY);

export const fitsCar = (p: ScreenProduct, car: Car | null) => !car || p.universal || p.fitSlugs.includes(car.slug);

/** Matches the customer's search words against everything they might type. */
/** Words people say around a search ("show me seat covers for my Creta") that are not part of it. */
const FILLER = new Set(
  "a an and any are can could do does for find get give have i in is it looking me my need of on or please search see show some something the to want we with you".split(" "),
);

/** "covers" → "cover", so spoken and typed plurals match singular titles and the other way round. */
const stem = (w: string) => (w.length > 3 && w.endsWith("s") && !w.endsWith("ss") ? w.slice(0, -1) : w);

/** Spoken numbers, so "six point five inch" finds 6.5-inch speakers. */
const NUMBERS: Record<string, string> = {
  zero: "0", one: "1", two: "2", three: "3", four: "4", five: "5", six: "6", seven: "7", eight: "8", nine: "9", ten: "10", twelve: "12",
};
function spokenNumbers(text: string): string {
  return text
    .replace(/\b(zero|one|two|three|four|five|six|seven|eight|nine|ten|twelve)\b/g, (w) => NUMBERS[w])
    .replace(/(\d)\s+point\s+(\d)/g, "$1.$2");
}

export function matchesQuery(p: ScreenProduct, query: string): boolean {
  const words = spokenNumbers(query.toLowerCase())
    .replace(/[^a-z0-9.\s-]/g, " ")
    .split(/\s+/)
    .filter((w) => w && !FILLER.has(w))
    .map(stem);
  if (words.length === 0) return true;
  const hay = `${p.title} ${p.brand} ${p.groupName} ${p.fitLabels.join(" ")}`.toLowerCase();
  return words.every((w) => hay.includes(w));
}

export function sortProducts(list: ScreenProduct[], key: SortKey): ScreenProduct[] {
  if (key === "featured") return list;
  const out = [...list];
  if (key === "price-asc") out.sort((a, b) => a.price - b.price);
  else if (key === "price-desc") out.sort((a, b) => b.price - a.price);
  else out.sort((a, b) => offPct(b) - offPct(a) || a.price - b.price);
  return out;
}

/* ---- filters ---- */

/** A price range on the shop screen: `min` ≤ price < `max` (no `max`: and up). */
export type PriceBand = { key: string; label: string; min: number; max: number | null };

/** Round rupee amounts a range may start or end at. */
const NICE_CUTS = [500, 1000, 2000, 3000, 5000, 10000, 15000, 25000, 50000, 100000];

const short = (n: number) => new Intl.NumberFormat("en-IN").format(n);

/**
 * Up to four price ranges built from this shop's own prices: the quarter points of its prices,
 * rounded to the nearest round amount (so a shop of ₹3,000–60,000 parts gets under ₹5,000 /
 * ₹5,000–10,000 / ₹10,000–25,000 / ₹25,000+). Only ranges that have products; none when every
 * product falls in one range.
 */
export function priceBands(products: ScreenProduct[]): PriceBand[] {
  const prices = products.map((p) => p.price).sort((a, b) => a - b);
  if (prices.length < 2) return [];
  const nearest = (v: number) => NICE_CUTS.reduce((best, c) => (Math.abs(Math.log(c / v)) < Math.abs(Math.log(best / v)) ? c : best));
  const cuts = [...new Set([0.25, 0.5, 0.75].map((q) => nearest(Math.max(1, prices[Math.floor(q * prices.length)]))))].sort((a, b) => a - b);
  const edges = [0, ...cuts, null];
  const bands: PriceBand[] = [];
  for (let i = 0; i < edges.length - 1; i++) {
    const min = edges[i] as number;
    const max = edges[i + 1];
    if (!prices.some((p) => p >= min && (max === null || p < max))) continue;
    const label = min === 0 ? `Under ₹${short(max!)}` : max === null ? `₹${short(min)}+` : `₹${short(min)}–${short(max)}`;
    bands.push({ key: `${min}-${max ?? ""}`, label, min, max });
  }
  return bands.length > 1 ? bands : [];
}

export const onSale = (p: { mrp: number; price: number }) => p.price < p.mrp;

/** What the customer narrowed the shop to, besides car and search. "all" / false = not narrowed. */
export type Facets = { group: string; brand: string; price: string; sale: boolean };
export type FacetKey = keyof Facets;
export const NO_FACETS: Facets = { group: "all", brand: "all", price: "all", sale: false };

const isSet = (f: Facets, k: FacetKey) => (k === "sale" ? f.sale : f[k] !== "all");

/** Whether `p` passes every chosen filter, leaving out `skip` (for that filter's own counts). */
export function matchesFacets(p: ScreenProduct, f: Facets, bands: PriceBand[], skip?: FacetKey): boolean {
  if (skip !== "group" && f.group !== "all" && p.group !== f.group) return false;
  if (skip !== "brand" && f.brand !== "all" && p.brand !== f.brand) return false;
  if (skip !== "sale" && f.sale && !onSale(p)) return false;
  if (skip !== "price" && f.price !== "all") {
    const b = bands.find((x) => x.key === f.price);
    if (b && (p.price < b.min || (b.max !== null && p.price >= b.max))) return false;
  }
  return true;
}

/**
 * The filters after the customer changed `changed` to its new value in `next`. When nothing in
 * `list` matches them all, the filters that clash with the new choice are cleared instead of
 * showing an empty screen (and, failing that, every other filter).
 */
export function settleFacets(list: ScreenProduct[], next: Facets, changed: FacetKey, bands: PriceBand[]): Facets {
  if (!isSet(next, changed) || list.some((p) => matchesFacets(p, next, bands))) return next;
  const out = { ...next };
  const others = (Object.keys(NO_FACETS) as FacetKey[]).filter((k) => k !== changed && isSet(next, k));
  for (const k of others) {
    const pair = { ...NO_FACETS, [changed]: next[changed], [k]: next[k] };
    if (!list.some((p) => matchesFacets(p, pair, bands))) Object.assign(out, { [k]: NO_FACETS[k] });
  }
  if (list.some((p) => matchesFacets(p, out, bands))) return out;
  return { ...NO_FACETS, [changed]: next[changed] };
}

/** The short "fits" chip for a tile. */
export function fitChip(p: ScreenProduct, car: Car | null): { text: string; match: boolean } | null {
  if (car && p.fitSlugs.includes(car.slug)) return { text: `Fits your ${car.name}`, match: true };
  if (p.universal) return { text: car ? `Universal, fits your ${car.name}` : "Universal", match: Boolean(car) };
  if (p.fitSlugs.length === 0) return null;
  const first = p.fitLabels[0];
  return { text: p.fitSlugs.length > 1 ? `Fits ${first} +${p.fitSlugs.length - 1}` : `Fits ${first}`, match: false };
}

/** Shared class strings, so every touch target is the same size and colour. */
export const ui = {
  primary:
    "inline-flex min-h-14 items-center justify-center gap-2.5 rounded-full bg-accent px-7 shadow-md text-base font-bold text-on-accent transition-[transform,background-color] duration-200 active:scale-[0.97] hover:bg-accent-deep disabled:opacity-45 disabled:active:scale-100",
  secondary:
    "inline-flex min-h-14 items-center justify-center gap-2.5 rounded-full border border-tint/20 bg-void px-7 text-base font-semibold text-chalk transition-[transform,background-color] duration-200 active:scale-[0.97] hover:bg-carbon disabled:opacity-45",
  icon: "grid h-12 w-12 shrink-0 place-items-center rounded-xl border border-tint/15 bg-void text-chalk transition-[transform,background-color] duration-200 active:scale-95 hover:bg-carbon disabled:opacity-40",
  pill: "inline-flex min-h-12 shrink-0 items-center gap-2 rounded-full border px-5 text-[15px] font-semibold transition-colors duration-200",
} as const;
