/**
 * MAHINDRA BE 6 — FACTORY SPECIFICATIONS, FEATURES AND SYSTEMS
 *
 * Same rule as ./factory: sourced or absent. A spec row whose figure Mahindra
 * has not published renders as "awaiting official figure" rather than an
 * interpolation, and the reason is carried on the row itself so the page can
 * explain the gap instead of hiding it.
 */

import { BATTERIES } from "./factory";

/** A figure we can stand behind, or an explicit admission that we cannot. */
export type SpecValue =
  | { kind: "value"; value: string; sourceId: string }
  | { kind: "pending"; reason: string; flagId?: string };

export const val = (value: string, sourceId: string): SpecValue => ({ kind: "value", value, sourceId });
export const pending = (reason: string, flagId?: string): SpecValue => ({ kind: "pending", reason, flagId });

export type SpecRow = { label: string; value: SpecValue; note?: string };
export type SpecGroup = {
  slug: string;
  title: string;
  caption: string;
  rows: SpecRow[];
};

export const SPEC_GROUPS: SpecGroup[] = [
  {
    slug: "powertrain",
    title: "POWERTRAIN",
    caption: "One motor, driven axle at the rear, three pack sizes.",
    rows: [
      { label: "Motor", value: val("Single electric motor", "mahindra-brochure") },
      { label: "Drive configuration", value: val("Rear-wheel drive", "mahindra-brochure") },
      {
        label: "Power",
        value: val("170 kW · 180 kW · 210 kW", "mahindra-brochure"),
        note: "59 kWh · 70 kWh · 79 kWh respectively",
      },
      { label: "Torque", value: val("380 Nm on all three packs", "mahindra-brochure") },
      { label: "Battery options", value: val("59 kWh · 70 kWh · 79 kWh", "mahindra-brochure") },
      {
        label: "Factory drive modes",
        value: val("Default, Range, Everyday, Race, Custom and Snow", "mahindra-brochure"),
        note: "These six are Mahindra's. Any Riderzpro drive mode is a separate concept and is labelled as one.",
      },
      { label: "Regeneration", value: val("L0, L1, L2, L3 — plus Auto from THREE upward. Single-pedal drive across the range.", "mahindra-brochure") },
      {
        label: "Cell chemistry",
        value: pending("Mahindra has not published the cell chemistry for the SPORTEQ packs in the material we hold."),
      },
      {
        label: "0–100 km/h",
        value: val("6.44 s — Formula E Freedom Edition with Acceleration Boost", "mahindra-pr-sporteq"),
        note: "This is the edition-specific figure Mahindra quotes. Per-variant acceleration times for the rest of the range are not published.",
      },
      { label: "Turning circle", value: val("10 m diameter", "mahindra-brochure") },
    ],
  },
  {
    slug: "range",
    title: "RANGE",
    caption: "Certified figures exactly as Mahindra states them — and a separate, clearly-labelled real-world view.",
    rows: [
      { label: "59 kWh — certified", value: val("548 km (MIDC Part 1 + Part 2)", "mahindra-brochure") },
      { label: "70 kWh — certified", value: val("651 km (MIDC Part 1 + Part 2)", "mahindra-brochure") },
      { label: "79 kWh — certified", value: val("683 km (MIDC Part 1 + Part 2)", "mahindra-brochure") },
      {
        label: "Range recovery",
        value: val("Revive and Revive SOS — additional range at 0% charge to reach the nearest charger; Revive SOS is limited to five uses over the vehicle's lifetime", "mahindra-brochure"),
      },
    ],
  },
  {
    slug: "charging",
    title: "CHARGING",
    caption: "Rates and times as published. Where a time has not been published, the row says so.",
    rows: [
      { label: "DC fast charge — 59 kWh", value: val("20–80% in 20 min with a 140 kW / 400 A charger", "mahindra-brochure") },
      { label: "DC fast charge — 70 kWh", value: val("20–80% in 20 min with a 160 kW / 400 A charger", "mahindra-brochure") },
      { label: "DC fast charge — 79 kWh", value: val("20–80% in 20 min with a 180 kW / 400 A charger", "mahindra-brochure") },
      { label: "Charging standard", value: val("CCS2", "mahindra-brochure") },
      { label: "Portable charger", value: val("13 A, up to 3.2 kW, on a 3-pin 16 A socket", "mahindra-brochure") },
      {
        label: "AC wall charger",
        value: val("7.2 kW or 11.2 kW", "mahindra-brochure"),
        note: "Mahindra lists the 7.2 kW wall charger as an accessory.",
      },
      { label: "AC full charge — 59 kWh", value: val("6 h at 11.2 kW · 8.7 h at 7.2 kW", "mahindra-brochure") },
      { label: "AC full charge — 70 kWh", value: val("7 h at 11.2 kW · 10.2 h at 7.2 kW", "mahindra-brochure") },
      { label: "AC full charge — 79 kWh", value: val("8 h at 11.2 kW · 11.7 h at 7.2 kW", "mahindra-brochure") },
      {
        label: "Charger in the price",
        value: val("No — prices exclude the wall charger and its installation", "mahindra-pr-sporteq"),
      },
    ],
  },
  {
    slug: "dimensions",
    title: "DIMENSIONS",
    caption: "Body and packaging.",
    rows: [
      { label: "Length", value: val("4,371 mm", "mahindra-brochure") },
      { label: "Width", value: val("1,907 mm", "mahindra-brochure") },
      { label: "Height", value: val("1,627 mm", "mahindra-brochure") },
      { label: "Wheelbase", value: val("2,775 mm", "mahindra-brochure") },
      { label: "Ground clearance", value: val("207 mm unladen — 222 mm at the battery", "mahindra-brochure") },
      { label: "Boot", value: val("455 litres (VDA ISO V211)", "mahindra-brochure") },
      { label: "Frunk", value: val("45 litres", "mahindra-brochure") },
    ],
  },
  {
    slug: "weight",
    title: "WEIGHT",
    caption: "The one place the published figures genuinely conflict.",
    rows: [
      {
        label: "Kerb weight",
        value: pending(
          "Not given in the official brochure, and the figures circulating in the press disagree by more than 300 kg.",
          "kerb-weight",
        ),
      },
      { label: "Gross vehicle weight", value: pending("Not published in the material we hold.") },
    ],
  },
  {
    slug: "chassis",
    title: "CHASSIS & WHEELS",
    caption: "Factory rolling stock and suspension. Riderzpro alternatives are a separate list, never mixed into this one.",
    rows: [
      { label: "Steering", value: val("Electric power steering with variable gear ratio", "mahindra-brochure") },
      { label: "Front suspension", value: val("McPherson strut i-Link independent, with stabiliser bar", "mahindra-brochure") },
      { label: "Rear suspension", value: val("Multi-link (5-link) independent, with stabiliser bar", "mahindra-brochure") },
      {
        label: "Damping",
        value: val("Passive with FDD and MTV-CL tech; Intelligent Adaptive Suspension on FOUR, LAUNCH EDITION and the Formula E editions", "mahindra-brochure"),
      },
      {
        label: "Wheels",
        value: val("ONE: R18 aero covers · TWO: R19 stylised with aero covers · THREE, THREE+, FOUR, LAUNCH EDITION: R19 alloys · FE and FE FOUR: R20 alloys", "mahindra-brochure"),
        note: "The Launch Edition on the brochure cover wears optional R20s.",
      },
      { label: "Tyres", value: val("Low rolling resistance", "mahindra-brochure") },
      {
        label: "Tyre sizes",
        value: pending("Section widths and profiles are not given in the brochure."),
        note: "Riderzpro will not validate a wheel or tyre fitment against an unpublished factory size.",
      },
      { label: "Brakes", value: val("All-wheel disc, brake-by-wire, intelligent electronic brake booster", "mahindra-brochure") },
    ],
  },
  {
    slug: "safety",
    title: "SAFETY",
    caption: "Crash performance and driver assistance.",
    rows: [
      { label: "Bharat NCAP", value: val("5 stars", "wikipedia-be6") },
      { label: "Adult occupant protection", value: val("31.97 / 32", "wikipedia-be6") },
      { label: "Child occupant protection", value: val("45 / 49", "wikipedia-be6") },
      {
        label: "Airbags",
        value: val("6 from ONE; a knee airbag is added on FOUR, LAUNCH EDITION and FE FOUR", "mahindra-brochure"),
      },
      {
        label: "Driver assistance",
        value: val("L2 ADAS (1 radar, 1 camera) from THREE · L2+ ADAS (5 radar, 1 camera) on FOUR, LAUNCH EDITION and FE FOUR", "mahindra-brochure"),
      },
      { label: "Cameras", value: val("540-degree camera from THREE upward", "mahindra-brochure") },
      { label: "Other", value: val("ESP, electronic parking brake, driver drowsiness detection, iTPMS, tyre inflator", "mahindra-brochure") },
    ],
  },
  {
    slug: "warranty",
    title: "WARRANTY",
    caption: "Mahindra's cover on the expensive part.",
    rows: [
      {
        label: "Battery — first registered owner",
        value: val("Lifetime warranty", "mahindra-brochure"),
        note: "Mahindra states this applies to private registration only.",
      },
      {
        label: "Battery — on change of ownership",
        value: val("10 years or 2,00,000 km, whichever is earlier", "mahindra-brochure"),
      },
      {
        label: "Vehicle warranty",
        value: pending("Standard vehicle warranty terms for the SPORTEQ not confirmed from official material."),
      },
    ],
  },
];

