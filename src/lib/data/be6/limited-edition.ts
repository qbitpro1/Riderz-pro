/**
 * MOTORBOTZ BE 6 LIMITED EDITION — CONCEPT
 *
 * An independent Motorbotz customisation concept. It is not a Mahindra
 * variant, not endorsed by Mahindra, and not for sale.
 *
 * This file carries the claims that would do the most damage if they were
 * loose: ballistic protection, cryptography, and AI. The rules applied here:
 *
 *   - No ballistic rating is named. None has been tested.
 *   - No cryptographic algorithm is named as implemented. None has been.
 *   - No Motorbotz AI feature is described in a way that could be read as
 *     Mahindra's MAIA or TEQ software, which genuinely exists and genuinely
 *     does some of these things already.
 *   - No production quantity is advertised, because none has been decided.
 */

import type { Stage, ValidationDomain } from "./motorbotz";

export const DISCLAIMER =
  "MOTORBOTZ Limited Edition is an independent customization concept by MOTORBOTZ and is not a factory Mahindra variant.";

export const DISCLAIMER_LONG =
  "The MOTORBOTZ BE 6 Limited Edition is an independent aftermarket concept developed by MOTORBOTZ. It is not a Mahindra product, not a Mahindra variant, and carries no Mahindra endorsement, certification or partnership. Mahindra and BE 6 are trademarks of Mahindra & Mahindra Ltd, used here to identify the vehicle the concept is based on. The factory vehicle, its specifications and its warranty are Mahindra's; everything described as MOTORBOTZ is ours.";

export const LE_HEADLINE = {
  name: "MOTORBOTZ BE 6",
  line: "LIMITED EDITION",
  status: "COMING SOON",
  sub: "The BE 6, rebuilt without limits.",
  positioning: "MOTORBOTZ BE 6 Limited Edition — Independent Custom Concept.",
};

/**
 * Production numbering. The concept is designed to support a numbered run —
 * the badge format exists — but no quantity has been decided and none is
 * advertised. `quantity: null` is the whole point of this object.
 */
export const NUMBERING = {
  badgeFormat: "MOTORBOTZ BE 6 — 001/___",
  quantity: null as number | null,
  note:
    "The concept is designed to support a numbered limited run. No production quantity has been decided, so none is advertised. The badge shows the format, not a promise.",
};

/* ------------------------------------------------------------------ */
/* 3D-PRINTED COMPONENTS                                               */
/* ------------------------------------------------------------------ */

export type PrintedPart = {
  slug: string;
  name: string;
  version: string;
  placement: "exterior" | "interior";
  material: string;
  finish: string;
  installation: string;
  /** Grams. Null where the part has not been printed and weighed. */
  weightG: number | null;
  price: number | null;
  stage: Stage;
  note?: string;
  validation?: ValidationDomain[];
};

