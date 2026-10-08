import { inflateRawSync } from "node:zlib";
import type { RawVehicle } from "./normalize-vehicle";
import { mapHeaders } from "./normalize-vehicle";

/**
 * Intake parsers.
 *
 * Dealers send whatever their system already produces. Every DMS on the market
 * exports CSV or XML for syndication, small dealers keep spreadsheets, and the
 * ones with their own software send JSON. All four are accepted as-is — asking
 * a dealer to reformat their stock list is how you never get their stock list.
 *
 * Server-side only: the XLSX reader uses node's zlib.
 */

export type ParseResult = {
  format: "csv" | "xlsx" | "xml" | "json";
  headers: string[];
  rows: RawVehicle[];
  warnings: string[];
};

export function detectFormat(filename: string, buffer: Buffer): ParseResult["format"] | null {
  const name = filename.toLowerCase();
  // XLSX is a ZIP: "PK\x03\x04".
  if (buffer.length > 4 && buffer[0] === 0x50 && buffer[1] === 0x4b) return "xlsx";
  if (name.endsWith(".json")) return "json";
  if (name.endsWith(".xml")) return "xml";
  if (name.endsWith(".csv") || name.endsWith(".tsv") || name.endsWith(".txt")) return "csv";

  const head = buffer.subarray(0, 512).toString("utf8").trim();
  if (head.startsWith("{") || head.startsWith("[")) return "json";
  if (head.startsWith("<")) return "xml";
  if (head.includes(",") || head.includes("\t")) return "csv";
  return null;
}

export function parseInventoryFile(filename: string, buffer: Buffer): ParseResult {
  const format = detectFormat(filename, buffer);
  if (!format) throw new Error("Unrecognised file. Send a CSV, Excel, XML or JSON export.");
  switch (format) {
    case "csv":
      return parseCsv(buffer.toString("utf8"));
    case "xlsx":
      return parseXlsx(buffer);
    case "xml":
      return parseXml(buffer.toString("utf8"));
    case "json":
      return parseJson(buffer.toString("utf8"));
  }
}

/* ------------------------------------------------------------------- CSV */

/** RFC 4180 with quoted fields, embedded commas and newlines, and TSV. */
export function parseCsv(text: string): ParseResult {
  const clean = text.replace(/^﻿/, "");
  const delimiter = pickDelimiter(clean);
  const rows: string[][] = [];
  let field = "";
  let row: string[] = [];
  let inQuotes = false;

  for (let i = 0; i < clean.length; i++) {
    const ch = clean[i];
    if (inQuotes) {
      if (ch === '"') {
        if (clean[i + 1] === '"') {
          field += '"';
          i++;
        } else inQuotes = false;
      } else field += ch;
      continue;
    }
    if (ch === '"') inQuotes = true;
    else if (ch === delimiter) {
      row.push(field);
      field = "";
    } else if (ch === "\n") {
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
    } else if (ch !== "\r") field += ch;
  }
  if (field || row.length) {
    row.push(field);
    rows.push(row);
  }

  const nonEmpty = rows.filter((r) => r.some((c) => c.trim()));
  if (nonEmpty.length === 0) return { format: "csv", headers: [], rows: [], warnings: ["The file is empty."] };

  const headers = nonEmpty[0].map((h) => h.trim());
  return { format: "csv", headers, rows: toRawVehicles(headers, nonEmpty.slice(1)), warnings: headerWarnings(headers) };
}

function pickDelimiter(text: string): string {
  const firstLine = text.slice(0, text.indexOf("\n") + 1 || 500);
  const counts = [
    [",", (firstLine.match(/,/g) ?? []).length],
    ["\t", (firstLine.match(/\t/g) ?? []).length],
    [";", (firstLine.match(/;/g) ?? []).length],
    ["|", (firstLine.match(/\|/g) ?? []).length],
  ] as const;
  return [...counts].sort((a, b) => b[1] - a[1])[0][0];
}

/* ------------------------------------------------------------------ XLSX */

/**
 * Minimal .xlsx reader: an XLSX is a ZIP containing XML. We read the central
 * directory, inflate the two parts we need, and pull the cell values out.
 * Deliberately dependency-free — a spreadsheet import is not worth a supply
 * chain.
 */
