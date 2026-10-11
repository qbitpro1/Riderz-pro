/**
 * THE STORE TAXONOMY
 *
 * The eight departments Riderzpro sells under, the groups inside each, and the
 * URL every one of them lives at. The navigation, the home page and the shop
 * all read from here — nothing else decides what a department is called or
 * where it links.
 *
 * Holds no product data, so client components may import it.
 *
 * Every department also has an OE (Original Equipment) section. It is a view of
 * the department's products flagged `oe`, not a group of its own.
 */

import type { MediaKey } from "@/lib/media";

export type DepartmentSlug =
  | "interior"
  | "exterior"
  | "multimedia"
  | "covers-guards"
  | "utilities"
  | "off-roading"
  | "lighting"
  | "accessories";

export type DepartmentGroup = {
  /** Stable id, unique within the department. */
  slug: string;
  name: string;
  /**
   * The catalogue `sub` labels that belong to this group, exactly as the brand
   * catalogues spell them. A product is placed by its `sub`, so every label
   * appears in exactly one group across the whole taxonomy.
   */
  subs: string[];
};

export type Department = {
  slug: DepartmentSlug;
  name: string;
  /** Short label for tight spaces (nav bar, bottom nav). */
  short: string;
  tagline: string;
  blurb: string;
  image: MediaKey;
  groups: DepartmentGroup[];
};

export const DEPARTMENTS: Department[] = [
  {
    slug: "interior",
    name: "Interior",
    short: "Interior",
    tagline: "Where you actually sit.",
    blurb: "Seat covers, floor mats, steering covers, tissue boxes and door panels, cut to your exact model.",
    image: "cockpitScreen",
    groups: [
      { slug: "seat-covers", name: "Seat Covers", subs: ["Seat covers", "Padded Seat Cover", "Eazy Fit"] },
      { slug: "floor-mats", name: "Floor Mats", subs: ["Foot mats", "7D mats", "9D mats", "Carpet & Care"] },
      { slug: "steering-covers", name: "Steering Covers", subs: ["Steering covers"] },
      { slug: "tissue-boxes", name: "Tissue Boxes", subs: ["Tissue Box"] },
      { slug: "door-panels", name: "Door Panels", subs: ["Door panels"] },
      {
        slug: "comfort",
        name: "Cushions & Comfort",
        subs: ["Neck cushions", "Armrests", "Health Ortho Memory", "Ventilated Cooling Car Cushion"],
      },
      { slug: "sunshades", name: "Sunshades & Curtains", subs: ["Sunshades", "Car curtains"] },
      { slug: "ambient-lighting", name: "Ambient Lighting", subs: ["Ambient lighting"] },
    ],
  },
  {
    slug: "exterior",
    name: "Exterior",
    short: "Exterior",
    tagline: "Sharpen how it meets the road.",
    blurb: "Side steps, foot rests, spoilers, grilles, visors and roof rails that change how your car looks and works.",
    image: "chromeGrille",
    groups: [
      { slug: "side-steps", name: "Side Steps", subs: ["Side steps"] },
      { slug: "foot-rests", name: "Foot Rests", subs: ["Foot rests"] },
      { slug: "spoilers", name: "Spoilers & Body Kits", subs: ["Spoilers"] },
      { slug: "grilles-chrome", name: "Grilles & Chrome", subs: ["Grilles", "Chrome accessories"] },
      { slug: "door-visors", name: "Door Visors", subs: ["Door visors"] },
      { slug: "roof", name: "Roof Rails & Racks", subs: ["Roof rails"] },
      { slug: "number-plates", name: "Number Plate Frames", subs: ["Number plate frames", "Car Number Plate"] },
    ],
  },
  {
    slug: "multimedia",
    name: "Multimedia",
    short: "Multimedia",
    tagline: "Hear it. See it. Properly.",
    blurb: "Speakers, subwoofers, amplifiers, displays and cameras, with everything needed to install them right.",
    image: "speakerCone",
    groups: [
      { slug: "speakers", name: "Speakers", subs: ["Speakers", "Midrange", "Tweeters", "Component speakers", "Soundbars"] },
      { slug: "subwoofers", name: "Subwoofers", subs: ["Subwoofers"] },
      { slug: "amplifiers", name: "Amplifiers", subs: ["Amplifiers"] },
      { slug: "processors", name: "DSP & Processors", subs: ["DSP", "Processors", "Signal"] },
      {
        slug: "displays",
        name: "Displays & Head Units",
        subs: ["Android head units", "Digital screens", "Rear entertainment systems"],
      },
      { slug: "cameras", name: "Cameras", subs: ["Reverse cameras", "Dash cams"] },
      {
        slug: "installation",
        name: "Wiring & Installation",
        subs: ["Wiring", "Power", "Electrical", "Tools", "Installation", "Sound deadening", "Damping"],
      },
      { slug: "marine-bike", name: "Marine & Two-Wheeler", subs: ["Marine", "Two Wheeler"] },
    ],
  },
  {
    slug: "covers-guards",
    name: "Covers & Guards",
    short: "Covers",
    tagline: "Keep new looking new.",
    blurb: "Covers, guards and flaps for the interior, exterior and dashboard that take the wear so your car doesn't.",
    image: "detailingPolish",
    groups: [
      { slug: "interior", name: "Interior Covers", subs: ["Seat protectors", "Boot mats"] },
      {
        slug: "exterior",
        name: "Exterior Covers & Guards",
        subs: ["Car covers", "Body covers", "Door guards", "Mud flaps"],
      },
      { slug: "dashboard", name: "Dashboard Covers", subs: ["Dashboard covers", "Dashboard accessories"] },
    ],
  },
  {
    slug: "utilities",
    name: "Utilities",
    short: "Utilities",
    tagline: "The useful stuff.",
    blurb: "Organisers, phone holders, chargers, inflators and car care that make every drive easier.",
    image: "steeringNight",
    groups: [
      { slug: "organisers", name: "Organisers", subs: ["Organizers", "Boot Organiser", "Utility"] },
      { slug: "phone-holders", name: "Phone Holders", subs: ["Phone holders", "Car Seat Hook With Mobile Holder"] },
      { slug: "charging", name: "Chargers", subs: ["Charging accessories"] },
      { slug: "inflators", name: "Tyre Inflators", subs: ["Air compressors"] },
      {
        slug: "car-care",
        name: "Car Care",
        subs: ["Microfibre", "Car Duster (Wax)", "Car Air Purifier", "Car Odour Eliminator"],
      },
    ],
  },
  {
    slug: "off-roading",
    name: "Off-Roading",
    short: "Off-Roading",
    tagline: "Built for the unpaved.",
    blurb: "Recovery, protection, suspension and expedition hardware, rated and load-tested.",
    image: "defenderSaltFlat",
    groups: [
      {
        slug: "recovery",
        name: "Recovery Gear",
        subs: ["Recovery boards", "Tow straps", "Shackles", "Winches", "Portable recovery equipment"],
      },
      {
        slug: "armour",
        name: "Armour & Protection",
        subs: ["Skid plates", "Rock sliders", "Bull bars", "Snorkels"],
      },
      { slug: "suspension", name: "Lift Kits & Suspension", subs: ["Lift kits", "Off-road suspension"] },
      { slug: "tyres", name: "Off-Road Tyres", subs: ["All-terrain tyres", "Mud-terrain tyres"] },
      {
        slug: "expedition",
        name: "Racks & Expedition",
        subs: ["Roof racks", "Roof tents", "Camping equipment", "Storage systems"],
      },
    ],
  },
  {
    slug: "lighting",
    name: "Lighting Solutions",
    short: "Lighting",
    tagline: "Be seen. See everything.",
    blurb: "Projector conversions, LED bulbs, DRLs, fog lamps and auxiliary bars, wired with relays and fused properly.",
    image: "tailLightBokeh",
    groups: [
      { slug: "headlamps", name: "Headlamps & Projectors", subs: ["Projector lamps", "Projector headlamps"] },
      { slug: "led-bulbs", name: "LED Bulbs", subs: ["LED bulbs"] },
      { slug: "fog-drl", name: "Fog Lamps & DRLs", subs: ["Fog lamps", "DRLs", "Sequential indicators"] },
      { slug: "auxiliary", name: "LED Bars & Auxiliary", subs: ["LED bars", "Off-road lights", "Auxiliary lights"] },
    ],
  },
  {
    slug: "accessories",
    name: "Accessories",
    short: "Accessories",
    tagline: "Everything else your car needs.",
    blurb: "The smaller pieces that don't fit a department: performance parts, travel add-ons and everyday extras.",
    image: "garageSpotlit",
    groups: [
      {
        slug: "performance",
        name: "Performance Parts",
        subs: [
          "Air filters",
          "Intake systems",
          "Exhaust",
          "ECU tuning",
          "Intercoolers",
          "Performance plugs",
          "Cooling systems",
          "Brakes",
          "Suspension",
          "Performance tyres",
        ],
      },
      { slug: "travel", name: "Travel Add-ons", subs: ["Steering Wheel Dining Tray"] },
      // Catch-all: any `sub` not listed elsewhere lands here. See `placeSub`.
      { slug: "more", name: "More Accessories", subs: [] },
    ],
  },
];

