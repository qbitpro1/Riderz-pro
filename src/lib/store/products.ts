import "server-only";

/**
 * THE STORE'S PRODUCT DETAILS
 *
 * Every product from every catalogue, projected into the one `ProductDetail`
 * shape in `./types`. Server-only: the brand modules carry dealer prices, and
 * although nothing confidential is copied into a `ProductDetail`, the source
 * records must never be importable from the browser.
 *
 * Price, MRP, availability, department and group are taken from the catalogue
 * item the listing already shows (`CATALOG`), so a card and its page can never
 * disagree. This module adds what a page needs on top: images, options,
 * highlights, specs and the like — filled only from fields the source carries.
 */

import { CATALOG, type CatalogItem } from "@/lib/catalog";
import { DEPARTMENT_BY_SLUG } from "@/lib/data/taxonomy";
import { PRODUCTS as HOUSE_PRODUCTS, type Product as HouseProduct } from "@/lib/data/products";
import type { ProductDetail } from "./types";
import { storeSlug } from "./slugs";

/* ------------------------------------------------------------------ slugs */

export { storeSlug };

/* ---------------------------------------------------------------- helpers */

const ITEM_BY_ID = new Map<string, CatalogItem>(CATALOG.map((i) => [i.id, i]));

function itemFor(id: string): CatalogItem {
  const item = ITEM_BY_ID.get(id);
  if (!item) throw new Error(`store/products: no catalogue item "${id}"`);
  return item;
}

function groupName(item: CatalogItem): string {
  const dept = DEPARTMENT_BY_SLUG[item.category];
  return dept.groups.find((g) => g.slug === item.group)?.name ?? item.group;
}

/** The fields every record takes straight from its catalogue item. */
function base(slug: string, item: CatalogItem) {
  return {
    slug,
    brand: item.brand,
    brandName: item.brandName,
    title: item.title,
    code: item.code,
    department: item.category,
    group: item.group,
    groupName: groupName(item),
    price: item.price,
    mrp: item.mrp,
    priceFrom: item.priceFrom,
    availability: item.availability,
    fitment: item.fitment,
    bestseller: item.bestseller,
    oe: item.oe,
  };
}

/* ------------------------------------------------------------------ house */

function houseDetail(p: HouseProduct): ProductDetail {
  const item = itemFor(`riderzpro:${p.slug}`);
  const keys = [p.image, ...(p.gallery ?? [])].filter((k, i, a) => a.indexOf(k) === i);
  return {
    ...base(storeSlug.house(p), item),
    stock: p.stock,
    images: keys.map((key, i) => ({
      kind: "media" as const,
      key,
      alt: i === 0 ? p.name : `${p.name} — view ${i + 1}`,
    })),
    options: [],
    summary: p.summary || null,
    highlights: p.features,
    specs: p.specs,
    installation: p.installation ? { price: p.installPrice ?? null, time: p.installTime ?? null } : null,
    warranty: p.warranty || null,
    delivery: p.delivery || null,
    rating: null,
    reviews: null,
    source: null,
    indexable: true,
  };
}

/* ------------------------------------------------------------- the lot */

/** Each record with the id of the catalogue item it was built from. */
const built: { detail: ProductDetail; itemId: string }[] = HOUSE_PRODUCTS.map((p) => ({
  detail: houseDetail(p),
  itemId: `riderzpro:${p.slug}`,
}));

export const PRODUCT_DETAILS: ProductDetail[] = built.map((b) => b.detail);

const DETAIL_BY_SLUG = new Map<string, ProductDetail>();
for (const d of PRODUCT_DETAILS) {
  if (DETAIL_BY_SLUG.has(d.slug)) throw new Error(`store/products: duplicate product slug "${d.slug}"`);
  DETAIL_BY_SLUG.set(d.slug, d);
}

const SLUG_BY_ITEM_ID = new Map(built.map((b) => [b.itemId, b.detail.slug]));

export const PRODUCT_SLUGS: string[] = PRODUCT_DETAILS.map((d) => d.slug);

export function getProductDetail(slug: string): ProductDetail | undefined {
  return DETAIL_BY_SLUG.get(slug);
}

/** The store slug for a catalogue item, so cards can link to `/products/{slug}`. */
export function catalogSlugFor(item: CatalogItem): string | null {
  return SLUG_BY_ITEM_ID.get(item.id) ?? null;
}

/** Same department+group first, then the rest of the department; never itself, never coming-soon. */
export function relatedProducts(slug: string, limit = 8): CatalogItem[] {
  const detail = DETAIL_BY_SLUG.get(slug);
  if (!detail) return [];
  const pool = CATALOG.filter(
    (i) => SLUG_BY_ITEM_ID.get(i.id) !== slug && i.availability !== "coming-soon" && i.category === detail.department,
  );
  return [...pool.filter((i) => i.group === detail.group), ...pool.filter((i) => i.group !== detail.group)].slice(0, limit);
}