/**
 * TEQ SUITES
 *
 * Mahindra's own in-car software, built on its MAIA architecture. This matters
 * for more than completeness: the factory car now genuinely ships AI features,
 * so any Riderzpro AI concept has to be visibly separated from these six or
 * the customer will reasonably assume we are describing the same thing.
 */
export type TeqSuite = {
  slug: string;
  name: string;
  summary: string;
  points: string[];
  sourceId: string;
};

export const TEQ_SUITES: TeqSuite[] = [
  {
    slug: "teq-talk",
    name: "TEQ_Talk",
    summary: "The voice layer, built with Google Gemini.",
    points: [
      "17 specialised AI agents",
      "Over 100 core vehicle functions",
      "48 apps spanning vehicle controls, navigation, music and news",
    ],
    sourceId: "autocarpro-sporteq",
  },
  {
    slug: "teq-play",
    name: "TEQ_Play",
    summary: "Entertainment, including two firsts for an Indian manufacturer.",
    points: [
      "Karaoke mode",
      "In-car gaming with bring-your-own-device support",
      "Private Audio, Dolby Vision and Dolby Atmos",
      "GrooveMe Party and Milestone",
    ],
    sourceId: "autocarpro-sporteq",
  },
  {
    slug: "teq-drive",
    name: "TEQ_Drive",
    summary: "Driving modes and the energy reserve.",
    points: [
      "Custom Drive Mode",
      "Drift Mode",
      "Tribe Drive",
      "Revive and Revive SOS — 13 km of reserve after 0%, up to five times over the pack's life",
    ],
    sourceId: "autocarpro-sporteq",
  },
  {
    slug: "teq-me",
    name: "TEQ_Me",
    summary: "Driver recognition and personalisation.",
    points: [
      "Recognises the driver on approach and loads their profile",
      "Seat position and climate preferences",
      "Charge scheduler",
      "Cabin pre-cooling before you get in",
    ],
    sourceId: "autocarpro-sporteq",
  },
  {
    slug: "teq-secure",
    name: "TEQ_Secure",
    summary: "Factory security and digital keys.",
    points: [
      "Secure360 Pro live monitoring with intrusion alerts",
      "Third-screen parental lock",
      "NFC and Digital Car Key across iPhone, Apple Watch, Android, Samsung and NFC key cards",
      "Car Connectivity Consortium compliant",
    ],
    sourceId: "autocarpro-sporteq",
  },
  {
    slug: "teq-xting",
    name: "TEQ_xting",
    summary: "Personalised tailgate messaging.",
    points: ["Programmable message display on the tailgate"],
    sourceId: "autocarpro-sporteq",
  },
];

