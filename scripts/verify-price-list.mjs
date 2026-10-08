#!/usr/bin/env node
/**
 * Guards the transcription. Every SKU, DP and MRP in the .psv files must be
 * present in the text extracted from the source PDFs.
 *
 *   node scripts/verify-price-list.mjs
 *
 * This is the check that keeps a typo in the price list from becoming a wrong
 * price on the website. It fails the build if a row cannot be traced back to
 * the PDF it came from.
 */
import { readFileSync, readdirSync, existsSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const DATA = resolve(ROOT, "data/recoil");
const SOURCE = resolve(DATA, "source");

if (!existsSync(SOURCE)) {
  console.error("No data/recoil/source — run scripts/extract-pdf-text.mjs on the price-list PDFs first.");
  process.exit(1);
}

/** Collapse everything that varies between the PDF's text layer and our cells. */
const flat = (s) => String(s).toUpperCase().replace(/[^A-Z0-9.]/g, "");

const pdfText = readdirSync(SOURCE)
  .filter((f) => f.endsWith(".txt"))
  .map((f) => readFileSync(resolve(SOURCE, f), "utf8"))
  .join("\n");
const pdfFlat = flat(pdfText);
const pdfNumbers = new Set(pdfText.match(/\d[\d,]*/g)?.map((n) => n.replace(/,/g, "")) ?? []);

let checked = 0;
const problems = [];
const warnings = [];

for (const file of readdirSync(DATA).filter((f) => /^price-list-.*\.psv$/.test(f))) {
  const lines = readFileSync(resolve(DATA, file), "utf8")
    .split(/\r?\n/)
    .filter((l) => l.trim() && !l.startsWith("#"));
  const header = lines.shift().split("|").map((h) => h.trim());

  for (const line of lines) {
    const cells = line.split("|");
    const row = Object.fromEntries(header.map((h, i) => [h, (cells[i] ?? "").trim()]));
    checked++;

    if (cells.length !== header.length) {
      problems.push([row.sku, `column count ${cells.length}, expected ${header.length}`]);
      continue;
    }

    // "RT0516-10 (2)" marks a second printed occurrence of the same model.
    const sku = row.sku.replace(/\s*\(\d+\)$/, "");
    if (!pdfFlat.includes(flat(sku))) {
      // Long model numbers get wrapped across two table cells in the PDF's text
      // layer ("BWS12300-" / "BB"). Accept a prefix match and say so, rather
      // than either failing a correct row or waving it through silently.
      const prefix = sku.includes("-") ? sku.slice(0, sku.lastIndexOf("-")) : "";
      if (prefix.length >= 4 && pdfFlat.includes(flat(prefix))) {
        warnings.push([row.sku, `only the "${prefix}" prefix is contiguous in the PDF text layer (wrapped cell)`]);
      } else {
        problems.push([row.sku, "SKU not found in the source PDF text"]);
      }
    }

    for (const field of ["dp", "mrp", "masterPack"]) {
      const v = row[field];
      if (v && !pdfNumbers.has(v)) problems.push([row.sku, `${field} ${v} does not appear anywhere in the source PDF`]);
    }

    if (!["ACTIVE", "COMING_SOON", "DISCONTINUED"].includes(row.status)) {
      problems.push([row.sku, `unknown status "${row.status}"`]);
    }
  }
}

console.log(`Checked ${checked} price-list rows against the source PDF text.`);

if (warnings.length) {
  console.log(`\n${warnings.length} row(s) verified by prefix only:`);
  for (const [sku, why] of warnings) console.log(`  ${String(sku).padEnd(18)} ${why}`);
}

if (problems.length === 0) {
  console.log("\nAll SKUs and printed figures trace back to the PDFs.");
  process.exit(0);
}

console.error(`\n${problems.length} row(s) could not be verified:`);
for (const [sku, why] of problems) console.error(`  ${String(sku).padEnd(18)} ${why}`);
process.exit(1);
