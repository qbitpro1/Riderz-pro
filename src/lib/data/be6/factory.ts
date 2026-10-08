/**
 * MAHINDRA BE 6 — FACTORY DATA
 *
 * Everything in this file describes the vehicle Mahindra sells. Nothing
 * Riderzpro makes, fits or imagines belongs here; that lives in ./riderzpro
 * and the two are never merged into one list.
 *
 * Current lineup is the BE 6 SPORTEQ, introduced 15 August 2026, deliveries
 * from 26 August 2026. Figures carry the id of the source they came from.
 *
 * Rule for this file: if Mahindra has not published it, it is not written
 * here. A null, or the unconfirmed marker, is a correct answer.
 */

export type BatteryId = "59" | "70" | "79";

export type Battery = {
  id: BatteryId;
  kwh: number;
  label: string;
  /** MIDC Part 1 + Part 2 certified range, in km. */
  certifiedRangeKm: number;
  rangeCycle: string;
  powerKw: number;
  powerPs: number;
  torqueNm: number;
  /** Peak DC rate the pack accepts. */
  dcPeakKw: number;
  dcNote: string;
  /** AC charge times, where Mahindra has published them. */
  ac72Hours: number | null;
  ac11Hours: number | null;
  sourceId: string;
};

export const BATTERIES: Battery[] = [
  {
    id: "59",
    kwh: 59,
    label: "59 kWh",
    certifiedRangeKm: 548,
    rangeCycle: "MIDC Part 1 + Part 2",
    powerKw: 170,
    powerPs: 231,
    torqueNm: 380,
    dcPeakKw: 140,
    dcNote: "20–80% in 20 minutes on a 140 kW DC charger",
    ac72Hours: 8.7,
    ac11Hours: 6,
    sourceId: "mahindra-brochure",
  },
  {
    id: "70",
    kwh: 70,
    label: "70 kWh",
    certifiedRangeKm: 651,
    rangeCycle: "MIDC Part 1 + Part 2",
    powerKw: 180,
    powerPs: 245,
    torqueNm: 380,
    dcPeakKw: 160,
    dcNote: "20–80% in 20 minutes on a 160 kW DC charger",
    ac72Hours: 10.2,
    ac11Hours: 7,
    sourceId: "mahindra-brochure",
  },
  {
    id: "79",
    kwh: 79,
    label: "79 kWh",
    certifiedRangeKm: 683,
    rangeCycle: "MIDC Part 1 + Part 2",
    powerKw: 210,
    powerPs: 286,
    torqueNm: 380,
    dcPeakKw: 180,
    dcNote: "20–80% in 20 minutes on a 180 kW DC charger",
    ac72Hours: 11.7,
    ac11Hours: 8,
    sourceId: "mahindra-brochure",
  },
];

export function battery(id: BatteryId): Battery {
  const found = BATTERIES.find((b) => b.id === id);
  if (!found) throw new Error(`Unknown BE 6 battery pack: ${id}`);
  return found;
}

/**
 * The ladder the comparison interface walks. Special editions sit outside it,
 * because an edition is not a rung — it is a different specification of the
 * top of the range.
 */
export type Rung = "one" | "two" | "three" | "threePlus" | "four";
export const RUNGS: Rung[] = ["one", "two", "three", "threePlus", "four"];

export type VariantPrice = {
  batteryId: BatteryId;
  /** Ex-showroom, pan-India, in rupees. Excludes wall charger and installation. */
  exShowroom: number;
  /**
   * Battery-as-a-Service price: the vehicle without the pack, which is then
   * rented per kilometre. Only on the variants Mahindra lists.
   */
  baas?: number;
};

