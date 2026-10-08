import { normalizeVehicle, type NormalizedVehicle, type RawVehicle } from "./normalize-vehicle";
import type { InventoryType, VerificationTier } from "./network";

/**
 * THE INTAKE PIPELINE
 *
 *   Source connector → Normalization → Validation → Image validation
 *     → Duplicate detection → Quality score → Freshness → Inventory
 *
 * Every source runs through the same stages, so adding a connector later —
 * including an official marketplace API, if one ever appears — needs no change
 * to anything downstream.
 */

export type RejectionCode =
  | "MISSING_MAKE"
  | "MISSING_MODEL"
  | "MISSING_YEAR"
  | "MISSING_PRICE"
  | "MISSING_LOCATION"
  | "MISSING_KM"
  | "MISSING_FUEL"
  | "MISSING_TRANSMISSION"
  | "MISSING_VARIANT"
  | "NO_IMAGES"
  | "IMPLAUSIBLE_PRICE"
  | "IMPLAUSIBLE_KM"
  | "IMPLAUSIBLE_YEAR"
  | "DUPLICATE_IN_BATCH"
  | "DUPLICATE_EXISTING"
  | "POSSIBLE_DUPLICATE"
  | "UNVERIFIABLE_CLAIM";

export const REJECTION_LABEL: Record<RejectionCode, string> = {
  MISSING_MAKE: "No make",
  MISSING_MODEL: "No model",
  MISSING_YEAR: "No year",
  MISSING_PRICE: "No price",
  MISSING_LOCATION: "No location",
  MISSING_KM: "No kilometres",
  MISSING_FUEL: "No fuel type",
  MISSING_TRANSMISSION: "No transmission",
  MISSING_VARIANT: "No variant",
  NO_IMAGES: "No photographs",
  IMPLAUSIBLE_PRICE: "Price looks wrong",
  IMPLAUSIBLE_KM: "Odometer looks wrong",
  IMPLAUSIBLE_YEAR: "Year looks wrong",
  DUPLICATE_IN_BATCH: "Duplicate in this file",
  DUPLICATE_EXISTING: "Already in your inventory",
  POSSIBLE_DUPLICATE: "Looks like another row in this file",
  UNVERIFIABLE_CLAIM: "Contains a claim we cannot verify",
};

/** Blocking failures. Everything else is a warning and still publishes. */
const BLOCKING: RejectionCode[] = [
  "MISSING_MAKE",
  "MISSING_MODEL",
  "MISSING_YEAR",
  "MISSING_PRICE",
  "MISSING_LOCATION",
  "IMPLAUSIBLE_PRICE",
  "IMPLAUSIBLE_YEAR",
  "DUPLICATE_IN_BATCH",
  "DUPLICATE_EXISTING",
  "UNVERIFIABLE_CLAIM",
];

export type ProcessedRow = {
  rowNumber: number;
  vehicle: NormalizedVehicle;
  errors: RejectionCode[];
  warnings: RejectionCode[];
  accepted: boolean;
  quality: QualityScore;
  fingerprint: string;
};

export type UploadReport = {
  fileName: string;
  format: string;
  receivedAt: string;
  totals: {
    uploaded: number;
    accepted: number;
    duplicate: number;
    rejected: number;
    warnings: number;
  };
  /** Counted per code, which is what a dealer actually wants to see. */
  breakdown: { code: RejectionCode; label: string; count: number; blocking: boolean }[];
  rows: ProcessedRow[];
  parserWarnings: string[];
};

/* ----------------------------------------------------------- quality score */

export type QualityScore = {
  total: number;
  bands: { label: string; earned: number; possible: number }[];
};

/**
 * Internal ranking signal. Complete, photographed, freshly-priced cars from a
 * verified dealer rank above a bare row someone typed in a hurry. Never shown
 * to buyers as a number — it decides ordering, not trust.
 */
export function scoreQuality(
  v: NormalizedVehicle,
  context: { verification: VerificationTier; imageCount: number; hoursSinceUpdate: number },
): QualityScore {
  const bands: QualityScore["bands"] = [];

  const core = [v.make, v.model, v.variant, v.year, v.fuel, v.transmission, v.km, v.price, v.city];
  bands.push({
    label: "Vehicle information",
    earned: Math.round((core.filter((f) => f != null && f !== "").length / core.length) * 30),
    possible: 30,
  });

  const extra = [v.registrationYear, v.owners, v.colour, v.bodyType, v.drivetrain];
  bands.push({
    label: "Detail completeness",
    earned: Math.round((extra.filter((f) => f != null && f !== "").length / extra.length) * 10),
    possible: 10,
  });

  bands.push({
    label: "Photographs",
    earned: context.imageCount === 0 ? 0 : context.imageCount >= 10 ? 25 : context.imageCount >= 5 ? 18 : 10,
    possible: 25,
  });

  const tierPoints: Record<VerificationTier, number> = {
    LISTED: 0,
    PARTNER_VERIFIED: 8,
    RIDERZPRO_INSPECTED: 16,
    RIDERZPRO_VERIFIED: 20,
  };
  bands.push({ label: "Verification", earned: tierPoints[context.verification], possible: 20 });

  const h = context.hoursSinceUpdate;
  bands.push({
    label: "Freshness",
    earned: h <= 24 ? 15 : h <= 72 ? 11 : h <= 168 ? 6 : 0,
    possible: 15,
  });

  return { total: bands.reduce((n, b) => n + b.earned, 0), bands };
}

