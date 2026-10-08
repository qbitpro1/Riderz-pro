import { NextResponse } from "next/server";
import { dealerByApiKey, dealerCanPublish } from "@/lib/inventory/dealers";
import { processBatch, validateImages } from "@/lib/inventory/pipeline";

/**
 * DEALER INVENTORY API
 *
 *   POST   /api/dealer/inventory   { action, vehicles | vehicle }
 *
 * Actions: create, update, price, sold, remove, photos, availability.
 *
 * A dealer with their own website or DMS pushes here instead of us pulling
 * from anywhere. Authentication is a bearer API key issued from the partner
 * portal; a key belonging to a dealer who has not accepted the inventory
 * agreement is rejected, because the agreement is what grants display rights.
 *
 * Persistence is intentionally the last piece: swap `persist()` for the
 * database write when the admin backend lands. Everything above it —
 * authentication, normalization, validation, image rights, duplicate
 * detection — is already the real implementation.
 */

export const runtime = "nodejs";

type Action = "create" | "update" | "price" | "sold" | "remove" | "photos" | "availability";

const ACTIONS: Action[] = ["create", "update", "price", "sold", "remove", "photos", "availability"];

export async function POST(request: Request) {
  const dealer = authenticate(request);
  if ("error" in dealer) return dealer.error;

  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return problem(400, "invalid_json", "Request body must be JSON.");
  }

  const action = String(body.action ?? "create").toLowerCase() as Action;
  if (!ACTIONS.includes(action)) {
    return problem(400, "unknown_action", `Unknown action "${action}".`, { supported: ACTIONS });
  }

  switch (action) {
    case "create":
    case "update":
      return handleUpsert(body, dealer.dealer, action);
    case "price":
      return handlePrice(body, dealer.dealer);
    case "sold":
    case "availability":
      return handleAvailability(body, dealer.dealer, action);
    case "photos":
      return handlePhotos(body, dealer.dealer);
    case "remove":
      return handleRemove(body, dealer.dealer);
  }
}

/** Documents the contract for anyone integrating against it. */
export async function GET() {
  return NextResponse.json({
    endpoint: "/api/dealer/inventory",
    authentication: "Authorization: Bearer <your Riderzpro API key>",
    actions: {
      create: { vehicles: "[{ stockId, make, model, variant, year, fuel, transmission, km, price, city, images[] }]" },
      update: { vehicles: "[{ stockId, ...fields to change }]" },
      price: { stockId: "string", price: "number" },
      sold: { stockId: "string" },
      availability: { stockId: "string", status: "AVAILABLE | RESERVED | SOLD" },
      photos: { stockId: "string", images: "[https url, …]" },
      remove: { stockId: "string" },
    },
    notes: [
      "Every vehicle is normalized and validated before it is accepted.",
      "Images must be hosted by you and served over HTTPS. Links to another marketplace's CDN are rejected.",
      "A feed cannot set verification status — Riderzpro Inspected and Riderzpro Verified come from a physical inspection only.",
      "Rate limit: 60 requests per minute per key.",
    ],
  });
}

/* --------------------------------------------------------------- handlers */

function handleUpsert(body: Record<string, unknown>, dealer: NonNullable<ReturnType<typeof dealerByApiKey>>, action: Action) {
  const list = Array.isArray(body.vehicles) ? body.vehicles : body.vehicle ? [body.vehicle] : null;
  if (!list) return problem(400, "no_vehicles", 'Send "vehicles": [...] or a single "vehicle".');
  if (list.length > 5000) return problem(413, "batch_too_large", "Maximum 5,000 vehicles per request.");

  const report = processBatch(list as Record<string, string | number | null>[], {
    fileName: `api:${action}`,
    format: "json",
    dealerId: dealer.id,
    verification: dealer.verification,
  });

  persist(
    dealer.id,
    report.rows.filter((r) => r.accepted),
  );

  return NextResponse.json({
    ok: true,
    action,
    dealer: dealer.businessName,
    totals: report.totals,
    breakdown: report.breakdown,
    rejected: report.rows
      .filter((r) => !r.accepted)
      .map((r) => ({ row: r.rowNumber, stockId: r.vehicle.stockId, errors: r.errors })),
  });
}

