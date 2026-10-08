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
import type { CategorySlug } from "@/lib/data/products";

const lower = (...parts: (string | null | undefined)[]) =>
  parts.filter(Boolean).join(" ").toLowerCase().replace(/\s+/g, " ").trim();

/* ------------------------------------------------------------- Motorbotz */

/**
 * The house range already carries every field the shop needs, so this is a
 * straight rename rather than a transformation.
 */
function houseItem(p: Product): CatalogItem {
  return {
    id: `motorbotz:${p.slug}`,
    brand: "motorbotz",
    brandName: BRAND_BY_SLUG.motorbotz.name,
    href: `/product/${p.slug}`,
    title: p.name,
    code: null,
    category: p.category,
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
    installation: p.installation,
    bestseller: Boolean(p.bestseller),
    badges: p.bestseller ? ["Bestseller"] : [],
    keywords: lower(p.name, p.sub, p.category, p.maker, p.summary, p.fitment.join(" ")),
  };
}

export function houseItems(): CatalogItem[] {
  return HOUSE_PRODUCTS.map(houseItem);
}

/* ----------------------------------------------------------------- RECOIL */

/**
 * Every RECOIL line — amplifiers through to damping and distribution blocks —
 * sits under the shop's `audio` category; its own subcategory carries the
 * detail. Vehicle fitment is left empty rather than guessed: the price list
 * marks universal fitment explicitly and says nothing about the rest.
 */
function recoilItem(p: RecoilProduct): CatalogItem {
  const comingSoon = p.status === "COMING_SOON";
  const image = p.images[0];
  return {
    id: `recoil:${p.slug}`,
    brand: "recoil",
    brandName: BRAND_BY_SLUG.recoil.name,
    href: `/products/${p.slug}`,
    title: p.priceListName,
    code: p.sku,
    category: "audio",
    sub: p.subcategory,
    price: comingSoon ? null : p.sellingPrice,
    mrp: p.mrp,
    priceFrom: false,
    tier: tierFor(p.sellingPrice),
    image: image
      ? { kind: "remote" as const, src: image.url, alt: image.alt, fit: "contain" as const, tone: "light" as const }
      : { kind: "none" as const },
    rating: null,
    reviews: null,
    fitment: p.compatibility.type === "universal" ? ["universal"] : [],
    availability: comingSoon ? "coming-soon" : "in-stock",
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
    href: `/autoform/${d.slug}`,
    title: `Autoform ${d.code}`,
    code: d.code,
    category: "interior",
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
    href: "/autoform#mats",
    title: `Autoform ${m.design}`,
    code: null,
    category: "interior",
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
  "Boot Organiser": "Organizers",
  "Tissue Box": "Organizers",
};

function autoformAccessoryItem(a: AccessoryRow): CatalogItem {
  const price = accessorySellingPrice(a);
  const sub = (a.category && ACCESSORY_SUBS[a.category]) ?? a.category ?? "Dashboard accessories";
  return {
    id: `autoform:accessory-${a.sno}`,
    brand: "autoform",
    brandName: BRAND_BY_SLUG.autoform.name,
    href: "/autoform#accessories",
    title: `Autoform ${a.productName}`,
    code: null,
    category: "interior",
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
    href: `/brands/blaupunkt#${p.slug}`,
    title: `Blaupunkt ${p.name}`,
    code: p.model,
    category: p.category as CategorySlug,
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