export const PRINTED_PARTS: PrintedPart[] = [
  /* --- EXTERIOR --------------------------------------------------- */
  {
    slug: "front-aero-blade",
    name: "Front aero blade",
    version: "v0.3",
    placement: "exterior",
    material: "ASA, glass-fibre reinforced",
    finish: "Primed and painted to body colour",
    installation: "3M VHB bonded to the lower bumper, no drilling",
    weightG: 780,
    price: null,
    stage: "PROTOTYPE",
    note: "First article on a test car. Clearance to the front ADAS sensors is being measured.",
    validation: ["adas"],
  },
  {
    slug: "fender-extensions",
    name: "Fender extensions",
    version: "v0.2",
    placement: "exterior",
    material: "ASA, glass-fibre reinforced",
    finish: "Textured satin black",
    installation: "Bonded with factory clip locations reused",
    weightG: 410,
    price: null,
    stage: "PROTOTYPE",
    validation: ["road-legality"],
    note: "Anything that changes the vehicle's overall width has a regulatory question attached to it.",
  },
  {
    slug: "aero-inserts",
    name: "Aero inserts",
    version: "v0.4",
    placement: "exterior",
    material: "ASA",
    finish: "Gloss black",
    installation: "Clip-in to existing bumper apertures",
    weightG: 190,
    price: null,
    stage: "TESTING",
  },
  {
    slug: "charge-port-bezel",
    name: "Charging-port bezel",
    version: "v1.0",
    placement: "exterior",
    material: "ASA",
    finish: "Anodised-look satin",
    installation: "Adhesive bezel around the factory port aperture",
    weightG: 60,
    price: null,
    stage: "TESTING",
    note: "In UV and cable-abrasion testing. This part gets touched every single charge.",
  },
  {
    slug: "plate-surround",
    name: "Number plate surround",
    version: "v1.1",
    placement: "exterior",
    material: "ASA",
    finish: "Satin black",
    installation: "Uses the factory plate fixings",
    weightG: 120,
    price: 2400,
    stage: "AVAILABLE",
    validation: ["road-legality"],
    note: "Must not obscure any part of the registration mark. Fitted to the regulation, not to the look.",
  },
  {
    slug: "rear-aero-element",
    name: "Rear aero element",
    version: "v0.1",
    placement: "exterior",
    material: "TBD",
    finish: "TBD",
    installation: "TBD",
    weightG: null,
    price: null,
    stage: "CONCEPT",
    note: "Drawn only. No model, no print, no weight.",
  },
  {
    slug: "roof-accessory-rail",
    name: "Roof accessory rail",
    version: "v0.1",
    placement: "exterior",
    material: "TBD",
    finish: "TBD",
    installation: "TBD",
    weightG: null,
    price: null,
    stage: "CONCEPT",
    validation: ["structure", "weight"],
    note: "A printed part carrying a roof load is a structural question. It will not leave concept without an engineer.",
  },

  /* --- INTERIOR ---------------------------------------------------- */
  {
    slug: "console-organiser",
    name: "Centre console organiser",
    version: "v1.2",
    placement: "interior",
    material: "PETG",
    finish: "Soft-touch textured",
    installation: "Drop-in, no fixings",
    weightG: 240,
    price: 3200,
    stage: "AVAILABLE",
  },
  {
    slug: "phone-dock",
    name: "Phone dock",
    version: "v1.3",
    placement: "interior",
    material: "PETG",
    finish: "Matte black",
    installation: "Clips to an existing trim seam",
    weightG: 95,
    price: 2100,
    stage: "AVAILABLE",
    note: "Sited clear of the passenger screen and out of the airbag path.",
    validation: ["airbags"],
  },
  {
    slug: "frunk-divider",
    name: "Frunk divider set",
    version: "v1.0",
    placement: "interior",
    material: "PETG",
    finish: "Textured",
    installation: "Friction fit into the 45-litre frunk",
    weightG: 420,
    price: 6800,
    stage: "READY",
  },
  {
    slug: "cable-tidy",
    name: "Charging cable tidy",
    version: "v1.1",
    placement: "interior",
    material: "PETG with woven strap",
    finish: "Matte",
    installation: "Boot floor mounted",
    weightG: 180,
    price: 1800,
    stage: "AVAILABLE",
  },
  {
    slug: "seatback-organiser",
    name: "Seat-back organiser",
    version: "v0.9",
    placement: "interior",
    material: "PETG and textile",
    finish: "Matte",
    installation: "Straps to the seat frame",
    weightG: 320,
    price: null,
    stage: "READY",
    note: "Signed off, awaiting a production slot.",
  },
  {
    slug: "cup-holder-insert",
    name: "Cup holder insert",
    version: "v1.0",
    placement: "interior",
    material: "PETG",
    finish: "Soft-touch",
    installation: "Drop-in",
    weightG: 70,
    price: 900,
    stage: "AVAILABLE",
  },
  {
    slug: "controller-mount",
    name: "Controller mount",
    version: "v0.2",
    placement: "interior",
    material: "PETG",
    finish: "Matte",
    installation: "Clips to a trim seam, second row",
    weightG: 110,
    price: null,
    stage: "PROTOTYPE",
    note: "For TEQ_Play's gaming mode, which is Mahindra's feature — this is only somewhere to put the controller.",
  },
  {
    slug: "switch-panel",
    name: "Auxiliary switch panel",
    version: "v0.1",
    placement: "interior",
    material: "TBD",
    finish: "TBD",
    installation: "TBD",
    weightG: null,
    price: null,
    stage: "CONCEPT",
    validation: ["electrical"],
    note: "Any switch panel taps the vehicle's electrical system. Concept until an auto electrician has specified it.",
  },
];

export function partsIn(placement: "exterior" | "interior"): PrintedPart[] {
  return PRINTED_PARTS.filter((p) => p.placement === placement);
}

/* ------------------------------------------------------------------ */
/* THE LAB PIPELINE                                                    */
/* ------------------------------------------------------------------ */

