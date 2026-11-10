import "server-only";

/**
 * THE CATALOGUE IMPORT SOURCE (product details)
 *
 * The site reads products from the database (catalog_products, src/lib/server/catalog.ts). This
 * module is only what the import reads: every product from the brand price lists and the house
 * range, projected into the one `ProductDetail` shape in `./types`. Nothing else imports it. Server-only: the brand modules carry dealer prices, and
 * although nothing confidential is copied into a `ProductDetail`, the source
 * records must never be importable from the browser.
 *
 * Price, MRP, availability, department and group are taken from the catalogue
 * item the listing already shows (`CATALOG`), so a card and its page can never
 * disagree. This module adds what a page needs on top: images, options,
 * highlights, specs and the like — filled only from fields the source carries.
 */

import type { CatalogItem } from "@/lib/catalog/types";
import { FILE_CATALOG as CATALOG } from "@/lib/catalog/file-source";
import { BRAND_BY_SLUG } from "@/lib/catalog/brands";
import { DEPARTMENT_BY_SLUG, placeSub } from "@/lib/data/taxonomy";
import { PRODUCTS as HOUSE_PRODUCTS, type Product as HouseProduct } from "@/lib/data/products";
import { ALL_PRODUCTS as RECOIL_ALL, type CatalogProduct as RecoilProduct } from "@/lib/data/recoil";
import {
  ACCESSORIES as AF_ACCESSORIES,
  CUSTOM_CHARGE,
  DESIGNS as AF_DESIGNS,
  DESIGN_FEATURES,
  MATS as AF_MATS,
  accessoryPublishable,
  bandFor,
  priceFor,
  toPublicPrice,
  type AccessoryRow,
  type AutoformDesign,
  type MatProduct,
} from "@/lib/autoform/catalog";
import { PRODUCTS as BLAUPUNKT_PRODUCTS, type BlaupunktProduct } from "@/lib/data/blaupunkt";
import type { ProductDetail, ProductImage, ProductOption } from "./types";
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

function toImage(item: CatalogItem, fallbackAlt: string): ProductImage[] {
  const img = item.image;
  if (img.kind === "media") return [{ kind: "media", key: img.key, alt: img.alt ?? fallbackAlt }];
  if (img.kind === "remote") return [img];
  return [];
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

/** Installation is offered (price and time unstated) or not offered. */
const installOffered = (item: CatalogItem) => (item.installation ? { price: null, time: null } : null);

const roundTo10 = (n: number) => Math.round(n / 10) * 10;

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
    rating: null, // real ratings come from customer reviews (src/lib/server/reviews.ts)
    reviews: null,
    source: null,
    indexable: true,
  };
}

/* ----------------------------------------------------------------- RECOIL */

const SPEC_PAIR = /^([^:：@]{2,40}?)\s*[:：]\s*(\S.*)$/;

/**
 * Source rows carry an internal annotation, e.g. "Special Dimensions: -8 × -5 mm
 * (retained reference)" on the RCX65. The note is not for shoppers and negative
 * dimensions are placeholders, so strip a trailing "(retained reference)" and
 * drop a dimensions line that carries a negative number. Other negative values
 * (dB, °C) are real and stay.
 */
function cleanSourceLine(line: string): string | null {
  const cleaned = line.replace(/\s*\(retained reference\)\s*$/i, "").trim();
  if (/dimension/i.test(cleaned) && /[:：×x]\s*-\d/.test(cleaned)) return null;
  return cleaned || null;
}

/** Split "Label: value" lines into specs; anything else is a highlight. */
function splitSpecLines(lines: string[]) {
  const specs: { label: string; value: string }[] = [];
  const highlights: string[] = [];
  for (const raw of lines) {
    const line = cleanSourceLine(raw.trim());
    if (!line) continue;
    const m = SPEC_PAIR.exec(line);
    if (m) specs.push({ label: m[1].trim(), value: m[2].trim() });
    else highlights.push(line);
  }
  return { specs, highlights };
}

/** Manufacturer text is either one prose paragraph (a summary) or a bulleted spec list. */
function manufacturerText(p: RecoilProduct) {
  let summary: string | null = null;
  const bullets: string[] = [];
  for (const text of [p.manufacturer?.description, p.manufacturer?.shortDescription]) {
    if (!text) continue;
    const lines = text
      .split(/\r?\n/)
      .map((l) => l.replace(/^\s*[*•-]\s*/, "").trim())
      .filter((l) => l && !/N\/A/i.test(l))
      .map(cleanSourceLine)
      .filter((l): l is string => l !== null);
    if (lines.length === 1 && lines[0].length >= 40 && !summary) summary = lines[0];
    else bullets.push(...lines);
  }
  return { summary, bullets };
}

