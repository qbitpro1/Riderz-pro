/**
 * PPF FILM CATALOGUE
 *
 * Every specification here carries its own source. Where a manufacturer does
 * not publish a figure, the field is `null` and renders as "Not specified by
 * manufacturer" — it is never estimated from a review site or a competitor's
 * data sheet.
 *
 * Warranty periods below were read from XPEL's own warranty page on
 * 9 August 2026. Thickness, gloss and hydrophobic figures are deliberately
 * left unverified until we hold each product's technical data sheet, because
 * those are the numbers customers compare and get quoted on.
 */

export type FilmFinish = "Gloss" | "Matte" | "Satin" | "Coloured";

export type FilmTier = "essential" | "premium" | "signature";

/** A specification we either hold from the manufacturer, or do not. */
export type Spec<T> = {
  value: T | null;
  /** Where the value came from. Null value means no source, by definition. */
  source: string | null;
  verifiedAt: string | null;
};

const unverified = <T>(): Spec<T> => ({ value: null, source: null, verifiedAt: null });
const verified = <T>(value: T, source: string, verifiedAt = "2026-08-09"): Spec<T> => ({ value, source, verifiedAt });

export type PpfBrand = {
  id: string;
  name: string;
  origin: string;
  homepage: string;
  blurb: string;
  /** Whether Motorbotz is an authorised installer for this brand. */
  installerStatus: "AUTHORISED" | "PENDING" | "PROSPECT";
  imageRights: "granted" | "not-granted";
};

export const PPF_BRANDS: PpfBrand[] = [
  {
    id: "xpel",
    name: "XPEL",
    origin: "United States",
    homepage: "https://www.xpel.com",
    blurb:
      "One of the most widely installed paint protection films worldwide, with a published warranty schedule per product and a plotter pattern library covering most vehicles sold in India.",
    installerStatus: "PENDING",
    imageRights: "not-granted",
  },
  {
    id: "garware",
    name: "Garware Hi-Tech Films",
    origin: "India — manufactured in Maharashtra",
    homepage: "https://www.garwarehitechfilms.com",
    blurb:
      "Indian-manufactured TPU film. Domestic production keeps landed cost down, which matters on a full-body job for a mid-range car rather than an exotic.",
    installerStatus: "PROSPECT",
    imageRights: "not-granted",
  },
];

export type PpfFilm = {
  sku: string;
  slug: string;
  brandId: string;
  name: string;
  series: string | null;
  tier: FilmTier;
  finish: FilmFinish;
  /** Micrometres. */
  thicknessMicron: Spec<number>;
  widthMm: Spec<number>;
  lengthM: Spec<number>;
  /** Years. */
  warrantyYears: Spec<number>;
  warrantyCovers: Spec<string[]>;
  warrantyExcludes: Spec<string[]>;
  warrantyTransferable: Spec<boolean>;
  warrantyConditions: Spec<string>;
  selfHealing: Spec<boolean>;
  hydrophobic: Spec<boolean>;
  uvStabilised: Spec<boolean>;
  glossLevel: Spec<string>;
  clarity: Spec<string>;
  manufacturerUrl: string;
  tdsUrl: string | null;
  sdsUrl: string | null;
  /** Only manufacturer images we are licensed to use ever appear here. */
  images: { url: string; source: string; collectedAt: string; authorisation: string }[];
  imagesUnavailableReason: string | null;
  /** Motorbotz price per square foot, before vehicle and labour factors. */
  ratePerSqFt: number | null;
  availability: "IN_STOCK" | "TO_ORDER" | "NOT_STOCKED";
  installationNotes: string[];
};

const XPEL_WARRANTY_SOURCE = "xpel.com/warranty-information";

const STANDARD_COVERS = ["Yellowing", "Cracking", "Blistering", "Delaminating"];

const STANDARD_EXCLUDES = [
  "Non-compliance with care instructions",
  "Improper installation or handling",
  "Damage from misuse",
  "Pre-existing paint defects",
  "Stains and scratches",
  "Improper washing",
  "Water spots",
  "Collision, vandalism, hail or flood damage",
  "Non-automotive use",
  "Rock and debris impact",
];

