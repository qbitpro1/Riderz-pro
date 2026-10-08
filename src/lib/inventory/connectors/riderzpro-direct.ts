import { CARS, type Car } from "@/lib/data/cars";
import inspectionFile from "../../../../data/inventory/inspections.json";
import { buildDescription, scoreConfidence, slugFor } from "../normalize";
import { emptyCondition, type Inspection, type Listing, type Transmission } from "../types";
import type { Connector } from "./index";

/** Completed workshop inspections, keyed by slug. The only source of the badge. */
const INSPECTIONS = (inspectionFile as { inspections: Record<string, Inspection> }).inspections;

/**
 * Riderzpro's own inventory — cars we hold, photograph and inspect ourselves.
 * Level 3 in the source hierarchy and the only source that can ever carry the
 * RIDERZPRO VERIFIED badge.
 *
 * The records currently here are the sample cars written during the design
 * build. They are flagged `demo: true` so the dashboard never counts them as
 * live inventory and no page can pass them off as real stock. Replace them
 * with genuine entries — or point this connector at the admin database — and
 * the flag goes away.
 */

const DEMO = true;

export const riderzproDirect: Connector = {
  sourceId: "riderzpro-direct",
  pull: () => CARS.map(toListing),
};

function toListing(car: Car): Listing {
  const now = new Date().toISOString();
  const id = `mb-${car.slug}`;
  // A car is verified because an engineer inspected it and filed a report —
  // never because a data file has a boolean called `verified` set to true.
  const inspection = INSPECTIONS[car.slug] ?? null;

  const listing: Listing = {
    id,
    slug: car.slug,

    make: car.brand,
    model: car.model,
    variant: car.variant,
    generation: null,
    year: car.year,
    registrationYear: car.year,
    manufacturingYear: null,
    fuel: car.fuel,
    transmission: normaliseTransmission(car.transmission, car.variant),
    engine: car.engine,
    engineCc: null,
    power: car.power,
    km: car.km,
    owners: ownersFrom(car.owner),
    bodyType: car.body as Listing["bodyType"],
    colour: null,
    seats: null,
    drivetrain: car.drivetrain,

    price: car.price,
    priceHistory: [{ at: now, price: car.price }],
    financeAvailable: car.financing,
    officialFinanceQuote: false,

    city: car.city,
    locality: null,
    state: car.state,
    pincode: null,

    sellerType: "riderzpro",
    dealerName: "Riderzpro",
    dealerLocation: `${car.city}, ${car.state}`,
    dealerContact: null,

    sources: [
      {
        sourceId: "riderzpro-direct",
        externalId: car.slug,
        url: null,
        urlDisplayable: false,
        firstSeenAt: now,
        lastVerifiedAt: now,
        lastPrice: car.price,
      },
    ],
    primarySourceId: "riderzpro-direct",
    status: "ACTIVE",
    verification: inspection ? "RIDERZPRO_VERIFIED" : "SOURCE_LISTING",
    confidence: "HIGH",
    demo: DEMO,

    description: "",
    highlights: car.highlights,
    modifications: car.modifications ?? null,
    images: car.images.map((media, i) => ({
      media,
      alt: `${car.year} ${car.brand} ${car.model} ${car.variant}`,
      slot: (["front-3q", "rear-3q", "interior", "side"] as const)[i] ?? "detail",
      licence: "riderzpro-own" as const,
      credit: null,
    })),
    imagesUnavailableReason: null,

    // Paperwork details are what the record states, not what we have checked.
    // They only move to `riderzproVerified` when an inspection confirms them.
    condition: {
      ...emptyCondition(),
      insurance: { sourceReported: car.insurance, riderzproVerified: null },
      serviceHistory: { sourceReported: car.serviceHistory, riderzproVerified: null },
      rc: { sourceReported: car.registration, riderzproVerified: null },
    },
    inspection,

    discoveredAt: now,
    lastVerifiedAt: now,
    listedAt: now,
    archivedAt: null,
  };

  listing.description = buildDescription(listing);
  listing.confidence = scoreConfidence(listing);
  listing.slug = car.slug || slugFor(listing);
  return listing;
}

function ownersFrom(owner: string): number | null {
  const m = owner.match(/(\d+)/);
  return m ? Number(m[1]) : null;
}

/** The price list says "Automatic"; the variant name usually says which kind. */
function normaliseTransmission(t: Car["transmission"], variant: string): Transmission {
  if (t === "Manual") return "Manual";
  const v = variant.toUpperCase();
  if (v.includes("DCT") || v.includes("DSG")) return "DCT";
  if (v.includes("CVT")) return "CVT";
  if (v.includes("AMT")) return "AMT";
  if (/\bAT\b/.test(v)) return "AT";
  return "Automatic";
}
