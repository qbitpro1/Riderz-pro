import type { Source } from "./types";

/**
 * Source registry.
 *
 * Each entry records what we are actually permitted to do, and why. The
 * `evidence` block is not decoration: `compliance.ts` reads `status` and
 * `rules` before any connector is allowed to fetch anything, so getting this
 * table wrong is the only way a listing can be imported without permission.
 *
 * The robots.txt rules quoted below were read on the date shown. Re-run
 * `npm run inventory:check-robots` to refresh them.
 */

const NO_RIGHTS = {
  canImport: false,
  canDisplayImages: false,
  canReproduceDescriptions: false,
  attributionRequired: true,
  originalUrlRequired: true,
  commercialUse: false,
};

const CHECKED = "2026-08-09T00:00:00.000Z";

export const SOURCES: Source[] = [
  /* ---------------------------------------------------------- level 3 */
  {
    id: "motorbotz-direct",
    name: "Motorbotz Direct Inventory",
    level: 3,
    status: "LIVE",
    rules: {
      canImport: true,
      canDisplayImages: true,
      canReproduceDescriptions: true,
      attributionRequired: false,
      originalUrlRequired: false,
      commercialUse: true,
    },
    licence: "Own inventory",
    rateLimitPerMin: null,
    refreshHours: { high: 24, normal: 72, stale: 168 },
    homepage: "https://motorbotz.in",
    evidence: {
      checkedAt: CHECKED,
      robotsUrl: null,
      blockingRules: [],
      note: "Cars Motorbotz owns, has consigned, or has photographed and inspected itself. No third-party rights involved.",
    },
  },

  /* ---------------------------------------------------------- level 1 */
  {
    id: "dealer-feed",
    name: "Partner Dealer Feed",
    level: 1,
    status: "LIVE",
    rules: {
      canImport: true,
      // Granted per dealer in the feed agreement; the connector still checks
      // the per-vehicle imageRights flag before showing anything.
      canDisplayImages: true,
      canReproduceDescriptions: false,
      attributionRequired: true,
      originalUrlRequired: false,
      commercialUse: true,
    },
    licence: "Motorbotz Dealer Inventory Agreement (per dealer)",
    rateLimitPerMin: 60,
    refreshHours: { high: 4, normal: 12, stale: 48 },
    homepage: "https://motorbotz.in/partners",
    evidence: {
      checkedAt: CHECKED,
      robotsUrl: null,
      blockingRules: [],
      note: "Dealers push CSV/JSON to us under a signed agreement that grants display rights for the vehicles and images they supply. Rights are recorded per vehicle, not assumed.",
    },
  },

  /* ---------------------------------------------------------- blocked */
  {
    id: "cardekho",
    name: "CarDekho",
    level: 2,
    status: "BLOCKED_NO_LICENCE",
    rules: NO_RIGHTS,
    licence: null,
    rateLimitPerMin: null,
    refreshHours: null,
    homepage: "https://www.cardekho.com",
    evidence: {
      checkedAt: CHECKED,
      robotsUrl: "https://www.cardekho.com/robots.txt",
      blockingRules: ["Disallow: /cars-search/*", "Disallow: /images/usedcarimages/", "Disallow: /compare-used-car/*"],
      note: "Used-car search paths are disallowed to all crawlers, and used-car images are disallowed explicitly. No public inventory API or partner feed is published. Import stays off until a written data agreement exists.",
    },
  },
  {
    id: "cars24",
    name: "CARS24",
    level: 2,
    status: "BLOCKED_NO_LICENCE",
    rules: NO_RIGHTS,
    licence: null,
    rateLimitPerMin: null,
    refreshHours: null,
    homepage: "https://www.cars24.com",
    evidence: {
      checkedAt: CHECKED,
      robotsUrl: "https://www.cars24.com/robots.txt",
      blockingRules: [
        "Disallow: /*/feed/",
        "Disallow: /*?filter=",
        "Disallow: /maruti-suzuki  (and every other brand path where inventory lives)",
      ],
      note: "Feed paths, filtered inventory queries and effectively every brand listing path are disallowed. No public API. Import stays off until a written data agreement exists.",
    },
  },
  {
    id: "spinny",
    name: "Spinny",
    level: 2,
    status: "BLOCKED_NO_LICENCE",
    rules: NO_RIGHTS,
    licence: null,
    rateLimitPerMin: null,
    refreshHours: null,
    homepage: "https://www.spinny.com",
    evidence: {
      checkedAt: CHECKED,
      robotsUrl: "https://www.spinny.com/robots.txt",
      blockingRules: [
        "Disallow: /api/",
        "Disallow: /*/p/  (individual listing pages)",
        "Disallow: /*?appliedFilters",
        "Disallow: /custom-listing/*",
      ],
      note: "The API and individual listing pages are both disallowed. Import stays off until a written data agreement exists.",
    },
  },
  {
    id: "carwale",
    name: "CarWale",
    level: 2,
    status: "BLOCKED_NO_LICENCE",
    rules: NO_RIGHTS,
    licence: null,
    rateLimitPerMin: null,
    refreshHours: null,
    homepage: "https://www.carwale.com",
    evidence: {
      checkedAt: CHECKED,
      robotsUrl: "https://www.carwale.com/robots.txt",
      blockingRules: [
        "Disallow: /used/search_result.aspx",
        "Disallow: /used/page-*/",
        "Disallow: /find-car/",
        "Disallow: /search/results/",
      ],
      note: "Used-car search and listing pagination are disallowed. Import stays off until a written data agreement exists.",
    },
  },
  {
    id: "olx-autos",
    name: "OLX Autos",
    level: 2,
    status: "BLOCKED_NO_LICENCE",
    rules: NO_RIGHTS,
    licence: null,
    rateLimitPerMin: null,
    refreshHours: null,
    homepage: "https://www.olx.in",
    evidence: {
      checkedAt: CHECKED,
      robotsUrl: "https://www.olx.in/robots.txt",
      blockingRules: ["Disallow: /api/", "Disallow: */items/  (individual item pages)"],
      note: "Item pages and the API are disallowed. Listings are also largely private-seller, which brings personal data obligations on top of the licensing question.",
    },
  },
  {
    id: "oem-certified",
    name: "Manufacturer Certified Pre-Owned",
    level: 1,
    status: "BLOCKED_NO_LICENCE",
    rules: NO_RIGHTS,
    licence: null,
    rateLimitPerMin: null,
    refreshHours: null,
    homepage: "https://motorbotz.in/partners",
    evidence: {
      checkedAt: CHECKED,
      robotsUrl: null,
      blockingRules: [],
      note: "Programmes such as Maruti True Value, Mahindra First Choice and BMW Premium Selection distribute inventory through franchise dealers. Onboard each dealer through the dealer-feed connector once an agreement is signed — there is nothing to scrape here.",
    },
  },
];

export const SOURCE_BY_ID = new Map(SOURCES.map((s) => [s.id, s]));

export function getSource(id: string): Source | undefined {
  return SOURCE_BY_ID.get(id);
}

export const LIVE_SOURCES = SOURCES.filter((s) => s.status === "LIVE");
export const BLOCKED_SOURCES = SOURCES.filter((s) => s.status === "BLOCKED_NO_LICENCE");
