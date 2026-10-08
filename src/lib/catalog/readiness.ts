/**
 * LAUNCH READINESS
 *
 * What is live, what is held back, and — the only part that matters — exactly
 * what unblocks each held-back item.
 *
 * Every product in here is already imported and already priced. None of it is
 * waiting on more catalogue; it is waiting on a document, a manufacturer answer
 * or a commercial decision. This module names which, per item, so the queue can
 * be worked rather than guessed at.
 *
 * Server-side only: it reads the full RECOIL records, which carry dealer price.
 * Nothing here returns `dp`, and nothing here may be imported by a client
 * component.
 */

import { ALL_PRODUCTS, CATALOG_SUMMARY, type CatalogProduct } from "@/lib/data/recoil";
import {
  ACCESSORIES,
  CATALOGUE_SUMMARY as AUTOFORM_SUMMARY,
  DESIGNS,
  DESIGNS_AWAITING_CATALOGUE,
  MATS,
  SOURCE_DOCS,
  accessoryPublishable,
} from "@/lib/autoform/catalog";
import {
  SUMMARY as BLAUPUNKT_SUMMARY,
  VERIFICATION_QUEUE as BLAUPUNKT_QUEUE,
} from "@/lib/data/blaupunkt";
import { CARS } from "@/lib/data/cars";
import { SOURCES } from "@/lib/inventory/sources";
import { CATALOG, CATALOG_BY_BRAND } from "./index";

export type BlockerOwner =
  /** Only the manufacturer can answer it. */
  | "Manufacturer"
  /** The answer is in a document we don't have, or haven't read yet. */
  | "Source document"
  /** We have everything we need; someone has to make the call. */
  | "Internal decision";

export type BlockedItem = {
  brand: string;
  /** SKU, design code or row reference — whatever identifies it in the source. */
  ref: string;
  name: string;
  note: string;
};

export type Blocker = {
  id: string;
  title: string;
  /** What actually unblocks it, in one sentence a human can act on. */
  need: string;
  owner: BlockerOwner;
  items: BlockedItem[];
};

/* ------------------------------------------------------------- RECOIL */

const IMAGE_FLAGS = ["IMAGE_VERIFICATION_REQUIRED", "NO_MANUFACTURER_MATCH"];
const PRICE_FLAGS = ["NO_DP", "NO_MRP", "PRICE_ANOMALY", "MARGIN_ANOMALY", "MRP_IS_SET_PRICE", "PRICE_NOTE"];
const IDENTITY_FLAGS = ["DUAL_SKU_CELL", "SHARED_ROW_PRICING", "ROW_AMBIGUOUS", "DUPLICATE_SKU", "SKU_AS_PRINTED"];
const SPEC_FLAGS = [
  "SPEC_CONFLICT",
  "SKU_SPEC_MISMATCH",
  "HEADING_CONFLICT",
  "TITLE_CONFLICT",
  "SPEC_MISSING",
  "DUPLICATE_DESCRIPTION",
  "PDF_TYPO",
];

const held = ALL_PRODUCTS.filter((p) => !p.published && p.verification !== "COMING_SOON");

function recoilItems(flags: string[]): BlockedItem[] {
  return held
    .filter((p) => p.flags.some((f) => flags.includes(f)))
    .map((p) => ({
      brand: "RECOIL",
      ref: p.sku,
      name: p.priceListName,
      note: p.flags.filter((f) => flags.includes(f)).map((f) => CATALOG_SUMMARY.flagMeanings[f] ?? f).join(" "),
    }));
}

/* ----------------------------------------------------------- Autoform */

const autoformDesigns: BlockedItem[] = DESIGNS_AWAITING_CATALOGUE.map((d) => ({
  brand: "Autoform",
  ref: d.listedAs,
  name: `${d.listedAs} seat covers`,
  note: `Priced in the ${SOURCE_DOCS.PRICE.name} but absent from the 2024 catalogue. Almost certainly in "${SOURCE_DOCS.NEWCAT.name}", which has not been read.`,
}));

const autoformAccessories: BlockedItem[] = ACCESSORIES.filter((a) => !accessoryPublishable(a)).map((a) => ({
  brand: "Autoform",
  ref: `Price sheet 2, row ${a.sno}`,
  name: a.productName ?? `${a.category ?? "Uncategorised"} — name missing`,
  note: a.flags.includes("MULTI_SKU_ROW")
    ? "One row prices several model codes at once; each needs its own SKU before it can be sold."
    : "The spreadsheet's merged cells left this row without a product name. It has a real DP and MRP, but a price with no product cannot be listed.",
}));

const autoformMats: BlockedItem[] = MATS.filter((m) => m.twoRow.mrp === null).map((m) => ({
  brand: "Autoform",
  ref: `Price sheet 3, row ${m.sno}`,
  name: m.design,
  note: "Dealer price is printed but MRP is blank, so there is no public price to show.",
}));