/* -------------------------------------------------------------- validation */

const CURRENT_YEAR = new Date().getFullYear();

/** Copy a supplier cannot substantiate. Kept out of published listings. */
const UNVERIFIABLE =
  /\b(accident[- ]free|non[- ]accidental|excellent condition|showroom condition|mint condition|genuine km|guaranteed|certified by us|best in market|no complaints)\b/i;

export function validateVehicle(v: NormalizedVehicle): { errors: RejectionCode[]; warnings: RejectionCode[] } {
  const errors: RejectionCode[] = [];
  const warnings: RejectionCode[] = [];

  if (!v.make) errors.push("MISSING_MAKE");
  if (!v.model) errors.push("MISSING_MODEL");
  if (!v.year) errors.push("MISSING_YEAR");
  if (v.price == null) errors.push("MISSING_PRICE");
  if (!v.city) errors.push("MISSING_LOCATION");

  if (!v.variant) warnings.push("MISSING_VARIANT");
  if (v.km == null) warnings.push("MISSING_KM");
  if (!v.fuel) warnings.push("MISSING_FUEL");
  if (!v.transmission) warnings.push("MISSING_TRANSMISSION");
  if (v.images.length === 0) warnings.push("NO_IMAGES");

  // Plausibility, not opinion: these catch a mistyped cell, not a cheap car.
  if (v.price != null && (v.price < 25_000 || v.price > 15_00_00_000)) errors.push("IMPLAUSIBLE_PRICE");
  if (v.year != null && (v.year < 1980 || v.year > CURRENT_YEAR + 1)) errors.push("IMPLAUSIBLE_YEAR");
  if (v.km != null && (v.km < 0 || v.km > 10_00_000)) warnings.push("IMPLAUSIBLE_KM");

  // A supplier's marketing copy is not a fact about the car — and it turns up
  // in the variant cell as often as the description, so check everything they
  // wrote, not just the field meant for prose.
  UNVERIFIABLE.lastIndex = 0;
  if (UNVERIFIABLE.test(v.supplierText)) errors.push("UNVERIFIABLE_CLAIM");

  return { errors, warnings };
}

/**
 * Image validation. A URL we cannot serve is worse than no photograph, and a
 * photograph a dealer does not own is not ours to publish.
 */
export function validateImages(urls: string[]): { valid: string[]; rejected: { url: string; reason: string }[] } {
  const valid: string[] = [];
  const rejected: { url: string; reason: string }[] = [];
  const seen = new Set<string>();

  for (const url of urls) {
    if (seen.has(url)) {
      rejected.push({ url, reason: "duplicate of another image on this vehicle" });
      continue;
    }
    seen.add(url);

    if (!/^https:\/\//i.test(url)) {
      rejected.push({ url, reason: "must be served over HTTPS" });
      continue;
    }
    // A dealer linking to a marketplace CDN is re-publishing someone else's
    // photograph. We take the dealer's own images, not a hotlink.
    if (/(cardekho|cars24|spinny|carwale|olx|quikr)\.(com|in)/i.test(url)) {
      rejected.push({ url, reason: "hosted on another marketplace — upload your own photograph" });
      continue;
    }
    if (!/\.(jpe?g|png|webp|avif)(\?|$)/i.test(url)) {
      rejected.push({ url, reason: "not a recognised image file" });
      continue;
    }
    valid.push(url);
  }
  return { valid: valid.slice(0, 20), rejected };
}

/* ------------------------------------------------------- duplicate detection */

/**
 * Within a batch, a dealer's own stock ID is decisive. Failing that, VIN, then
 * registration, then the vehicle's own attributes.
 */
export function batchFingerprint(v: NormalizedVehicle, dealerId: string): string {
  if (v.stockId) return `stock:${dealerId}:${v.stockId.toUpperCase()}`;
  if (v.vin) return `vin:${v.vin}`;
  if (v.registration) return `reg:${v.registration}`;
  return attributeFingerprint(v, dealerId);
}

/**
 * Attribute-only fingerprint, used alongside the stock ID.
 *
 * Three rows can carry three different stock IDs and still be the same car —
 * that is exactly what happens when a dealer re-enters a vehicle instead of
 * editing it. We do not reject on this, because a dealer really can hold two
 * near-identical Cretas; we flag it and let them decide.
 */
export function attributeFingerprint(v: NormalizedVehicle, dealerId: string): string {
  return [
    "attr",
    dealerId,
    v.make ?? "?",
    v.model ?? "?",
    v.variant ?? "?",
    v.year ?? "?",
    // Odometer within a 2,000 km band, so small differences still collide.
    v.km != null ? Math.round(v.km / 2000) : "?",
    v.price != null ? Math.round(v.price / 50_000) : "?",
  ]
    .join("|")
    .toUpperCase();
}

