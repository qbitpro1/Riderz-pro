#!/usr/bin/env node
/**
 * Extracts the product photography out of a supplier catalogue PDF, one image
 * per page, keeping the manufacturer's original file wherever possible.
 *
 *   node scripts/extract-pdf-images.mjs <input.pdf> <out-dir> [prefix]
 *
 * Two paths, in priority order:
 *
 *   1. The image is an embedded JPEG (/DCTDecode). The original bytes are
 *      copied out untouched — no re-encode, no quality loss, and the file is
 *      exactly what the manufacturer supplied.
 *   2. Anything else is decoded by pdf.js and written as PNG.
 *
 * pdf.js gives the page-to-object mapping; the raw file gives the original
 * bytes. Each page's largest image is taken as the product shot, which is what
 * a product page in a catalogue actually looks like.
 */
import { getDocument, OPS } from "pdfjs-dist/legacy/build/pdf.mjs";
import { deflateSync } from "node:zlib";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

const args = process.argv.slice(2);
const ALL = args.includes("--all");
const [input, outDir, prefix = "page"] = args.filter((a) => !a.startsWith("--"));
if (!input || !outDir) {
  console.error("usage: extract-pdf-images.mjs <input.pdf> <out-dir> [prefix] [--all]");
  process.exit(1);
}

/**
 * Default takes the single largest image per page — right for a catalogue that
 * gives each product a page of its own.
 *
 * `--all` takes every image above the floor, in reading order. A page listing
 * seven speakers carries seven product shots at around 190px; they are small,
 * but they are the manufacturer's own photograph of that exact model, which is
 * the thing a page-level screenshot can never give you.
 */
const MIN_PIXELS = ALL ? 20_000 : 120_000;

const bytes = readFileSync(input);
const raw = bytes.toString("latin1");
mkdirSync(resolve(outDir), { recursive: true });

const doc = await getDocument({ data: new Uint8Array(bytes), useSystemFonts: true }).promise;

/** pdf.js resolves image objects asynchronously; wait rather than skip. */
function resolveObj(page, name) {
  return new Promise((done) => {
    try {
      if (page.objs.has(name)) return done(page.objs.get(name));
      page.objs.get(name, done);
    } catch {
      done(null);
    }
    setTimeout(() => done(null), 4000);
  });
}

/**
 * Pulls object N's stream straight out of the file. Only used when the object
 * is a JPEG, so the bytes written are the manufacturer's own encode.
 */
function rawJpeg(objNum) {
  const at = raw.indexOf(`\n${objNum} 0 obj`) + 1 || raw.indexOf(`\r${objNum} 0 obj`) + 1;
  if (at <= 0) return null;
  const dictEnd = raw.indexOf("stream", at);
  if (dictEnd < 0) return null;
  const dict = raw.slice(at, dictEnd);
  if (!dict.includes("DCTDecode")) return null;

  let start = dictEnd + "stream".length;
  if (raw[start] === "\r") start++;
  if (raw[start] === "\n") start++;
  const end = raw.indexOf("endstream", start);
  if (end < 0) return null;

  const out = bytes.subarray(start, end);
  // A JPEG always starts FF D8; if it doesn't, the dictionary lied and we drop it.
  return out[0] === 0xff && out[1] === 0xd8 ? out : null;
}

/* ------------------------------------------------------------------ PNG */

const CRC = (() => {
  const t = new Int32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c;
  }
  return t;
})();

function crc32(buf) {
  let c = -1;
  for (let i = 0; i < buf.length; i++) c = CRC[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ -1) >>> 0;
}

function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const body = Buffer.concat([Buffer.from(type, "latin1"), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body));
  return Buffer.concat([len, body, crc]);
}

