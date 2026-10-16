/**
 * THE STORE CONTRACT
 *
 * One product-detail shape and one cart-line shape that every brand's products
 * are projected into, so there is a single product page, a single cart and a
 * single URL scheme — whichever catalogue a product came from.
 *
 * Types only, and nothing confidential (no dealer price), so client components
 * may import this file. The data that fills it is built server-side in
 * `./products` and passed to the page as props.
 */

import type { BrandSlug } from "@/lib/catalog/brands";
import type { MediaKey } from "@/lib/media";
import type { DepartmentSlug } from "@/lib/data/taxonomy";

/** Every product lives at `/products/{slug}`; slugs are unique across brands. */
export function productHref(slug: string): string {
  return `/products/${slug}`;
}

export type ProductImage =
  /** A key into `MEDIA` — stock photography, rendered with <Photo>. */
  | { kind: "media"; key: MediaKey; alt: string }
  /** A product photograph by URL or public path. `tone` is the photo's own background. */
  | { kind: "remote"; src: string; alt: string; fit: "contain" | "cover"; tone: "light" | "dark" };

/**
 * One choice the shopper makes before adding to the cart — seat rows, colour.
 * Options are independent: the price is the base price plus every selected
 * value's `priceDelta` (and likewise for MRP).
 */
export type ProductOption = {
  id: string;
  name: string;
  values: ProductOptionValue[];
};

export type ProductOptionValue = {
  id: string;
  label: string;
  /** Added to the base price / MRP when selected. 0 for the default choice. */
  priceDelta: number;
  mrpDelta: number;
  /** False when the source lists the choice but no price for it. */
  available: boolean;
};

export type ProductAvailability = "in-stock" | "made-to-order" | "coming-soon";

export type ProductDetail = {
  slug: string;
  brand: BrandSlug;
  brandName: string;
  title: string;
  /** Manufacturer model number / SKU, when the source prints one. */
  code: string | null;
  department: DepartmentSlug;
  /** Group slug within the department, and its display name. */
  group: string;
  groupName: string;

  /** Base selling price in rupees, inclusive of GST. Null = price on request. */
  price: number | null;
  mrp: number | null;
  /** True when `price` is a starting price that options or the vehicle raise. */
  priceFrom: boolean;
  availability: ProductAvailability;
  /** Units on hand, only where the source tracks stock. */
  stock: number | null;

  images: ProductImage[];
  options: ProductOption[];

  /** One-paragraph description. Null when the source has none — never invented. */
  summary: string | null;
  /** Short bullet points: features or headline specs. */
  highlights: string[];
  specs: { label: string; value: string }[];

  /** Vehicle model slugs, `["universal"]`, or empty when the source does not say. */
  fitment: string[];
  installation: { price: number | null; time: string | null } | null;
  warranty: string | null;
  delivery: string | null;

  /** Present only where real ratings exist for the product. */
  rating: number | null;
  reviews: number | null;
  bestseller: boolean;
  oe: boolean;

  /** Where the product record comes from, for the "product details" block. */
  source: string | null;
  /** False keeps a held-back product's page out of search engines. */
  indexable: boolean;
};

/* ------------------------------------------------------------------- cart */

/**
 * A line in the cart. `id` identifies the product *and* the chosen options, so
 * the same seat cover in two-row and three-row form is two lines.
 */
export type CartLine = {
  id: string;
  slug: string;
  href: string;
  name: string;
  /** Human-readable chosen options, e.g. "3 rows · Black". */
  variant?: string;
  image?: ProductImage;
  /** Unit price with the chosen options applied. */
  price: number;
  qty: number;
  /** Optional installation add-on booked with the part, per unit. */
  install?: number;
  /**
   * Set for marketplace products sold by an approved vendor (`slug` is then
   * `vendor:<product slug>`, see src/lib/vendor/types.ts). Absent for the house range.
   */
  seller?: { id: string; name: string; slug: string };
};

/** The cart-line id for a product with the given option choices (option id → value id). */
export function cartLineId(slug: string, choices: Record<string, string> = {}): string {
  const picked = Object.keys(choices)
    .sort()
    .map((k) => `${k}=${choices[k]}`)
    .join("&");
  return picked ? `${slug}?${picked}` : slug;
}
