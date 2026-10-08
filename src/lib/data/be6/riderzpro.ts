/**
 * RIDERZPRO BE 6 — WHAT WE ADD
 *
 * Everything Riderzpro makes, fits, or has only imagined. Nothing in this file
 * is a Mahindra feature, and nothing here may be rendered in the same list as
 * ./factory data. The label carried by every item is what keeps that promise
 * on screen.
 *
 * Two ideas do the work:
 *   `Provenance` — who is responsible for the part: Mahindra, or us.
 *   `Stage`      — how real it is, from an idea to something you can buy.
 *
 * An item at CONCEPT stage has no price, because it has nothing to sell.
 */

export type Provenance =
  /** Genuine Mahindra factory equipment. */
  | "MAHINDRA FACTORY"
  /** A Riderzpro product or service we fit to the car. */
  | "RIDERZPRO CUSTOM"
  /** A Riderzpro idea for the Limited Edition. Not for sale. */
  | "RIDERZPRO CONCEPT";

export type Stage =
  /** An idea. Drawn, not built. */
  | "CONCEPT"
  /** Being developed — a model exists, or a first article. */
  | "PROTOTYPE"
  /** Physical testing underway. */
  | "TESTING"
  /** Production-ready, not yet on sale. */
  | "READY"
  /** On sale today. */
  | "AVAILABLE"
  /** Planned, dated, not yet purchasable. */
  | "COMING SOON";

export const STAGE_ORDER: Stage[] = ["CONCEPT", "PROTOTYPE", "TESTING", "READY", "COMING SOON", "AVAILABLE"];

export const STAGE_COPY: Record<Stage, { label: string; meaning: string; sellable: boolean }> = {
  CONCEPT: { label: "CONCEPT", meaning: "An idea we have drawn. Nothing has been built.", sellable: false },
  PROTOTYPE: { label: "PROTOTYPE", meaning: "A first article exists. It has not been through testing.", sellable: false },
  TESTING: { label: "TESTING", meaning: "Physical testing underway. Not yet signed off.", sellable: false },
  READY: { label: "READY", meaning: "Production-ready and signed off. Not yet on sale.", sellable: false },
  "COMING SOON": { label: "COMING SOON", meaning: "Planned. Not yet purchasable.", sellable: false },
  AVAILABLE: { label: "AVAILABLE", meaning: "On sale and fitted at our workshops today.", sellable: true },
};

/**
 * Modifications that touch any of these need a qualified engineer to sign them
 * off before they go anywhere near a customer's car, and several need more
 * than that. The brief is explicit and so are we.
 */
export type ValidationDomain =
  | "structure"
  | "weight"
  | "glass"
  | "electrical"
  | "lighting"
  | "wheels"
  | "braking"
  | "airbags"
  | "adas"
  | "cybersecurity"
  | "road-legality";

export const VALIDATION_COPY: Record<ValidationDomain, string> = {
  structure: "Affects structural integrity — professional engineering validation required.",
  weight: "Adds mass, which changes range, braking and load ratings — engineering validation required.",
  glass: "Replaces or covers glazing — engineering validation and regulatory review required.",
  electrical: "Taps the vehicle's electrical system — professional installation and validation required.",
  lighting: "Affects lighting — road-legal configuration required under applicable Indian regulations.",
  wheels: "Changes rolling stock — fitment, load and speed rating validation required.",
  braking: "Affects braking — professional engineering validation required.",
  airbags: "In the deployment path of an airbag — professional engineering validation required.",
  adas: "May obstruct ADAS sensors or cameras — recalibration and validation required.",
  cybersecurity: "Touches vehicle cybersecurity — independent security review required.",
  "road-legality": "Subject to applicable Indian regulations and certification requirements.",
};

/* ------------------------------------------------------------------ */
/* UPGRADES — the things a customer can put on a real BE 6 build       */
/* ------------------------------------------------------------------ */

