/**
 * COLLECTIONS
 *
 * Curated views over the catalogue. Definitions only — no catalogue import, so
 * this file is safe for client code. Every collection is a pure predicate over
 * a `CatalogItem` field the data really carries; counts are computed from the
 * catalogue where they are shown, never written down here.
 */

import type { MediaKey } from "@/lib/media";
import type { CatalogItem } from "@/lib/catalog/types";
import type { SortKey } from "@/lib/catalog/filters";

export type Collection = {
  slug: string;
  name: string;
  tagline: string;
  blurb: string;
  image: MediaKey;
  match: (item: CatalogItem) => boolean;
  /** Default sort for the collection page. */
  sort: SortKey;
};

/** Minimum real gap between MRP and price for "Biggest savings". */
export const MIN_SAVING = 0.1;

export const hasRealSaving = (i: CatalogItem): boolean =>
  i.price !== null && i.mrp !== null && i.mrp > i.price && (i.mrp - i.price) / i.mrp >= MIN_SAVING;

const under = (n: number) => (i: CatalogItem) => i.price !== null && i.price <= n;

export const COLLECTIONS: Collection[] = [
  {
    slug: "bestsellers",
    name: "Bestsellers",
    tagline: "What customers pick most",
    blurb: "The products we flag as bestsellers, across every department.",
    image: "trackYellow",
    match: (i) => i.bestseller,
    sort: "popular",
  },
  {
    slug: "under-999",
    name: "Under ₹999",
    tagline: "Everyday pieces at easy prices",
    blurb: "Everything listed at ₹999 or less.",
    image: "washBay",
    match: under(999),
    sort: "price-asc",
  },
  {
    slug: "under-2499",
    name: "Under ₹2,499",
    tagline: "Upgrades without the big spend",
    blurb: "Everything listed at ₹2,499 or less.",
    image: "studioMonitors",
    match: under(2499),
    sort: "price-asc",
  },
  {
    slug: "biggest-savings",
    name: "Biggest savings",
    tagline: "The widest gap between MRP and our price",
    blurb: "Products priced at least 10% below their MRP, biggest saving first.",
    image: "detailingPolish",
    match: hasRealSaving,
    sort: "discount",
  },
  {
    slug: "riderzpro-originals",
    name: "Riderzpro Originals",
    tagline: "Made and sold by us",
    blurb: "Products under the Riderzpro name.",
    image: "garageSpotlit",
    match: (i) => i.brand === "riderzpro",
    sort: "popular",
  },
  {
    slug: "fitted-by-us",
    name: "Fitted by us",
    tagline: "We install it at our garages",
    blurb: "Products with installation available at a Riderzpro garage.",
    image: "mechanicEngine",
    match: (i) => i.installation,
    sort: "popular",
  },
];

export const COLLECTION_BY_SLUG: Record<string, Collection> = Object.fromEntries(
  COLLECTIONS.map((c) => [c.slug, c]),
);
