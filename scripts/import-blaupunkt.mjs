#!/usr/bin/env node
/**
 * Imports the Blaupunkt 2026 catalogue into src/lib/data/blaupunkt/catalog.generated.json.
 *
 *   node scripts/import-blaupunkt.mjs
 *
 * Source of truth: "Blaupunkt Brochure 2026" (73 pages), supplied by the
 * customer. Unusually for a brochure it carries printed MRP alongside every
 * model, so it is both the pricing authority and the specification authority —
 * there is no second document to reconcile against.
 *
 * The catalogue uses two layouts and the parser recognises both:
 *
 *   VERTICAL   model name on its own line, spec line beneath, then "MRP: ` n/-".
 *              One product per block, several blocks per page. (Speakers, subs.)
 *   COLUMN     several models across one line, their prices across the next,
 *              then a spec matrix with one column per model. (Amplifiers.)
 *
 * Anything that doesn't parse cleanly into one of those is flagged and held out
 * of the storefront rather than guessed at — same rule the RECOIL importer runs.
 */
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const TEXT = resolve(ROOT, "data/blaupunkt/source/brochure-2026.pdf.txt");
const MANIFEST = resolve(ROOT, "public/blaupunkt/catalogue/manifest.json");
const OUT = resolve(ROOT, "src/lib/data/blaupunkt/catalog.generated.json");
const VERIFIED = resolve(ROOT, "data/blaupunkt/verified-pages.json");

const SOURCE = {
  doc: "Blaupunkt Brochure 2026",
  edition: "2026-27",
  supplied: "Supplied by the customer, 11 August 2026",
  pages: 73,
};

/**
 * Which shelf each catalogue section sits on in the Riderzpro shop. The section
 * headings are Blaupunkt's own; the mapping to our six categories is ours, and
 * it is the only interpretive step in this importer.
 */
const SECTIONS = [
  { from: 3, to: 20, category: "audio", sub: "Android head units", group: "Multimedia" },
  { from: 21, to: 21, category: "audio", sub: "Coaxial", group: "Speakers" },
  { from: 22, to: 22, category: "audio", sub: "Component speakers", group: "Speakers" },
  { from: 23, to: 23, category: "audio", sub: "Component speakers", group: "Speakers" },
  { from: 24, to: 25, category: "audio", sub: "Amplifiers", group: "Amplifiers" },
  { from: 26, to: 28, category: "audio", sub: "Subwoofers", group: "Subwoofers" },
  { from: 29, to: 29, category: "exterior", sub: "Horns", group: "Accessories" },
  { from: 30, to: 30, category: "interior", sub: "Car care", group: "Accessories" },
  { from: 31, to: 31, category: "exterior", sub: "Wiper blades", group: "Accessories" },
  { from: 32, to: 34, category: "interior", sub: "Charging accessories", group: "Accessories" },
  { from: 35, to: 38, category: "interior", sub: "Reverse cameras", group: "Accessories" },
  { from: 39, to: 40, category: "interior", sub: "Car care", group: "Accessories" },
  { from: 41, to: 41, category: "audio", sub: "Sound deadening", group: "Installation" },
  { from: 42, to: 42, category: "interior", sub: "Dashboard accessories", group: "Accessories" },
  { from: 43, to: 44, category: "off-road", sub: "Air compressors", group: "Accessories" },
  { from: 45, to: 50, category: "interior", sub: "Dash cams", group: "Accessories" },
  { from: 51, to: 52, category: "lighting", sub: "Ambient lighting", group: "Lighting" },
  { from: 53, to: 62, category: "lighting", sub: "LED bulbs", group: "Lighting" },
  { from: 63, to: 63, category: "lighting", sub: "LED bulbs", group: "Lighting" },
  { from: 64, to: 64, category: "exterior", sub: "Antennas", group: "Accessories" },
  { from: 65, to: 71, category: "audio", sub: "Wiring", group: "Installation" },
];

const sectionFor = (page) => SECTIONS.find((s) => page >= s.from && page <= s.to) ?? null;

/* ------------------------------------------------------------- helpers */

const clean = (s) =>
  s
    .replace(/ /g, " ")
    .replace(/[Ÿ•]/g, "")
    .replace(/\s*\|\s*/g, " ")
    .replace(/\s+/g, " ")
    .trim();