export type PipelineStage = {
  slug: string;
  name: string;
  blurb: string;
  /** Which part stages sit at this point in the pipeline. */
  stages: Stage[];
};

export const PIPELINE: PipelineStage[] = [
  { slug: "concept", name: "CONCEPT", blurb: "Sketched against the real car and its real dimensions.", stages: ["CONCEPT"] },
  { slug: "model", name: "3D MODEL", blurb: "Modelled to scanned geometry, not to a photograph.", stages: ["CONCEPT"] },
  { slug: "prototype", name: "PROTOTYPE", blurb: "First article printed in the target material.", stages: ["PROTOTYPE"] },
  { slug: "test-fit", name: "TEST FIT", blurb: "Fitted to a customer-representative car. Panel gaps, clearances, sensor lines.", stages: ["PROTOTYPE"] },
  { slug: "safety", name: "SAFETY CHECK", blurb: "Airbag paths, ADAS obstruction, load paths, road legality.", stages: ["TESTING"] },
  { slug: "final", name: "FINAL DESIGN", blurb: "Revisions closed, drawing frozen, part numbered.", stages: ["READY"] },
  { slug: "production", name: "LIMITED PRODUCTION", blurb: "Printed to order in batches, each part traceable to its version.", stages: ["AVAILABLE"] },
];

/* ------------------------------------------------------------------ */
/* CONCEPT MODULES — the ones with the sharpest claim risk             */
/* ------------------------------------------------------------------ */

export type ConceptModule = {
  slug: string;
  name: string;
  status: "CONCEPT" | "COMING SOON";
  tagline: string;
  body: string;
  /** What we are explicitly NOT claiming. Rendered, not buried. */
  notClaiming: string[];
  /** What would have to happen before this could be sold. */
  requirements: string[];
  validation: ValidationDomain[];
};

export const ARMOR: ConceptModule = {
  slug: "armor",
  name: "MOTORBOTZ ARMOR — CONCEPT",
  status: "CONCEPT",
  tagline: "A security concept. Not an armoured vehicle.",
  body:
    "Armor is our study into what meaningful physical security on a BE 6 would involve. Parts of it are real and testable today — anti-shatter film, secure storage, tracking, tamper alerting. The parts that involve resisting a projectile are not, and separating those two is the entire point of publishing this as a concept.",
  notClaiming: [
    "We do not claim the vehicle is bulletproof.",
    "We do not claim any ballistic resistance level, because none has been tested.",
    "We do not claim the glazing, doors or panels have been engineered or certified to any standard.",
    "Security film resists shattering and forced entry. That is not ballistic protection and we will not let the two be confused.",
  ],
  requirements: [
    "Structural engineering assessment of the door and pillar structures",
    "Complete-vehicle mass and load-path analysis, including the effect on range and braking",
    "Ballistic testing of the complete glazing and body system to a recognised standard",
    "Suspension and brake re-rating for the added mass",
    "Regulatory and legal review under applicable Indian regulations",
    "Certification by an accredited test house",
  ],
  validation: ["structure", "weight", "glass", "braking", "road-legality"],
};

export const SECURITY_GLASS: ConceptModule = {
  slug: "security-glass",
  name: "MOTORBOTZ SECURITY GLASS",
  status: "COMING SOON",
  tagline: "CONCEPT — COMING SOON",
  body:
    "Ballistic glazing is not a film and not an upgrade. It is a different glass system, several times the mass of what it replaces, and it changes the vehicle it is fitted to. We are publishing the engineering path rather than a product, because there is no product.",
  notClaiming: [
    "No ballistic rating is promised, quoted or implied.",
    "No glazing has been tested.",
    "No BE 6 has been converted.",
  ],
  requirements: [
    "Engineering validation of the glazing system",
    "Structural validation of the apertures, doors and pillars carrying it",
    "Ballistic testing to an appropriate recognised standard",
    "Vehicle integration testing, including door hardware, regulators and seals",
    "Regulatory and legal review",
    "Weight assessment and its consequences for range, braking and handling",
    "Certification where required",
  ],
  validation: ["glass", "structure", "weight", "braking", "road-legality"],
};

