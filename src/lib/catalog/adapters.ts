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
import {
  COMING_SOON as RECOIL_COMING_SOON,
  PRODUCTS as RECOIL_PRODUCTS,
  type CatalogProduct as RecoilProduct,
} from "@/lib/data/recoil";
import {
  ACCESSORIES as AUTOFORM_ACCESSORIES,
  DESIGNS as AUTOFORM_DESIGNS,
  MATS as AUTOFORM_MATS,
  accessoryPublishable,
  accessorySellingPrice,
  bandFor,
  priceFor,
  type AccessoryRow,
  type AutoformDesign,
  type MatProduct,
} from "@/lib/autoform/catalog";
import { PRODUCTS as BLAUPUNKT_PRODUCTS, type BlaupunktProduct } from "@/lib/data/blaupunkt";
import { BRAND_BY_SLUG } from "./brands";
import { tierFor, type CatalogItem } from "./types";
import { isKnownSub, placeSub } from "@/lib/data/taxonomy";
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
    rating: p.rating,
    reviews: p.reviews,
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

/* ----------------------------------------------------------------- RECOIL */

/**
 * Every RECOIL line — amplifiers through to damping and distribution blocks —
 * is shelved by its category through the taxonomy (mostly Multimedia); its own subcategory carries the
 * detail. Vehicle fitment is left empty rather than guessed: the price list
 * marks universal fitment explicitly and says nothing about the rest.
 */
function recoilItem(p: RecoilProduct): CatalogItem {
  const comingSoon = p.status === "COMING_SOON";
  // Mirrors `indexable: p.published` in the product-detail builder (store/products.ts).
  const buyable = !comingSoon && p.published;
  const image = p.images[0];
  return {
    id: `recoil:${p.slug}`,
    brand: "recoil",
    brandName: BRAND_BY_SLUG.recoil.name,
    slug: storeSlug.recoil(p),
    hasOptions: false,
    href: productHref(storeSlug.recoil(p)),
    title: p.priceListName,
    code: p.sku,
    // RECOIL's own `category` (Amplifiers, Wiring, Marine…) is the label the taxonomy names;
    // its `subcategory` (Mono, 4-Channel…) is finer detail and stays as `sub`.
    ...shelve(p.category),
    sub: p.subcategory,
    price: comingSoon ? null : p.sellingPrice,
    mrp: p.mrp,
    priceFrom: false,
    tier: buyable ? tierFor(p.sellingPrice) : null,
    image: image
      ? { kind: "remote" as const, src: image.url, alt: image.alt, fit: "contain" as const, tone: "light" as const }
      : { kind: "none" as const },
    rating: null,
    reviews: null,
    fitment: p.compatibility.type === "universal" ? ["universal"] : [],
    availability: comingSoon ? "coming-soon" : "in-stock",
    buyable,
    installation: true,
    bestseller: false,
    badges: comingSoon ? ["Coming soon"] : [],
    keywords: lower(p.sku, p.priceListName, p.subcategory, p.series, "recoil", p.searchTokens.join(" ")),
  };
}

export function recoilItems(): CatalogItem[] {
  return RECOIL_PRODUCTS.concat(RECOIL_COMING_SOON).map(recoilItem);
}

/* --------------------------------------------------------------- Autoform */

/**
 * Seat covers are priced by series band and row count, not per design, so the
 * card carries the 2-row price marked as a starting price. `priceFrom` is what
 * stops that reading as the final figure.
 */
function autoformDesignItem(d: AutoformDesign): CatalogItem {
  const price = priceFor(d, 2);
  const band = bandFor(d);
  return {
    id: `autoform:design-${d.slug}`,
    brand: "autoform",
    brandName: BRAND_BY_SLUG.autoform.name,
    slug: storeSlug.autoformDesign(d),
    hasOptions: true,
    href: productHref(storeSlug.autoformDesign(d)),
    title: `Autoform ${d.code}`,
    code: d.code,
    ...shelve("Seat covers"),
    sub: "Seat covers",
    price: price.sellingPrice,
    mrp: price.mrp,
    priceFrom: true,
    tier: tierFor(price.sellingPrice),
    image: {
      kind: "remote",
      src: d.image,
      alt: `Autoform ${d.code} seat cover design`,
      fit: "cover",
      tone: "dark",
    },
    rating: null,
    reviews: null,
    // Cut to the vehicle at order time; the source carries no model list.
    fitment: [],
    availability: "made-to-order",
    buyable: true,
    installation: true,
    bestseller: false,
    badges: ["Made to order"],
    keywords: lower("autoform", d.code, d.tagline, band.series, "seat cover seat covers"),
  };
}