export type Variant = {
  slug: string;
  /** Mahindra's casing, not ours. */
  name: string;
  rung: Rung | null;
  /** Where it sits in the four-step story the shopper is walked through. */
  ladderLabel: string;
  blurb: string;
  prices: VariantPrice[];
  /** Wheel fitted at the factory, exactly as the brochure states it. */
  wheel: string;
  /** Screens fitted at the factory. The one spec everybody asks about. */
  screens: string;
  /** Editions are flagged so they never masquerade as a trim step. */
  edition?: boolean;
  /** Paint restricted to this variant, if any. */
  exclusiveColourSlug?: string;
  sourceId: string;
};

export const VARIANTS: Variant[] = [
  {
    slug: "one",
    name: "ONE",
    rung: "one",
    ladderLabel: "BASE",
    blurb:
      "The way into the BE 6. Full 59 kWh powertrain, 548 km certified, nothing taken out of the drivetrain to hit the price.",
    prices: [{ batteryId: "59", exShowroom: 19_45_000, baas: 11_45_000 }],
    wheel: "R18 Aero covers",
    screens: "Dual Super HD Screens (31.24 cm x 2)",
    sourceId: "mahindra-pr-sporteq",
  },
  {
    slug: "two",
    name: "TWO",
    rung: "two",
    ladderLabel: "MID",
    blurb: "The volume specification. Same powertrain as ONE, materially more cabin technology.",
    prices: [{ batteryId: "59", exShowroom: 20_95_000, baas: 12_95_000 }],
    wheel: "R19 Stylised Wheels with Aero covers",
    screens: "Coast-to-Coast Triple HD Screens (31.24 cm x 3)",
    sourceId: "mahindra-pr-sporteq",
  },
  {
    slug: "three",
    name: "THREE",
    rung: "three",
    ladderLabel: "HIGH",
    blurb: "First rung with a choice of pack — stay at 59 kWh, or step up to the new 70 kWh and 651 km.",
    prices: [
      { batteryId: "59", exShowroom: 21_95_000 },
      { batteryId: "70", exShowroom: 22_95_000 },
    ],
    wheel: "R19 Alloys",
    screens: "Coast-to-Coast Triple HD Screens (31.24 cm x 3)",
    sourceId: "mahindra-pr-sporteq",
  },
  {
    slug: "three-plus",
    name: "THREE+",
    rung: "threePlus",
    ladderLabel: "HIGH+",
    blurb: "The 70 kWh pack as the entry point, with the 79 kWh and its 683 km available on top.",
    prices: [
      { batteryId: "70", exShowroom: 23_95_000 },
      { batteryId: "79", exShowroom: 24_95_000 },
    ],
    wheel: "R19 Alloys",
    screens: "Coast-to-Coast Triple HD Screens (31.24 cm x 3)",
    sourceId: "mahindra-pr-sporteq",
  },
  {
    slug: "four",
    name: "FOUR",
    rung: "four",
    ladderLabel: "TOP",
    blurb: "The full BE 6: 79 kWh, 210 kW, 683 km certified, and the complete TEQ suite.",
    prices: [{ batteryId: "79", exShowroom: 26_95_000 }],
    wheel: "R19 Alloys",
    screens: "Coast-to-Coast Triple HD Screens (31.24 cm x 3)",
    sourceId: "mahindra-pr-sporteq",
  },
  {
    slug: "launch-edition",
    name: "LAUNCH EDITION",
    rung: null,
    ladderLabel: "EDITION",
    blurb: "Top-specification SPORTEQ in the edition-only Graphite Storm paint.",
    prices: [{ batteryId: "79", exShowroom: 26_95_000 }],
    edition: true,
    exclusiveColourSlug: "graphite-storm",
    wheel: "R19 Alloys (R20 optional)",
    screens: "Coast-to-Coast Triple HD Screens (31.24 cm x 3)",
    sourceId: "mahindra-pr-sporteq",
  },
  {
    slug: "fe",
    name: "FE",
    rung: null,
    ladderLabel: "FORMULA E",
    blurb: "Formula E Edition on the 79 kWh pack, in the edition-only Rosso Impulso satin red.",
    prices: [{ batteryId: "79", exShowroom: 24_45_000 }],
    edition: true,
    exclusiveColourSlug: "rosso-impulso",
    wheel: "R20 Alloys",
    screens: "Dual Super HD Screens (31.24 cm x 2)",
    sourceId: "mahindra-pr-sporteq",
  },
  {
    slug: "fe-four",
    name: "FE FOUR",
    rung: null,
    ladderLabel: "FORMULA E TOP",
    blurb:
      "Formula E Freedom Edition. Mahindra quotes 0–100 km/h in 6.44 seconds with Acceleration Boost engaged.",
    prices: [{ batteryId: "79", exShowroom: 26_95_000 }],
    edition: true,
    wheel: "R20 Alloys",
    screens: "Dual Super HD Screens (31.24 cm x 2)",
    sourceId: "mahindra-pr-sporteq",
  },
];