export const PPF_FILMS: PpfFilm[] = [
  {
    sku: "XPEL-ULTIMATE-PLUS",
    slug: "xpel-ultimate-plus",
    brandId: "xpel",
    name: "ULTIMATE PLUS",
    series: "Ultimate",
    tier: "premium",
    finish: "Gloss",
    thicknessMicron: unverified(),
    widthMm: unverified(),
    lengthM: unverified(),
    warrantyYears: verified(10, XPEL_WARRANTY_SOURCE),
    warrantyCovers: verified(STANDARD_COVERS, XPEL_WARRANTY_SOURCE),
    warrantyExcludes: verified(
      [...STANDARD_EXCLUDES, "Unapproved areas after paint repairs"],
      XPEL_WARRANTY_SOURCE,
    ),
    warrantyTransferable: verified(true, XPEL_WARRANTY_SOURCE),
    warrantyConditions: verified(
      "Transferable with proof of the original installation date.",
      XPEL_WARRANTY_SOURCE,
    ),
    selfHealing: unverified(),
    hydrophobic: unverified(),
    uvStabilised: unverified(),
    glossLevel: unverified(),
    clarity: unverified(),
    manufacturerUrl: "https://www.xpel.com",
    tdsUrl: null,
    sdsUrl: null,
    images: [],
    imagesUnavailableReason:
      "Product images pending — we do not hold image authorisation from XPEL yet, and we will not use a stock photograph of a different film.",
    ratePerSqFt: null,
    availability: "TO_ORDER",
    installationNotes: [
      "Plotter-cut to the vehicle's own pattern where XPEL publishes one.",
      "Edges wrapped where the panel allows it.",
    ],
  },
  {
    sku: "XPEL-STEALTH",
    slug: "xpel-stealth",
    brandId: "xpel",
    name: "STEALTH",
    series: "Ultimate",
    tier: "premium",
    finish: "Satin",
    thicknessMicron: unverified(),
    widthMm: unverified(),
    lengthM: unverified(),
    warrantyYears: verified(10, XPEL_WARRANTY_SOURCE),
    warrantyCovers: verified(STANDARD_COVERS, XPEL_WARRANTY_SOURCE),
    warrantyExcludes: verified(
      [...STANDARD_EXCLUDES, "Unapproved areas after paint repairs"],
      XPEL_WARRANTY_SOURCE,
    ),
    warrantyTransferable: verified(true, XPEL_WARRANTY_SOURCE),
    warrantyConditions: verified("Transferable with proof of the original installation date.", XPEL_WARRANTY_SOURCE),
    selfHealing: unverified(),
    hydrophobic: unverified(),
    uvStabilised: unverified(),
    glossLevel: unverified(),
    clarity: unverified(),
    manufacturerUrl: "https://www.xpel.com",
    tdsUrl: null,
    sdsUrl: null,
    images: [],
    imagesUnavailableReason: "Product images pending image authorisation from XPEL.",
    ratePerSqFt: null,
    availability: "TO_ORDER",
    installationNotes: [
      "Turns a gloss car satin while protecting the paint underneath — the original finish is untouched.",
      "Satin film shows installation errors more than gloss. Panel prep matters more, not less.",
    ],
  },
  {
    sku: "XPEL-ULTIMATE-FUSION",
    slug: "xpel-ultimate-fusion",
    brandId: "xpel",
    name: "ULTIMATE FUSION",
    series: "Ultimate",
    tier: "signature",
    finish: "Gloss",
    thicknessMicron: unverified(),
    widthMm: unverified(),
    lengthM: unverified(),
    warrantyYears: verified(10, XPEL_WARRANTY_SOURCE),
    warrantyCovers: verified(
      [...STANDARD_COVERS, "Oxidation, gloss loss, UV damage and fading for a further 4 years"],
      XPEL_WARRANTY_SOURCE,
    ),
    warrantyExcludes: verified(STANDARD_EXCLUDES, XPEL_WARRANTY_SOURCE),
    warrantyTransferable: verified(true, XPEL_WARRANTY_SOURCE),
    warrantyConditions: verified(
      "Requires annual inspections. Transferable with proof of the original installation date.",
      XPEL_WARRANTY_SOURCE,
    ),
    selfHealing: unverified(),
    hydrophobic: unverified(),
    uvStabilised: unverified(),
    glossLevel: unverified(),
    clarity: unverified(),
    manufacturerUrl: "https://www.xpel.com",
    tdsUrl: null,
    sdsUrl: null,
    images: [],
    imagesUnavailableReason: "Product images pending image authorisation from XPEL.",
    ratePerSqFt: null,
    availability: "TO_ORDER",
    installationNotes: [
      "The only film in this list whose published warranty extends to oxidation, gloss loss and fading — and the only one that requires annual inspections to keep it.",
    ],
  },
  {
    sku: "XPEL-COLOR-PPF",
    slug: "xpel-color-ppf",
    brandId: "xpel",
    name: "COLOR PPF",
    series: "Colour",
    tier: "signature",
    finish: "Coloured",
    thicknessMicron: unverified(),
    widthMm: unverified(),
    lengthM: unverified(),
    warrantyYears: verified(10, XPEL_WARRANTY_SOURCE),
    warrantyCovers: verified(STANDARD_COVERS, XPEL_WARRANTY_SOURCE),
    warrantyExcludes: verified(STANDARD_EXCLUDES, XPEL_WARRANTY_SOURCE),
    warrantyTransferable: unverified(),
    warrantyConditions: unverified(),
    selfHealing: unverified(),
    hydrophobic: unverified(),
    uvStabilised: unverified(),
    glossLevel: unverified(),
    clarity: unverified(),
    manufacturerUrl: "https://www.xpel.com",
    tdsUrl: null,
    sdsUrl: null,
    images: [],
    imagesUnavailableReason: "Product images pending image authorisation from XPEL.",
    ratePerSqFt: null,
    availability: "TO_ORDER",
    installationNotes: [
      "Changes the colour and protects the paint in one layer. Ask us for the current shade range before you commit — availability moves.",
    ],
  },
  {
    sku: "XPEL-EXO-ARMOR",
    slug: "xpel-exo-armor",
    brandId: "xpel",
    name: "EXO ARMOR",
    series: "Armor",
    tier: "premium",
    finish: "Gloss",
    thicknessMicron: unverified(),
    widthMm: unverified(),
    lengthM: unverified(),
    warrantyYears: verified(7, XPEL_WARRANTY_SOURCE),
    warrantyCovers: verified(STANDARD_COVERS, XPEL_WARRANTY_SOURCE),
    warrantyExcludes: verified(STANDARD_EXCLUDES, XPEL_WARRANTY_SOURCE),
    warrantyTransferable: verified(false, XPEL_WARRANTY_SOURCE),
    warrantyConditions: verified("Non-transferable.", XPEL_WARRANTY_SOURCE),
    selfHealing: unverified(),
    hydrophobic: unverified(),
    uvStabilised: unverified(),
    glossLevel: unverified(),
    clarity: unverified(),
    manufacturerUrl: "https://www.xpel.com",
    tdsUrl: null,
    sdsUrl: null,
    images: [],
    imagesUnavailableReason: "Product images pending image authorisation from XPEL.",
    ratePerSqFt: null,
    availability: "TO_ORDER",
    installationNotes: [],
  },
  {
    sku: "XPEL-PROTEX-LITE",
    slug: "xpel-protex-lite",
    brandId: "xpel",
    name: "PROTEX Lite",
    series: "Protex",
    tier: "essential",
    finish: "Gloss",
    thicknessMicron: unverified(),
    widthMm: unverified(),
    lengthM: unverified(),
    warrantyYears: verified(5, XPEL_WARRANTY_SOURCE),
    warrantyCovers: verified(STANDARD_COVERS, XPEL_WARRANTY_SOURCE),
    warrantyExcludes: verified(STANDARD_EXCLUDES, XPEL_WARRANTY_SOURCE),
    warrantyTransferable: verified(false, XPEL_WARRANTY_SOURCE),
    warrantyConditions: verified("Non-transferable.", XPEL_WARRANTY_SOURCE),
    selfHealing: unverified(),
    hydrophobic: unverified(),
    uvStabilised: unverified(),
    glossLevel: unverified(),
    clarity: unverified(),
    manufacturerUrl: "https://www.xpel.com",
    tdsUrl: null,
    sdsUrl: null,
    images: [],
    imagesUnavailableReason: "Product images pending image authorisation from XPEL.",
    ratePerSqFt: null,
    availability: "TO_ORDER",
    installationNotes: [
      "The entry film in the XPEL range. Shorter published warranty than Ultimate Plus, and non-transferable — worth knowing if you sell the car inside five years.",
    ],
  },
  {
    sku: "GARWARE-PREMIUM-PPF",
    slug: "garware-premium-ppf",
    brandId: "garware",
    name: "Premium PPF",
    series: null,
    tier: "essential",
    finish: "Gloss",
    thicknessMicron: unverified(),
    widthMm: unverified(),
    lengthM: unverified(),
    warrantyYears: unverified(),
    warrantyCovers: unverified(),
    warrantyExcludes: unverified(),
    warrantyTransferable: unverified(),
    warrantyConditions: unverified(),
    selfHealing: unverified(),
    hydrophobic: unverified(),
    uvStabilised: unverified(),
    glossLevel: unverified(),
    clarity: unverified(),
    manufacturerUrl: "https://www.garwarehitechfilms.com",
    tdsUrl: null,
    sdsUrl: null,
    images: [],
    imagesUnavailableReason: "Product images pending distributor authorisation.",
    ratePerSqFt: null,
    availability: "NOT_STOCKED",
    installationNotes: [
      "Indian-manufactured TPU. Listed here because domestic production changes the maths on a full-body job for a mid-range car.",
    ],
  },
];

