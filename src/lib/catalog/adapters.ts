/**
 * BRAND ADAPTERS
 *
 * Each brand's own catalogue is projected into `CatalogItem`. The brand modules
 * are read-only here — no source of truth is moved, nothing is rewritten, and
 * every item keeps an `href` back to the page that actually owns it.
 *
 * To add a brand: write one `to…Items()` here and append it in `./index`.
 */

import { PRODUCTS as HOUSE_PRODUCTS, type Product } from "@/lib/data/products";
import { BRAND_BY_SLUG } from "./brands";
import type { CatalogItem } from "./types";
import { placeSub } from "@/lib/data/taxonomy";
import { storeSlug } from "@/lib/store/slugs";
import { productHref } from "@/lib/store/types";

/** Department, group and OE flag for a `sub` — the one place items are shelved. No product data is flagged OE yet. */
const shelve = (sub: string) => {
  const { department, group } = placeSub(sub);
  return { category: department, group, oe: false };
};

const lower = (...parts: (string | null | undefined)[]) =>
  parts.filter(Boolean).join(" ").toLowerCase().replace(/\s+/g, " ").trim();

/* ------------------------------------------------------------- Riderzpro */

/**
 * The house range already carries every field the shop needs, so this is a
 * straight rename rather than a transformation.
 */
function houseItem(p: Product): CatalogItem {
  return {
    id: `riderzpro:${p.slug}`,
    brand: "riderzpro",
    brandName: BRAND_BY_SLUG.riderzpro.name,
    slug: storeSlug.house(p),
    hasOptions: false,
    href: productHref(storeSlug.house(p)),
    title: p.name,
    code: null,
    ...shelve(p.sub),
    sub: p.sub,
    price: p.price,
    mrp: p.mrp,
    priceFrom: false,
    tier: p.tier,
    image: { kind: "media", key: p.image },
    rating: null,
    reviews: null,
    fitment: p.fitment,
    availability: p.stock > 0 ? "in-stock" : "made-to-order",
    buyable: true,
    installation: p.installation,
    bestseller: Boolean(p.bestseller),
    badges: p.bestseller ? ["Bestseller"] : [],
    keywords: lower(p.name, p.sub, placeSub(p.sub).department, p.maker, p.summary, p.fitment.join(" ")),
  };
}

export function houseItems(): CatalogItem[] {
  return HOUSE_PRODUCTS.map(houseItem);
}
