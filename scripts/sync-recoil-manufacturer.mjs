#!/usr/bin/env node
/**
 * Mirrors the official Recoil catalogues into data/recoil/manufacturer-mirror.json.
 *
 *   node scripts/sync-recoil-manufacturer.mjs
 *
 * Two sources, in priority order:
 *   1. recoilaudio.com      — manufacturer site, public WooCommerce Store API.
 *                             Carries an explicit SKU field, so matches are exact.
 *   2. recoilaudiousa.com   — official regional storefront, Shopify products.json.
 *                             Model number is the leading token of the title.
 *
 * Nothing here is interpreted or rewritten: titles, descriptions and image URLs
 * are stored as the manufacturer publishes them, with the source recorded so the
 * catalogue can always be traced back.
 */
import { writeFileSync, mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const OUT = resolve(ROOT, "data/recoil/manufacturer-mirror.json");
const UA = "Mozilla/5.0 (compatible; MotorbotzCatalogImport/1.0)";

async function fetchOfficial() {
  const out = [];
  for (let page = 1; page <= 40; page++) {
    const r = await fetch(
      `https://recoilaudio.com/wp-json/wc/store/v1/products?per_page=100&page=${page}`,
      { headers: { "user-agent": UA } },
    );
    if (!r.ok) break;
    const list = await r.json();
    if (!Array.isArray(list) || list.length === 0) break;
    for (const p of list) {
      out.push({
        source: "recoilaudio.com",
        sourceLabel: "Official RECOIL manufacturer website",
        sku: (p.sku || "").trim(),
        title: decode(p.name),
        url: p.permalink,
        categories: (p.categories || []).map((c) => c.name),
        description: stripHtml(p.description),
        shortDescription: stripHtml(p.short_description),
        images: (p.images || []).map((i) => ({ url: i.src, alt: decode(i.alt || ""), name: decode(i.name || "") })),
      });
    }
    process.stderr.write(`  recoilaudio.com page ${page}: ${list.length}\n`);
    if (list.length < 100) break;
  }
  return out;
}

async function fetchUsa() {
  const out = [];
  for (let page = 1; page <= 20; page++) {
    const r = await fetch(`https://recoilaudiousa.com/products.json?limit=250&page=${page}`, {
      headers: { "user-agent": UA },
    });
    if (!r.ok) break;
    const json = await r.json();
    if (!json.products?.length) break;
    for (const p of json.products) {
      out.push({
        source: "recoilaudiousa.com",
        sourceLabel: "Official RECOIL regional storefront",
        sku: (p.variants || []).map((v) => v.sku).find(Boolean) || "",
        title: decode(p.title),
        url: `https://recoilaudiousa.com/products/${p.handle}`,
        categories: [p.product_type].filter(Boolean),
        description: stripHtml(p.body_html),
        shortDescription: "",
        images: (p.images || []).map((i) => ({ url: (i.src || "").replace(/^\/\//, "https://"), alt: "", name: "" })),
      });
    }
    process.stderr.write(`  recoilaudiousa.com page ${page}: ${json.products.length}\n`);
    if (json.products.length < 250) break;
  }
  return out;
}

function decode(s) {
  return String(s || "")
    .replace(/&#8243;/g, '"')
    .replace(/&#8221;|&#8220;/g, '"')
    .replace(/&#8217;|&#8216;/g, "'")
    .replace(/&#8211;|&#8212;/g, "–")
    .replace(/&amp;/g, "&")
    .replace(/&nbsp;/g, " ")
    .replace(/&#0?39;/g, "'")
    .trim();
}

function stripHtml(html) {
  return decode(
    String(html || "")
      .replace(/<li[^>]*>/gi, "\n• ")
      .replace(/<\/(p|div|h\d|ul|tr)>/gi, "\n")
      .replace(/<br\s*\/?>/gi, "\n")
      .replace(/<[^>]+>/g, " ")
      .replace(/[ \t]+/g, " ")
      .replace(/\n{3,}/g, "\n\n"),
  );
}

console.error("Mirroring official Recoil catalogues…");
const [official, usa] = await Promise.all([fetchOfficial(), fetchUsa()]);
const products = [...official, ...usa];

mkdirSync(dirname(OUT), { recursive: true });
writeFileSync(
  OUT,
  JSON.stringify({ fetchedAt: new Date().toISOString(), counts: { official: official.length, usa: usa.length }, products }),
  "utf8",
);

console.log(`Mirrored ${products.length} manufacturer products → data/recoil/manufacturer-mirror.json`);
console.log(`  recoilaudio.com    ${official.length} (${official.filter((p) => p.sku).length} with SKU field)`);
console.log(`  recoilaudiousa.com ${usa.length}`);