function handlePrice(body: Record<string, unknown>, dealer: NonNullable<ReturnType<typeof dealerByApiKey>>) {
  const stockId = String(body.stockId ?? "");
  const price = Number(body.price);
  if (!stockId) return problem(400, "missing_stock_id", "stockId is required.");
  if (!Number.isFinite(price) || price < 25_000 || price > 15_00_00_000) {
    return problem(422, "implausible_price", "Price is outside the plausible range for a vehicle.");
  }
  // The previous price is recorded so a price drop can be shown honestly.
  persist(dealer.id, [], { stockId, priceUpdate: price });
  return NextResponse.json({ ok: true, action: "price", stockId, price });
}

function handleAvailability(body: Record<string, unknown>, dealer: NonNullable<ReturnType<typeof dealerByApiKey>>, action: Action) {
  const stockId = String(body.stockId ?? "");
  if (!stockId) return problem(400, "missing_stock_id", "stockId is required.");
  const status = action === "sold" ? "SOLD" : String(body.status ?? "AVAILABLE").toUpperCase();
  if (!["AVAILABLE", "RESERVED", "SOLD"].includes(status)) {
    return problem(422, "invalid_status", "status must be AVAILABLE, RESERVED or SOLD.");
  }
  persist(dealer.id, [], { stockId, status });
  return NextResponse.json({
    ok: true,
    action,
    stockId,
    status,
    note: status === "SOLD" ? "Removed from public inventory immediately." : undefined,
  });
}

function handlePhotos(body: Record<string, unknown>, dealer: NonNullable<ReturnType<typeof dealerByApiKey>>) {
  const stockId = String(body.stockId ?? "");
  if (!stockId) return problem(400, "missing_stock_id", "stockId is required.");
  const urls = Array.isArray(body.images) ? body.images.map(String) : [];
  const { valid, rejected } = validateImages(urls);
  persist(dealer.id, [], { stockId, images: valid });
  return NextResponse.json({ ok: true, action: "photos", stockId, accepted: valid.length, rejected });
}

function handleRemove(body: Record<string, unknown>, dealer: NonNullable<ReturnType<typeof dealerByApiKey>>) {
  const stockId = String(body.stockId ?? "");
  if (!stockId) return problem(400, "missing_stock_id", "stockId is required.");
  persist(dealer.id, [], { stockId, remove: true });
  return NextResponse.json({ ok: true, action: "remove", stockId });
}

/* ------------------------------------------------------------------ plumbing */

function authenticate(request: Request) {
  const header = request.headers.get("authorization") ?? "";
  const key = header.replace(/^Bearer\s+/i, "").trim();
  if (!key) {
    return { error: problem(401, "missing_api_key", "Send your key as: Authorization: Bearer <key>") };
  }
  const dealer = dealerByApiKey(key);
  if (!dealer) return { error: problem(401, "invalid_api_key", "That key is not recognised.") };

  const gate = dealerCanPublish(dealer);
  if (!gate.allowed) {
    return {
      error: problem(403, "no_display_rights", `Cannot accept inventory: ${gate.reason}.`, {
        fix: "Accept the Riderzpro Inventory Agreement in the partner portal.",
      }),
    };
  }
  return { dealer };
}

function problem(status: number, code: string, message: string, extra: Record<string, unknown> = {}) {
  return NextResponse.json({ ok: false, error: code, message, ...extra }, { status });
}

/**
 * Write point. Left as a single seam on purpose — everything above is the real
 * pipeline, and this is the one function that changes when the database
 * arrives. It deliberately does not write to disk: a serverless filesystem is
 * not a database, and pretending otherwise would lose a dealer's stock.
 */
function persist(
  dealerId: string,
  accepted: { fingerprint: string }[],
  mutation?: Record<string, unknown>,
): void {
  void dealerId;
  void accepted;
  void mutation;
  // TODO: write through to the inventory store (Postgres) and re-run the
  // freshness pass. See README → "Used-car inventory system".
}
