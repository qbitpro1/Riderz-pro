import type { Listing, SourceRef } from "./types";

/**
 * Duplicate detection.
 *
 * The same car routinely appears on several marketplaces at once. Showing it
 * five times makes the marketplace look padded and wastes the buyer's time, so
 * matches are merged into one listing that keeps every source internally.
 *
 * Scoring is deliberately conservative: registration or VIN is decisive on its
 * own, everything else has to agree on several axes before we merge.
 */

export type MatchScore = {
  score: number;
  confidence: "certain" | "high" | "possible" | "none";
  reasons: string[];
};

/** Decisive identifiers, when a source legitimately provides them. */
export type StrongId = { registration?: string | null; vin?: string | null };

const norm = (s: string | null | undefined) => (s ?? "").toString().trim().toUpperCase().replace(/\s+/g, "");

export function fingerprint(l: Listing): string {
  return [
    norm(l.make),
    norm(l.model),
    norm(l.variant),
    l.year,
    l.fuel ?? "?",
    l.transmission ?? "?",
    norm(l.city),
  ].join("|");
}

export function compare(a: Listing, b: Listing, ids?: { a: StrongId; b: StrongId }): MatchScore {
  const reasons: string[] = [];

  // Decisive: a shared registration number or VIN is the same car.
  const regA = norm(ids?.a.registration);
  const regB = norm(ids?.b.registration);
  if (regA && regB) {
    if (regA === regB) return { score: 100, confidence: "certain", reasons: ["registration number matches"] };
    return { score: 0, confidence: "none", reasons: ["registration numbers differ"] };
  }
  const vinA = norm(ids?.a.vin);
  const vinB = norm(ids?.b.vin);
  if (vinA && vinB) {
    if (vinA === vinB) return { score: 100, confidence: "certain", reasons: ["VIN matches"] };
    return { score: 0, confidence: "none", reasons: ["VINs differ"] };
  }

  let score = 0;

  if (norm(a.make) !== norm(b.make) || norm(a.model) !== norm(b.model)) {
    return { score: 0, confidence: "none", reasons: ["different make or model"] };
  }
  score += 25;
  reasons.push("same make and model");

  if (a.year !== b.year) return { score: 0, confidence: "none", reasons: ["different model year"] };
  score += 15;
  reasons.push("same model year");

  if (a.variant && b.variant && norm(a.variant) === norm(b.variant)) {
    score += 15;
    reasons.push("same variant");
  }
  if (a.fuel && b.fuel && a.fuel === b.fuel) score += 5;
  if (a.transmission && b.transmission && a.transmission === b.transmission) score += 5;

  // Odometer readings drift between listings; within 2,000 km is the same car.
  if (a.km != null && b.km != null) {
    const diff = Math.abs(a.km - b.km);
    if (diff <= 2000) {
      score += 20;
      reasons.push(`odometer within ${diff.toLocaleString("en-IN")} km`);
    } else if (diff > 10000) {
      score -= 25;
      reasons.push("odometer readings too far apart");
    }
  }

  if (a.colour && b.colour && norm(a.colour) === norm(b.colour)) {
    score += 10;
    reasons.push("same colour");
  }

  if (norm(a.city) === norm(b.city)) {
    score += 10;
    reasons.push("same city");
  } else {
    score -= 15;
    reasons.push("different city");
  }

  if (a.dealerName && b.dealerName && norm(a.dealerName) === norm(b.dealerName)) {
    score += 15;
    reasons.push("same dealer");
  }

  // A large price gap usually means two different cars, not one mispriced one.
  if (a.price != null && b.price != null) {
    const gap = Math.abs(a.price - b.price) / Math.max(a.price, b.price);
    if (gap <= 0.05) {
      score += 10;
      reasons.push("asking price within 5%");
    } else if (gap > 0.25) {
      score -= 20;
      reasons.push("asking prices far apart");
    }
  }

  const confidence = score >= 85 ? "high" : score >= 65 ? "possible" : "none";
  return { score, confidence, reasons };
}

/** Only "certain" and "high" merge automatically; "possible" goes to review. */
export const AUTO_MERGE_MIN: MatchScore["confidence"][] = ["certain", "high"];

export type MergeResult = {
  merged: Listing[];
  /** Pairs a human should look at rather than merge blind. */
  review: { keep: string; candidate: string; score: MatchScore }[];
};

export function deduplicate(listings: Listing[], ids: Map<string, StrongId> = new Map()): MergeResult {
  const merged: Listing[] = [];
  const review: MergeResult["review"] = [];

  for (const listing of listings) {
    let absorbed = false;

    for (const kept of merged) {
      const score = compare(kept, listing, { a: ids.get(kept.id) ?? {}, b: ids.get(listing.id) ?? {} });

      if (AUTO_MERGE_MIN.includes(score.confidence)) {
        absorb(kept, listing);
        absorbed = true;
        break;
      }
      if (score.confidence === "possible") {
        review.push({ keep: kept.id, candidate: listing.id, score });
      }
    }

    if (!absorbed) merged.push({ ...listing });
  }

  return { merged, review };
}

/**
 * Folds a duplicate into the listing we keep. The richer record wins on each
 * field; sources accumulate; the lowest verified asking price is shown.
 */
function absorb(keep: Listing, dupe: Listing): void {
  const seen = new Set(keep.sources.map((s) => `${s.sourceId}:${s.externalId ?? s.url}`));
  for (const ref of dupe.sources) {
    const key = `${ref.sourceId}:${ref.externalId ?? ref.url}`;
    if (!seen.has(key)) {
      keep.sources.push(ref satisfies SourceRef);
      seen.add(key);
    }
  }

  // Prefer whichever record actually has the field.
  const fill = <K extends keyof Listing>(field: K) => {
    if (keep[field] == null && dupe[field] != null) keep[field] = dupe[field];
  };
  (["variant", "generation", "registrationYear", "manufacturingYear", "engine", "engineCc", "power", "km", "owners", "colour", "seats", "drivetrain", "locality", "pincode", "dealerName", "dealerLocation"] as (keyof Listing)[]).forEach(fill);

  if (dupe.price != null && (keep.price == null || dupe.price < keep.price)) {
    keep.price = dupe.price;
  }

  // Keep the earliest discovery and the most recent verification.
  if (new Date(dupe.discoveredAt) < new Date(keep.discoveredAt)) keep.discoveredAt = dupe.discoveredAt;
  if (new Date(dupe.lastVerifiedAt) > new Date(keep.lastVerifiedAt)) keep.lastVerifiedAt = dupe.lastVerifiedAt;

  // Only our own inspection can carry the verified badge across a merge.
  if (dupe.verification === "MOTORBOTZ_VERIFIED" && dupe.inspection) {
    keep.verification = "MOTORBOTZ_VERIFIED";
    keep.inspection = dupe.inspection;
  }

  keep.images = keep.images.length >= dupe.images.length ? keep.images : dupe.images;
  keep.priceHistory = mergeHistory(keep.priceHistory, dupe.priceHistory);
}

function mergeHistory(a: Listing["priceHistory"], b: Listing["priceHistory"]) {
  const seen = new Set<string>();
  return [...a, ...b]
    .filter((p) => (seen.has(`${p.at}:${p.price}`) ? false : (seen.add(`${p.at}:${p.price}`), true)))
    .sort((x, y) => new Date(x.at).getTime() - new Date(y.at).getTime());
}
