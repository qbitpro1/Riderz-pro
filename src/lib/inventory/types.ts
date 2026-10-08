import type { MediaKey } from "@/lib/media";

/* ------------------------------------------------------------- sources */

export type SourceLevel = 1 | 2 | 3;

/**
 * What a given source actually permits. Every field here has to be backed by
 * something real — a signed agreement, an API licence, or the source's own
 * published robots.txt. Nothing defaults to "allowed".
 */
export type SourceRules = {
  /** May factual vehicle data be imported into our database at all? */
  canImport: boolean;
  /** May we display images obtained from this source? */
  canDisplayImages: boolean;
  /** May the source's own description text be reproduced? Almost never true. */
  canReproduceDescriptions: boolean;
  /** Must we credit the source on any listing derived from it? */
  attributionRequired: boolean;
  /** Must we link back to the original listing? */
  originalUrlRequired: boolean;
  /** Is commercial use permitted under the licence we hold? */
  commercialUse: boolean;
};

export type SourceStatus =
  | "LIVE"
  /** Architecture present, but no licence — the connector refuses to run. */
  | "BLOCKED_NO_LICENCE"
  /** Licence exists but the operator has paused it. */
  | "PAUSED";

export type Source = {
  id: string;
  name: string;
  level: SourceLevel;
  status: SourceStatus;
  rules: SourceRules;
  /** Licence or agreement reference, once one exists. */
  licence: string | null;
  /** Requests per minute we are permitted to make. */
  rateLimitPerMin: number | null;
  /** How often active listings from this source should be re-verified. */
  refreshHours: { high: number; normal: number; stale: number } | null;
  homepage: string;
  /**
   * Why this source is in its current state. For blocked marketplaces this
   * records the exact robots.txt rules that stop us, with the date checked.
   */
  evidence: {
    checkedAt: string;
    robotsUrl: string | null;
    blockingRules: string[];
    note: string;
  };
};

/* ------------------------------------------------------------ listings */

export type ListingStatus =
  | "ACTIVE"
  | "PRICE_UPDATED"
  | "SOLD_UNAVAILABLE"
  | "STALE"
  | "SOURCE_ERROR"
  | "ARCHIVED";

/**
 * Whether Riderzpro has physically seen the car. This is deliberately separate
 * from ListingStatus: a listing can be perfectly ACTIVE and still be a third
 * party's car that we have never touched.
 */
export type VerificationLevel =
  /** Third-party or partner listing. Riderzpro has not inspected it. */
  | "SOURCE_LISTING"
  /** A customer has requested an inspection; not yet completed. */
  | "INSPECTION_REQUESTED"
  /** Riderzpro has physically inspected and signed off. */
  | "RIDERZPRO_VERIFIED";

export type DataConfidence = "HIGH" | "MEDIUM" | "LOW";

export type Fuel = "Petrol" | "Diesel" | "CNG" | "Electric" | "Hybrid";
export type Transmission = "Manual" | "Automatic" | "AMT" | "CVT" | "DCT" | "AT";
export type Drivetrain = "2WD" | "AWD" | "4WD";
export type BodyType = "Hatchback" | "Sedan" | "SUV" | "MUV" | "MPV" | "Coupe" | "Convertible" | "Pickup" | "Off-Roader";

/** An image we are actually allowed to show, or an honest gap. */
export type ListingImage = {
  /** Local/licensed remote URL. */
  url?: string;
  /** Riderzpro's own photography from the media library. */
  media?: MediaKey;
  alt: string;
  slot:
    | "front-3q"
    | "rear-3q"
    | "side"
    | "interior"
    | "dashboard"
    | "seats"
    | "wheels"
    | "engine-bay"
    | "boot"
    | "detail";
  /** Where the right to display it comes from. */
  licence: "riderzpro-own" | "dealer-permission" | "licensed-feed";
  credit: string | null;
};

/** Facts about condition. Anything unknown stays unknown. */
export type ConditionField = {
  /** What the source stated, in its own factual terms. */
  sourceReported: string | null;
  /** What Riderzpro confirmed on inspection. */
  riderzproVerified: string | null;
};

export type ConditionReport = {
  exterior: ConditionField;
  interior: ConditionField;
  tyres: ConditionField;
  mechanical: ConditionField;
  accidentHistory: ConditionField;
  insurance: ConditionField;
  serviceHistory: ConditionField;
  rc: ConditionField;
  pollutionCertificate: ConditionField;
  numberOfKeys: ConditionField;
};