export const LADDER = VARIANTS.filter((v) => v.rung !== null);
export const EDITIONS = VARIANTS.filter((v) => v.edition);

export function variant(slug: string): Variant | undefined {
  return VARIANTS.find((v) => v.slug === slug);
}

export const PRICE_FROM = Math.min(...VARIANTS.flatMap((v) => v.prices.map((p) => p.exShowroom)));
export const PRICE_TO = Math.max(...VARIANTS.flatMap((v) => v.prices.map((p) => p.exShowroom)));
export const BAAS_FROM = Math.min(
  ...VARIANTS.flatMap((v) => v.prices.flatMap((p) => (p.baas ? [p.baas] : []))),
);

/**
 * Battery-as-a-Service. Mahindra sells the car without the pack and rents the
 * pack per kilometre, so the headline price and the running cost move in
 * opposite directions. Both halves are always shown together — the ₹11.45
 * lakh figure on its own is not what the car costs to run.
 */
export const BAAS = {
  perKm: 3.75,
  basisKmPerDay: 60,
  offeredOn: ["one", "two"],
  batteryId: "59" as BatteryId,
  note:
    "Mahindra quotes the battery subscription at ₹3.75 per km on a 60 km-a-day basis. The subscription is additional to the ex-showroom price and continues for as long as you keep the vehicle.",
  sourceId: "mahindra-pr-sporteq",
};

/** Monthly battery subscription implied by the published rate. */
export function baasMonthly(kmPerDay = BAAS.basisKmPerDay): number {
  return Math.round((kmPerDay * BAAS.perKm * 365) / 12);
}

/**
 * PAINT
 *
 * Rebuilt from the official brochure colour page and the configurator, which
 * carry Mahindra's own colour codes and hex values. The list we first built
 * from media reporting was wrong: there is no Desert Myst Satin, and a satin
 * black was missing. The satin finishes belong to the Formula E Freedom
 * Edition; Graphite Storm is Launch Edition only.
 *
 * `image` is Mahindra's own product render, self-hosted. `hex` is Mahindra's
 * own swatch value, used for the selector chip — not a paint match.
 */
export type Colour = {
  slug: string;
  name: string;
  finish: "Gloss" | "Satin";
  /** Mahindra's swatch hex, from the official configurator. */
  hex: string;
  /** Mahindra's internal colour code. */
  code: string;
  /** Self-hosted official Mahindra render. */
  image: string;
  /** Restricted to a named edition, where applicable. */
  exclusiveTo?: string;
  sourceId: string;
};

const render = (slug: string) => `/be6/colours/${slug}.png`;

