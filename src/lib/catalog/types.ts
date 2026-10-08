/**
 * THE UNIFIED CATALOGUE ITEM
 *
 * One shape every brand's products are projected into so the shop can filter,
 * sort and count across all of them at once. It is deliberately a *projection*,
 * not a replacement: each brand keeps its own richer model and its own store
 * pages, and `href` always points back at the real product page.
 *
 * Nothing in here is invented. A field a source doesn't carry stays null, and
 * the UI renders the absence rather than filling it in.
 */

import type { MediaKey } from "@/lib/media";
import type { CategorySlug, PriceTier } from "@/lib/data/products";
import type { BrandSlug } from "./brands";

/**
 * Two kinds of imagery live side by side: our own curated photography, keyed
 * into the media library, and manufacturer product shots served as URLs. They
 * need different framing — a studio cut-out on white must not be cropped.
 */
export type CatalogImage =
  | { kind: "media"; key: MediaKey; alt?: string }
  | { kind: "remote"; src: string; alt: string; fit: "contain" | "cover"; tone: "light" | "dark" }
  | { kind: "none" };

export type Availability = "in-stock" | "made-to-order" | "coming-soon";

export type CatalogItem = {
  /** Unique across every source. `${brand}:${slug}`. */
  id: string;
  brand: BrandSlug;
  brandName: string;
  /** The product page this item resolves to — on the brand store where one exists. */
  href: string;
  title: string;
  /** SKU, design code or series — whatever the source uses to identify the item. */
  code: string | null;
  /** One of the six shop categories. */
  category: CategorySlug;
  /** Subcategory label, as the source names it. */
  sub: string;
  /** Selling price in rupees, or null when the source carries no price. */
  price: number | null;
  mrp: number | null;
  /** True when `price` is a starting price rather than the final one. */
  priceFrom: boolean;
  tier: PriceTier;
  image: CatalogImage;
  rating: number | null;
  reviews: number | null;
  /** Model slugs from the vehicle catalogue, or ["universal"]. Empty when unknown. */
  fitment: string[];
  availability: Availability;
  installation: boolean;
  bestseller: boolean;
  /** Short labels rendered on the card — "Bestseller", "Coming soon", "Made to order". */
  badges: string[];
  /** Lower-cased free text the shop search box matches against. */
  keywords: string;
};

export const TIER_BOUNDS: Record<PriceTier, [number, number]> = {
  value: [0, 4999],
  mid: [5000, 24_999],
  premium: [25_000, Number.POSITIVE_INFINITY],
};

export function tierFor(price: number | null): PriceTier {
  if (price === null) return "mid";
  if (price <= TIER_BOUNDS.value[1]) return "value";
  if (price <= TIER_BOUNDS.mid[1]) return "mid";
  return "premium";
}