export type UpgradeGroupSlug =
  | "shield"
  | "aero"
  | "wheels"
  | "audio"
  | "interior"
  | "light-lab"
  | "lab"
  | "storage"
  | "security"
  | "tech"
  | "urban-explorer";

export type Upgrade = {
  slug: string;
  name: string;
  group: UpgradeGroupSlug;
  provenance: Provenance;
  stage: Stage;
  blurb: string;
  /** Installed price in rupees. Null wherever there is nothing to sell yet. */
  price: number | null;
  /** Shown instead of a price when price is null. */
  priceNote?: string;
  /** Existing Riderzpro catalogue this draws on, where it does. */
  sourcedFrom?: { label: string; href: string };
  validation?: ValidationDomain[];
  /** Selected by default in the builder — the ones we would fit to our own car. */
  signature?: boolean;
};

export type UpgradeGroup = {
  slug: UpgradeGroupSlug;
  title: string;
  /** The name the section carries on the page. */
  banner: string;
  caption: string;
  href?: string;
};

export const UPGRADE_GROUPS: UpgradeGroup[] = [
  {
    slug: "shield",
    title: "PPF & COATING",
    banner: "RIDERZPRO SHIELD",
    caption: "Paint protection film and ceramic, from our existing PPF programme.",
    href: "/ppf",
  },
  {
    slug: "aero",
    title: "EXTERIOR",
    banner: "RIDERZPRO AERO",
    caption: "Bodywork, aero and trim. Every part labelled factory or Riderzpro.",
  },
  {
    slug: "wheels",
    title: "WHEELS & TYRES",
    banner: "RIDERZPRO WHEELS",
    caption: "Alternatives to the factory 19s, with fitment validated before anything is ordered.",
  },
  {
    slug: "audio",
    title: "AUDIO",
    banner: "RIDERZPRO AUDIO 01",
    caption: "Built on the Blaupunkt and RECOIL catalogues we already carry.",
    href: "/audio",
  },
  {
    slug: "interior",
    title: "INTERIOR",
    banner: "RIDERZPRO INTERIOR",
    caption: "Seat covers, trim and ambient light, drawing on the Autoform catalogue.",
    href: "/autoform",
  },
  {
    slug: "light-lab",
    title: "LIGHTING",
    banner: "RIDERZPRO LIGHT LAB",
    caption: "Cabin, welcome and cargo light. Nothing that alters a factory road-lighting function.",
  },
  {
    slug: "lab",
    title: "3D-PRINTED PARTS",
    banner: "RIDERZPRO LAB",
    caption: "Parts we design and print ourselves, each with its own development stage.",
  },
  { slug: "storage", title: "STORAGE", banner: "RIDERZPRO STORAGE", caption: "Using the 455-litre boot and 45-litre frunk properly." },
  { slug: "security", title: "SECURITY", banner: "RIDERZPRO ARMOR", caption: "Concept work. Read the engineering notice before anything else." },
  { slug: "tech", title: "TECHNOLOGY", banner: "RIDERZPRO TECH", caption: "Concept software and electronics, kept strictly apart from Mahindra's TEQ suites." },
  {
    slug: "urban-explorer",
    title: "URBAN EXPLORER",
    banner: "RIDERZPRO URBAN EXPLORER",
    caption: "Weekend-capable, not a 4x4 conversion. The BE 6 is rear-wheel drive and we do not pretend otherwise.",
  },
];

