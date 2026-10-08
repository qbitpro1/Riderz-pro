/**
 * THE UNIFIED CATALOGUE
 *
 * Every brand's products in one filterable list, plus the filter engine the
 * shop, the category pages and the brand pages all share.
 *
 * The brand stores (/recoil, /autoform) are not replaced by this — they stay
 * as they are. This layer is the *other* way in: by category, by price, by
 * fitment, and by brand.
 */

import "server-only";

import { CATEGORIES, fitsModel as houseFitsModel } from "@/lib/data/products";
import { BRANDS, LIVE_BRANDS, type BrandSlug } from "./brands";
import { autoformItems, blaupunktItems, houseItems, recoilItems } from "./adapters";
import { itemFits } from "./filters";
import type { CatalogItem } from "./types";

export * from "./brands";
export * from "./filters";
export * from "./types";

/** Every product from every brand, in one list. */
export const CATALOG: CatalogItem[] = [
  ...houseItems(),
  ...recoilItems(),
  ...autoformItems(),
  ...blaupunktItems(),
];

export const CATALOG_BY_BRAND: Record<BrandSlug, CatalogItem[]> = Object.fromEntries(
  BRANDS.map((b) => [b.slug, CATALOG.filter((i) => i.brand === b.slug)]),
) as Record<BrandSlug, CatalogItem[]>;

export function catalogFor(brand: BrandSlug): CatalogItem[] {
  return CATALOG_BY_BRAND[brand] ?? [];
}

export const CATALOG_TOTALS = {
  products: CATALOG.length,
  brands: LIVE_BRANDS.length,
  categories: CATEGORIES.length,
  /** Distinct subcategory labels across every brand. */
  subcategories: new Set(CATALOG.map((i) => i.sub)).size,
};

/* ------------------------------------------------------- related / helpers */

/** House fitment logic, re-exported so callers don't reach past this module. */
export const productFitsModel = houseFitsModel;

export function itemsForModel(modelSlug: string): CatalogItem[] {
  return CATALOG.filter((i) => itemFits(i, modelSlug));
}