/* ---------------------------------------------------------------- the run */

export function processBatch(
  rows: RawVehicle[],
  options: {
    fileName: string;
    format: string;
    dealerId: string;
    verification: VerificationTier;
    parserWarnings?: string[];
    /** Fingerprints already in this dealer's inventory. */
    existing?: Set<string>;
  },
): UploadReport {
  const seen = new Set<string>();
  const seenAttributes = new Map<string, number>();
  const existing = options.existing ?? new Set<string>();
  const processed: ProcessedRow[] = [];

  rows.forEach((raw, i) => {
    const vehicle = normalizeVehicle(raw);
    const { errors, warnings } = validateVehicle(vehicle);

    const images = validateImages(vehicle.images);
    vehicle.images = images.valid;
    if (images.valid.length === 0 && !warnings.includes("NO_IMAGES")) warnings.push("NO_IMAGES");

    const fingerprint = batchFingerprint(vehicle, options.dealerId);
    if (seen.has(fingerprint)) errors.push("DUPLICATE_IN_BATCH");
    else if (existing.has(fingerprint)) errors.push("DUPLICATE_EXISTING");
    seen.add(fingerprint);

    // Distinct stock IDs describing the same vehicle: warn, never reject.
    const attrKey = attributeFingerprint(vehicle, options.dealerId);
    const firstRow = seenAttributes.get(attrKey);
    if (firstRow != null && !errors.includes("DUPLICATE_IN_BATCH")) {
      warnings.push("POSSIBLE_DUPLICATE");
      vehicle.inferences.push(`looks like the same vehicle as row ${firstRow}`);
    } else if (firstRow == null) {
      seenAttributes.set(attrKey, i + 2);
    }

    const blocking = errors.filter((e) => BLOCKING.includes(e));

    processed.push({
      rowNumber: i + 2, // +2: one-based, and row 1 is the header.
      vehicle,
      errors: blocking,
      warnings: [...warnings, ...errors.filter((e) => !BLOCKING.includes(e))],
      accepted: blocking.length === 0,
      quality: scoreQuality(vehicle, {
        verification: options.verification,
        imageCount: vehicle.images.length,
        hoursSinceUpdate: 0,
      }),
      fingerprint,
    });
  });

  const counts = new Map<RejectionCode, number>();
  for (const row of processed) {
    for (const code of [...row.errors, ...row.warnings]) counts.set(code, (counts.get(code) ?? 0) + 1);
  }

  const duplicate = processed.filter(
    (r) => r.errors.includes("DUPLICATE_IN_BATCH") || r.errors.includes("DUPLICATE_EXISTING"),
  ).length;
  const accepted = processed.filter((r) => r.accepted).length;

  return {
    fileName: options.fileName,
    format: options.format,
    receivedAt: new Date().toISOString(),
    totals: {
      uploaded: processed.length,
      accepted,
      duplicate,
      rejected: processed.length - accepted,
      warnings: processed.filter((r) => r.accepted && r.warnings.length > 0).length,
    },
    breakdown: [...counts.entries()]
      .map(([code, count]) => ({
        code,
        label: REJECTION_LABEL[code],
        count,
        blocking: BLOCKING.includes(code),
      }))
      .sort((a, b) => Number(b.blocking) - Number(a.blocking) || b.count - a.count),
    rows: processed,
    parserWarnings: options.parserWarnings ?? [],
  };
}

/* ---------------------------------------------------------------- template */

export const UPLOAD_TEMPLATE_HEADERS = [
  "Stock ID",
  "Make",
  "Model",
  "Variant",
  "Year",
  "Registration Year",
  "Fuel",
  "Transmission",
  "KM",
  "Owners",
  "Colour",
  "Price",
  "City",
  "Body Type",
  "Images",
  "Status",
  "Description",
];

export const UPLOAD_TEMPLATE_EXAMPLE = [
  "RP-1042",
  "Hyundai",
  "Creta",
  "SX(O) 1.5 Turbo DCT",
  "2023",
  "2023",
  "Petrol",
  "Automatic",
  "21400",
  "1",
  "Titan Grey",
  "1725000",
  "Gurugram",
  "SUV",
  "https://yourdealership.in/photos/1042-front.jpg|https://yourdealership.in/photos/1042-rear.jpg",
  "AVAILABLE",
  "Company maintained, service records available",
];

/** The fields a dealer must supply, and the ones that simply help. */
export const FIELD_REQUIREMENTS = [
  { field: "Make", required: true },
  { field: "Model", required: true },
  { field: "Variant", required: true },
  { field: "Year", required: true },
  { field: "Fuel", required: true },
  { field: "Transmission", required: true },
  { field: "KM", required: true },
  { field: "Price", required: true },
  { field: "Location", required: true },
  { field: "Images", required: true },
  { field: "Registration year", required: false },
  { field: "Owners", required: false },
  { field: "Colour", required: false },
  { field: "VIN", required: false },
  { field: "Description", required: false },
] as const;

export type { InventoryType };