export const DEPARTMENT_BY_SLUG = Object.fromEntries(DEPARTMENTS.map((d) => [d.slug, d])) as Record<
  DepartmentSlug,
  Department
>;

const PLACEMENT = new Map<string, { department: DepartmentSlug; group: string }>();
for (const d of DEPARTMENTS) {
  for (const g of d.groups) {
    for (const sub of g.subs) PLACEMENT.set(sub.toLowerCase(), { department: d.slug, group: g.slug });
  }
}

/**
 * Where a catalogue `sub` label belongs. Anything the taxonomy does not name is
 * shelved under Accessories → More, so a new brand's odd label is never lost.
 */
export function placeSub(sub: string): { department: DepartmentSlug; group: string } {
  return PLACEMENT.get(sub.trim().toLowerCase()) ?? { department: "accessories", group: "more" };
}

/* ------------------------------------------------------------------- URLs */

export function departmentHref(slug: DepartmentSlug): string {
  return `/shop/${slug}`;
}

/** A group is the department page filtered to that group. */
export function groupHref(slug: DepartmentSlug, group: string): string {
  return `/shop/${slug}?group=${group}`;
}

/** The department's Original Equipment section. */
export function oeHref(slug: DepartmentSlug): string {
  return `/shop/${slug}?oe=1`;
}

/** Pre-taxonomy shop URLs, for redirects. */
export const LEGACY_DEPARTMENT_SLUGS: Record<string, string> = {
  audio: "/shop/multimedia",
  "off-road": "/shop/off-roading",
  performance: "/shop/accessories?group=performance",
  protection: "/shop/covers-guards",
};
