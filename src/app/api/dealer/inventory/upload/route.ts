import { NextResponse } from "next/server";
import { dealerByApiKey, dealerCanPublish, type Dealer } from "@/lib/inventory/dealers";
import { parseInventoryFile, googleSheetCsvUrl, parseCsv } from "@/lib/inventory/parsers";
import { processBatch } from "@/lib/inventory/pipeline";

/**
 * BULK INVENTORY UPLOAD
 *
 *   POST /api/dealer/inventory/upload   multipart: file=<csv|xlsx|xml|json>
 *   POST /api/dealer/inventory/upload   json: { sheetUrl: "https://docs.google.com/..." }
 *
 * Requires the dealer API key (`Authorization: Bearer <key>` or `x-dealer-key`).
 * The dealer id and the verification tier come from the key, never from the caller.
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
const SHEET_TIMEOUT_MS = 15_000;
const MAX_SHEET_BYTES = 12 * 1024 * 1024;
const MAX_JSON_BYTES = 8_192;

function fail(error: string, message: string, status: number) {
  return NextResponse.json({ ok: false, error, message }, { status });
}

/** Key from `Authorization: Bearer` or `x-dealer-key`. Anything else is anonymous. */
function authenticate(request: Request): Dealer | null {
  const bearer = (request.headers.get("authorization") ?? "").replace(/^Bearer\s+/i, "").trim();
  const key = bearer || (request.headers.get("x-dealer-key") ?? "").trim();
  const dealer = dealerByApiKey(key);
  return dealer && dealerCanPublish(dealer).allowed ? dealer : null;
}

export async function POST(request: Request) {
  const dealer = authenticate(request);
  if (!dealer) return NextResponse.json({ ok: false }, { status: 401 });

  const contentType = request.headers.get("content-type") ?? "";

  try {
    if (contentType.includes("application/json")) return await handleSheet(request, dealer);
    return await handleFile(request, dealer);
  } catch (error) {
    // Parser detail stays in the server log; the caller gets a generic message.
    console.error("[dealer upload]", error instanceof Error ? error.message : "unexpected error");
    return fail("upload_failed", "Upload could not be processed. Check the file and try again.", 400);
  }
}

/** Allow-list: a caller may only ask for LISTED (a downgrade); anything else gets the dealer's own tier. */
function tierFor(dealer: Dealer, requested: unknown) {
  return requested === "LISTED" ? "LISTED" : dealer.verification;
}

async function handleFile(request: Request, dealer: Dealer) {
  // Reject an oversized body before it is buffered (multipart overhead is small).
  const declared = Number(request.headers.get("content-length") ?? 0);
  if (declared > MAX_BYTES + 64 * 1024) return tooLarge();

  const form = await request.formData();
  const file = form.get("file");
  if (!(file instanceof File)) return fail("no_file", "Attach a file as `file`.", 400);
  if (file.size > MAX_BYTES) return tooLarge();

  const buffer = Buffer.from(await file.arrayBuffer());
  const parsed = parseInventoryFile(file.name, buffer);

  const report = processBatch(parsed.rows, {
    fileName: file.name,
    format: parsed.format,
    dealerId: dealer.id,
    verification: tierFor(dealer, form.get("verification")),
    parserWarnings: parsed.warnings,
  });

  return NextResponse.json({ ok: true, report });
}

function tooLarge() {
  return fail("file_too_large", "Maximum upload size is 12 MB. Split the export and send it in two parts.", 413);
}

async function handleSheet(request: Request, dealer: Dealer) {
  const raw = await request.text();
  if (raw.length > MAX_JSON_BYTES) return fail("bad_request", "Request too large.", 413);
  const body = JSON.parse(raw) as { sheetUrl?: unknown };

  // googleSheetCsvUrl only extracts a sheet id and rebuilds the URL on
  // docs.google.com, so the caller never chooses the host. Re-check anyway.
  const csvUrl = typeof body.sheetUrl === "string" ? googleSheetCsvUrl(body.sheetUrl) : null;
  const target = csvUrl ? new URL(csvUrl) : null;
  if (!csvUrl || !target || target.protocol !== "https:" || target.hostname !== "docs.google.com" || !target.pathname.startsWith("/spreadsheets/")) {
    return fail("bad_sheet_url", "That does not look like a Google Sheets link. Paste the normal share URL.", 400);
  }

  let text: string;
  try {
    const response = await fetch(csvUrl, {
      headers: { "user-agent": "RiderzproInventory/1.0" },
      signal: AbortSignal.timeout(SHEET_TIMEOUT_MS),
    });
    if (!response.ok) throw new Error(`sheet fetch returned ${response.status}`);
    text = await response.text();
    if (text.length > MAX_SHEET_BYTES) throw new Error("sheet too large");
  } catch (error) {
    console.error("[dealer upload] sheet", error instanceof Error ? error.message : "unexpected error");
    return fail(
      "sheet_unreachable",
      "Could not read the sheet. In Google Sheets choose Share → Anyone with the link → Viewer, then try again.",
      400,
    );
  }

  const parsed = parseCsv(text);
  const report = processBatch(parsed.rows, {
    fileName: "Google Sheet",
    format: "google-sheet",
    dealerId: dealer.id,
    verification: dealer.verification,
    parserWarnings: parsed.warnings,
  });

  return NextResponse.json({ ok: true, report, syncUrl: csvUrl });
}