export function parseXlsx(buffer: Buffer): ParseResult {
  const files = readZip(buffer);
  const sharedStrings = files["xl/sharedStrings.xml"] ? readSharedStrings(files["xl/sharedStrings.xml"].toString("utf8")) : [];

  const sheetName =
    Object.keys(files).find((f) => /^xl\/worksheets\/sheet1\.xml$/.test(f)) ??
    Object.keys(files).find((f) => /^xl\/worksheets\/.+\.xml$/.test(f));
  if (!sheetName) throw new Error("No worksheet found inside the Excel file.");

  const sheet = files[sheetName].toString("utf8");
  const grid: string[][] = [];

  for (const rowMatch of sheet.matchAll(/<row[^>]*>([\s\S]*?)<\/row>/g)) {
    const cells: string[] = [];
    for (const cellMatch of rowMatch[1].matchAll(/<c([^>]*)>([\s\S]*?)<\/c>/g)) {
      const attrs = cellMatch[1];
      const body = cellMatch[2];
      const ref = attrs.match(/r="([A-Z]+)\d+"/)?.[1];
      const index = ref ? columnIndex(ref) : cells.length;
      const isShared = /t="s"/.test(attrs);
      const isInline = /t="(inlineStr|str)"/.test(attrs);

      let value = "";
      if (isInline) value = decodeXml(body.replace(/<[^>]+>/g, ""));
      else {
        const v = body.match(/<v>([\s\S]*?)<\/v>/)?.[1] ?? "";
        value = isShared ? (sharedStrings[Number(v)] ?? "") : decodeXml(v);
      }
      while (cells.length < index) cells.push("");
      cells[index] = value;
    }
    grid.push(cells);
  }

  const nonEmpty = grid.filter((r) => r.some((c) => c.trim()));
  if (nonEmpty.length === 0) return { format: "xlsx", headers: [], rows: [], warnings: ["The spreadsheet is empty."] };

  const headers = nonEmpty[0].map((h) => h.trim());
  return { format: "xlsx", headers, rows: toRawVehicles(headers, nonEmpty.slice(1)), warnings: headerWarnings(headers) };
}

function columnIndex(ref: string): number {
  let n = 0;
  for (const ch of ref) n = n * 26 + (ch.charCodeAt(0) - 64);
  return n - 1;
}

function readSharedStrings(xml: string): string[] {
  return [...xml.matchAll(/<si>([\s\S]*?)<\/si>/g)].map((m) =>
    decodeXml(
      [...m[1].matchAll(/<t[^>]*>([\s\S]*?)<\/t>/g)]
        .map((t) => t[1])
        .join(""),
    ),
  );
}

/** Reads a ZIP end-of-central-directory and inflates each stored entry. */
function readZip(buffer: Buffer): Record<string, Buffer> {
  const out: Record<string, Buffer> = {};

  // End of central directory record: 0x06054b50.
  let eocd = -1;
  for (let i = buffer.length - 22; i >= 0 && i > buffer.length - 66_000; i--) {
    if (buffer.readUInt32LE(i) === 0x06054b50) {
      eocd = i;
      break;
    }
  }
  if (eocd < 0) throw new Error("Not a valid Excel file (no ZIP directory found).");

  const entries = buffer.readUInt16LE(eocd + 10);
  let offset = buffer.readUInt32LE(eocd + 16);

  for (let i = 0; i < entries; i++) {
    if (buffer.readUInt32LE(offset) !== 0x02014b50) break;
    const method = buffer.readUInt16LE(offset + 10);
    const compressedSize = buffer.readUInt32LE(offset + 20);
    const nameLen = buffer.readUInt16LE(offset + 28);
    const extraLen = buffer.readUInt16LE(offset + 30);
    const commentLen = buffer.readUInt16LE(offset + 32);
    const localOffset = buffer.readUInt32LE(offset + 42);
    const name = buffer.subarray(offset + 46, offset + 46 + nameLen).toString("utf8");

    // Local file header: skip its own variable-length name and extra fields.
    const localNameLen = buffer.readUInt16LE(localOffset + 26);
    const localExtraLen = buffer.readUInt16LE(localOffset + 28);
    const dataStart = localOffset + 30 + localNameLen + localExtraLen;
    const data = buffer.subarray(dataStart, dataStart + compressedSize);

    if (name.endsWith(".xml")) {
      try {
        out[name] = method === 0 ? Buffer.from(data) : inflateRawSync(data);
      } catch {
        // A part we cannot inflate is skipped rather than failing the upload.
      }
    }
    offset += 46 + nameLen + extraLen + commentLen;
  }
  return out;
}

/* ------------------------------------------------------------------- XML */