/**
 * FEATURE EXPLAINERS — "what does this actually do?"
 *
 * `availability` is deliberately loose. Where Mahindra's variant chart has not
 * been verified line by line, the feature says so instead of asserting a tier.
 * An unconfirmed availability is not a defect in the data; it is the honest
 * state of it until the official chart is checked.
 */
export type FeatureAvailability =
  | { kind: "confirmed"; text: string; sourceId: string }
  | { kind: "unconfirmed"; text: string; flagId?: string };

export type FactoryFeature = {
  slug: string;
  name: string;
  group: "Cockpit" | "Comfort" | "Audio" | "Safety" | "Security" | "Drive";
  /** Plain description of the mechanism. */
  what: string;
  /** Why a person driving it would care. */
  why: string;
  availability: FeatureAvailability;
  sourceId: string;
};

export const FACTORY_FEATURES: FactoryFeature[] = [
  {
    slug: "three-screen-cockpit",
    name: "Three-screen coast-to-coast cockpit",
    group: "Cockpit",
    what: "Three 12.3-inch displays across the dashboard: instrument cluster, central infotainment, and a screen in front of the passenger.",
    why: "The passenger screen takes navigation and media off the driver's display, so the person driving keeps a clean instrument view on a long run.",
    availability: {
      kind: "confirmed",
      text: "TWO upward. ONE gets two screens; the Formula E editions keep two even at the top of the range.",
      sourceId: "mahindra-brochure",
    },
    sourceId: "mahindra-brochure",
  },
  {
    slug: "harman-kardon",
    name: "16-speaker Harman Kardon audio",
    group: "Audio",
    what: "1,400 watts through sixteen drivers, tuned to the cabin. Mahindra states this is the first EV in India with Dolby Vision and Dolby Atmos.",
    why: "It is a genuinely capable factory system, and the baseline our audio team measures against before recommending any change.",
    availability: { kind: "confirmed", text: "TWO upward", sourceId: "mahindra-brochure" },
    sourceId: "mahindra-brochure",
  },
  {
    slug: "adas",
    name: "Level 2+ ADAS",
    group: "Safety",
    what: "Camera and radar driver assistance that holds distance in a lane and intervenes on some hazards. THREE gets L2 with one radar and one camera; FOUR, LAUNCH EDITION and FE FOUR get L2+ with five radars.",
    why: "It reduces workload in traffic and on highways. It assists — it does not drive the car, and it does not remove the need to steer and watch.",
    availability: { kind: "confirmed", text: "L2 from THREE · L2+ on FOUR, LAUNCH EDITION and FE FOUR", sourceId: "mahindra-brochure" },
    sourceId: "mahindra-brochure",
  },
  {
    slug: "camera-540",
    name: "540-degree camera",
    group: "Safety",
    what: "Surround-view cameras that also render a view of the ground under the front of the car.",
    why: "It is the difference between guessing at a kerb and seeing it — worth a lot on a 1,907 mm-wide vehicle in Indian parking.",
    availability: { kind: "confirmed", text: "THREE upward", sourceId: "mahindra-brochure" },
    sourceId: "mahindra-brochure",
  },
  {
    slug: "digital-key",
    name: "Digital Car Key",
    group: "Security",
    what: "Phone, watch or NFC card acts as the key, built to Car Connectivity Consortium specifications.",
    why: "Access can be given and taken back without handing over a physical key.",
    availability: { kind: "confirmed", text: "Part of TEQ_Secure", sourceId: "mahindra-pr-sporteq" },
    sourceId: "mahindra-pr-sporteq",
  },
  {
    slug: "secure-360-pro",
    name: "Secure360 Pro",
    group: "Security",
    what: "Live monitoring of the vehicle with intrusion alerts pushed to the owner.",
    why: "It tells you something happened while you were away, which is most of what vehicle security is actually for.",
    availability: { kind: "confirmed", text: "Part of TEQ_Secure", sourceId: "mahindra-pr-sporteq" },
    sourceId: "autocarpro-sporteq",
  },
  {
    slug: "revive",
    name: "Revive and Revive SOS",
    group: "Drive",
    what: "Holds back a reserve that releases roughly 13 km of range after the gauge reads zero, usable up to five times in the pack's life.",
    why: "It converts the worst moment in EV ownership into a recoverable one.",
    availability: { kind: "confirmed", text: "Part of TEQ_Drive", sourceId: "autocarpro-sporteq" },
    sourceId: "autocarpro-sporteq",
  },
  {
    slug: "drift-mode",
    name: "Drift Mode",
    group: "Drive",
    what: "A factory drive mode that permits controlled rear-axle slip.",
    why: "It is a closed-surface feature. Worth knowing it is factory — so that nobody credits it to an aftermarket tune.",
    availability: { kind: "confirmed", text: "Part of TEQ_Drive", sourceId: "autocarpro-sporteq" },
    sourceId: "autocarpro-sporteq",
  },
  {
    slug: "comfort-pack",
    name: "Seat, climate and charging comfort",
    group: "Comfort",
    what: "Six-way powered driver's seat with memory and ventilated front seats from THREE; dual-zone climate and the first wireless charger from TWO; a second wireless charger and the Infinity fixed-glass panoramic roof higher up.",
    why: "The memory seat and the ventilation are the two that matter most day to day in an Indian summer.",
    availability: { kind: "confirmed", text: "Builds up from TWO to FOUR", sourceId: "mahindra-brochure" },
    sourceId: "mahindra-brochure",
  },
];