export const INSPECTION_POINTS = [
  "Exterior",
  "Interior",
  "Engine",
  "Transmission",
  "Suspension",
  "Brakes",
  "Tyres",
  "Electrical",
  "AC",
  "Accident damage",
  "Odometer",
  "Documents",
] as const;

export type InspectionPoint = (typeof INSPECTION_POINTS)[number];

export type Inspection = {
  inspectedAt: string;
  inspector: string;
  /** Only points actually checked appear here. */
  results: { point: InspectionPoint; pass: boolean; note: string | null }[];
};

export type PricePoint = {
  /** ISO timestamp, UTC. */
  at: string;
  price: number;
};

export type SourceRef = {
  sourceId: string;
  /** The source's own identifier for the listing, where one is available. */
  externalId: string | null;
  url: string | null;
  /** Whether we may show the URL to a customer. */
  urlDisplayable: boolean;
  firstSeenAt: string;
  lastVerifiedAt: string;
  lastPrice: number | null;
};

export type Listing = {
  id: string;
  slug: string;

  /* vehicle -------------------------------------------------------- */
  make: string;
  model: string;
  variant: string | null;
  generation: string | null;
  year: number;
  registrationYear: number | null;
  manufacturingYear: number | null;
  fuel: Fuel | null;
  transmission: Transmission | null;
  engine: string | null;
  engineCc: number | null;
  power: string | null;
  km: number | null;
  owners: number | null;
  bodyType: BodyType | null;
  colour: string | null;
  seats: number | null;
  drivetrain: Drivetrain | null;

  /* commercial ------------------------------------------------------ */
  price: number | null;
  priceHistory: PricePoint[];
  financeAvailable: boolean;
  /** Only ever an estimate unless the source supplies an official quote. */
  officialFinanceQuote: boolean;

  /* location -------------------------------------------------------- */
  city: string;
  locality: string | null;
  state: string;
  pincode: string | null;

  /* seller ---------------------------------------------------------- */
  sellerType: "dealer" | "private" | "riderzpro";
  dealerName: string | null;
  dealerLocation: string | null;
  /** Never populated for private sellers. */
  dealerContact: string | null;

  /* provenance ------------------------------------------------------ */
  sources: SourceRef[];
  primarySourceId: string;
  status: ListingStatus;
  verification: VerificationLevel;
  confidence: DataConfidence;
  /** Sample data carried over from the design build; never counted as live. */
  demo: boolean;

  /* content --------------------------------------------------------- */
  /** Written by us from the facts. Never the source's copy. */
  description: string;
  highlights: string[];
  modifications: { name: string; value: string }[] | null;
  images: ListingImage[];
  imagesUnavailableReason: string | null;

  condition: ConditionReport;
  inspection: Inspection | null;

  /* housekeeping ---------------------------------------------------- */
  discoveredAt: string;
  lastVerifiedAt: string;
  listedAt: string | null;
  archivedAt: string | null;
};

export type ImportLogEntry = {
  listingId: string;
  sourceId: string;
  sourceUrl: string | null;
  importedAt: string;
  lastCheckedAt: string;
  lastPrice: number | null;
  currentPrice: number | null;
  status: ListingStatus;
  imagePermission: "granted" | "not-granted" | "own-photography";
  confidence: DataConfidence;
  duplicateOf: string | null;
  notes: string[];
};

export type InventorySnapshot = {
  generatedAt: string;
  sources: { id: string; status: SourceStatus; imported: number; skipped: number; reason: string | null }[];
  totals: {
    listings: number;
    live: number;
    demo: number;
    newToday: number;
    priceDrops: number;
    soldOrRemoved: number;
    stale: number;
    sourceErrors: number;
    duplicatesMerged: number;
    riderzproVerified: number;
  };
  listings: Listing[];
  importLog: ImportLogEntry[];
};

/** Every condition field starts unknown. Callers fill in only what they know. */
export function emptyCondition(): ConditionReport {
  const blank = (): ConditionField => ({ sourceReported: null, riderzproVerified: null });
  return {
    exterior: blank(),
    interior: blank(),
    tyres: blank(),
    mechanical: blank(),
    accidentHistory: blank(),
    insurance: blank(),
    serviceHistory: blank(),
    rc: blank(),
    pollutionCertificate: blank(),
    numberOfKeys: blank(),
  };
}