/** Handles the flat <vehicle>…</vehicle> shape DMS syndication feeds emit. */
export function parseXml(text: string): ParseResult {
  const itemPattern = /<(vehicle|car|item|listing|inventory_item|unit)\b[^>]*>([\s\S]*?)<\/\1>/gi;
  const rows: RawVehicle[] = [];
  const headerSet = new Set<string>();

  for (const match of text.matchAll(itemPattern)) {
    const record: Record<string, string> = {};
    for (const field of match[2].matchAll(/<([A-Za-z0-9_:-]+)(?:\s[^>]*)?>([\s\S]*?)<\/\1>/g)) {
      const key = field[1].replace(/^.*:/, "");
      const value = decodeXml(field[2].replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1").replace(/<[^>]+>/g, " ")).trim();
      record[key] = record[key] ? `${record[key]}|${value}` : value;
      headerSet.add(key);
    }
    if (Object.keys(record).length) rows.push(record);
  }

  const headers = [...headerSet];
  const mapping = mapHeaders(headers);
  const mapped = rows.map((row) => {
    const out: RawVehicle = {};
    headers.forEach((header, i) => {
      const field = mapping[i];
      if (field) out[field] = row[header];
      else out[header] = row[header];
    });
    return out;
  });

  return {
    format: "xml",
    headers,
    rows: mapped,
    warnings: rows.length === 0 ? ["No <vehicle> or <item> elements found in the XML."] : headerWarnings(headers),
  };
}

/* ------------------------------------------------------------------ JSON */

export function parseJson(text: string): ParseResult {
  let payload: unknown;
  try {
    payload = JSON.parse(text);
  } catch {
    throw new Error("The JSON could not be parsed. Check for a trailing comma or a truncated file.");
  }

  const list = Array.isArray(payload)
    ? payload
    : ((payload as Record<string, unknown>)?.vehicles ??
       (payload as Record<string, unknown>)?.inventory ??
       (payload as Record<string, unknown>)?.data ??
       (payload as Record<string, unknown>)?.items);

  if (!Array.isArray(list)) {
    throw new Error('Expected an array of vehicles, or an object with a "vehicles" array.');
  }

  const headerSet = new Set<string>();
  for (const item of list) if (item && typeof item === "object") Object.keys(item).forEach((k) => headerSet.add(k));
  const headers = [...headerSet];
  const mapping = mapHeaders(headers);

  const rows = list.map((item) => {
    const record = item as Record<string, unknown>;
    const out: RawVehicle = {};
    headers.forEach((header, i) => {
      const value = record[header];
      const flat = Array.isArray(value) ? value.join("|") : value == null ? "" : typeof value === "object" ? JSON.stringify(value) : value;
      const field = mapping[i];
      out[field ?? header] = flat as string | number;
    });
    return out;
  });

  return { format: "json", headers, rows, warnings: headerWarnings(headers) };
}

/* --------------------------------------------------------------- shared */

function toRawVehicles(headers: string[], rows: string[][]): RawVehicle[] {
  const mapping = mapHeaders(headers);
  return rows.map((cells) => {
    const out: RawVehicle = {};
    headers.forEach((header, i) => {
      const field = mapping[i] ?? header;
      const value = (cells[i] ?? "").trim();
      if (value !== "") out[field] = value;
    });
    return out;
  });
}

function headerWarnings(headers: string[]): string[] {
  const mapping = mapHeaders(headers);
  const mapped = new Set(Object.values(mapping));
  const required = ["make", "model", "year", "price"];
  const missing = required.filter((f) => !mapped.has(f));
  const warnings: string[] = [];
  if (missing.length) {
    warnings.push(
      `Could not find a column for: ${missing.join(", ")}. Rename the column or use the template — we match common names automatically.`,
    );
  }
  const unmapped = headers.filter((_, i) => !mapping[i]);
  if (unmapped.length) warnings.push(`Columns kept but not recognised: ${unmapped.slice(0, 8).join(", ")}.`);
  return warnings;
}

function decodeXml(s: string): string {
  return s
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)))
    .replace(/&amp;/g, "&");
}

/**
 * Google Sheets: a published sheet serves CSV at a predictable URL, so a
 * dealer only has to paste the normal share link.
 */
export function googleSheetCsvUrl(shareUrl: string): string | null {
  const id = shareUrl.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/)?.[1];
  if (!id) return null;
  const gid = shareUrl.match(/[#&?]gid=(\d+)/)?.[1] ?? "0";
  return `https://docs.google.com/spreadsheets/d/${id}/gviz/tq?tqx=out:csv&gid=${gid}`;
}