/**
 * INTERACTIVE EXPLORER HOTSPOTS
 *
 * Positioned as percentages over the schematic. Each one only carries facts we
 * hold; where the fact would have to come from the owner's manual, the hotspot
 * says the manual has not been supplied rather than inventing the answer.
 */
export type Hotspot = {
  slug: string;
  label: string;
  /** Percentage position over the schematic viewport. */
  x: number;
  y: number;
  view: "exterior" | "interior";
  body: string;
  sourceId?: string;
  /** Set where the answer properly belongs to the owner's manual. */
  needsManual?: boolean;
};

export const HOTSPOTS: Hotspot[] = [
  {
    slug: "headlamps",
    label: "Headlamps",
    x: 16,
    y: 46,
    view: "exterior",
    body: "The BE 6's lighting signature is one of the most recognisable things about the car. Riderzpro will not alter the factory headlamp function — see the Light Lab note on road legality.",
  },
  {
    slug: "wheels",
    label: "Wheels",
    x: 30,
    y: 74,
    view: "exterior",
    body: "R18 aero covers on ONE, R19 with aero covers on TWO, R19 alloys from THREE up, and R20 alloys on the Formula E editions.",
    sourceId: "mahindra-brochure",
  },
  {
    slug: "charge-port",
    label: "Charging port",
    x: 78,
    y: 52,
    view: "exterior",
    body: "CCS2. Takes 140 kW, 160 kW or 180 kW DC depending on the pack — 20 to 80% in 20 minutes on all three — and 7.2 kW or 11.2 kW AC from the wall charger.",
    sourceId: "mahindra-brochure",
  },
  {
    slug: "frunk",
    label: "Frunk",
    x: 22,
    y: 34,
    view: "exterior",
    body: "45 litres of storage under the bonnet, in addition to the 455-litre boot.",
    sourceId: "mahindra-brochure",
  },
  {
    slug: "boot",
    label: "Boot",
    x: 86,
    y: 40,
    view: "exterior",
    body: "455 litres to VDA ISO V211, with a power tailgate and gesture control higher up the range. The tail lamps also carry TEQ_xting, Mahindra's personalised LED text display.",
    sourceId: "mahindra-brochure",
  },
  {
    slug: "cameras",
    label: "Cameras & sensors",
    x: 52,
    y: 28,
    view: "exterior",
    body: "540-degree camera coverage from THREE, and the radar set behind L2 and L2+ ADAS.",
    sourceId: "mahindra-brochure",
  },
  {
    slug: "dashboard",
    label: "Dashboard",
    x: 46,
    y: 40,
    view: "interior",
    body: "Coast-to-coast triple 31.24 cm screens from TWO upward. ONE runs two, and so do the Formula E editions.",
    sourceId: "mahindra-brochure",
  },
  {
    slug: "seats",
    label: "Seats",
    x: 62,
    y: 62,
    view: "interior",
    body: "Ventilated front seats with a six-way powered driver's seat and memory, from THREE upward.",
    sourceId: "mahindra-brochure",
  },
  {
    slug: "audio",
    label: "Audio",
    x: 24,
    y: 58,
    view: "interior",
    body: "1,400 W through 16 Harman Kardon speakers, with Dolby Atmos and Dolby Vision through TEQ_Play.",
    sourceId: "mahindra-brochure",
  },
  {
    slug: "controls",
    label: "Controls & indicators",
    x: 34,
    y: 46,
    view: "interior",
    body: "",
    needsManual: true,
  },
  {
    slug: "roof",
    label: "Panoramic roof",
    x: 50,
    y: 18,
    view: "interior",
    body: "Infinity Roof — fixed glass panoramic, with an LED pattern on the top variants.",
    sourceId: "mahindra-brochure",
  },
];