export const COLOURS: Colour[] = [
  { slug: "stealth-black", name: "Stealth Black", finish: "Gloss", hex: "#060505", code: "C1STELBLK", image: render("stealth-black"), sourceId: "mahindra-configurator" },
  { slug: "everest-white", name: "Everest White", finish: "Gloss", hex: "#cfcdcd", code: "C1EVRTWHT", image: render("everest-white"), sourceId: "mahindra-configurator" },
  { slug: "firestorm-orange", name: "Firestorm Orange", finish: "Gloss", hex: "#F2745E", code: "C1FRORNG", image: render("firestorm-orange"), sourceId: "mahindra-configurator" },
  { slug: "tango-red", name: "Tango Red", finish: "Gloss", hex: "#970211", code: "C1TANGRED", image: render("tango-red"), sourceId: "mahindra-configurator" },
  { slug: "deep-forest", name: "Deep Forest", finish: "Gloss", hex: "#282d22", code: "C1DEEPFRST", image: render("deep-forest"), sourceId: "mahindra-configurator" },
  { slug: "desert-myst", name: "Desert Myst", finish: "Gloss", hex: "#C0BEB7", code: "C1DSRTMST", image: render("desert-myst"), sourceId: "mahindra-configurator" },
  { slug: "ruby-velvet", name: "Ruby Velvet", finish: "Gloss", hex: "#2d0406", code: "C1RVELVET", image: render("ruby-velvet"), sourceId: "mahindra-configurator" },
  {
    slug: "graphite-storm",
    name: "Graphite Storm",
    finish: "Gloss",
    hex: "#4e535d",
    code: "C1GLXYGRY",
    image: render("graphite-storm"),
    exclusiveTo: "SPORTEQ Launch Edition",
    sourceId: "mahindra-configurator",
  },
  {
    slug: "rosso-impulso",
    name: "Rosso Impulso",
    finish: "Satin",
    hex: "#970211",
    code: "C1ROSMPLSO",
    image: render("rosso-impulso"),
    exclusiveTo: "Formula E Freedom Edition",
    sourceId: "mahindra-configurator",
  },
  {
    slug: "everest-white-satin",
    name: "Everest White Satin",
    finish: "Satin",
    hex: "#cfcdcd",
    code: "C1EVRTWHTM",
    image: render("everest-white-satin"),
    exclusiveTo: "Formula E Freedom Edition",
    sourceId: "mahindra-configurator",
  },
  {
    slug: "firestorm-orange-satin",
    name: "Firestorm Orange Satin",
    finish: "Satin",
    hex: "#F2745E",
    code: "C1LURCRLM",
    image: render("firestorm-orange-satin"),
    exclusiveTo: "Formula E Freedom Edition",
    sourceId: "mahindra-configurator",
  },
  {
    slug: "stealth-black-satin",
    name: "Stealth Black Satin",
    finish: "Satin",
    hex: "#060505",
    code: "C1STLBLKM",
    image: render("stealth-black-satin"),
    exclusiveTo: "Formula E Freedom Edition",
    sourceId: "mahindra-configurator",
  },
];

export function colour(slug: string): Colour {
  const found = COLOURS.find((c) => c.slug === slug);
  if (!found) throw new Error(`Unknown BE 6 colour: ${slug}`);
  return found;
}

/**
 * Paint available on a given variant. The brochure splits the palette three
 * ways: seven gloss finishes across the SPORTEQ range, four satins reserved
 * for the Formula E Freedom Edition, and Graphite Storm for the Launch
 * Edition alone.
 */
export function coloursFor(variantSlug: string): Colour[] {
  const v = variant(variantSlug);
  if (!v) return COLOURS.filter((c) => !c.exclusiveTo);
  if (v.slug === "launch-edition") return COLOURS.filter((c) => c.slug === "graphite-storm");
  if (v.slug === "fe" || v.slug === "fe-four") return COLOURS.filter((c) => c.exclusiveTo?.startsWith("Formula E"));
  return COLOURS.filter((c) => !c.exclusiveTo);
}

export const COLOUR_NOTE =
  "Renders and swatch values are Mahindra's own. Mahindra states that vehicle images in its material are creative visualisations, and that on-screen colour may differ from the actual paint — check the car at a dealership before choosing.";
