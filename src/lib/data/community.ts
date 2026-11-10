import type { MediaKey } from "@/lib/media";

export type Build = {
  slug: string;
  title: string;
  vehicle: string;
  owner: string;
  city: string;
  cost: number;
  weeks: number;
  brief: string;
  image: MediaKey;
  gallery: MediaKey[];
  mods: { group: string; items: string[] }[];
  shop: string[];
  tag: "Off-Road" | "Street" | "Audio" | "Luxury" | "Performance";
};

export const BUILDS: Build[] = [
  {
    slug: "thar-overland-project-dust",
    title: "PROJECT DUST",
    vehicle: "2022 Mahindra Thar LX 4x4",
    owner: "Aditya R.",
    city: "Bengaluru",
    cost: 6_40_000,
    weeks: 5,
    brief:
      "Built for eight days of Spiti with two people, a dog and everything they needed to sleep and cook. Nothing on this car is decorative.",
    image: "defenderSaltFlat",
    gallery: ["defenderSaltFlat", "suvDesertRocks", "suvGrille", "suvSnowRoad"],
    mods: [
      { group: "Suspension", items: ["2-inch progressive lift", "Remote reservoir dampers", "Heavy-duty load springs"] },
      { group: "Wheels", items: ["16\" steel wheels", "255/85 R16 mud-terrain", "Spare carrier on tyre door"] },
      { group: "Protection", items: ["Steel bull bar", "Rock sliders", "Full skid plate set", "Diff guard"] },
      { group: "Recovery", items: ["12,000 lb winch", "Kinetic rope kit", "Recovery boards", "Chassis recovery points"] },
      { group: "Expedition", items: ["Platform roof rack", "Hard-shell roof tent", "270° awning", "40L drawer system", "Dual battery with 200 W solar"] },
      { group: "Lighting", items: ["22\" LED bar", "Dual pod lights", "Rear work light"] },
    ],
    shop: ["2-inch-lift-kit", "recovery-boards-pair", "12000lb-winch-synthetic", "expedition-roof-rack-platform"],
    tag: "Off-Road",
  },
  {
    slug: "fortuner-blackout",
    title: "BLACKOUT",
    vehicle: "2021 Toyota Fortuner Legender",
    owner: "Karthik S.",
    city: "Hyderabad",
    cost: 8_95_000,
    weeks: 7,
    brief:
      "Every piece of chrome deleted, a full lounge interior in the second row, and a DSP audio build that measures flat to 40 Hz.",
    image: "suvSnowRoad",
    gallery: ["suvSnowRoad", "cockpitScreen", "chromeGrille", "estateRear"],
    mods: [
      { group: "Exterior", items: ["Full chrome delete in satin black", "Gloss black grille", "20\" forged alloys", "Smoked lamp treatment"] },
      { group: "Protection", items: ["Full-body PPF with self-healing top coat", "Ceramic top layer"] },
      { group: "Interior", items: ["Nappa leather with diamond stitch", "Captain seats with electric recline", "Automatic footrests", "Alcantara roof lining", "64-colour ambient lighting"] },
      { group: "Audio", items: ["3-way active front stage", "8-channel DSP amplifier", "Sealed 10\" subwoofer", "Full-cabin deadening"] },
    ],
    shop: ["riderzpro-signature-component-set", "8-channel-dsp-amplifier", "custom-fit-seat-covers-leatherette"],
    tag: "Luxury",
  },
  {
    slug: "polo-gt-street",
    title: "POCKET ROCKET",
    vehicle: "2020 Volkswagen Polo GT TSI",
    owner: "Nikhil M.",
    city: "Pune",
    cost: 3_25_000,
    weeks: 3,
    brief:
      "A daily-driven GT TSI that runs 138 bhp, sits on coilovers set to a usable height, and still clears every speed breaker in Kharadi.",
    image: "cityNightRain",
    gallery: ["cityNightRain", "coupeGrey", "engineBay", "tailLightBokeh"],
    mods: [
      { group: "Engine", items: ["Stage 1 ECU remap — 138 bhp / 230 Nm", "Closed-box cold air intake", "Uprated intercooler"] },
      { group: "Exhaust", items: ["Cat-back stainless with valve", "Twin 89 mm tips"] },
      { group: "Chassis", items: ["Adjustable coilovers, 35 mm drop", "Rear anti-roll bar", "Front strut brace"] },
      { group: "Wheels", items: ["16\" flow-formed alloys", "195/50 R16 performance tyres"] },
      { group: "Audio", items: ["Component front stage", "300 W 4-channel amplifier", "Four-door deadening"] },
    ],
    shop: ["stage-1-ecu-remap", "cold-air-intake-system", "cat-back-exhaust-system", "coilover-suspension-kit"],
    tag: "Performance",
  },
  {
    slug: "scorpio-n-sound-lab",
    title: "SOUND LAB",
    vehicle: "2023 Mahindra Scorpio N Z8L",
    owner: "Rehan A.",
    city: "Chennai",
    cost: 4_80_000,
    weeks: 4,
    brief:
      "A Signature audio build with fibreglass A-pillars trimmed in the factory leather. Measured, tuned and documented — the owner has the RTA plots.",
    image: "steeringNight",
    gallery: ["steeringNight", "speakerCone", "studioMonitors", "cockpitScreen"],
    mods: [
      { group: "Front stage", items: ["Custom fibreglass A-pillar pods", "3-way active: 6.5\" midbass, 3\" midrange, 28 mm tweeter"] },
      { group: "Processing", items: ["8-channel DSP with 96 kHz processing", "Optical input from head unit", "Per-driver time alignment"] },
      { group: "Bass", items: ["Sealed 10\" subwoofer under the third row", "Dedicated mono amplifier"] },
      { group: "Electrical", items: ["Big three upgrade", "Second battery with isolator", "Distribution block and 70 mm² runs"] },
      { group: "Acoustics", items: ["Full-cabin butyl deadening", "Closed-cell foam decoupler", "Boot floor treatment"] },
    ],
    shop: ["riderzpro-signature-component-set", "8-channel-dsp-amplifier", "sound-deadening-kit-4-door"],
    tag: "Audio",
  },
  {
    slug: "creta-facelift-refresh",
    title: "SECOND LIFE",
    vehicle: "2020 Hyundai Creta SX(O)",
    owner: "Priya D.",
    city: "Mumbai",
    cost: 2_35_000,
    weeks: 2,
    brief:
      "A four-year-old Creta turned into the current one for a fraction of the cost of changing cars. Panel gaps checked with a feeler gauge.",
    image: "crossoverTeal",
    gallery: ["crossoverTeal", "frontGrilleRed", "cockpitScreen", "openRoadRear"],
    mods: [
      { group: "Front", items: ["2024 bumper with parametric grille", "Quad-beam LED headlamps", "Connected DRL bar"] },
      { group: "Rear", items: ["Connected LED tail lamp bar", "Rear bumper and skid plate"] },
      { group: "Wheels", items: ["17\" diamond-cut alloys", "215/60 R17"] },
      { group: "Interior", items: ["12.3\" Android head unit", "Ambient lighting", "9D floor mats"] },
      { group: "Protection", items: ["Front-end PPF", "9H ceramic coating"] },
    ],
    shop: ["12-inch-android-head-unit", "riderzpro-9d-floor-mats", "suv-ambient-lighting-kit"],
    tag: "Street",
  },
  {
    slug: "gurkha-expedition-rig",
    title: "BASECAMP",
    vehicle: "2023 Force Gurkha 4x4",
    owner: "Team Riderzpro",
    city: "Nagpur",
    cost: 5_60_000,
    weeks: 6,
    brief:
      "Our own shop truck. Every part on it is something we sell, and it has been to Ladakh twice to prove the point.",
    image: "suvDesertRocks",
    gallery: ["suvDesertRocks", "defenderSaltFlat", "wagonRoofBox", "suvGrille"],
    mods: [
      { group: "Breathing", items: ["Raised air intake snorkel, pressure-tested"] },
      { group: "Suspension", items: ["Heavy-duty springs", "Rebuildable dampers"] },
      { group: "Wheels", items: ["16\" steel wheels", "235/85 R16 mud-terrain"] },
      { group: "Expedition", items: ["Roof rack with jerry-can mounts", "20L water tank", "Fridge slide", "Dual battery"] },
      { group: "Lighting", items: ["Dual 5\" pod lights", "Rear work light", "Rock lights"] },
    ],
    shop: ["raised-air-intake-snorkel", "expedition-roof-rack-platform", "portable-air-compressor", "all-terrain-tyre-set"],
    tag: "Off-Road",
  },
];

export function getBuild(slug: string): Build | undefined {
  return BUILDS.find((b) => b.slug === slug);
}

// Customer reviews and the site's headline numbers come from the database: src/lib/server/reviews.ts.
