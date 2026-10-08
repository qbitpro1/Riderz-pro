#!/usr/bin/env node
/**
 * Builds the Riderzpro RECOIL catalogue.
 *
 *   node scripts/import-recoil.mjs
 *
 * Inputs
 *   data/recoil/price-list-*.psv       the price list, transcribed from the PDF
 *   data/recoil/manufacturer-mirror.json  official manufacturer data
 *   data/recoil/overrides.json         hand-checked corrections, optional
 *
 * Output
 *   src/lib/data/recoil/catalog.generated.json
 *
 * Rules this importer enforces, in order of importance:
 *   1. The price list is the pricing and SKU authority. Manufacturer copy only
 *      ever *adds* to it.
 *   2. SKU matching is exact. A near-miss never inherits another SKU's images.
 *   3. Nothing is inferred. A missing figure stays missing and the record is
 *      flagged, never back-filled from a related field.
 *   4. Anything uncertain lands in the verification queue instead of going live.
 */
import { readFileSync, writeFileSync, mkdirSync, existsSync, readdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const DATA = resolve(ROOT, "data/recoil");
const OUT = resolve(ROOT, "src/lib/data/recoil/catalog.generated.json");

/** Riderzpro retail margin off MRP, per category. Admin-editable downstream. */
const DEFAULT_DISCOUNT = { default: 0.12, Amplifiers: 0.1, Subwoofers: 0.1, Speakers: 0.12, Processors: 0.1 };

export const FLAG_MEANINGS = {
  PRICE_ANOMALY: "Printed price is inconsistent with the rest of the range — confirm with RECOIL before publishing.",
  MARGIN_ANOMALY: "DP/MRP ratio differs from the rest of the price list.",
  MRP_IS_SET_PRICE: "The printed MRP covers a set or pack, not a single unit.",
  PRICE_NOTE: "The price cell carries an extra note that needs a human read.",
  SPEC_CONFLICT: "The printed specification contradicts itself or the manufacturer's own listing.",
  HEADING_CONFLICT: "The section heading disagrees with the row's own specification.",
  SKU_SPEC_MISMATCH: "The model number implies a figure the specification does not match.",
  SKU_AS_PRINTED: "The SKU cell contains more than a bare model number; kept exactly as printed.",
  DUPLICATE_SKU: "This model number appears more than once in the price list.",
  DUAL_SKU_CELL: "One cell lists two model numbers.",
  SHARED_ROW_PRICING: "Several model numbers share one printed price row.",
  ROW_AMBIGUOUS: "Row alignment in the PDF is ambiguous.",
  MISSING_MASTER_PACK: "Master pack quantity is blank in the price list.",
  NO_DP: "No dealer price printed.",
  NO_MRP: "No MRP printed.",
  SPEC_MISSING: "The price list gives no specification for this item.",
  PDF_TYPO: "Obvious spelling error in the source PDF, reproduced rather than silently corrected.",
  DUPLICATE_DESCRIPTION: "Description is identical to another SKU in the same series.",
  TRADE_ITEM: "Retail display or marketing item, not a consumer product.",
  NO_MANUFACTURER_MATCH: "No exact SKU match on an official RECOIL source.",
  IMAGE_VERIFICATION_REQUIRED: "No authentic image could be matched to this exact SKU.",
  TITLE_CONFLICT: "The manufacturer's product title disagrees with the price list description.",
};

/* ------------------------------------------------------------------ inputs */

function readPriceLists() {
  const rows = [];
  for (const file of readdirSync(DATA).filter((f) => /^price-list-.*\.psv$/.test(f)).sort()) {
    const text = readFileSync(resolve(DATA, file), "utf8");
    const lines = text.split(/\r?\n/).filter((l) => l.trim() && !l.startsWith("#"));
    const header = lines.shift().split("|");
    for (const line of lines) {
      const cells = line.split("|");
      const row = Object.fromEntries(header.map((h, i) => [h.trim(), (cells[i] ?? "").trim()]));
      row.__source = file;
      rows.push(row);
    }
  }
  return rows;
}

function readMirror() {
  const path = resolve(DATA, "manufacturer-mirror.json");
  if (!existsSync(path)) {
    console.error("! manufacturer-mirror.json missing — run scripts/sync-recoil-manufacturer.mjs first.");
    return { products: [], fetchedAt: null };
  }
  return JSON.parse(readFileSync(path, "utf8"));
}

function readOverrides() {
  const path = resolve(DATA, "overrides.json");
  return existsSync(path) ? JSON.parse(readFileSync(path, "utf8")) : {};
}

/* ---------------------------------------------------------------- matching */

const normSku = (s) => String(s || "").toUpperCase().replace(/\s+/g, "");
/** Storefront titles lead with the model number: "SPL4200.4 – 4200W…". */
const leadToken = (title) => (String(title || "").match(/^\s*([A-Za-z0-9][A-Za-z0-9._\-/]*)/)?.[1] || "").replace(/[–—-]$/, "");

function buildIndex(products) {
  const index = new Map();
  const push = (key, entry) => {
    const k = normSku(key);
    if (!k || k.length < 2) return;
    if (!index.has(k)) index.set(k, []);
    index.get(k).push(entry);
  };
  for (const p of products) {
    const official = p.source === "recoilaudio.com";
    if (p.sku) push(p.sku, { ...p, tier: official ? "official-sku" : "regional-sku" });
    push(leadToken(p.title), { ...p, tier: official ? "official-title" : "regional-title" });
  }
  return index;
}

const TIER_RANK = { "official-sku": 0, "official-title": 1, "regional-sku": 2, "regional-title": 3 };

/* ----------------------------------------------------------------- helpers */

const num = (v) => (v === "" || v == null ? null : Number(v));

function slugify(sku) {
  return sku.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}

function titleCase(s) {
  return s.replace(/\b([a-z])/g, (m) => m.toUpperCase());
}

/** "RECOIL [Series] [Product Type] – [Key Specification] – [SKU]" */
function buildTitle(row) {
  const parts = ["RECOIL"];
  if (row.series && row.series !== row.subcategory) parts.push(`${row.series} Series`);
  parts.push(row.name);
  return `${parts.join(" ")} – ${row.sku}`;
}

/**
 * Title tags cap out around 60 characters. Trim the descriptive middle at a
 * word boundary rather than amputating the brand suffix.
 */
function seoTitle(sku, name) {
  const suffix = " | RIDERZPRO";
  const lead = `RECOIL ${sku} `;
  const room = 60 - suffix.length - lead.length;
  let desc = name.replace(/\s+/g, " ").trim();
  if (desc.length > room) {
    desc = desc.slice(0, Math.max(room, 0));
    desc = desc.slice(0, desc.lastIndexOf(" ") > 0 ? desc.lastIndexOf(" ") : desc.length).trim();
  }
  return `${lead}${desc}${suffix}`.replace(/\s+\|/, " |");
}

function metaDescription(row, sellingPrice) {
  const spec = (row.specs || "").split(";")[0];
  const base = `${row.sku} — ${row.name}.${spec ? ` ${spec}.` : ""} Genuine RECOIL, authorised Riderzpro reseller.${
    sellingPrice ? ` ₹${sellingPrice.toLocaleString("en-IN")}.` : ""
  }`;
  return base.length <= 158 ? base : `${base.slice(0, 155).trimEnd()}…`;
}

function keywords(row) {
  const out = new Set(["Recoil", row.sku, row.category, row.subcategory, "car audio", "India", "Riderzpro"]);
  if (row.series) out.add(`Recoil ${row.series}`);
  return [...out].filter(Boolean);
}

/**
 * Search tokens, so "SPL4200" finds SPL4200.4 and "4 channel amplifier" finds
 * every four-channel amp without keyword-stuffing the visible copy.
 */
function searchTokens(row) {
  const bag = new Set();
  const add = (s) => String(s || "").toLowerCase().split(/[^a-z0-9.]+/).filter(Boolean).forEach((t) => bag.add(t));
  add(row.sku);
  add(row.sku.replace(/[.\-]/g, " "));
  add(row.name);
  add(row.series);
  add(row.category);
  add(row.subcategory);
  add(row.specs);
  // Model numbers are searched as fragments: SPL4200 for SPL4200.4.
  const base = row.sku.split(".")[0];
  if (base) bag.add(base.toLowerCase());
  return [...bag];
}

/* ------------------------------------------------------------------- build */

const priceRows = readPriceLists();
const mirror = readMirror();
const overrides = readOverrides();
const index = buildIndex(mirror.products);

const skuCounts = new Map();
for (const r of priceRows) {
  const k = normSku(r.sku.replace(/\s*\(\d+\)$/, ""));
  skuCounts.set(k, (skuCounts.get(k) || 0) + 1);
}

const catalog = priceRows.map((row) => {
  const flags = new Set((row.flags || "").split(",").map((f) => f.trim()).filter(Boolean));

  // "RT0516-10 (2)" marks the second printed occurrence; the real SKU is the base.
  const printedSku = row.sku;
  const sku = printedSku.replace(/\s*\(\d+\)$/, "");
  if (skuCounts.get(normSku(sku)) > 1) flags.add("DUPLICATE_SKU");

  const dp = num(row.dp);
  const mrp = num(row.mrp);
  const masterPack = num(row.masterPack);
  if (dp == null) flags.add("NO_DP");
  if (mrp == null) flags.add("NO_MRP");
  if (masterPack == null) flags.add("MISSING_MASTER_PACK");

  // Margin sanity: the list runs at DP = 50% of MRP almost everywhere.
  if (dp != null && mrp != null && mrp > 0) {
    const ratio = dp / mrp;
    if (ratio < 0.2 || ratio > 0.8) flags.add("PRICE_ANOMALY");
  }

  const hits = (index.get(normSku(sku)) || []).slice().sort((a, b) => TIER_RANK[a.tier] - TIER_RANK[b.tier]);
  const seen = new Set();
  const unique = hits.filter((h) => (seen.has(h.url) ? false : (seen.add(h.url), true)));
  const match = unique[0] || null;

  if (!match) flags.add("NO_MANUFACTURER_MATCH");
  if (!match || match.images.length === 0) flags.add("IMAGE_VERIFICATION_REQUIRED");

  // Fuse ratings are encoded in the model number, so a mismatch between the
  // SKU and the manufacturer's own title is objective and worth catching.
  if (match && row.subcategory === "Fuses") {
    const fromSku = sku.match(/(\d+)-\d+$/)?.[1];
    const fromTitle = match.title.match(/(\d+)\s*A\b/i)?.[1];
    if (fromSku && fromTitle && fromSku !== fromTitle) flags.add("TITLE_CONFLICT");
  }

  const discount = DEFAULT_DISCOUNT[row.category] ?? DEFAULT_DISCOUNT.default;
  const sellingPrice = mrp != null ? Math.round((mrp * (1 - discount)) / 10) * 10 : null;

  // Manufacturer galleries sometimes repeat the same file; keep first order.
  const seenImages = new Set();
  const uniqueImages = (match?.images ?? []).filter((img) =>
    seenImages.has(img.url) ? false : (seenImages.add(img.url), true),
  );

  const images = uniqueImages.map((img, i) => ({
    url: img.url,
    type: ["primary", "secondary", "detail", "detail", "detail", "packaging", "feature"][i] ?? "gallery",
    alt: img.alt || `RECOIL ${sku} — ${row.name}`,
    source: match.source,
    sourceLabel: match.sourceLabel,
    sourceUrl: match.url,
    sku,
    accessedAt: mirror.fetchedAt,
    usage: "Manufacturer image used under authorised reseller marketing permission.",
    verified: true,
  }));

  const record = {
    sku,
    printedSku,
    slug: slugify(printedSku),
    brand: "RECOIL",
    category: row.category,
    subcategory: row.subcategory,
    series: row.series || null,
    productType: row.subcategory,

    // Price list — the authority.
    priceListName: row.name,
    priceListSpecs: [...new Set((row.specs || "").split(";").map((s) => s.trim()).filter(Boolean))],
    dp,
    mrp,
    masterPack,
    priceListFile: row.__source,
    priceListEdition: "May 2026",

    // Riderzpro commercial layer. DP is admin-only and never rendered.
    sellingPrice,
    discountPct: mrp && sellingPrice ? Math.round(((mrp - sellingPrice) / mrp) * 100) : null,

    status: row.status,

    // Manufacturer enrichment — additive only.
    manufacturer: match
      ? {
          matchTier: match.tier,
          title: match.title,
          // Some manufacturer listings put a whole paragraph in the title
          // field. Recorded, but never rendered as a heading.
          titleIsProse: match.title.length > 90 || !normSku(match.title).startsWith(normSku(sku)),
          url: match.url,
          source: match.source,
          sourceLabel: match.sourceLabel,
          categories: match.categories,
          description: match.description || null,
          shortDescription: match.shortDescription || null,
          alternates: unique.slice(1).map((h) => ({ title: h.title, url: h.url, source: h.source })),
        }
      : null,
    images,

    title: buildTitle({ ...row, sku }),
    seo: {
      title: seoTitle(sku, row.name),
      metaDescription: metaDescription({ ...row, sku }, sellingPrice),
      url: `/products/recoil-${slugify(printedSku)}`,
      keywords: keywords({ ...row, sku }),
    },
    searchTokens: searchTokens({ ...row, sku }),

    flags: [...flags].sort(),
    ...(overrides[sku] || {}),
  };

  // Compatibility is never guessed. Vehicle-specific series are the only
  // records that carry a vehicle, and only because the price list says so.
  record.compatibility =
    record.compatibility ??
    (row.subcategory === "Vehicle Specific"
      ? { type: "vehicle-specific", note: `${row.series} — confirm exact model, generation and variant before fitting.` }
      : { type: "universal", note: "Universal / requires installation verification" });

  return record;
});

/* ------------------------------------------------- publication gate + report */

function verdict(p) {
  const blocking = [
    "NO_MANUFACTURER_MATCH",
    "IMAGE_VERIFICATION_REQUIRED",
    "PRICE_ANOMALY",
    "SPEC_CONFLICT",
    "HEADING_CONFLICT",
    "SKU_SPEC_MISMATCH",
    "DUPLICATE_SKU",
    "DUAL_SKU_CELL",
    "ROW_AMBIGUOUS",
    "TITLE_CONFLICT",
    "SPEC_MISSING",
  ];
  if (p.status === "COMING_SOON") return "COMING_SOON";
  if (p.flags.some((f) => blocking.includes(f))) return "NEEDS_REVIEW";
  if (p.mrp == null || p.dp == null) return "MISSING_DATA";
  return "READY";
}

for (const p of catalog) {
  p.verification = verdict(p);
  p.published = p.verification === "READY";
}

const summary = {
  generatedAt: new Date().toISOString(),
  priceListEdition: "May 2026",
  manufacturerMirrorFetchedAt: mirror.fetchedAt,
  totals: {
    skus: catalog.length,
    ready: catalog.filter((p) => p.verification === "READY").length,
    needsReview: catalog.filter((p) => p.verification === "NEEDS_REVIEW").length,
    missingData: catalog.filter((p) => p.verification === "MISSING_DATA").length,
    comingSoon: catalog.filter((p) => p.verification === "COMING_SOON").length,
    withManufacturerMatch: catalog.filter((p) => p.manufacturer).length,
    withImages: catalog.filter((p) => p.images.length > 0).length,
    images: catalog.reduce((n, p) => n + p.images.length, 0),
  },
  flagCounts: Object.fromEntries(
    Object.keys(FLAG_MEANINGS)
      .map((f) => [f, catalog.filter((p) => p.flags.includes(f)).length])
      .filter(([, n]) => n > 0),
  ),
  flagMeanings: FLAG_MEANINGS,
};

mkdirSync(dirname(OUT), { recursive: true });
writeFileSync(OUT, JSON.stringify({ summary, products: catalog }), "utf8");

console.log("RECOIL catalogue import");
console.log("───────────────────────");
for (const [k, v] of Object.entries(summary.totals)) console.log(`  ${k.padEnd(22)} ${v}`);
console.log("\nFlags raised:");
for (const [k, v] of Object.entries(summary.flagCounts)) console.log(`  ${String(v).padStart(4)}  ${k}`);
console.log(`\n→ ${OUT.replace(ROOT + "\\", "").replace(ROOT + "/", "")}`);
