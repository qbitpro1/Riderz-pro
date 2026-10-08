/**
 * BRAND REGISTRY
 *
 * The single place a brand is declared. Each brand keeps whatever standalone
 * store it already has — /recoil and /autoform are untouched — and gains a
 * shop-side identity so the same products can also be reached by brand from
 * /brands, from the shop filters, and from search.
 *
 * Adding a brand is one entry here plus one adapter in `./adapters`. Nothing
 * else in the app needs to know a new brand exists.
 */

import type { MediaKey } from "@/lib/media";
import type { CategorySlug } from "@/lib/data/products";

export type BrandSlug = "motorbotz" | "recoil" | "autoform" | "blaupunkt";

/**
 * How we're allowed to describe our relationship with the brand. These are
 * claims about the business, so each one has to match what the brand's own
 * pages already say — "Import in progress" is the safe default for a brand
 * whose terms haven't been stated anywhere on the site yet.
 */
export type BrandPosition = "House brand" | "Authorised reseller" | "Import in progress";

export type BrandCatalogueState =
  /** Products are live in the unified catalogue. */
  | "live"
  /** Registered and stocked, but the catalogue import has not landed yet. */
  | "importing";

export type Brand = {
  slug: BrandSlug;
  /** Set in the brand's own casing — never re-cased for display. */
  name: string;
  position: BrandPosition;
  tagline: string;
  blurb: string;
  /** The standalone brand store, where one exists. Kept as a first-class destination. */
  storeHref: string | null;
  storeLabel: string | null;
  image: MediaKey;
  /** Shop categories this brand sells into. Used for the brand cards and SEO copy. */
  categories: CategorySlug[];
  state: BrandCatalogueState;
  /** Shown on the brand page as the sourcing statement. Must stay factual. */
  provenance: string;
};

export const BRANDS: Brand[] = [
  {
    slug: "motorbotz",
    name: "Motorbotz",
    position: "House brand",
    tagline: "Built by us, fitted by us.",
    blurb:
      "Our own range — mats, covers, lighting, off-road hardware and performance parts, cut to the model and warranted by the workshop that fits them.",
    storeHref: null,
    storeLabel: null,
    image: "heroWorkshopNight",
    categories: ["interior", "exterior", "lighting", "audio", "off-road", "performance"],
    state: "live",
    provenance: "Specified, stocked and warranted by Motorbotz. Fitted at our own workshops.",
  },
  {
    slug: "recoil",
    name: "RECOIL",
    position: "Authorised reseller",
    tagline: "Amplifiers, DSP, drivers and everything between.",
    blurb:
      "The full RECOIL car-audio and installation range — amplifiers, processors, component and coaxial speakers, subwoofers, damping, wiring and distribution.",
    storeHref: "/recoil",
    storeLabel: "RECOIL catalogue",
    image: "studioMonitors",
    categories: ["audio"],
    state: "live",
    provenance:
      "Imported from the official RECOIL price list and matched model number by model number to the manufacturer's own catalogue.",
  },
  {
    slug: "autoform",
    name: "Autoform",
    // Matches the wording already on /autoform: "Authorised Motorbotz reseller".
    position: "Authorised reseller",
    tagline: "Seat covers cut to your car.",
    blurb:
      "Autoform's Eco, Sports, Signature, Emporio and OE-Riviera seat cover series, plus the carpet, 7D and boot mat range.",
    storeHref: "/autoform",
    storeLabel: "Autoform brand store",
    image: "cockpitScreen",
    categories: ["interior"],
    state: "live",
    provenance:
      "Built from the Autoform dealer price list and product catalogue supplied by the manufacturer. Nothing is inferred between the two.",
  },
  {
    slug: "blaupunkt",
    name: "Blaupunkt",
    // Still a placeholder: the catalogue is now imported, but the reseller
    // relationship has never been stated on the site. Set it once confirmed.
    position: "Import in progress",
    tagline: "German car audio, head units and dash cams.",
    blurb:
      "Head units, amplifiers, speakers, subwoofers, rear-seat entertainment, dash cams and installation accessories.",
    storeHref: null,
    storeLabel: null,
    image: "speakerCone",
    categories: ["audio"],
    state: "live",
    provenance:
      "Imported from the Blaupunkt Brochure 2026 supplied by the distributor. MRP and specifications are reproduced as printed; a model is only listed where the catalogue gives it a photograph of its own.",
  },
];

/**
 * BLAUPUNKT — imported from the supplied brochure, 11 August 2026.
 *
 * Do not attempt to crawl blaupunktcar.in. It sits entirely behind a Cloudflare
 * bot challenge; every path returns 403 to an identifying client, including the
 * sitemap.xml its own robots.txt declares. Getting past that means presenting as
 * a browser, which is circumventing bot detection rather than honouring
 * robots.txt. It is also unnecessary — the brochure is the better source, and
 * `npm run import:blaupunkt` reads it.
 */

export const BRAND_BY_SLUG: Record<BrandSlug, Brand> = Object.fromEntries(
  BRANDS.map((b) => [b.slug, b]),
) as Record<BrandSlug, Brand>;

export function getBrand(slug: string): Brand | undefined {
  return BRANDS.find((b) => b.slug === slug);
}

/** Brands whose products are actually in the catalogue right now. */
export const LIVE_BRANDS = BRANDS.filter((b) => b.state === "live");

/** Brands that have a store page of their own, for the "brand stores" rail. */
export const BRAND_STORES = BRANDS.filter((b) => b.storeHref !== null);