/* ------------------------------------------------------------------ lookups */

export function getFilm(slug: string): PpfFilm | undefined {
  return PPF_FILMS.find((f) => f.slug === slug);
}

export function getBrand(id: string): PpfBrand | undefined {
  return PPF_BRANDS.find((b) => b.id === id);
}

export function filmsByBrand(brandId: string): PpfFilm[] {
  return PPF_FILMS.filter((f) => f.brandId === brandId);
}

export const FINISHES: { finish: FilmFinish; blurb: string; forWho: string }[] = [
  {
    finish: "Gloss",
    blurb: "Optically clear. The car looks exactly as it did, with a protective layer over it.",
    forWho: "Most owners. Maximum paint clarity and shine.",
  },
  {
    finish: "Satin",
    blurb: "Takes a gloss finish down to a soft sheen while protecting the paint underneath.",
    forWho: "A subtle change of character without repainting.",
  },
  {
    finish: "Matte",
    blurb: "A flat, non-reflective finish over your existing paint.",
    forWho: "Stealth look, fully reversible.",
  },
  {
    finish: "Coloured",
    blurb: "Changes the colour and protects the paint in a single layer.",
    forWho: "A colour change you can undo, with protection built in.",
  },
];

/**
 * Publication gate: a film goes on the storefront only when we hold enough
 * verified data to describe it honestly and we can actually supply it.
 */