/** kind 2 = RGB 24bpp, kind 3 = RGBA 32bpp — pdf.js's own constants. */
function toPng({ width, height, kind, data }) {
  const channels = kind === 3 ? 4 : 3;
  const colorType = kind === 3 ? 6 : 2;
  const stride = width * channels;
  const rows = Buffer.alloc((stride + 1) * height);
  for (let y = 0; y < height; y++) {
    rows[y * (stride + 1)] = 0; // filter: none
    Buffer.from(data.buffer ?? data, y * stride, stride).copy(rows, y * (stride + 1) + 1);
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8;
  ihdr[9] = colorType;
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk("IHDR", ihdr),
    chunk("IDAT", deflateSync(rows, { level: 9 })),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

/* ----------------------------------------------------------------- main */

const manifest = [];

for (let p = 1; p <= doc.numPages; p++) {
  const page = await doc.getPage(p);
  const ops = await page.getOperatorList();

  /* Walk the content stream keeping the current transformation matrix, so each
     image can be placed on the page. Without position there is no reading
     order, and without reading order a page of seven speakers cannot be told
     apart. */
  const mul = (m, n) => [
    m[0] * n[0] + m[2] * n[1],
    m[1] * n[0] + m[3] * n[1],
    m[0] * n[2] + m[2] * n[3],
    m[1] * n[2] + m[3] * n[3],
    m[0] * n[4] + m[2] * n[5] + m[4],
    m[1] * n[4] + m[3] * n[5] + m[5],
  ];

  let ctm = [1, 0, 0, 1, 0, 0];
  const stack = [];
  const candidates = [];

  for (let i = 0; i < ops.fnArray.length; i++) {
    const fn = ops.fnArray[i];
    if (fn === OPS.save) stack.push(ctm.slice());
    else if (fn === OPS.restore) ctm = stack.pop() ?? [1, 0, 0, 1, 0, 0];
    else if (fn === OPS.transform) ctm = mul(ctm, ops.argsArray[i]);
    else if (fn === OPS.paintImageXObject || fn === OPS.paintJpegXObject) {
      const [id, w, h] = ops.argsArray[i];
      candidates.push({
        id: String(id),
        w: Number(w) || 0,
        h: Number(h) || 0,
        // The unit square maps to the placed image; e/f are its origin.
        x: ctm[4],
        y: ctm[5],
      });
    }
  }
  if (candidates.length === 0) continue;

  const kept = [];
  for (const c of candidates) {
    const obj = await resolveObj(page, c.id);
    if (!obj?.width) continue;
    const pixels = obj.width * obj.height;
    if (pixels < MIN_PIXELS) continue;
    kept.push({ ...c, obj, pixels });
  }
  if (kept.length === 0) continue;

  /* Reading order: down the page, then across. PDF y grows upward, so rows are
     descending y, and images within ~24pt of each other count as one row. */
  const chosen = ALL
    ? kept.sort((a, b) => (Math.abs(b.y - a.y) > 24 ? b.y - a.y : a.x - b.x))
    : [kept.reduce((best, c) => (!best || c.pixels > best.pixels ? c : best), null)];

  chosen.forEach((c, idx) => {
    const objNum = Number(String(c.obj.ref ?? "").replace(/R$/, ""));
    const jpeg = Number.isFinite(objNum) ? rawJpeg(objNum) : null;

    const stem = `${prefix}-${String(p).padStart(3, "0")}${ALL ? `-${idx + 1}` : ""}`;
    const file = jpeg ? `${stem}.jpg` : `${stem}.png`;
    writeFileSync(resolve(outDir, file), jpeg ?? toPng(c.obj));

    manifest.push({
      page: p,
      order: idx + 1,
      file,
      width: c.obj.width,
      height: c.obj.height,
      x: Math.round(c.x),
      y: Math.round(c.y),
      original: Boolean(jpeg),
    });
  });
  process.stderr.write(`  p${p}: ${chosen.length} image(s)\n`);
}

writeFileSync(resolve(outDir, "manifest.json"), JSON.stringify({ source: input, pages: doc.numPages, images: manifest }, null, 2));
console.log(`\n${manifest.length} images from ${doc.numPages} pages → ${outDir}`);