export const QUANTUM_SHIELD: ConceptModule = {
  slug: "quantum-shield",
  name: "MOTORBOTZ QUANTUM SHIELD",
  status: "CONCEPT",
  tagline: "A security architecture concept. Designed around modern and post-quantum-ready security principles.",
  body:
    "Quantum Shield is an architecture study for the Motorbotz systems that would talk to a vehicle — our app, our telemetry, our keys — not a claim about the car. Mahindra's own systems are Mahindra's. What we are working out is how anything we add would authenticate, communicate and be updated without becoming the weakest link in someone's car.",
  notClaiming: [
    'We do not claim anything is "unhackable".',
    'We do not claim anything is "impossible to breach".',
    "We do not claim the vehicle becomes post-quantum secure because a Motorbotz component is fitted.",
    "We name no specific cryptographic algorithm as implemented, because none has been implemented or validated yet.",
    "We make no claim about the security of Mahindra's factory systems, which are outside our scope.",
  ],
  requirements: [
    "Threat model for every Motorbotz component that touches the vehicle",
    "Independent security review of the architecture before any implementation",
    "Selection of recognised post-quantum cryptographic standards at implementation time, published only once validated",
    "Key management and secure provisioning design",
    "Penetration testing of the implemented system",
    "A responsible disclosure process before anything ships",
  ],
  validation: ["cybersecurity", "electrical"],
};

/** The architecture areas Quantum Shield covers, as a study. */
export const QUANTUM_AREAS = [
  { name: "Secure communications", body: "Encrypted transport between vehicle-side hardware, phone and our backend." },
  { name: "Key security", body: "How keys are generated, stored and rotated in hardware." },
  { name: "Authentication", body: "Proving a device is what it says it is, in both directions." },
  { name: "Access control", body: "Who can do what, and how that is revoked." },
  { name: "Tamper detection", body: "Detecting and reporting physical interference with our hardware." },
  { name: "Device authentication", body: "Pairing only devices we can attest." },
  { name: "Post-quantum readiness", body: "Choosing an architecture that can adopt recognised post-quantum standards without being rebuilt." },
];

/* ------------------------------------------------------------------ */
/* AI — kept strictly apart from Mahindra's MAIA and TEQ suites        */
/* ------------------------------------------------------------------ */

export const AI_SEPARATION =
  "Mahindra's BE 6 already runs its own AI software: the MAIA architecture and six TEQ suites, including TEQ_Talk built with Google Gemini and TEQ_Me driver personalisation. Those are factory features and they are described in the factory section of this site. Everything below is a MOTORBOTZ concept — separate software, not yet built, and not an enhancement to Mahindra's system.";

export type AiMode = {
  slug: string;
  name: string;
  blurb: string;
  does: string[];
  /** Where Mahindra's factory software already covers this ground. */
  factoryOverlap?: string;
};

export const AI_MODES: AiMode[] = [
  {
    slug: "ai-personal",
    name: "AI PERSONAL",
    blurb: "Learns how you like the car set up.",
    does: ["Climate preferences", "Seat position", "Audio profile", "Lighting", "Navigation habits"],
    factoryOverlap:
      "Mahindra's TEQ_Me already recognises the driver on approach and restores seat, climate and charge-schedule preferences.",
  },
  {
    slug: "ai-comfort",
    name: "AI COMFORT",
    blurb: "Optimises the cabin around the journey ahead.",
    does: ["Cabin conditioning", "Charging suggestions", "Drive experience tuning"],
    factoryOverlap: "TEQ_Me already handles cabin pre-cooling and charge scheduling.",
  },
  {
    slug: "ai-security",
    name: "AI SECURITY",
    blurb: "Watches the vehicle when you are not in it.",
    does: ["Access monitoring", "Suspicious activity", "Tamper detection", "Unauthorised attempts"],
    factoryOverlap: "TEQ_Secure already provides Secure360 Pro live monitoring with intrusion alerts.",
  },
  {
    slug: "ai-trip",
    name: "AI TRIP",
    blurb: "Plans a long drive around the charging, not around the map.",
    does: ["Charging stops", "Range projection", "Route", "Weather", "Traffic"],
  },
  {
    slug: "ai-garage",
    name: "AI GARAGE",
    blurb: "Diagnostics and service reminders, including for the parts we fitted.",
    does: ["Vehicle diagnostics", "Maintenance reminders", "Motorbotz component health"],
  },
  {
    slug: "ai-guardian",
    name: "AI GUARDIAN",
    blurb: "Alerting built around the owner rather than the vehicle.",
    does: ["Security monitoring", "Escalating alerts", "Trusted contacts"],
    factoryOverlap: "Overlaps substantially with TEQ_Secure.",
  },
];

