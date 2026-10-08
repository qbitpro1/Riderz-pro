import file from "../../../data/inventory/dealers.json";
import type { InventoryType, VerificationTier } from "./network";

/**
 * Partner registry — dealers, fleets and auction houses that supply inventory.
 *
 * Registration is what creates the relationship; accepting the inventory
 * agreement is what grants Riderzpro the right to display their vehicles and
 * photographs. Neither is assumed.
 */

export type DealerPackage = "free" | "premium" | "verified" | "partner";

export type Dealer = {
  id: string;
  businessName: string;
  contactName: string;
  phone: string;
  email: string;
  gstin: string | null;
  /** Dealer/trade registration where the state requires one. */
  tradeRegistration: string | null;
  address: string;
  city: string;
  state: string;
  pincode: string | null;
  website: string | null;
  inventoryType: InventoryType;
  package: DealerPackage;
  /** Only LISTED or PARTNER_VERIFIED. Vehicle tiers are set per vehicle. */
  verification: Extract<VerificationTier, "LISTED" | "PARTNER_VERIFIED">;
  /** The display rights come from here. No agreement, no listings. */
  agreementAccepted: boolean;
  agreementRef: string | null;
  agreementAcceptedAt: string | null;
  /** Bearer token for the dealer API. */
  apiKey: string | null;
  /** Published Google Sheet, if they sync that way. */
  sheetUrl: string | null;
  /** Their own inventory feed, if they have one. */
  feedUrl: string | null;
  createdAt: string;
  lastUploadAt: string | null;
  vehicleCount: number;
};

const data = file as unknown as { dealers: Dealer[] };

export const DEALERS: Dealer[] = data.dealers ?? [];

/** Only these may contribute vehicles. */
export const ACTIVE_DEALERS = DEALERS.filter((d) => d.agreementAccepted);

export function getDealer(id: string): Dealer | undefined {
  return DEALERS.find((d) => d.id === id);
}

export function dealerByApiKey(key: string): Dealer | undefined {
  if (!key) return undefined;
  return ACTIVE_DEALERS.find((d) => d.apiKey && d.apiKey === key);
}

/**
 * Display rights check. Mirrors the source-level compliance gate: a dealer who
 * has not accepted the agreement gets nothing published, however much stock
 * they upload.
 */
export function dealerCanPublish(dealer: Dealer | undefined): { allowed: boolean; reason: string | null } {
  if (!dealer) return { allowed: false, reason: "unknown dealer" };
  if (!dealer.agreementAccepted) {
    return { allowed: false, reason: "inventory agreement not accepted — no display rights granted" };
  }
  return { allowed: true, reason: null };
}

/** Freshness thresholds, in days, applied to a dealer's last update. */
export const FRESHNESS_THRESHOLDS = {
  needsVerification: 3,
  stale: 7,
  hide: 14,
} as const;

export type FreshnessState = "FRESH" | "NEEDS_VERIFICATION" | "STALE" | "HIDDEN";

/**
 * A dealer who stops updating is the main way a marketplace ends up showing
 * cars that sold last month. After fourteen days we hide their stock rather
 * than wear the complaint.
 */
export function freshnessState(lastUpdatedAt: string | null, now = Date.now()): FreshnessState {
  if (!lastUpdatedAt) return "HIDDEN";
  const days = (now - new Date(lastUpdatedAt).getTime()) / 86_400_000;
  if (days >= FRESHNESS_THRESHOLDS.hide) return "HIDDEN";
  if (days >= FRESHNESS_THRESHOLDS.stale) return "STALE";
  if (days >= FRESHNESS_THRESHOLDS.needsVerification) return "NEEDS_VERIFICATION";
  return "FRESH";
}

export const FRESHNESS_LABEL: Record<FreshnessState, string> = {
  FRESH: "Up to date",
  NEEDS_VERIFICATION: "Needs verification",
  STALE: "Stale",
  HIDDEN: "Temporarily hidden",
};
