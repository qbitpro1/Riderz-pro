import { NextResponse } from "next/server";
import { parseInventoryFile, googleSheetCsvUrl, parseCsv } from "@/lib/inventory/parsers";
import { processBatch } from "@/lib/inventory/pipeline";
import type { VerificationTier } from "@/lib/inventory/network";

/**
 * BULK INVENTORY UPLOAD
 *
 *   POST /api/dealer/inventory/upload   multipart: file=<csv|xlsx|xml|json>
 *   POST /api/dealer/inventory/upload   json: { sheetUrl: "https://docs.google.com/..." }
 *
 * Returns the validation report the dealer sees before anything goes live:
 * how many were accepted, how many were duplicates, and exactly what is wrong
 * with the rest, row by row.
 *
 * Parsing happens server-side because the XLSX reader needs node's zlib, and
 * because a dealer's stock list should not be validated by code they can edit.
 */

export const runtime = "nodejs";
export const maxDuration = 60;

const MAX_BYTES = 12 * 1024 * 1024;

export async function POST(request: Request) {
  const contentType = request.headers.get("content-type") ?? "";

  try {
    if (contentType.includes("application/json")) return await handleSheet(request);
    return await handleFile(request);
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: "upload_failed", message: error instanceof Error ? error.message : "Upload could not be processed." },
      { status: 400 },
    );
  }
}

async function handleFile(request: Request) {
  const form = await request.formData();
  const file = form.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ ok: false, error: "no_file", message: "Attach a file as `file`." }, { status: 400 });
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json(
      { ok: false, error: "file_too_large", message: "Maximum upload size is 12 MB. Split the export and send it in two parts." },
      { status: 413 },
    );
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const parsed = parseInventoryFile(file.name, buffer);

  const report = processBatch(parsed.rows, {
    fileName: file.name,
    format: parsed.format,
    dealerId: String(form.get("dealerId") ?? "preview"),
    verification: (String(form.get("verification") ?? "LISTED") as VerificationTier) ?? "LISTED",
    parserWarnings: parsed.warnings,
  });

  return NextResponse.json({ ok: true, report });
}

async function handleSheet(request: Request) {
  const body = (await request.json()) as { sheetUrl?: string; dealerId?: string };
  const csvUrl = googleSheetCsvUrl(body.sheetUrl ?? "");
  if (!csvUrl) {
    return NextResponse.json(
      {
        ok: false,
        error: "bad_sheet_url",
        message: "That does not look like a Google Sheets link. Paste the normal share URL.",
      },
      { status: 400 },
    );
  }

  const response = await fetch(csvUrl, { headers: { "user-agent": "RiderzproInventory/1.0" } });
  if (!response.ok) {
    return NextResponse.json(
      {
        ok: false,
        error: "sheet_unreachable",
        message:
          "Could not read the sheet. In Google Sheets choose Share → Anyone with the link → Viewer, then try again.",
      },
      { status: 400 },
    );
  }

  const parsed = parseCsv(await response.text());
  const report = processBatch(parsed.rows, {
    fileName: "Google Sheet",
    format: "google-sheet",
    dealerId: body.dealerId ?? "preview",
    verification: "LISTED",
    parserWarnings: parsed.warnings,
  });

  return NextResponse.json({ ok: true, report, syncUrl: csvUrl });
}
