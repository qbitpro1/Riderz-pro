/**
 * CMYK → sRGB for images lifted out of a print PDF.
 *
 * Brochures are prepared for print, so their embedded photographs are often
 * 4-component Adobe JPEGs (CMYK, usually YCCK-encoded and stored inverted).
 * `extract-pdf-images` copies the original bytes, which is the right thing for
 * an RGB source and produces a colour-inverted mess for a CMYK one — teal skies
 * and negative bodywork.
 *
 * This pass re-encodes anything with 4 channels into sRGB and leaves 3-channel
 * files alone, so it is safe to run over a whole directory more than once.
 *
 *   node scripts/convert-cmyk-images.mjs <dir>
 */

import { readdir, readFile, writeFile, stat } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const dir = process.argv[2];
if (!dir) {
  console.error("usage: node scripts/convert-cmyk-images.mjs <dir>");
  process.exit(1);
}

const files = (await readdir(dir)).filter((f) => /\.jpe?g$/i.test(f));
if (!files.length) {
  console.error(`no JPEGs in ${dir}`);
  process.exit(1);
}

let converted = 0;
let skipped = 0;

for (const file of files) {
  const full = path.join(dir, file);
  const input = await readFile(full);
  const meta = await sharp(input).metadata();

  if (meta.channels !== 4) {
    console.log(`  ${file}: ${meta.channels}-channel ${meta.space} — left alone`);
    skipped += 1;
    continue;
  }

  const before = (await stat(full)).size;

  // Photoshop writes CMYK JPEGs with inverted values. libvips decodes the
  // YCCK correctly but leaves the inversion in place, which is what turns a
  // sunset into a teal sky — so negate while the data is still CMYK, then
  // convert. Doing it the other way round negates the finished RGB and is
  // subtly wrong.
  const out = await sharp(input)
    .negate({ alpha: false })
    .toColourspace("srgb")
    .jpeg({ quality: 86, chromaSubsampling: "4:4:4", mozjpeg: true })
    .toBuffer();

  await writeFile(full, out);
  converted += 1;
  console.log(
    `  ${file}: CMYK ${meta.width}x${meta.height} → sRGB  ${(before / 1024).toFixed(0)}kB → ${(out.length / 1024).toFixed(0)}kB`,
  );
}

console.log(`\n${converted} converted, ${skipped} already sRGB → ${dir}`);
