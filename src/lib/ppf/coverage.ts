import type { FilmTier } from "./films";

/**
 * PPF COVERAGE & PRICING ENGINE
 *
 * A PPF quote is film area × film rate × how hard the car is to wrap, adjusted
 * for what the paint needs first. Everything here produces a *range*, and every
 * surface says so: the real number comes off the car, not off a form.
 */

export type AreaGroup = "front" | "side" | "rear" | "high-impact";

export type CoverageArea = {
  id: string;
  label: string;
  group: AreaGroup;
  /** Approximate film area in square feet for a mid-size SUV. Scaled per class. */
  baseSqFt: number;
  /** Some panels are simply harder to wrap without a visible edge. */
  difficulty: 1 | 1.2 | 1.5;
  note?: string;
};

export const COVERAGE_AREAS: CoverageArea[] = [
  // Front
  { id: "front-bumper", label: "Front bumper", group: "front", baseSqFt: 14, difficulty: 1.5, note: "Takes the most impact of any panel on the car." },
  { id: "bonnet-full", label: "Bonnet — full", group: "front", baseSqFt: 18, difficulty: 1.2 },
  { id: "bonnet-partial", label: "Bonnet — partial", group: "front", baseSqFt: 8, difficulty: 1, note: "Leaves a film line across the bonnet. Cheaper, and you will see it." },
  { id: "fenders-front", label: "Front fenders", group: "front", baseSqFt: 10, difficulty: 1.2 },
  { id: "orvm", label: "Mirrors (ORVM)", group: "front", baseSqFt: 2, difficulty: 1.5 },
  { id: "headlights", label: "Headlights", group: "front", baseSqFt: 3, difficulty: 1.2, note: "Also slows the hazing that makes older cars look tired." },
  { id: "fog-lamps", label: "Fog lamps", group: "front", baseSqFt: 1, difficulty: 1.2 },
  { id: "a-pillars", label: "A-pillars", group: "front", baseSqFt: 4, difficulty: 1.2 },

  // Side
  { id: "doors", label: "Doors", group: "side", baseSqFt: 32, difficulty: 1 },
  { id: "door-edges", label: "Door edges", group: "side", baseSqFt: 2, difficulty: 1.2, note: "Where car parks do their damage." },
  { id: "door-cups", label: "Door handle cups", group: "side", baseSqFt: 1, difficulty: 1.2, note: "Fingernail scratches, on every car, always." },
  { id: "side-skirts", label: "Side skirts / rocker panels", group: "side", baseSqFt: 8, difficulty: 1.2, note: "First thing gravel finds." },
  { id: "b-pillars", label: "B-pillars", group: "side", baseSqFt: 3, difficulty: 1.2 },
  { id: "rear-fenders", label: "Rear fenders / quarter panels", group: "side", baseSqFt: 12, difficulty: 1.2 },

  // Rear
  { id: "rear-bumper", label: "Rear bumper", group: "rear", baseSqFt: 13, difficulty: 1.5 },
  { id: "tailgate", label: "Tailgate / boot lid", group: "rear", baseSqFt: 12, difficulty: 1.2 },
  { id: "boot-loading", label: "Boot loading edge", group: "rear", baseSqFt: 2, difficulty: 1.2, note: "Where luggage scrapes the paint every trip." },
  { id: "roof", label: "Roof", group: "rear", baseSqFt: 20, difficulty: 1 },

  // High impact
  { id: "fuel-lid", label: "Fuel lid", group: "high-impact", baseSqFt: 1, difficulty: 1 },
  { id: "piano-black", label: "Piano-black trims", group: "high-impact", baseSqFt: 3, difficulty: 1.2, note: "Scratches if you look at it. Worth protecting on any modern car." },
];

export function areasIn(group: AreaGroup): CoverageArea[] {
  return COVERAGE_AREAS.filter((a) => a.group === group);
}

export const AREA_GROUP_LABEL: Record<AreaGroup, string> = {
  front: "Front",
  side: "Side",
  rear: "Rear",
  "high-impact": "High-impact areas",
};

/* --------------------------------------------------------- vehicle classes */

export type SizeClass = "hatchback" | "sedan" | "compact-suv" | "mid-suv" | "full-suv" | "luxury" | "exotic";

export type VehicleClass = {
  id: SizeClass;
  label: string;
  /** Multiplies the base area figures. */
  areaFactor: number;
  /** Complex bodywork, deep recesses and tight radii all cost labour. */
  complexityFactor: number;
  examples: string[];
  totalBodySqFt: number;
};

