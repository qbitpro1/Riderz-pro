// Temporary extraction tool: dumps positioned text from a PDF so the price-list
// rows can be reconstructed faithfully.
import { getDocument } from "pdfjs-dist/legacy/build/pdf.mjs";
import { readFileSync, writeFileSync } from "node:fs";

const file = process.argv[2];
const out = process.argv[3];

const doc = await getDocument({ data: new Uint8Array(readFileSync(file)), useSystemFonts: true }).promise;
let dump = "";

for (let p = 1; p <= doc.numPages; p++) {
  const page = await doc.getPage(p);
  const content = await page.getTextContent();
  const rows = new Map();
  for (const item of content.items) {
    if (!item.str || !item.str.trim()) continue;
    const y = Math.round(item.transform[5] / 3) * 3;
    if (!rows.has(y)) rows.set(y, []);
    rows.get(y).push({ x: item.transform[4], s: item.str });
  }
  dump += `\n===== PAGE ${p} =====\n`;
  for (const y of [...rows.keys()].sort((a, b) => b - a)) {
    const line = rows
      .get(y)
      .sort((a, b) => a.x - b.x)
      .map((i) => i.s.trim())
      .filter(Boolean)
      .join(" | ");
    if (line) dump += line + "\n";
  }
}

writeFileSync(out, dump, "utf8");
console.log("pages:", doc.numPages, "chars:", dump.length);
