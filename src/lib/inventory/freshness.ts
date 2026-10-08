import type { Listing, ListingStatus, PricePoint } from "./types";

/** Everything customer-facing is quoted in Indian Standard Time. */
const IST = "Asia/Kolkata";

export function formatIST(iso: string): string {
  const d = new Date(iso);
  const date = d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric", timeZone: IST });
  const time = d.toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit", hour12: true, timeZone: IST });
  return `${date}, ${time} IST`;
}

/** "Listed 6 hours ago" / "Listed 3 days ago". Null when the source gave no timestamp. */
export function relativeAge(iso: string | null, now = Date.now()): string | null {
  if (!iso) return null;
  const ms = now - new Date(iso).getTime();
  if (ms < 0) return null;
  const mins = Math.floor(ms / 60000);
  if (mins < 60) return mins <= 1 ? "just now" : `${mins} minutes ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} hour${hours === 1 ? "" : "s"} ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days} day${days === 1 ? "" : "s"} ago`;
  const weeks = Math.floor(days / 7);
  if (weeks < 5) return `${weeks} week${weeks === 1 ? "" : "s"} ago`;
  const months = Math.floor(days / 30);
  return `${months} month${months === 1 ? "" : "s"} ago`;
}

export type Bucket = "today" | "yesterday" | "this-week" | "older";

export function bucketFor(iso: string, now = Date.now()): Bucket {
  const days = Math.floor((now - new Date(iso).getTime()) / 86_400_000);
  if (days <= 0) return "today";
  if (days === 1) return "yesterday";
  if (days <= 7) return "this-week";
  return "older";
}

export const BUCKET_LABEL: Record<Bucket, string> = {
  today: "Added today",
  yesterday: "Added yesterday",
  "this-week": "Added this week",
  older: "Earlier",
};

/* ------------------------------------------------------- status machine */

/** How long a listing may go unverified before we stop claiming it is current. */
export const STALE_AFTER_HOURS = 72;
/** Consecutive failed verifications before a listing is archived rather than shown. */
export const ARCHIVE_AFTER_FAILURES = 3;

export type VerificationOutcome =
  | { kind: "found"; price: number | null }
  | { kind: "gone" }
  | { kind: "error"; message: string };

/**
 * Advances a listing's status from a refresh result.
 *
 * A listing that vanishes from its source is never deleted on the first miss —
 * sources drop listings temporarily all the time. It moves to
 * SOLD_UNAVAILABLE, and only archives after repeated failures.
 */
export function nextStatus(
  current: Listing,
  outcome: VerificationOutcome,
  consecutiveFailures: number,
): { status: ListingStatus; priceChanged: boolean } {
  if (outcome.kind === "error") {
    return { status: "SOURCE_ERROR", priceChanged: false };
  }

  if (outcome.kind === "gone") {
    return {
      status: consecutiveFailures + 1 >= ARCHIVE_AFTER_FAILURES ? "ARCHIVED" : "SOLD_UNAVAILABLE",
      priceChanged: false,
    };
  }

  const priceChanged = outcome.price != null && current.price != null && outcome.price !== current.price;
  return { status: priceChanged ? "PRICE_UPDATED" : "ACTIVE", priceChanged };
}

/** Marks anything not re-verified inside the window as stale. */
export function applyStaleness(listing: Listing, now = Date.now()): ListingStatus {
  if (listing.status === "ARCHIVED" || listing.status === "SOLD_UNAVAILABLE") return listing.status;
  const hours = (now - new Date(listing.lastVerifiedAt).getTime()) / 3_600_000;
  return hours > STALE_AFTER_HOURS ? "STALE" : listing.status;
}

/** Which listings the refresh runner should look at first. */
export function refreshPriority(listing: Listing, now = Date.now()): "high" | "normal" | "stale" {
  const ageHours = (now - new Date(listing.discoveredAt).getTime()) / 3_600_000;
  if (ageHours < 48) return "high";
  const sinceCheck = (now - new Date(listing.lastVerifiedAt).getTime()) / 3_600_000;
  return sinceCheck > STALE_AFTER_HOURS ? "stale" : "normal";
}

/* ------------------------------------------------------------ pricing */

export type PriceChange = { direction: "drop" | "rise"; previous: number; current: number; delta: number };

/**
 * Reads a genuine price movement out of recorded history. Returns null unless
 * two different observed prices actually exist — a price drop is never
 * synthesised for display.
 */
export function priceChange(history: PricePoint[]): PriceChange | null {
  if (history.length < 2) return null;
  const current = history[history.length - 1];
  let previous: PricePoint | null = null;
  for (let i = history.length - 2; i >= 0; i--) {
    if (history[i].price !== current.price) {
      previous = history[i];
      break;
    }
  }
  if (!previous) return null;
  return {
    direction: current.price < previous.price ? "drop" : "rise",
    previous: previous.price,
    current: current.price,
    delta: Math.abs(previous.price - current.price),
  };
}

/** True when we should tell the customer the price needs re-confirming. */
export function priceNeedsConfirmation(listing: Listing, now = Date.now()): boolean {
  if (listing.status === "STALE" || listing.status === "SOURCE_ERROR") return true;
  const hours = (now - new Date(listing.lastVerifiedAt).getTime()) / 3_600_000;
  return hours > STALE_AFTER_HOURS;
}