export const VEHICLE_CLASSES: VehicleClass[] = [
  { id: "hatchback", label: "Hatchback", areaFactor: 0.75, complexityFactor: 1, examples: ["Swift", "i20", "Baleno", "Polo"], totalBodySqFt: 135 },
  { id: "sedan", label: "Sedan", areaFactor: 0.9, complexityFactor: 1, examples: ["City", "Verna", "Virtus", "Slavia"], totalBodySqFt: 160 },
  { id: "compact-suv", label: "Compact SUV", areaFactor: 0.9, complexityFactor: 1.05, examples: ["Brezza", "Nexon", "Venue", "Punch"], totalBodySqFt: 155 },
  { id: "mid-suv", label: "Mid-size SUV", areaFactor: 1, complexityFactor: 1.1, examples: ["Creta", "Seltos", "Thar", "Harrier"], totalBodySqFt: 180 },
  { id: "full-suv", label: "Full-size SUV", areaFactor: 1.2, complexityFactor: 1.15, examples: ["Fortuner", "Scorpio N", "XUV700", "Gurkha"], totalBodySqFt: 215 },
  { id: "luxury", label: "Luxury", areaFactor: 1.15, complexityFactor: 1.35, examples: ["3 Series", "GLC", "Q7", "XC60", "Defender"], totalBodySqFt: 200 },
  { id: "exotic", label: "Exotic / supercar", areaFactor: 1.1, complexityFactor: 1.8, examples: ["911", "Huracán", "F-Type", "AMG GT"], totalBodySqFt: 185 },
];

export function getVehicleClass(id: SizeClass): VehicleClass {
  return VEHICLE_CLASSES.find((c) => c.id === id) ?? VEHICLE_CLASSES[3];
}

/** Maps our vehicle catalogue's body type onto a PPF size class. */
export function classForBody(body: string, segment: string): SizeClass {
  if (segment === "luxury") return "luxury";
  switch (body) {
    case "Hatchback":
      return "hatchback";
    case "Sedan":
      return "sedan";
    case "SUV":
      return "mid-suv";
    case "Off-Roader":
    case "Pickup":
      return "full-suv";
    case "MUV":
    case "MPV":
      return "full-suv";
    case "Coupe":
      return "exotic";
    default:
      return "mid-suv";
  }
}

/* ------------------------------------------------------------- film rates */

/**
 * Motorbotz installed rates per square foot, as a range. These are our own
 * prices, not a manufacturer's — supplier rates are not published, and we do
 * not pretend otherwise. Labour, consumables and the pattern licence are in
 * the figure.
 */
export const TIER_RATES: Record<FilmTier, { min: number; max: number; label: string; blurb: string }> = {
  essential: {
    min: 210,
    max: 300,
    label: "Essential",
    blurb: "Entry film. Real protection on the panels that get hit, at a price that makes sense on a mid-range car.",
  },
  premium: {
    min: 340,
    max: 470,
    label: "Premium",
    blurb: "The films most owners choose. Longer published warranties and better optical clarity.",
  },
  signature: {
    min: 520,
    max: 780,
    label: "Signature",
    blurb: "Top of each manufacturer's range. Extended warranty cover, and the finish options that change how the car looks.",
  },
};

export type PaintCondition = "excellent" | "good" | "needs-correction" | "unknown";

export const PAINT_CONDITIONS: { id: PaintCondition; label: string; blurb: string; addOn: number }[] = [
  { id: "excellent", label: "Excellent", blurb: "New or recently corrected. Nothing to do first.", addOn: 0 },
  { id: "good", label: "Good", blurb: "Light swirls. A single-stage polish before film.", addOn: 6_000 },
  { id: "needs-correction", label: "Needs correction", blurb: "Visible swirls or marks. Two-stage correction before film — film locks in whatever is underneath.", addOn: 16_000 },
  { id: "unknown", label: "Not sure", blurb: "We will read the paint on arrival and tell you before we start.", addOn: 8_000 },
];

/* ---------------------------------------------------------------- packages */

export type PpfPackage = {
  id: string;
  name: string;
  headline: string;
  blurb: string;
  areaIds: string[];
  /** Full body is computed from the class's total area, not the area list. */
  fullBody?: boolean;
  cta: string;
  audience: "entry" | "mid" | "premium" | "luxury";
};