export function isPublishable(film: PpfFilm): boolean {
  return film.warrantyYears.value != null && film.availability !== "NOT_STOCKED";
}

export function verifiedFieldCount(film: PpfFilm): { verified: number; total: number; missing: string[] } {
  const fields: [string, Spec<unknown>][] = [
    ["Thickness", film.thicknessMicron],
    ["Width", film.widthMm],
    ["Roll length", film.lengthM],
    ["Warranty period", film.warrantyYears],
    ["Warranty cover", film.warrantyCovers],
    ["Warranty exclusions", film.warrantyExcludes],
    ["Transferable", film.warrantyTransferable],
    ["Self-healing", film.selfHealing],
    ["Hydrophobic", film.hydrophobic],
    ["UV stabilised", film.uvStabilised],
    ["Gloss level", film.glossLevel],
    ["Clarity", film.clarity],
  ];
  const missing = fields.filter(([, spec]) => spec.value == null).map(([label]) => label);
  return { verified: fields.length - missing.length, total: fields.length, missing };
}

export const NOT_SPECIFIED = "Not specified by manufacturer";

export function specText(spec: Spec<string | number | boolean | string[]>, suffix = ""): string {
  if (spec.value == null) return NOT_SPECIFIED;
  if (Array.isArray(spec.value)) return spec.value.join(", ");
  if (typeof spec.value === "boolean") return spec.value ? "Yes" : "No";
  return `${spec.value}${suffix}`;
}