/** [PRICE sheet 3] Mats live on the brand store rather than on their own page. */
function autoformMatItem(m: MatProduct): CatalogItem {
  const mrp = m.twoRow.mrp;
  const price = mrp === null ? null : Math.round((mrp * 0.9) / 10) * 10;
  return {
    id: `autoform:mat-${m.sno}`,
    brand: "autoform",
    brandName: BRAND_BY_SLUG.autoform.name,
    slug: storeSlug.autoformMat(m),
    hasOptions: true,
    href: productHref(storeSlug.autoformMat(m)),
    title: `Autoform ${m.design}`,
    code: null,
    ...shelve(m.category === "7D Mats" ? "7D mats" : "Foot mats"),
    sub: m.category === "7D Mats" ? "7D mats" : "Foot mats",
    price,
    mrp,
    priceFrom: true,
    tier: tierFor(price),
    image: { kind: "media", key: "steeringNight" },
    rating: null,
    reviews: null,
    fitment: [],
    availability: "made-to-order",
    buyable: price !== null,
    installation: false,
    bestseller: false,
    badges: mrp === null ? ["Price on request"] : ["Made to order"],
    keywords: lower("autoform", m.design, m.category, "mats", m.colours.join(" ")),
  };
}

/**
 * [PRICE sheet 2] The price sheet's own accessory category names are kept
 * except where one is unambiguously the same thing as an existing shop
 * subcategory — mapping any further would be guessing at what the row is.
 */
const ACCESSORY_SUBS: Record<string, string> = {
  "Stitch Type Steering Cover": "Steering covers",
  Polyfill: "Neck cushions",
};

function autoformAccessoryItem(a: AccessoryRow): CatalogItem {
  const price = accessorySellingPrice(a);
  // The sheet's broad "Utility" bucket (and a missing category) hold unrelated things, so a product the
  // taxonomy names itself is shelved by its own name first, then by the sheet's category.
  const name = a.productName?.trim() ?? "";
  const sub =
    (name && isKnownSub(name) ? name : null) ??
    (a.category && ACCESSORY_SUBS[a.category]) ??
    a.category ??
    "Dashboard accessories";
  return {
    id: `autoform:accessory-${a.sno}`,
    brand: "autoform",
    brandName: BRAND_BY_SLUG.autoform.name,
    slug: storeSlug.autoformAccessory(a),
    hasOptions: false,
    href: productHref(storeSlug.autoformAccessory(a)),
    title: `Autoform ${a.productName}`,
    code: null,
    ...shelve(sub),
    sub,
    price,
    mrp: a.mrp,
    priceFrom: false,
    tier: tierFor(price),
    image: { kind: "media", key: "cockpitScreen" },
    rating: null,
    reviews: null,
    fitment: ["universal"],
    availability: "in-stock",
    buyable: price !== null,
    installation: false,
    bestseller: false,
    badges: [],
    keywords: lower("autoform", a.productName, a.category, sub),
  };
}

/* -------------------------------------------------------------- Blaupunkt */

/**
 * The brochure photographs are local files lifted from the catalogue page, so
 * they frame like editorial photography rather than a studio cut-out.
 */
function blaupunktItem(p: BlaupunktProduct): CatalogItem {
  return {
    id: `blaupunkt:${p.slug}`,
    brand: "blaupunkt",
    brandName: BRAND_BY_SLUG.blaupunkt.name,
    slug: storeSlug.blaupunkt(p),
    hasOptions: false,
    href: productHref(storeSlug.blaupunkt(p)),
    title: `Blaupunkt ${p.name}`,
    code: p.model,
    ...shelve(p.subcategory),
    sub: p.subcategory,
    price: p.sellingPrice,
    mrp: p.mrp,
    priceFrom: false,
    tier: tierFor(p.sellingPrice),
    image: p.image
      ? { kind: "remote" as const, src: p.image.file, alt: `Blaupunkt ${p.name}`, fit: "cover" as const, tone: "dark" as const }
      : { kind: "none" as const },
    rating: null,
    reviews: null,
    // The brochure states no vehicle fitment for any line.
    fitment: [],
    availability: "in-stock",
    buyable: p.sellingPrice !== null,
    installation: true,
    bestseller: false,
    badges: [],
    keywords: lower("blaupunkt", p.model, p.variant, p.name, p.subcategory, p.group, p.specs.join(" ")),
  };
}

export function blaupunktItems(): CatalogItem[] {
  return BLAUPUNKT_PRODUCTS.map(blaupunktItem);
}

export function autoformItems(): CatalogItem[] {
  return [
    ...AUTOFORM_DESIGNS.map(autoformDesignItem),
    ...AUTOFORM_MATS.map(autoformMatItem),
    // A row without a product name cannot be sold, so it is not listed either.
    ...AUTOFORM_ACCESSORIES.filter(accessoryPublishable).map(autoformAccessoryItem),
  ];
}
