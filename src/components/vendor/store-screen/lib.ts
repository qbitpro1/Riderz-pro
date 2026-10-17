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
export function matchesQuery(p: ScreenProduct, query: string): boolean {
  const words = query.trim().toLowerCase().split(/\s+/).filter(Boolean);
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
    "inline-flex min-h-14 items-center justify-center gap-2.5 rounded-xl bg-accent px-6 text-base font-bold text-on-accent transition-[transform,background-color] duration-200 active:scale-[0.97] hover:bg-accent-deep disabled:opacity-45 disabled:active:scale-100",
  secondary:
    "inline-flex min-h-14 items-center justify-center gap-2.5 rounded-xl border border-tint/20 bg-void px-6 text-base font-semibold text-chalk transition-[transform,background-color] duration-200 active:scale-[0.97] hover:bg-carbon disabled:opacity-45",
  icon: "grid h-12 w-12 shrink-0 place-items-center rounded-xl border border-tint/15 bg-void text-chalk transition-[transform,background-color] duration-200 active:scale-95 hover:bg-carbon disabled:opacity-40",
  pill: "inline-flex min-h-12 shrink-0 items-center gap-2 rounded-full border px-5 text-[15px] font-semibold transition-colors duration-200",
} as const;
