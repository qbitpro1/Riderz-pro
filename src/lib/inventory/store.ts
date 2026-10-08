import { pullAll } from "./connectors";
import { deduplicate } from "./dedupe";
import { applyStaleness, bucketFor, priceChange } from "./freshness";
import { SOURCES, getSource } from "./sources";
import { verifiedBadgeAllowed } from "./compliance";
import type { ImportLogEntry, InventorySnapshot, Listing } from "./types";

/**
 * The inventory store.
 *
 * Assembles every permitted source into one deduplicated set, applies the
 * freshness rules, and produces the snapshot the storefront and the admin
 * dashboard both read. Built once per server start; swap `buildSnapshot` for a
 * database query when the admin backend lands and nothing above this layer
 * changes.
 */

function buildSnapshot(): InventorySnapshot {
  const now = Date.now();
  const pulls = pullAll();

  const raw = pulls.flatMap((p) => p.listings);
  const { merged, review } = deduplicate(raw);

  const listings = merged.map((l) => {
    const status = applyStaleness(l, now);
    // A listing can only claim the verified badge if an inspection backs it.
    const verification = verifiedBadgeAllowed(l) ? l.verification : l.verification === "MOTORBOTZ_VERIFIED" ? "SOURCE_LISTING" : l.verification;
    return { ...l, status, verification };
  });

  const importLog: ImportLogEntry[] = listings.map((l) => {
    const primary = l.sources.find((s) => s.sourceId === l.primarySourceId) ?? l.sources[0];
    const source = getSource(l.primarySourceId);
    return {
      listingId: l.id,
      sourceId: l.primarySourceId,
      sourceUrl: primary?.url ?? null,
      importedAt: l.discoveredAt,
      lastCheckedAt: l.lastVerifiedAt,
      lastPrice: priceChange(l.priceHistory)?.previous ?? null,
      currentPrice: l.price,
      status: l.status,
      imagePermission:
        l.images.length === 0
          ? "not-granted"
          : l.images.every((i) => i.licence === "motorbotz-own")
            ? "own-photography"
            : "granted",
      confidence: l.confidence,
      duplicateOf: null,
      notes: [
        l.demo ? "Sample record from the design build — not live inventory." : null,
        l.sources.length > 1 ? `Merged from ${l.sources.length} sources.` : null,
        source && source.level === 2 ? "Level 2 source — data reuse is licence-gated." : null,
      ].filter((n): n is string => Boolean(n)),
    };
  });

  const live = listings.filter((l) => !l.demo);
  const priceDrops = listings.filter((l) => priceChange(l.priceHistory)?.direction === "drop").length;

  return {
    generatedAt: new Date(now).toISOString(),
    sources: SOURCES.map((s) => {
      const pull = pulls.find((p) => p.sourceId === s.id);
      return {
        id: s.id,
        status: s.status,
        imported: pull?.listings.length ?? 0,
        skipped: pull?.skipped ? 1 : 0,
        reason: pull?.reason ?? null,
      };
    }),
    totals: {
      listings: listings.length,
      live: live.length,
      demo: listings.length - live.length,
      newToday: listings.filter((l) => bucketFor(l.discoveredAt, now) === "today").length,
      priceDrops,
      soldOrRemoved: listings.filter((l) => l.status === "SOLD_UNAVAILABLE" || l.status === "ARCHIVED").length,
      stale: listings.filter((l) => l.status === "STALE").length,
      sourceErrors: listings.filter((l) => l.status === "SOURCE_ERROR").length,
      duplicatesMerged: raw.length - merged.length,
      motorbotzVerified: listings.filter((l) => l.verification === "MOTORBOTZ_VERIFIED").length,
    },
    listings,
    importLog,
  };
}

export const SNAPSHOT: InventorySnapshot = buildSnapshot();

/** Everything, including archived records — the dashboard wants the full set. */
export const ALL_LISTINGS = SNAPSHOT.listings;

/** What a customer may browse: nothing archived, nothing sold. */
export const BROWSABLE = ALL_LISTINGS.filter((l) => l.status !== "ARCHIVED" && l.status !== "SOLD_UNAVAILABLE");

export function getListing(slug: string): Listing | undefined {
  return ALL_LISTINGS.find((l) => l.slug === slug);
}