/* ---------------------------------------------------------- Blaupunkt */

/**
 * The 2026 brochure lays several models out per page under one photograph, so
 * most records arrive priced and specified but with no image that can honestly
 * be attributed to a single model.
 */
const blaupunkt = (flags: string[]): BlockedItem[] =>
  BLAUPUNKT_QUEUE.filter((p) => p.flags.some((f) => flags.includes(f))).map((p) => ({
    brand: "Blaupunkt",
    ref: `${p.model} (p.${p.page})`,
    name: p.name,
    note: p.flags
      .filter((f) => flags.includes(f))
      .map((f) => BLAUPUNKT_SUMMARY.flagMeanings[f] ?? f)
      .join(" "),
  }));

/* ------------------------------------------------------------ blockers */

export const BLOCKERS: Blocker[] = [
  {
    id: "images",
    title: "No verified product image",
    need: "A manufacturer image pack keyed by model number. For Autoform, reading the Brand Store Exclusive catalogue would clear the design rows outright; for Blaupunkt, per-model shots would replace the one-photo-per-page the brochure gives.",
    owner: "Source document",
    items: [...recoilItems(IMAGE_FLAGS), ...autoformDesigns, ...blaupunkt(["NO_IMAGE", "IMAGE_COUNT_MISMATCH", "IMAGE_ORDER_ASSUMED"])],
  },
  {
    id: "identity",
    title: "The row doesn't identify one product",
    need: "A re-read of the source sheet where cells are merged, shared or doubled up — one product per row, with its own model number. The Blaupunkt rows need their catalogue page read visually, because the model name sits inside a spec table.",
    owner: "Source document",
    items: [
      ...recoilItems(IDENTITY_FLAGS),
      ...autoformAccessories,
      ...blaupunkt(["MODEL_UNCERTAIN", "DUPLICATE_LISTING"]),
    ],
  },
  {
    id: "pricing",
    title: "Incomplete or questionable pricing",
    need: "Written confirmation of the missing or anomalous figures against the current price list.",
    owner: "Manufacturer",
    items: [...recoilItems(PRICE_FLAGS), ...autoformMats],
  },
  {
    id: "specs",
    title: "Specification conflicts with itself",
    need: "The manufacturer confirming which of the two conflicting figures is correct.",
    owner: "Manufacturer",
    items: recoilItems(SPEC_FLAGS),
  },
  {
    id: "commercial",
    title: "Not obviously a consumer product",
    need: "A decision on whether trade and display items belong in a retail catalogue at all.",
    owner: "Internal decision",
    items: recoilItems(["TRADE_ITEM"]),
  },
];

/** An item can be blocked twice; this is how many distinct products are held. */
export const HELD_BACK_TOTAL =
  new Set(BLOCKERS.flatMap((b) => b.items.map((i) => `${i.brand}:${i.ref}`))).size;

export const READINESS = {
  live: {
    riderzpro: CATALOG_BY_BRAND.riderzpro.length,
    recoil: CATALOG_BY_BRAND.recoil.length,
    autoform: CATALOG_BY_BRAND.autoform.length,
    blaupunkt: CATALOG_BY_BRAND.blaupunkt.length,
    total: CATALOG.length,
  },
  recoil: {
    imported: CATALOG_SUMMARY.totals.skus,
    ready: CATALOG_SUMMARY.totals.ready,
    queue: CATALOG_SUMMARY.totals.needsReview + CATALOG_SUMMARY.totals.missingData,
    comingSoon: CATALOG_SUMMARY.totals.comingSoon,
  },
  blaupunkt: {
    parsed: BLAUPUNKT_SUMMARY.totals.parsed,
    published: BLAUPUNKT_SUMMARY.totals.published,
    held: BLAUPUNKT_SUMMARY.totals.held,
    source: BLAUPUNKT_SUMMARY.source.doc,
  },
  autoform: {
    designsLive: DESIGNS.length,
    designsAwaiting: DESIGNS_AWAITING_CATALOGUE.length,
    accessoriesLive: AUTOFORM_SUMMARY.accessoriesPublishable,
    accessoriesHeld: ACCESSORIES.length - AUTOFORM_SUMMARY.accessoriesPublishable,
    mats: MATS.length,
  },
  cars: {
    listed: CARS.length,
    liveSources: SOURCES.filter((s) => s.status === "LIVE").length,
    blockedSources: SOURCES.filter((s) => s.status === "BLOCKED_NO_LICENCE").length,
  },
  heldBack: HELD_BACK_TOTAL,
};

/** Only the RECOIL record type leaks into this module's signatures. */
export type { CatalogProduct };
