/**
 * BE 6 — the flagship vehicle programme.
 *
 * Three layers, deliberately kept in three files so they cannot bleed into
 * each other:
 *
 *   factory / specs / ladder  — the Mahindra BE 6, as Mahindra sells it.
 *   riderzpro                 — what we fit to it.
 *   limited-edition           — what we have only imagined.
 *
 * Import from here for page code; import the specific module when you need
 * the types.
 */

export * from "./sources";
export * from "./factory";
export * from "./specs";
export * from "./ladder";
export * from "./riderzpro";
export * from "./limited-edition";

export const BE6 = {
  brand: "Mahindra",
  model: "BE 6",
  lineup: "SPORTEQ",
  href: "/be-6",
  limitedEditionHref: "/be-6/limited-edition",
  /** Date the SPORTEQ lineup was introduced. */
  lineupFrom: "15 August 2026",
  deliveriesFrom: "26 August 2026",
  /** Shown wherever factory data appears, so the reader knows how fresh it is. */
  dataVerified: "16 August 2026",
};

export const FACTORY_DATA_NOTICE =
  "Factory specifications, variants, prices and colours are Mahindra's, verified against the sources listed on this page on 16 August 2026. Prices are ex-showroom and exclude the wall charger and its installation. Mahindra may change any of it without telling us — confirm current specification and price with Mahindra or an authorised dealer before you buy.";
