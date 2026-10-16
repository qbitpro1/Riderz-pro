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

/** `Availability` plus "out-of-stock", which only marketplace items whose seller has no units left use. */
export type ShopAvailability = Availability | "out-of-stock";

/** The store a marketplace item is sold by. Only public fields; mirrors `CartLine.seller`. */
export type CatalogSeller = { id: string; name: string; slug: string };

/** Filter key for a marketplace seller's own brand text, e.g. `mp-bosch-india`. Never collides with a house `BrandSlug`. */
export type MarketplaceBrandKey = `mp-${string}`;

export type CatalogItem = {
  /** Unique across every source. `${brand}:${slug}`. */
  id: string;
  brand: BrandSlug;
  brandName: string;
  /** The store slug — unique across brands; the product lives at `/products/{slug}`. */
  slug: string;
  /** The unified product page, `/products/{slug}`. */
  href: string;
  /** True when a choice (seat rows, colour…) is needed before it can be bought. */
  hasOptions: boolean;
  title: string;
  /** SKU, design code or series — whatever the source uses to identify the item. */
  code: string | null;
  /** The department this item is shelved under, derived from `sub` via the taxonomy. */
  category: CategorySlug;
  /** Group slug within the department. */
  group: string;
  /** Original Equipment part. Nothing is flagged OE yet. */
  oe: boolean;
  /** Subcategory label, as the source names it. */
  sub: string;
  /** Selling price in rupees, or null when the source carries no price. */
  price: number | null;
  mrp: number | null;
  /** True when `price` is a starting price rather than the final one. */
  priceFrom: boolean;
  /** Price band, or null when the item has no price (price on request / coming soon) so it sits in no band. */
  tier: PriceTier | null;
  image: CatalogImage;
  rating: number | null;
  reviews: number | null;
  /** Model slugs from the vehicle catalogue, or ["universal"]. Empty when unknown. */
  fitment: string[];
  availability: Availability;
  /**
   * True when the product can be bought online: it has a price, is not coming soon and its product
   * page is indexable (the same rule the wishlist and the product page use). A held-back item keeps
   * its `price` for reference but the shop shows "Price on request" and treats it as price-less.
   */
  buyable: boolean;
  installation: boolean;
  bestseller: boolean;
  /** Short labels rendered on the card — "Bestseller", "Coming soon", "Made to order". */
  badges: string[];
  /** Lower-cased free text the shop search box matches against. */
  keywords: string;
  /** Set only on marketplace items sold by an approved vendor. House items never carry it. */
  seller?: CatalogSeller;
};

/**
 * What the shop browser, filters and cards work with: a house `CatalogItem`, or a
 * marketplace item whose `brand` is the seller's own brand text keyed `mp-…` (the
 * house brand registry does not know it). `CatalogItem` is assignable to `ShopItem`.
 */
export type ShopItem = Omit<CatalogItem, "brand" | "availability"> & {
  brand: BrandSlug | MarketplaceBrandKey;
  availability: ShopAvailability;
};

export const TIER_BOUNDS: Record<PriceTier, [number, number]> = {
  value: [0, 4999],
  mid: [5000, 24_999],
  premium: [25_000, Number.POSITIVE_INFINITY],
};

export function tierFor(price: number | null): PriceTier | null {
  if (price === null) return null;
  if (price <= TIER_BOUNDS.value[1]) return "value";
  if (price <= TIER_BOUNDS.mid[1]) return "mid";
  return "premium";
}