export const UPGRADES: Upgrade[] = [
  /* --- SHIELD ----------------------------------------------------- */
  {
    slug: "ppf-full-body",
    name: "Full-body PPF",
    group: "shield",
    provenance: "RIDERZPRO CUSTOM",
    stage: "AVAILABLE",
    blurb:
      "Every painted panel wrapped in self-healing film. On a satin or matte BE 6 finish the film has to be matched to the finish, not just to the colour.",
    price: 1_85_000,
    sourcedFrom: { label: "Riderzpro PPF programme", href: "/ppf" },
    signature: true,
  },
  {
    slug: "ppf-high-impact",
    name: "High-impact areas PPF",
    group: "shield",
    provenance: "RIDERZPRO CUSTOM",
    stage: "AVAILABLE",
    blurb: "Bonnet, front bumper, mirrors, and the luggage-loading edge. The panels that actually take the hits.",
    price: 62_000,
    sourcedFrom: { label: "Riderzpro PPF programme", href: "/ppf" },
  },
  {
    slug: "ppf-headlamp",
    name: "Headlamp protection film",
    group: "shield",
    provenance: "RIDERZPRO CUSTOM",
    stage: "AVAILABLE",
    blurb: "Clear film over the lighting signature. Optical clarity is the whole job here.",
    price: 7500,
    validation: ["lighting"],
  },
  {
    slug: "ceramic",
    name: "Ceramic coating over PPF",
    group: "shield",
    provenance: "RIDERZPRO CUSTOM",
    stage: "AVAILABLE",
    blurb: "Applied over the film, not instead of it. Makes the car wash off rather than scrub off.",
    price: 34_000,
  },
  {
    slug: "ppf-interior",
    name: "Interior high-touch film",
    group: "shield",
    provenance: "RIDERZPRO CUSTOM",
    stage: "AVAILABLE",
    blurb:
      "Film on the three screens' surrounds, door pulls and the console. On a three-screen cabin this is the difference between a two-year-old interior and a tired one.",
    price: 12_500,
  },

  /* --- AERO -------------------------------------------------------- */
  {
    slug: "aero-front",
    name: "Front aero element",
    group: "aero",
    provenance: "RIDERZPRO CUSTOM",
    stage: "PROTOTYPE",
    blurb: "Lower front blade, printed and finished in house. First article fitted to a test car.",
    price: null,
    priceNote: "Priced at production release",
    validation: ["adas"],
  },
  {
    slug: "aero-side-skirts",
    name: "Side skirts",
    group: "aero",
    provenance: "RIDERZPRO CUSTOM",
    stage: "PROTOTYPE",
    blurb: "Sill extensions that visually drop the car without touching ride height.",
    price: null,
    priceNote: "Priced at production release",
  },
  {
    slug: "aero-diffuser",
    name: "Rear diffuser",
    group: "aero",
    provenance: "RIDERZPRO CUSTOM",
    stage: "CONCEPT",
    blurb: "Rear underbody element. Drawn, not yet modelled for print.",
    price: null,
    priceNote: "Concept — nothing built",
  },
  {
    slug: "aero-spoiler",
    name: "Roof spoiler",
    group: "aero",
    provenance: "RIDERZPRO CUSTOM",
    stage: "CONCEPT",
    blurb: "Extension of the factory roof line. Bonded, not drilled.",
    price: null,
    priceNote: "Concept — nothing built",
    validation: ["structure"],
  },
  {
    slug: "charge-port-surround",
    name: "Charging-port surround",
    group: "aero",
    provenance: "RIDERZPRO CUSTOM",
    stage: "TESTING",
    blurb: "Printed bezel around the charge port. In durability testing against UV and repeated cable contact.",
    price: null,
    priceNote: "Priced at production release",
  },

  /* --- WHEELS ------------------------------------------------------- */
  {
    slug: "wheels-19-forged",
    name: "19-inch forged wheel set",
    group: "wheels",
    provenance: "RIDERZPRO CUSTOM",
    stage: "AVAILABLE",
    blurb:
      "Same 19-inch diameter as the factory alloy, so the tyre and the speedometer are unaffected. The safest change you can make to a wheel.",
    price: 2_20_000,
    validation: ["wheels"],
  },
  {
    slug: "wheels-20-touring",
    name: "20-inch touring set",
    group: "wheels",
    provenance: "RIDERZPRO CUSTOM",
    stage: "COMING SOON",
    blurb:
      "Matches the diameter Mahindra fits to the Formula E editions. Held until we have the factory tyre sizes in writing — an inch up on an unpublished size is not a fitment we will validate.",
    price: null,
    priceNote: "Held pending official tyre data",
    validation: ["wheels", "adas"],
  },
  {
    slug: "tyres-ev-touring",
    name: "EV-specific touring tyres",
    group: "wheels",
    provenance: "RIDERZPRO CUSTOM",
    stage: "AVAILABLE",
    blurb:
      "Higher load rating and lower rolling resistance. An EV is heavier and quieter than the car a standard tyre was designed around.",
    price: 68_000,
    validation: ["wheels"],
  },

  /* --- AUDIO -------------------------------------------------------- */
  {
    slug: "audio-dsp",
    name: "DSP and re-tune over the factory system",
    group: "audio",
    provenance: "RIDERZPRO CUSTOM",
    stage: "AVAILABLE",
    blurb:
      "The factory Harman Kardon is a good system. A DSP and a proper tune to the cabin gets more out of it than replacing it does.",
    price: 52_000,
    sourcedFrom: { label: "Riderzpro audio", href: "/audio" },
    validation: ["electrical"],
    signature: true,
  },
  {
    slug: "audio-amp-sub",
    name: "Amplifier and subwoofer",
    group: "audio",
    provenance: "RIDERZPRO CUSTOM",
    stage: "AVAILABLE",
    blurb: "Adds the bottom octave the factory system does not reach, sited so the 455-litre boot stays usable.",
    price: 1_15_000,
    sourcedFrom: { label: "RECOIL catalogue", href: "/recoil" },
    validation: ["electrical"],
  },
  {
    slug: "audio-speakers",
    name: "Component speaker upgrade",
    group: "audio",
    provenance: "RIDERZPRO CUSTOM",
    stage: "AVAILABLE",
    blurb: "Front stage replacement from the Blaupunkt and RECOIL ranges we stock.",
    price: 46_000,
    sourcedFrom: { label: "Brand catalogues", href: "/brands" },
    validation: ["electrical"],
  },
  {
    slug: "audio-damping",
    name: "Sound damping",
    group: "audio",
    provenance: "RIDERZPRO CUSTOM",
    stage: "AVAILABLE",
    blurb:
      "Doors, arches and boot floor. An EV has no engine noise to mask road roar, so damping does more here than it would on a petrol car.",
    price: 38_000,
    signature: true,
  },

  /* --- INTERIOR ----------------------------------------------------- */
  {
    slug: "interior-seat-covers",
    name: "Autoform seat covers",
    group: "interior",
    provenance: "RIDERZPRO CUSTOM",
    stage: "AVAILABLE",
    blurb: "Cut to the BE 6's seats from the Autoform design range.",
    price: 32_000,
    sourcedFrom: { label: "Autoform catalogue", href: "/autoform" },
    validation: ["airbags"],
  },
  {
    slug: "interior-upholstery",
    name: "Full custom upholstery",
    group: "interior",
    provenance: "RIDERZPRO CUSTOM",
    stage: "AVAILABLE",
    blurb: "Retrim in the material and stitch of your choosing. Seat ventilation is preserved through perforation.",
    price: 1_45_000,
    validation: ["airbags"],
  },
  {
    slug: "interior-ambient",
    name: "Ambient lighting",
    group: "interior",
    provenance: "RIDERZPRO CUSTOM",
    stage: "AVAILABLE",
    blurb: "Footwell, door card and console light on its own controller, independent of the factory system.",
    price: 24_000,
    validation: ["electrical"],
    signature: true,
  },
  {
    slug: "interior-mats",
    name: "Premium floor and boot mats",
    group: "interior",
    provenance: "RIDERZPRO CUSTOM",
    stage: "AVAILABLE",
    blurb: "Cut to the BE 6 floor pan, including the frunk.",
    price: 14_500,
    sourcedFrom: { label: "Autoform catalogue", href: "/autoform" },
  },
  {
    slug: "interior-steering",
    name: "Custom steering wheel retrim",
    group: "interior",
    provenance: "RIDERZPRO CUSTOM",
    stage: "AVAILABLE",
    blurb: "Retrim of the factory wheel. The airbag module and every control is reused, never relocated.",
    price: 28_000,
    validation: ["airbags"],
  },

  /* --- LIGHT LAB ----------------------------------------------------- */
  {
    slug: "light-welcome",
    name: "Welcome lighting",
    group: "light-lab",
    provenance: "RIDERZPRO CUSTOM",
    stage: "AVAILABLE",
    blurb: "Cabin and puddle light sequence on approach. Does not touch a road-lighting function.",
    price: 16_000,
    validation: ["electrical"],
  },
  {
    slug: "light-cargo",
    name: "Boot and frunk lighting",
    group: "light-lab",
    provenance: "RIDERZPRO CUSTOM",
    stage: "AVAILABLE",
    blurb: "Proper light in both storage areas. The frunk has none worth the name from the factory.",
    price: 9500,
    validation: ["electrical"],
  },
  {
    slug: "light-ground-projection",
    name: "Ground projection",
    group: "light-lab",
    provenance: "RIDERZPRO CUSTOM",
    stage: "CONCEPT",
    blurb:
      "Projected logo on the ground at the doors. Concept only — projected light from a vehicle has road-legality questions we have not answered yet.",
    price: null,
    priceNote: "Concept — road legality unresolved",
    validation: ["lighting", "road-legality"],
  },
  {
    slug: "light-drl",
    name: "DRL modification",
    group: "light-lab",
    provenance: "RIDERZPRO CUSTOM",
    stage: "CONCEPT",
    blurb:
      "We are not currently willing to modify the BE 6's daytime running lights. The lighting signature is a homologated road-lighting function and altering it puts road legality at risk.",
    price: null,
    priceNote: "Not offered — road-legality risk",
    validation: ["lighting", "road-legality"],
  },

  /* --- STORAGE ------------------------------------------------------ */
  {
    slug: "storage-frunk-organiser",
    name: "Frunk organiser",
    group: "storage",
    provenance: "RIDERZPRO CUSTOM",
    stage: "READY",
    blurb: "Printed insert that divides the 45-litre frunk into a cable bay and a dry bay.",
    price: 6800,
  },
  {
    slug: "storage-boot-system",
    name: "Boot organiser system",
    group: "storage",
    provenance: "RIDERZPRO CUSTOM",
    stage: "AVAILABLE",
    blurb: "Modular dividers for the 455-litre boot, removable in one piece.",
    price: 11_500,
  },
  {
    slug: "storage-cable-management",
    name: "Charging cable management",
    group: "storage",
    provenance: "RIDERZPRO CUSTOM",
    stage: "READY",
    blurb: "A bag and mount so the charging cable stops living loose in the boot.",
    price: 4200,
  },

  /* --- SECURITY (concept) -------------------------------------------- */
  {
    slug: "armor-tracking",
    name: "Tracking and recovery",
    group: "security",
    provenance: "RIDERZPRO CUSTOM",
    stage: "AVAILABLE",
    blurb:
      "Independent tracker with its own power, additional to Mahindra's Secure360 Pro rather than a replacement for it.",
    price: 26_000,
    validation: ["electrical"],
  },
  {
    slug: "armor-secure-storage",
    name: "Secure in-car storage",
    group: "security",
    provenance: "RIDERZPRO CUSTOM",
    stage: "PROTOTYPE",
    blurb: "Lockable compartment under the boot floor. First article built, not yet tested.",
    price: null,
    priceNote: "Priced at production release",
    validation: ["structure"],
  },
  {
    slug: "armor-security-film",
    name: "Security film on glazing",
    group: "security",
    provenance: "RIDERZPRO CUSTOM",
    stage: "TESTING",
    blurb:
      "Anti-shatter film on the side glass. This makes glass harder to break through. It is not ballistic protection and we do not describe it as such.",
    price: null,
    priceNote: "Priced on completion of testing",
    validation: ["glass", "road-legality"],
  },
  {
    slug: "armor-intrusion",
    name: "Intrusion detection",
    group: "security",
    provenance: "RIDERZPRO CONCEPT",
    stage: "CONCEPT",
    blurb: "Additional sensing and tamper alerting. Concept — and it overlaps with what TEQ_Secure already does.",
    price: null,
    priceNote: "Concept",
    validation: ["electrical", "cybersecurity"],
  },

  /* --- TECH (concept) ------------------------------------------------ */
  {
    slug: "tech-dashcam",
    name: "Dual dashcam with parking mode",
    group: "tech",
    provenance: "RIDERZPRO CUSTOM",
    stage: "AVAILABLE",
    blurb: "Front and rear, hard-wired, recording while parked.",
    price: 32_000,
    validation: ["electrical"],
  },
  {
    slug: "tech-rear-entertainment",
    name: "Rear entertainment",
    group: "tech",
    provenance: "RIDERZPRO CUSTOM",
    stage: "AVAILABLE",
    blurb: "Screens for the second row. Independent of the factory three-screen cockpit.",
    price: 78_000,
    validation: ["electrical"],
  },

  /* --- URBAN EXPLORER ------------------------------------------------ */
  {
    slug: "ux-roof-storage",
    name: "Roof storage",
    group: "urban-explorer",
    provenance: "RIDERZPRO CUSTOM",
    stage: "AVAILABLE",
    blurb:
      "Roof box and rails. Expect a real range cost — anything on the roof of an EV is paid for in kilometres at highway speed.",
    price: 42_000,
    validation: ["weight", "structure"],
  },
  {
    slug: "ux-all-weather",
    name: "All-weather protection pack",
    group: "urban-explorer",
    provenance: "RIDERZPRO CUSTOM",
    stage: "AVAILABLE",
    blurb: "Mats, boot liner, mud flaps and seat protection for a car that gets used properly.",
    price: 22_000,
  },
  {
    slug: "ux-underbody",
    name: "Underbody protection",
    group: "urban-explorer",
    provenance: "RIDERZPRO CONCEPT",
    stage: "CONCEPT",
    blurb:
      "Concept only. The battery is structural on this platform and anything bolted beneath it is an engineering question before it is a product question.",
    price: null,
    priceNote: "Concept — engineering study required",
    validation: ["structure", "weight"],
  },
];

export function upgradesIn(group: UpgradeGroupSlug): Upgrade[] {
  return UPGRADES.filter((u) => u.group === group);
}

export function upgrade(slug: string): Upgrade | undefined {
  return UPGRADES.find((u) => u.slug === slug);
}

/** Only what can actually be bought and priced today. */
export const BUILDABLE = UPGRADES.filter((u) => u.price !== null && STAGE_COPY[u.stage].sellable);

/**
 * The BE 6 is a rear-wheel-drive urban and performance EV. This is the line we
 * hold on the Urban Explorer section, and it is here rather than in a template
 * so it cannot be quietly softened later.
 */
export const URBAN_EXPLORER_LIMITS = [
  "The BE 6 is rear-wheel drive. It has no locking differential, no low range and no factory off-road drive mode.",
  "Ground clearance is 207 mm as widely reported, which is a broken-road figure, not a rock-crawling one.",
  "The battery is part of the vehicle structure. Underbody impact on an EV is a different and more serious event than it is on a combustion car.",
  "Nothing in this package makes the BE 6 an off-roader, and we will not sell it as one.",
];