/**
 * The brief asks for the official owner's manual to be the reference for
 * controls, charging procedure, maintenance, displays, driving modes, systems,
 * emergency procedures and terminology. No manual has been supplied to this
 * project, so those sections are built and left deliberately empty.
 */
export const MANUAL_STATUS = {
  supplied: false,
  headline: "Owner's manual not supplied",
  body:
    "The controls, maintenance, emergency-procedure and indicator sections are built and ready to be populated from the official BE 6 owner's manual. Until that document is supplied, nothing is written into them. Mahindra's brochure is a marketing document and is not a substitute — it says nothing about emergency procedures or service intervals.",
  covers: [
    "Vehicle controls",
    "Safety warnings",
    "Charging procedure",
    "Maintenance schedule",
    "Display and indicator meanings",
    "Driving modes",
    "Vehicle systems",
    "Emergency procedures",
    "Technical terminology",
  ],
};

/** Real-world range, kept structurally separate from the certified figure. */
export const REAL_WORLD_RANGE = {
  headline: "Certified is not the same as real-world",
  body:
    "MIDC Part 1 + Part 2 is a laboratory cycle: the right number for comparing two cars, the wrong one for planning a journey. Mahindra's own brochure quotes a separate real-world figure of 500+ km, measured internally at moderate ambient temperature, in city driving, with low HVAC load, on a dry road, in the optimal drive mode — which is to say, on a good day.",
  officialRealWorld: "500+ km",
  estimates: BATTERIES.map((b) => ({
    label: b.label,
    certified: b.certifiedRangeKm,
  })),
  note:
    "Both figures above are Mahindra's. Riderzpro does not publish a real-world estimate of its own until we have driven a customer's car on their own route.",
};