export const VOICE = {
  name: "MOTORBOTZ AI",
  status: "CONCEPT" as const,
  intro:
    "A concept voice assistant for Motorbotz systems. What it could actually answer depends entirely on what a future vehicle integration is permitted to read — so these are the questions we are designing towards, not features that work today.",
  examples: [
    "What's my range?",
    "Find the nearest fast charger.",
    "Prepare the cabin for my trip.",
    "Start my preferred audio profile.",
    "How much battery will I have when I reach?",
  ],
  caveat:
    "Mahindra's TEQ_Talk, built with Google Gemini, already answers questions like these in the factory car. A Motorbotz assistant would only be worth building for things TEQ_Talk cannot reach — our own components, our own service history, our own build.",
};

export type DriveMode = { slug: string; name: string; blurb: string };

export const DRIVE_MODES: DriveMode[] = [
  { slug: "city", name: "CITY", blurb: "Efficiency-focused. Softer response, stronger regeneration." },
  { slug: "sport", name: "SPORT", blurb: "Sharper response for a driver who wants it." },
  { slug: "long-range", name: "LONG RANGE", blurb: "Range-conscious climate and drivetrain settings." },
  { slug: "night", name: "NIGHT", blurb: "Cabin and ambient lighting configuration for driving after dark." },
  { slug: "road-trip", name: "ROAD TRIP", blurb: "Charging plan, navigation and cabin preparation together." },
  { slug: "guardian", name: "GUARDIAN", blurb: "Security-oriented configuration for leaving the car somewhere unfamiliar." },
];

export const DRIVE_MODES_NOTICE =
  "These are MOTORBOTZ concepts, not factory drive modes. Mahindra's own TEQ_Drive provides Custom Drive Mode, Drift Mode and Tribe Drive on the factory car. Nothing here modifies or replaces them.";

/* ------------------------------------------------------------------ */
/* FACTORY vs MOTORBOTZ                                                */
/* ------------------------------------------------------------------ */

export type ComparisonRow = {
  label: string;
  factory: string;
  motorbotz: string;
  /** Marks the row as describing something not yet real on our side. */
  conceptual?: boolean;
};

export const COMPARISON: ComparisonRow[] = [
  { label: "Factory powertrain", factory: "Yes", motorbotz: "Yes — unmodified" },
  { label: "Factory battery and warranty", factory: "Yes", motorbotz: "Yes — untouched" },
  { label: "Mahindra MAIA / TEQ suites", factory: "Yes", motorbotz: "Yes — factory software, unmodified" },
  { label: "Custom exterior", factory: "—", motorbotz: "Motorbotz" },
  { label: "3D-printed parts", factory: "—", motorbotz: "Motorbotz" },
  { label: "Premium audio", factory: "16-speaker Harman Kardon", motorbotz: "Motorbotz DSP, amplification and damping over it" },
  { label: "PPF and coating", factory: "Accessory", motorbotz: "Motorbotz" },
  { label: "Custom interior", factory: "Accessory", motorbotz: "Motorbotz" },
  { label: "Vehicle security", factory: "TEQ_Secure, Secure360 Pro, digital key", motorbotz: "Motorbotz concept, additional to it", conceptual: true },
  { label: "AI features", factory: "MAIA architecture, six TEQ suites", motorbotz: "Motorbotz concept, separate software", conceptual: true },
  { label: "Ballistic protection", factory: "—", motorbotz: "Concept — untested, uncertified", conceptual: true },
  { label: "Post-quantum security", factory: "—", motorbotz: "Concept — architecture study only", conceptual: true },
];

export const COMPARISON_NOTICE =
  "Rows marked as concept are not production-ready and cannot be bought. Nothing in the MOTORBOTZ column is a Mahindra feature.";

/* ------------------------------------------------------------------ */
/* WAITLIST                                                            */
/* ------------------------------------------------------------------ */

export const WAITLIST_BUDGETS = [
  "Under ₹25 lakh",
  "₹25–30 lakh",
  "₹30–40 lakh",
  "₹40 lakh+",
  "Prefer not to say",
];

export const LE_SECTIONS = [
  "Exterior",
  "Interior",
  "Technology",
  "Security",
  "Audio",
  "AI",
  "3D-printed components",
  "PPF",
  "Wheels",
  "Custom lighting",
  "Build process",
  "Expected launch",
  "Join waitlist",
];

export const EXPECTED_LAUNCH = {
  headline: "Expected launch",
  body:
    "No launch date has been set. The concept moves when the parts move — the Lab pipeline on this page is the real status, and it is the same board we work from internally.",
};