/**
 * Rows held back from the shop (not published) have no catalogue item but keep
 * a page. Their shelf and price follow `recoilItem` in the catalogue adapter,
 * replicated here because that function is private.
 */
function recoilBase(p: RecoilProduct) {
  const listed = ITEM_BY_ID.get(`recoil:${p.slug}`);
  if (listed) return { item: listed, base: base(storeSlug.recoil(p), listed) };
  const comingSoon = p.status === "COMING_SOON";
  const { department, group } = placeSub(p.category);
  const shelf = DEPARTMENT_BY_SLUG[department].groups.find((g) => g.slug === group)?.name ?? group;
  return {
    item: undefined,
    base: {
      slug: storeSlug.recoil(p),
      brand: "recoil" as const,
      brandName: BRAND_BY_SLUG.recoil.name,
      title: p.priceListName,
      code: p.sku,
      department,
      group,
      groupName: shelf,
      price: comingSoon ? null : p.sellingPrice,
      mrp: p.mrp,
      priceFrom: false,
      availability: comingSoon ? ("coming-soon" as const) : ("in-stock" as const),
      fitment: p.compatibility.type === "universal" ? ["universal"] : [],
      bestseller: false,
      oe: false,
    },
  };
}

function recoilDetail(p: RecoilProduct): ProductDetail {
  const { base: b } = recoilBase(p);
  const { specs, highlights } = splitSpecLines(p.priceListSpecs);
  const text = manufacturerText(p);
  const seen = new Set(highlights.map((h) => h.toLowerCase()));
  for (const b of text.bullets) {
    if (!seen.has(b.toLowerCase())) {
      seen.add(b.toLowerCase());
      highlights.push(b);
    }
  }
  return {
    ...b,
    stock: null,
    images: p.images.map((i) => ({
      kind: "remote" as const,
      src: i.url,
      alt: i.alt,
      fit: "contain" as const,
      tone: "light" as const,
    })),
    options: [],
    summary: text.summary,
    highlights,
    specs,
    installation: { price: null, time: null },
    warranty: null,
    delivery: null,
    rating: null,
    reviews: null,
    source: `RECOIL price list, ${p.priceListEdition}`,
    // A held-back row keeps a page (as today) but stays out of search engines.
    indexable: p.published,
  };
}

/* --------------------------------------------------------------- Autoform */

const SEAT_ROWS_OPTION_ID = "rows";

function autoformDesignDetail(d: AutoformDesign): ProductDetail {
  const item = itemFor(`autoform:design-${d.slug}`);
  const band = bandFor(d);
  const two = toPublicPrice(priceFor(d, 2));
  const three = toPublicPrice(priceFor(d, 3));
  const rows: ProductOption = {
    id: SEAT_ROWS_OPTION_ID,
    name: "Seat rows",
    values: [
      { id: "2", label: "2 rows", priceDelta: 0, mrpDelta: 0, available: true },
      {
        id: "3",
        label: "3 rows",
        priceDelta: three.sellingPrice - two.sellingPrice,
        mrpDelta: three.mrp - two.mrp,
        available: true,
      },
    ],
  };
  return {
    ...base(storeSlug.autoformDesign(d), item),
    stock: null,
    images: toImage(item, `Autoform ${d.code} seat cover design`),
    options: [rows],
    summary: null,
    highlights: DESIGN_FEATURES,
    specs: [
      { label: "Design", value: d.tagline },
      { label: "Series", value: band.series },
      { label: "Custom charge", value: `₹${CUSTOM_CHARGE.amount.toLocaleString("en-IN")} incl. 18% GST` },
    ],
    installation: installOffered(item),
    warranty: null,
    delivery: null,
    rating: null,
    reviews: null,
    source: "Autoform catalogue",
    indexable: true,
  };
}

