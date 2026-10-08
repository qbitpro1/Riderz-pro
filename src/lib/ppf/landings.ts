import { LOCATIONS } from "@/lib/data/site";
import { ALL_MODELS } from "@/lib/data/vehicles";
import { classForBody, getPackage, quote, type SizeClass } from "./coverage";

/**
 * PPF landing pages.
 *
 * Two kinds: a city page for people searching locally, and a vehicle page for
 * people searching for their own car. Both are generated from real data — the
 * prices come from the same pricing engine the quote calculator uses, so a
 * landing page can never quote a number the calculator disagrees with.
 */

export type PpfLanding = {
  slug: string;
  kind: "city" | "vehicle";
  title: string;
  h1: string;
  description: string;
  intro: string;
  /** Present on vehicle pages. */
  sizeClass: SizeClass;
  vehicle: { brand: string; model: string; body: string } | null;
  city: { name: string; state: string; address: string | null } | null;
  points: string[];
};

/** Cities we can honestly claim to serve: our own studios, plus Delhi NCR. */
const CITY_TARGETS = [
  { name: "Delhi", state: "Delhi", nearby: "Delhi NCR" },
  { name: "Gurugram", state: "Haryana", nearby: "Delhi NCR" },
  { name: "Noida", state: "Uttar Pradesh", nearby: "Delhi NCR" },
  { name: "Bengaluru", state: "Karnataka", nearby: null },
  { name: "Hyderabad", state: "Telangana", nearby: null },
  { name: "Pune", state: "Maharashtra", nearby: null },
];

/** Models with enough search demand to deserve their own page. */
const VEHICLE_TARGETS = [
  "thar", "fortuner", "creta", "scorpio-n", "xuv700", "seltos", "harrier",
  "gurkha", "jimny", "compass", "3-series", "glc", "defender", "city", "brezza",
];

function cityLanding(target: (typeof CITY_TARGETS)[number]): PpfLanding {
  const studio = LOCATIONS.find((l) => l.city === target.name);
  const entry = quote({
    sizeClass: "compact-suv",
    tier: "essential",
    areaIds: getPackage("essential")!.areaIds,
    paintCondition: "excellent",
  });
  const fullFront = quote({
    sizeClass: "mid-suv",
    tier: "premium",
    areaIds: getPackage("full-front")!.areaIds,
    paintCondition: "excellent",
  });

  return {
    slug: `ppf-in-${target.name.toLowerCase().replace(/\s+/g, "-")}`,
    kind: "city",
    title: `PPF in ${target.name} — Paint Protection Film Installation`,
    h1: `PAINT PROTECTION FILM IN ${target.name.toUpperCase()}.`,
    description: `Paint protection film in ${target.name}. Essential protection from ₹${entry.low.toLocaleString(
      "en-IN",
    )}, full front from ₹${fullFront.low.toLocaleString("en-IN")}. Plotter-cut patterns, dust-controlled installation, manufacturer warranty passed through.`,
    intro: studio
      ? `Our ${target.name} studio has a dedicated dust-controlled room for film work. Book an inspection and we read the paint before quoting — the number on the website is an estimate until we have seen the car.`
      : `We install paint protection film for customers across ${target.nearby ?? target.name}. Bring the car to the nearest Riderzpro studio and we will read the paint, quote properly and book you in.`,
    sizeClass: "mid-suv",
    vehicle: null,
    city: { name: target.name, state: target.state, address: studio?.address ?? null },
    points: [
      `Essential protection from ₹${entry.low.toLocaleString("en-IN")}`,
      `Full front from ₹${fullFront.low.toLocaleString("en-IN")}`,
      "Plotter-cut patterns where the manufacturer publishes one for your car",
      "Paint depth read and recorded per panel before any film is cut",
      "Manufacturer warranty passed through in full, plus 12 months on our workmanship",
    ],
  };
}

function vehicleLanding(slug: string): PpfLanding | null {
  const model = ALL_MODELS.find((m) => m.slug === slug);
  if (!model) return null;

  const sizeClass = classForBody(model.body, model.segment);
  const offroad = Boolean(model.offroad);
  const pkg = getPackage(offroad ? "trail" : "full-front")!;
  const price = quote({ sizeClass, tier: "premium", areaIds: pkg.areaIds, paintCondition: "excellent" });
  const essential = quote({
    sizeClass,
    tier: "essential",
    areaIds: getPackage("essential")!.areaIds,
    paintCondition: "excellent",
  });
  const fullBody = quote({ sizeClass, tier: "premium", areaIds: [], fullBody: true, paintCondition: "excellent" });

  return {
    slug: `ppf-for-${model.slug}`,
    kind: "vehicle",
    title: `PPF for ${model.brand} ${model.name} — Packages & Prices`,
    h1: `PPF FOR THE ${model.name.toUpperCase()}.`,
    description: `Paint protection film for the ${model.brand} ${model.name}. Essential from ₹${essential.low.toLocaleString(
      "en-IN",
    )}, ${pkg.name.toLowerCase()} from ₹${price.low.toLocaleString("en-IN")}, full body from ₹${fullBody.low.toLocaleString("en-IN")}. Indicative — confirmed after inspection.`,
    intro: offroad
      ? `The ${model.name} meets stones, branches, gravel and dust that a city car never sees. Film handles the abrasive end of that well — it will not stop a rock strike denting a panel, and we would not tell you otherwise.`
      : `Paint protection film for the ${model.brand} ${model.name}, priced against a ${sizeClass.replace("-", " ")} body. Most owners start with the front end, where the stone damage actually happens.`,
    sizeClass,
    vehicle: { brand: model.brand, model: model.name, body: model.body },
    city: null,
    points: [
      `Essential protection from ₹${essential.low.toLocaleString("en-IN")}`,
      `${pkg.name} from ₹${price.low.toLocaleString("en-IN")}`,
      `Full body from ₹${fullBody.low.toLocaleString("en-IN")}`,
      offroad
        ? "Rocker panels and lower doors prioritised — that is where trail spray lands"
        : "No visible film line across the bonnet on a full front package",
      "Final price confirmed after a physical paint inspection",
    ],
  };
}

export const PPF_LANDINGS: PpfLanding[] = [
  ...CITY_TARGETS.map(cityLanding),
  ...VEHICLE_TARGETS.map(vehicleLanding).filter((l): l is PpfLanding => l !== null),
];

export function getLanding(slug: string): PpfLanding | undefined {
  return PPF_LANDINGS.find((l) => l.slug === slug);
}