/** Newest verified listing first — the ordering the Latest Cars page uses. */
export function latestFirst(listings: Listing[] = BROWSABLE): Listing[] {
  return [...listings].sort((a, b) => new Date(b.discoveredAt).getTime() - new Date(a.discoveredAt).getTime());
}

export function justLanded(limit = 12): Listing[] {
  return latestFirst().slice(0, limit);
}

export function relatedListings(listing: Listing, limit = 3): Listing[] {
  return BROWSABLE.filter((l) => l.id !== listing.id)
    .map((l) => {
      let score = 0;
      if (l.bodyType === listing.bodyType) score += 3;
      if (l.make === listing.make) score += 2;
      if (listing.price != null && l.price != null && Math.abs(l.price - listing.price) < 5_00_000) score += 2;
      if (l.city === listing.city) score += 1;
      return { l, score };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((x) => x.l);
}

/* --------------------------------------------------------------- facets */

const uniq = <T>(v: T[]) => [...new Set(v)].filter(Boolean) as NonNullable<T>[];

export const FACETS = {
  makes: uniq(BROWSABLE.map((l) => l.make)).sort(),
  bodyTypes: uniq(BROWSABLE.map((l) => l.bodyType)).sort(),
  fuels: uniq(BROWSABLE.map((l) => l.fuel)).sort(),
  transmissions: uniq(BROWSABLE.map((l) => l.transmission)).sort(),
  cities: uniq(BROWSABLE.map((l) => l.city)).sort(),
  drivetrains: uniq(BROWSABLE.map((l) => l.drivetrain)).sort(),
  years: uniq(BROWSABLE.map((l) => l.year)).sort((a, b) => b - a),
};

export const PRICE_BANDS = [
  { label: "Under ₹3L", min: 0, max: 3_00_000 },
  { label: "₹3–5L", min: 3_00_000, max: 5_00_000 },
  { label: "₹5–8L", min: 5_00_000, max: 8_00_000 },
  { label: "₹8–12L", min: 8_00_000, max: 12_00_000 },
  { label: "₹12–20L", min: 12_00_000, max: 20_00_000 },
  { label: "₹20–30L", min: 20_00_000, max: 30_00_000 },
  { label: "₹30L+", min: 30_00_000, max: Number.MAX_SAFE_INTEGER },
];

export const KM_BANDS = [
  { label: "Under 20,000", max: 20_000 },
  { label: "Under 40,000", max: 40_000 },
  { label: "Under 60,000", max: 60_000 },
  { label: "Under 1 lakh", max: 1_00_000 },
];

/**
 * Motorbotz's own angles on the inventory. These are derived from recorded
 * facts — drivetrain, listed modifications, marque — never guessed.
 */
export const SPECIAL_FILTERS = {
  "off-road": {
    label: "Off-road",
    tags: ["4x4", "AWD", "Lifted", "Modified", "Off-road tyres", "Roof rack"],
    match: (l: Listing) =>
      l.drivetrain === "4WD" ||
      l.drivetrain === "AWD" ||
      hasMod(l, /lift|all[- ]terrain|mud[- ]terrain|snorkel|winch|roof rack|skid|slider|recovery/i),
  },
  enthusiast: {
    label: "Enthusiast",
    tags: ["Performance", "Modified", "Premium audio", "Body kit", "Custom interior", "PPF", "Wrap"],
    match: (l: Listing) =>
      (l.modifications?.length ?? 0) > 0 ||
      hasMod(l, /remap|exhaust|intake|coilover|audio|dsp|body kit|ppf|wrap/i),
  },
  luxury: {
    label: "Luxury",
    tags: ["BMW", "Mercedes-Benz", "Audi", "Volvo", "Jaguar", "Land Rover", "Lexus", "Porsche"],
    match: (l: Listing) =>
      ["BMW", "Mercedes-Benz", "Audi", "Volvo", "Jaguar", "Land Rover", "Lexus", "Porsche", "MINI"].includes(l.make),
  },
} as const;

export type SpecialFilterKey = keyof typeof SPECIAL_FILTERS;

function hasMod(l: Listing, re: RegExp): boolean {
  return (l.modifications ?? []).some((m) => re.test(`${m.name} ${m.value}`));
}