export const PPF_PACKAGES: PpfPackage[] = [
  {
    id: "essential",
    name: "ESSENTIAL PROTECTION",
    headline: "The bits that always get damaged.",
    blurb:
      "Door cups, door edges, the boot loading edge, mirrors and headlights. Under a day in the workshop, and it removes most of the damage a car picks up in normal use.",
    areaIds: ["door-cups", "door-edges", "boot-loading", "orvm", "headlights"],
    cta: "Protect the essentials",
    audience: "entry",
  },
  {
    id: "partial-front",
    name: "PARTIAL FRONT",
    headline: "Where the stones hit.",
    blurb:
      "Front bumper, partial bonnet, partial fenders and mirrors. The cheapest way to cover the panels that take stone chips — with a visible film line across the bonnet, which we will show you before we cut.",
    areaIds: ["front-bumper", "bonnet-partial", "fenders-front", "orvm"],
    cta: "Partial front",
    audience: "entry",
  },
  {
    id: "full-front",
    name: "FULL FRONT",
    headline: "No film line on the bonnet.",
    blurb:
      "Full bonnet, full front fenders, front bumper, mirrors and headlights. The package most owners land on: everything the road throws at you, with no visible edge across the middle of the car.",
    areaIds: ["front-bumper", "bonnet-full", "fenders-front", "orvm", "headlights", "a-pillars"],
    cta: "Full front package",
    audience: "mid",
  },
  {
    id: "full-body",
    name: "FULL BODY",
    headline: "Every painted panel.",
    blurb:
      "The complete exterior. Wrapped edges wherever the panel allows, so there is no film line visible with the doors shut.",
    areaIds: [],
    fullBody: true,
    cta: "Get a full body quote",
    audience: "premium",
  },
  {
    id: "trail",
    name: "TRAIL PACK",
    headline: "Built for the unpaved.",
    blurb:
      "Front end, doors, rocker panels and rear quarters — the panels gravel and branches actually reach on a trail. Not a claim that your Thar is now damage-proof; it is not.",
    areaIds: ["front-bumper", "bonnet-full", "fenders-front", "doors", "side-skirts", "rear-fenders", "orvm", "headlights", "door-edges"],
    cta: "Protect the trail rig",
    audience: "mid",
  },
  {
    id: "signature",
    name: "SIGNATURE",
    headline: "Full body, top-tier film, every detail.",
    blurb:
      "Full body in a Signature-tier film, plus piano-black trims, headlights, door cups and the boot edge. For cars where the paint is a meaningful part of what you paid for.",
    areaIds: ["piano-black", "headlights", "door-cups", "boot-loading", "fuel-lid"],
    fullBody: true,
    cta: "Signature package",
    audience: "luxury",
  },
];

export function getPackage(id: string): PpfPackage | undefined {
  return PPF_PACKAGES.find((p) => p.id === id);
}

/* ----------------------------------------------------------------- pricing */

export type QuoteInput = {
  sizeClass: SizeClass;
  tier: FilmTier;
  areaIds: string[];
  fullBody?: boolean;
  paintCondition: PaintCondition;
};

export type Quote = {
  sqFt: number;
  coveragePct: number;
  filmLow: number;
  filmHigh: number;
  prepCost: number;
  low: number;
  high: number;
  breakdown: { label: string; value: string }[];
};

/**
 * Produces an indicative range. Deliberately not a single number: paint
 * condition, trim removal and how the previous owner treated the car all move
 * the real figure, and quoting to the rupee online would be a lie.
 */
export function quote(input: QuoteInput): Quote {
  const vehicle = getVehicleClass(input.sizeClass);
  const rate = TIER_RATES[input.tier];
  const condition = PAINT_CONDITIONS.find((c) => c.id === input.paintCondition) ?? PAINT_CONDITIONS[3];

  const selected = COVERAGE_AREAS.filter((a) => input.areaIds.includes(a.id));

  let sqFt: number;
  let weighted: number;

  if (input.fullBody) {
    sqFt = vehicle.totalBodySqFt;
    // Whole-car jobs average out: some panels are easy, bumpers are not.
    weighted = sqFt * 1.2;
    // Extras selected on top of full body (trims, lamps) still add area.
    const extras = selected.filter((a) => a.group === "high-impact");
    sqFt += extras.reduce((n, a) => n + a.baseSqFt * vehicle.areaFactor, 0);
    weighted += extras.reduce((n, a) => n + a.baseSqFt * vehicle.areaFactor * a.difficulty, 0);
  } else {
    sqFt = selected.reduce((n, a) => n + a.baseSqFt * vehicle.areaFactor, 0);
    weighted = selected.reduce((n, a) => n + a.baseSqFt * vehicle.areaFactor * a.difficulty, 0);
  }

  const filmLow = weighted * rate.min * vehicle.complexityFactor;
  const filmHigh = weighted * rate.max * vehicle.complexityFactor;
  const prepCost = condition.addOn;

  const round = (n: number) => Math.round(n / 500) * 500;

  return {
    sqFt: Math.round(sqFt),
    coveragePct: Math.min(100, Math.round((sqFt / vehicle.totalBodySqFt) * 100)),
    filmLow: round(filmLow),
    filmHigh: round(filmHigh),
    prepCost,
    low: round(filmLow + prepCost),
    high: round(filmHigh + prepCost),
    breakdown: [
      { label: "Vehicle class", value: vehicle.label },
      { label: "Film area", value: `≈ ${Math.round(sqFt)} sq ft` },
      { label: "Film tier", value: rate.label },
      { label: "Rate", value: `₹${rate.min}–${rate.max} / sq ft installed` },
      { label: "Complexity", value: `×${vehicle.complexityFactor.toFixed(2)}` },
      { label: "Paint preparation", value: prepCost ? `₹${prepCost.toLocaleString("en-IN")}` : "None required" },
    ],
  };
}

/** The lowest published entry point, used for "PPF from ₹X" copy. */
export function fromPrice(sizeClass: SizeClass): number {
  const q = quote({
    sizeClass,
    tier: "essential",
    areaIds: getPackage("essential")!.areaIds,
    paintCondition: "excellent",
  });
  return q.low;
}

export const PRICE_DISCLAIMER =
  "Indicative range only. The final price is confirmed after a physical inspection — paint condition, trim removal and previous film all change the figure.";