function autoformMatDetail(m: MatProduct): ProductDetail {
  const item = itemFor(`autoform:mat-${m.sno}`);
  // Selling price is derived exactly as the catalogue adapter does: 10% off MRP, to the nearest ₹10.
  const sell = (mrp: number | null) => (mrp === null ? null : roundTo10(mrp * 0.9));
  const baseMrp = m.twoRow.mrp;
  const basePrice = sell(baseMrp);
  const valueFor = (id: string, label: string, mrp: number | null) => {
    const price = sell(mrp);
    const priced = mrp !== null && baseMrp !== null && basePrice !== null && price !== null;
    return {
      id,
      label,
      priceDelta: priced ? price - basePrice : 0,
      mrpDelta: priced ? mrp - baseMrp : 0,
      available: mrp !== null,
    };
  };
  const options: ProductOption[] = [
    {
      id: SEAT_ROWS_OPTION_ID,
      name: "Seat rows",
      values: [valueFor("2", "2 rows", m.twoRow.mrp), valueFor("3", "3 rows", m.threeRow.mrp)],
    },
  ];
  if (m.colours.length > 0) {
    options.push({
      id: "colour",
      name: "Colour",
      values: m.colours.map((c) => ({
        id: c.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
        label: c,
        priceDelta: 0,
        mrpDelta: 0,
        available: true,
      })),
    });
  }
  return {
    ...base(storeSlug.autoformMat(m), item),
    stock: null,
    images: toImage(item, `Autoform ${m.design}`),
    options,
    summary: null,
    highlights: [],
    specs: [{ label: "Range", value: m.category }],
    installation: null,
    warranty: null,
    delivery: null,
    rating: null,
    reviews: null,
    source: "Autoform catalogue",
    indexable: true,
  };
}

function autoformAccessoryDetail(a: AccessoryRow): ProductDetail {
  const item = itemFor(`autoform:accessory-${a.sno}`);
  return {
    ...base(storeSlug.autoformAccessory(a), item),
    stock: null,
    images: toImage(item, `Autoform ${a.productName}`),
    options: [],
    summary: null,
    highlights: [],
    specs: a.category ? [{ label: "Range", value: a.category }] : [],
    installation: null,
    warranty: null,
    delivery: null,
    rating: null,
    reviews: null,
    source: "Autoform catalogue",
    indexable: true,
  };
}

/* ------------------------------------------------------------- Blaupunkt */

function blaupunktDetail(p: BlaupunktProduct): ProductDetail {
  const item = itemFor(`blaupunkt:${p.slug}`);
  return {
    ...base(storeSlug.blaupunkt(p), item),
    stock: null,
    images: toImage(item, `Blaupunkt ${p.name}`),
    options: [],
    summary: null,
    highlights: p.specs,
    specs: [],
    installation: installOffered(item),
    warranty: null,
    delivery: null,
    rating: null,
    reviews: null,
    source: p.source,
    indexable: true,
  };
}

/* ------------------------------------------------------------- the lot */

/**
 * Every product with the catalogue item it was built from (null for a held-back RECOIL row, which
 * keeps a page but is not listed). In file order, which becomes the database's sort order.
 */
export function fileProducts(): { detail: ProductDetail; item: CatalogItem | null }[] {
  const built: { detail: ProductDetail; itemId: string }[] = [
    ...HOUSE_PRODUCTS.map((p) => ({ detail: houseDetail(p), itemId: `riderzpro:${p.slug}` })),
    // Every RECOIL row has a page (unpublished ones are noindex).
    ...RECOIL_ALL.map((p) => ({ detail: recoilDetail(p), itemId: `recoil:${p.slug}` })),
    ...AF_DESIGNS.map((d) => ({ detail: autoformDesignDetail(d), itemId: `autoform:design-${d.slug}` })),
    ...AF_MATS.map((m) => ({ detail: autoformMatDetail(m), itemId: `autoform:mat-${m.sno}` })),
    ...AF_ACCESSORIES.filter(accessoryPublishable).map((a) => ({
      detail: autoformAccessoryDetail(a),
      itemId: `autoform:accessory-${a.sno}`,
    })),
    ...BLAUPUNKT_PRODUCTS.map((p) => ({ detail: blaupunktDetail(p), itemId: `blaupunkt:${p.slug}` })),
  ];
  const seen = new Set<string>();
  for (const b of built) {
    if (seen.has(b.detail.slug)) throw new Error(`store/file-source: duplicate product slug "${b.detail.slug}"`);
    seen.add(b.detail.slug);
  }
  return built.map((b) => ({ detail: b.detail, item: ITEM_BY_ID.get(b.itemId) ?? null }));
}
