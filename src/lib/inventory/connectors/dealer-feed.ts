import feed from "../../../../data/inventory/dealer-feed.json";
import { buildDescription, scoreConfidence, slugFor } from "../normalize";
import { emptyCondition, type Listing } from "../types";
import type { Connector } from "./index";

/**
 * Partner dealer feed — Level 1, the preferred way to get real inventory.
 *
 * A dealer signs the Motorbotz Dealer Inventory Agreement and pushes a JSON
 * feed matching the shape below. The agreement is what grants display rights,
 * and rights are recorded per vehicle: a car whose `imageRights` is not
 * `granted` shows no photographs at all rather than borrowing someone else's.
 *
 * The shipped feed is empty. No dealer agreement is in place yet, and the one
 * thing this system must never do is invent inventory to look busy.
 */

export type DealerFeedVehicle = {
  dealerId: string;
  dealerName: string;
  dealerCity: string;
  dealerState: string;
  dealerContact?: string | null;
  /** The dealer's own stock number. Used for duplicate detection and updates. */
  stockId: string;
  make: string;
  model: string;
  variant?: string | null;
  year: number;
  registrationYear?: number | null;
  fuel?: Listing["fuel"];
  transmission?: Listing["transmission"];
  bodyType?: Listing["bodyType"];
  drivetrain?: Listing["drivetrain"];
  engine?: string | null;
  engineCc?: number | null;
  power?: string | null;
  km?: number | null;
  owners?: number | null;
  colour?: string | null;
  seats?: number | null;
  price: number;
  locality?: string | null;
  pincode?: string | null;
  listedAt?: string | null;
  /** Explicit, per-vehicle. Absent or anything else means: show no images. */
  imageRights?: "granted" | "not-granted";
  images?: { url: string; slot: Listing["images"][number]["slot"]; alt?: string }[];
  /** Facts the dealer states. Reproduced as source-reported, never as verified. */
  reported?: Partial<Record<keyof ReturnType<typeof emptyCondition>, string>>;
};

export type DealerFeed = {
  agreementRef: string | null;
  generatedAt: string | null;
  vehicles: DealerFeedVehicle[];
};

const data = feed as DealerFeed;

export const dealerFeed: Connector = {
  sourceId: "dealer-feed",
  pull() {
    if (!data.agreementRef) {
      // No signed agreement on file means no display rights, so nothing is
      // imported even if somebody drops vehicles into the file.
      return [];
    }
    return data.vehicles.map(toListing);
  },
};

export function validateFeedVehicle(v: DealerFeedVehicle): string[] {
  const problems: string[] = [];
  if (!v.stockId) problems.push("stockId is required for updates and duplicate detection");
  if (!v.make || !v.model) problems.push("make and model are required");
  if (!Number.isFinite(v.year)) problems.push("year is required");
  if (!Number.isFinite(v.price)) problems.push("price is required");
  if (v.images?.length && v.imageRights !== "granted") {
    problems.push("images supplied without imageRights: 'granted' — they will not be displayed");
  }
  return problems;
}

function toListing(v: DealerFeedVehicle): Listing {
  const now = new Date().toISOString();
  const id = `df-${v.dealerId}-${v.stockId}`;
  const imagesAllowed = v.imageRights === "granted";

  const listing: Listing = {
    id,
    slug: "",

    make: v.make,
    model: v.model,
    variant: v.variant ?? null,
    generation: null,
    year: v.year,
    registrationYear: v.registrationYear ?? null,
    manufacturingYear: null,
    fuel: v.fuel ?? null,
    transmission: v.transmission ?? null,
    engine: v.engine ?? null,
    engineCc: v.engineCc ?? null,
    power: v.power ?? null,
    km: v.km ?? null,
    owners: v.owners ?? null,
    bodyType: v.bodyType ?? null,
    colour: v.colour ?? null,
    seats: v.seats ?? null,
    drivetrain: v.drivetrain ?? null,

    price: v.price,
    priceHistory: [{ at: now, price: v.price }],
    financeAvailable: true,
    officialFinanceQuote: false,

    city: v.dealerCity,
    locality: v.locality ?? null,
    state: v.dealerState,
    pincode: v.pincode ?? null,

    sellerType: "dealer",
    dealerName: v.dealerName,
    dealerLocation: `${v.dealerCity}, ${v.dealerState}`,
    dealerContact: v.dealerContact ?? null,

    sources: [
      {
        sourceId: "dealer-feed",
        externalId: `${v.dealerId}:${v.stockId}`,
        url: null,
        urlDisplayable: false,
        firstSeenAt: now,
        lastVerifiedAt: now,
        lastPrice: v.price,
      },
    ],
    primarySourceId: "dealer-feed",
    status: "ACTIVE",
    // A partner's car is not our car until we have inspected it.
    verification: "SOURCE_LISTING",
    confidence: "MEDIUM",
    demo: false,

    description: "",
    highlights: [],
    modifications: null,
    images: imagesAllowed
      ? (v.images ?? []).map((img) => ({
          url: img.url,
          alt: img.alt ?? `${v.year} ${v.make} ${v.model}`,
          slot: img.slot,
          licence: "dealer-permission" as const,
          credit: v.dealerName,
        }))
      : [],
    imagesUnavailableReason: imagesAllowed
      ? null
      : "Photos unavailable — contact Motorbotz for vehicle images",

    condition: applyReported(v),
    inspection: null,

    discoveredAt: now,
    lastVerifiedAt: now,
    listedAt: v.listedAt ?? null,
    archivedAt: null,
  };

  listing.slug = slugFor(listing);
  listing.description = buildDescription(listing);
  listing.confidence = scoreConfidence(listing);
  return listing;
}

/** Dealer statements land in `sourceReported`. `motorbotzVerified` stays null. */
function applyReported(v: DealerFeedVehicle) {
  const condition = emptyCondition();
  for (const [key, value] of Object.entries(v.reported ?? {})) {
    const field = condition[key as keyof typeof condition];
    if (field && typeof value === "string") field.sourceReported = value;
  }
  return condition;
}
