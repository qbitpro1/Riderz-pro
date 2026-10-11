import "server-only";
import { PRODUCT_DETAILS } from "@/lib/store/products";
import type { ProductDetail, ProductImage, ProductOption, ProductOptionValue } from "@/lib/store/types";
import { MEDIA } from "@/lib/media";
import { SITE } from "@/lib/data/site";

/**
 * Builds Shopify's product-import CSV from the store's product details.
 * Deliberately has no "Cost per item" column: nothing confidential is exported.
 */

/** Shopify allows at most 3 options per product. */
const MAX_OPTIONS = 3;
/** The Storefront variant lookup reads up to 250 variants per product. */
const MAX_VARIANTS = 250;

export const COLUMNS = [
  "Handle",
  "Title",
  "Body (HTML)",
  "Vendor",
  "Type",
  "Tags",
  "Published",
  "Option1 Name",
  "Option1 Value",
  "Option2 Name",
  "Option2 Value",
  "Option3 Name",
  "Option3 Value",
  "Variant SKU",
  "Variant Inventory Tracker",
  "Variant Inventory Qty",
  "Variant Inventory Policy",
  "Variant Price",
  "Variant Compare At Price",
  "Variant Requires Shipping",
  "Variant Taxable",
  "Image Src",
  "Image Position",
  "Image Alt Text",
  "Status",
] as const;

type Row = Record<(typeof COLUMNS)[number], string>;

export type SkipReason = "not-indexable" | "no-price" | "too-many-options" | "too-many-variants";

export type CsvBuild = {
  csv: string;
  products: number;
  variants: number;
  rows: number;
  skipped: Record<SkipReason, number>;
};

export const SKIP_LABELS: Record<SkipReason, string> = {
  "not-indexable": "Held back (not published on the site)",
  "no-price": "Price on request (no price to sell at)",
  "too-many-options": `More than ${MAX_OPTIONS} options (Shopify's limit)`,
  "too-many-variants": `More than ${MAX_VARIANTS} variants`,
};

export function csvCell(raw: string): string {
  // Some source text has a NUL where an "fi" ligature was lost; other control characters break imports.
  const v = raw.replace(/\u0000/g, "fi").replace(/[\u0001-\u0008\u000B\u000C\u000E-\u001F]/g, "");
  return /[",\r\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v;
}

function esc(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function bodyHtml(d: ProductDetail): string {
  const parts: string[] = [];
  if (d.summary) parts.push(`<p>${esc(d.summary)}</p>`);
  if (d.highlights.length) parts.push(`<ul>${d.highlights.map((h) => `<li>${esc(h)}</li>`).join("")}</ul>`);
  if (d.specs.length) {
    parts.push(
      `<table>${d.specs.map((s) => `<tr><th>${esc(s.label)}</th><td>${esc(s.value)}</td></tr>`).join("")}</table>`,
    );
  }
  return parts.join("");
}

function imageUrl(img: ProductImage): { src: string; alt: string } | null {
  if (img.kind === "media") {
    const m = MEDIA[img.key];
    return m ? { src: m.src, alt: img.alt } : null;
  }
  if (/^https?:\/\//i.test(img.src)) return { src: img.src, alt: img.alt };
  if (img.src.startsWith("/")) return { src: `${SITE.url}${img.src}`, alt: img.alt };
  return null;
}

type Combo = { values: ProductOptionValue[] };

function combos(options: ProductOption[]): Combo[] {
  let acc: ProductOptionValue[][] = [[]];
  for (const opt of options) {
    const avail = opt.values.filter((v) => v.available);
    acc = acc.flatMap((prefix) => avail.map((v) => [...prefix, v]));
  }
  return acc.map((values) => ({ values }));
}

function money(n: number): string {
  return n.toFixed(2);
}

function blank(): Row {
  return Object.fromEntries(COLUMNS.map((c) => [c, ""])) as Row;
}

function skipReason(d: ProductDetail): SkipReason | null {
  if (!d.indexable) return "not-indexable";
  if (d.price === null) return "no-price";
  if (d.options.length > MAX_OPTIONS) return "too-many-options";
  if (combos(d.options).length > MAX_VARIANTS) return "too-many-variants";
  return null;
}

export function buildShopifyCsv(): CsvBuild {
  const skipped: Record<SkipReason, number> = {
    "not-indexable": 0,
    "no-price": 0,
    "too-many-options": 0,
    "too-many-variants": 0,
  };
  const rows: Row[] = [];
  let products = 0;
  let variants = 0;

  for (const d of PRODUCT_DETAILS) {
    const why = skipReason(d);
    if (why) {
      skipped[why] += 1;
      continue;
    }
    const price = d.price as number;
    const list = combos(d.options);
    if (list.length === 0) continue;
    products += 1;

    const images = d.images.map(imageUrl).filter((i): i is { src: string; alt: string } => i !== null);
    const tags = [d.department, d.group, d.brand, d.oe ? "oe" : ""].filter(Boolean).join(", ");

    list.forEach((combo, i) => {
      const r = blank();
      r.Handle = d.slug;
      if (i === 0) {
        r.Title = d.title;
        r["Body (HTML)"] = bodyHtml(d);
        r.Vendor = d.brandName;
        r.Type = d.groupName;
        r.Tags = tags;
        r.Published = "true";
        r.Status = "active";
        if (images[0]) {
          r["Image Src"] = images[0].src;
          r["Image Position"] = "1";
          r["Image Alt Text"] = images[0].alt;
        }
      }
      d.options.forEach((opt, k) => {
        const n = k + 1;
        if (i === 0) r[`Option${n}Name` as keyof Row] = opt.name;
        r[`Option${n}Value` as keyof Row] = combo.values[k].label;
      });
      const delta = combo.values.reduce((s, v) => s + v.priceDelta, 0);
      const mrpDelta = combo.values.reduce((s, v) => s + v.mrpDelta, 0);
      const vPrice = price + delta;
      const vMrp = d.mrp !== null ? d.mrp + mrpDelta : null;
      const base = d.code ?? d.slug;
      r["Variant SKU"] = combo.values.length ? [base, ...combo.values.map((v) => v.id)].join("-") : base;
      r["Variant Price"] = money(vPrice);
      if (vMrp !== null && vMrp > vPrice) r["Variant Compare At Price"] = money(vMrp);
      r["Variant Requires Shipping"] = "true";
      r["Variant Taxable"] = "true";
      // Stock is tracked per product, so it can only be applied to single-variant products.
      if (d.stock !== null && d.options.length === 0) {
        r["Variant Inventory Tracker"] = "shopify";
        r["Variant Inventory Qty"] = String(Math.max(0, Math.floor(d.stock)));
        r["Variant Inventory Policy"] = "deny";
      }
      rows.push(r);
      variants += 1;
    });

    images.slice(1).forEach((img, j) => {
      const r = blank();
      r.Handle = d.slug;
      r["Image Src"] = img.src;
      r["Image Position"] = String(j + 2);
      r["Image Alt Text"] = img.alt;
      rows.push(r);
    });
  }

  const lines = [COLUMNS.map(csvCell).join(",")];
  for (const r of rows) lines.push(COLUMNS.map((c) => csvCell(r[c])).join(","));
  return { csv: lines.join("\r\n") + "\r\n", products, variants, rows: rows.length, skipped };
}