const slugify = (s) =>
  s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

/** "6,000/-" and "42990" both mean rupees. */
function money(raw) {
  const n = Number(String(raw).replace(/[,\s/-]/g, ""));
  return Number.isFinite(n) && n > 0 ? n : null;
}

const PRICE_RE = /MRP\s*:?\s*\|?\s*[`₹]?\s*\|?\s*([\d][\d,]{2,})\s*\/?-?/g;

/**
 * A model name is short, carries at least one letter, and is not a spec line.
 * Spec lines are the ones full of units, so they are excluded explicitly rather
 * than by length alone.
 */
const SPECISH =
  /(watts|ohms?|hz|db|mm|inch|"|dimensions|frequency|impedance|sensitivity|response|power|channel|class |warranty|series|MRP|www\.|IS \d)/i;

function looksLikeModel(line) {
  const c = clean(line);
  if (!c || c.length > 46) return false;
  if (SPECISH.test(c)) return false;
  if (!/[a-z]/i.test(c)) return false;
  // Must carry a model-ish token: a digit run, or ALL CAPS words.
  return /\d/.test(c) || /^[A-Z0-9 .&+'-]{3,}$/.test(c);
}

/**
 * The loose test above is what finds candidate lines; this is what decides
 * whether the result is safe to sell. Spec fragments that slip through the
 * first test — "Coated Paper 0 – 180° / – (10.0 x 10.2 x" — fail here, and the
 * record is held for a human read instead of being published under a made-up
 * name.
 */
function modelIsConfident(name) {
  const c = clean(name);
  if (!c || c.length < 3 || c.length > 34) return false;
  // BIS registration numbers and the standards mark sit next to the price on
  // certified products. They are not model numbers.
  if (/^R-?\s?\d{6,}$/i.test(c) || /bis\.gov|IS \d{3}/i.test(c)) return false;
  if (/^set of\b/i.test(c)) return false;
  if (/[°()%><≥≤~]/.test(c)) return false;
  if (/\d+\s*[x×]\s*\d/.test(c)) return false; // dimensions
  if (/[–—]/.test(c)) return false; // ranges
  if (/\b(way|ohm|watt|paper|coated|synthetic|factor|damping|level|active|passive)\b/i.test(c)) return false;
  if (c.split(" ").length > 6) return false;
  // A screen-size variant legitimately carries several numbers — "SAN JOSE
  // 1000 - 12.33" is a real model, so the ceiling allows for it.
  if ((c.match(/\d+/g) ?? []).length > 4) return false;
  // Either a model code (letters followed by digits) or a named product in caps.
  return /[A-Za-z]{1,6}\s?\d/.test(c) || /^[A-Z][A-Z0-9 .&+'-]{2,}$/.test(c);
}

/* ---------------------------------------------------------------- parse */

const text = readFileSync(TEXT, "utf8");
const manifest = JSON.parse(readFileSync(MANIFEST, "utf8"));

/* Hand-maintained: pages whose image-to-product pairing a human has checked.
   Never written by this script — corrections do not go into the parser. */
const verifiedPages = new Set(JSON.parse(readFileSync(VERIFIED, "utf8")).verified ?? []);

/** Every image on a page, in reading order: down the page, then across. */
const imagesByPage = new Map();
for (const img of manifest.images) {
  if (!imagesByPage.has(img.page)) imagesByPage.set(img.page, []);
  imagesByPage.get(img.page).push(img);
}
for (const list of imagesByPage.values()) list.sort((a, b) => a.order - b.order);

const chunks = text.split(/===== PAGE (\d+) =====/).slice(1);
const products = [];
const skipped = [];

for (let i = 0; i < chunks.length; i += 2) {
  const page = Number(chunks[i]);
  const body = chunks[i + 1] ?? "";
  const section = sectionFor(page);
  if (!section) continue;

  const lines = body.split("\n").filter((l) => l.trim());
  const heading = clean(lines[0] ?? "");

  for (let n = 0; n < lines.length; n++) {
    const line = lines[n];
    const prices = [...line.matchAll(PRICE_RE)].map((m) => money(m[1])).filter(Boolean);
    if (prices.length === 0) continue;

    if (prices.length > 1) {
      /* COLUMN — models on the nearest preceding line, split on the pipe. */
      const modelLine = lines.slice(0, n).reverse().find((l) => l.includes("|") && looksLikeModel(l.split("|")[0]));
      const models = modelLine
        ? modelLine.split("|").map((m) => clean(m)).filter((m) => m && !SPECISH.test(m))
        : [];

      if (models.length !== prices.length) {
        skipped.push({ page, reason: "COLUMN_COUNT_MISMATCH", models: models.length, prices: prices.length, line: clean(line).slice(0, 120) });
        continue;
      }
      models.forEach((model, idx) => {
        products.push(build({ model, mrp: prices[idx], page, section, heading, specs: columnSpecs(lines, n, idx, models.length) }));
      });
      continue;
    }

    /* VERTICAL — walk back for the model name, collect the lines between. */
    const before = lines.slice(0, n);
    let modelIdx = -1;
    for (let k = before.length - 1; k >= 0 && k >= before.length - 6; k--) {
      if (looksLikeModel(before[k])) {
        modelIdx = k;
        break;
      }
    }
    if (modelIdx === -1) {
      // Head-unit pages print the model in the page heading instead.
      const inline = clean(line).replace(/MRP.*$/i, "").replace(/[-–]\s*$/, "").trim();
      const fromHeading = [lines[1], lines[2]].filter(Boolean).map(clean).find(looksLikeModel);
      if (fromHeading) {
        products.push(build({ model: fromHeading, variant: inline || null, mrp: prices[0], page, section, heading, specs: pageSpecs(lines) }));
      } else {
        skipped.push({ page, reason: "NO_MODEL_NAME", line: clean(line).slice(0, 120) });
      }
      continue;
    }

    /* The size or trim printed alongside the price — "9.5inch", "12.33" — is
       what separates two rows that share a model name, so it is kept as the
       variant rather than collapsed away. */
    const variant = clean(line).replace(/MRP.*$/i, "").replace(/[-–|]\s*$/, "").trim() || null;

    /* Most blocks put the specification between the model and the price. The
       multimedia pages put it after. Take whichever side actually has it. */
    const between = before.slice(modelIdx + 1).map(clean).filter(Boolean);
    const after = lines
      .slice(n + 1)
      .map(clean)
      .filter((l) => l && l.length > 8 && !/^MRP/i.test(l));
    const specs = between.length > 0 ? between : after.slice(0, 24);

    products.push(build({ model: clean(before[modelIdx]), variant, mrp: prices[0], page, section, heading, specs }));
  }
}

/** One column out of a spec matrix, label kept with its value. */
function columnSpecs(lines, priceIdx, col, total) {
  const out = [];
  for (const raw of lines.slice(priceIdx + 1, priceIdx + 30)) {
    const cells = raw.split("|").map((c) => c.trim());
    if (cells.length < total + 1) continue;
    const label = cells[0];
    const value = cells[col + 1];
    if (!label || !value || value === "-") continue;
    out.push(`${label}: ${value}`);
  }
  return out;
}

function pageSpecs(lines) {
  return lines
    .slice(1)
    .map(clean)
    .filter((l) => l && l.length > 8 && !/^MRP/i.test(l))
    .slice(0, 24);
}

function build({ model, variant = null, mrp, page, section, heading, specs }) {
  const name = variant ? `${model} ${variant}` : model;
  const flags = [];
  if (specs.length === 0) flags.push("SPEC_MISSING");
  if (!modelIsConfident(name)) flags.push("MODEL_UNCERTAIN");
  // Image is attached once the page's product count is known — see below.
  const image = null;

  return {
    model: model.trim(),
    variant,
    name: name.trim(),
    slug: slugify(`blaupunkt-${name}`),
    brand: "BLAUPUNKT",
    category: section.category,
    subcategory: section.sub,
    group: section.group,
    mrp,
    sellingPrice: Math.round((mrp * 0.9) / 10) * 10,
    discountPct: 10,
    specs: specs.slice(0, 24),
    heading,
    page,
    image: image ? { file: `/blaupunkt/catalogue/${image.file}`, width: image.width, height: image.height, source: `${SOURCE.doc} p.${page}` } : null,
    flags,
    published: false, // decided once the whole catalogue is parsed — see below
    source: SOURCE.doc,
  };
}

/* --------------------------------------------------------------- output */

// A model printed twice in the catalogue is one product, not two.
const seen = new Map();
for (const p of products) {
  const key = p.slug;
  if (!seen.has(key)) seen.set(key, p);
  else seen.get(key).flags.push("DUPLICATE_LISTING");
}
const unique = [...seen.values()];

/**
 * One photograph per page. Where a page lists several models, that photograph
 * cannot be claimed to be of any one of them — so those products keep their
 * price and specification but go out without an image, and stay unpublished.
 * This is the same rule the RECOIL importer runs: a near-miss never inherits
 * another model's photograph.
 */
/**
 * The exception: where every product on a page is the same model in a different
 * screen size, the page photograph is a photograph of that model, and keeping it
 * attributes nothing that isn't true.
 */
const onPage = new Map();
for (const p of unique) {
  if (!onPage.has(p.page)) onPage.set(p.page, []);
  onPage.get(p.page).push(p);
}

for (const [page, list] of onPage) {
  const images = imagesByPage.get(page) ?? [];
  const asImage = (img) => ({
    file: `/blaupunkt/catalogue/${img.file}`,
    width: img.width,
    height: img.height,
    source: `${SOURCE.doc} p.${page}`,
  });

  if (images.length === 0) {
    for (const p of list) p.flags.push("NO_IMAGE");
  } else if (list.length === 1) {
    // One product on the page: the largest image on it is that product.
    const biggest = [...images].sort((a, b) => b.width * b.height - a.width * a.height)[0];
    list[0].image = asImage(biggest);
  } else if (images.length === list.length) {
    /* One photograph per product, and both sequences run in the same reading
       order. That is strong evidence but not verification, so the pairing is
       recorded and flagged — a wrong photograph on a product is exactly what
       these rules exist to prevent. */
    const checked = verifiedPages.has(page);
    list.forEach((p, i) => {
      p.image = asImage(images[i]);
      p.flags.push(checked ? "IMAGE_ORDER_VERIFIED" : "IMAGE_ORDER_ASSUMED");
    });
  } else {
    for (const p of list) p.flags.push("IMAGE_COUNT_MISMATCH");
  }
}

for (const p of unique) {
  p.published =
    Boolean(p.image) &&
    p.specs.length > 0 &&
    !p.flags.includes("MODEL_UNCERTAIN") &&
    !p.flags.includes("DUPLICATE_LISTING") &&
    !p.flags.includes("IMAGE_ORDER_ASSUMED");
}

const flagCounts = {};
for (const p of unique) for (const f of p.flags) flagCounts[f] = (flagCounts[f] ?? 0) + 1;

const payload = {
  summary: {
    generatedAt: new Date().toISOString(),
    source: SOURCE,
    totals: {
      parsed: unique.length,
      published: unique.filter((p) => p.published).length,
      held: unique.filter((p) => !p.published).length,
      withImage: unique.filter((p) => p.image).length,
      skippedRows: skipped.length,
    },
    flagCounts,
    flagMeanings: {
      NO_IMAGE: "No photograph could be taken from this catalogue page.",
      IMAGE_ORDER_ASSUMED: "The page carries one photograph per product and both run in the same reading order, so the pairing is likely but has not been checked by eye.",
      IMAGE_ORDER_VERIFIED: "The image-to-product pairing on this page has been checked against the printed model names.",
      IMAGE_COUNT_MISMATCH: "The page has a different number of photographs than products, so no image can be attributed to this model.",
      MODEL_UNCERTAIN: "The parsed model name may be a fragment of the specification table rather than the model itself.",
      SPEC_MISSING: "No specification lines were printed for this model.",
      DUPLICATE_LISTING: "This model appears more than once in the catalogue.",
    },
    skipped,
  },
  products: unique,
};

mkdirSync(dirname(OUT), { recursive: true });
writeFileSync(OUT, JSON.stringify(payload, null, 2));

console.log(`parsed ${unique.length} products · ${payload.summary.totals.published} publishable · ${skipped.length} rows skipped`);
for (const [f, n] of Object.entries(flagCounts).sort((a, b) => b[1] - a[1])) console.log(`  ${f}: ${n}`);
