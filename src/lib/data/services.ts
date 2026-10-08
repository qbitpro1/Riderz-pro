import type { MediaKey } from "@/lib/media";

/* ------------------------------------------------------------------ audio */

export type AudioPackage = {
  slug: string;
  name: string;
  tagline: string;
  price: number;
  priceNote: string;
  duration: string;
  includes: string[];
  bestFor: string;
  highlight?: boolean;
};

export const AUDIO_PACKAGES: AudioPackage[] = [
  {
    slug: "daily-driver",
    name: "DAILY DRIVER",
    tagline: "The honest first upgrade",
    price: 24_900,
    priceNote: "installed",
    duration: "1 day",
    bestFor: "Factory system that sounds thin and distorts past half volume",
    includes: [
      "Coaxial front and rear speakers",
      "Front-door butyl deadening",
      "Factory head unit retained and re-levelled",
      "Basic EQ set on the road, not on a bench",
    ],
  },
  {
    slug: "street",
    name: "STREET",
    tagline: "Balanced, loud, still liveable",
    price: 64_900,
    priceNote: "installed",
    duration: "2 days",
    bestFor: "Daily driving with real bass and clean vocals at highway speed",
    includes: [
      "6.5\" component front stage with A-pillar tweeters",
      "4-channel amplifier, 75 W RMS per channel",
      "10\" under-seat active subwoofer",
      "Four-door deadening with foam decoupler",
      "Time alignment and EQ on the factory head unit",
    ],
    highlight: true,
  },
  {
    slug: "premium",
    name: "PREMIUM",
    tagline: "DSP, staging, control",
    price: 1_74_900,
    priceNote: "installed",
    duration: "3–4 days",
    bestFor: "Owners who want a soundstage sitting on the dashboard, not in the doors",
    includes: [
      "Riderzpro Signature 3-way front stage",
      "8-channel DSP amplifier with per-driver time alignment",
      "Sealed 10\" subwoofer in a custom-built enclosure",
      "Full-cabin deadening — doors, floor, boot, wheel arches",
      "Measured tune with RTA, plus a free re-tune after 30 days",
    ],
  },
  {
    slug: "signature",
    name: "SIGNATURE",
    tagline: "Audiophile-grade custom build",
    price: 4_50_000,
    priceNote: "starting, build to brief",
    duration: "3–6 weeks",
    bestFor: "Competition-grade or reference listening, in a road car",
    includes: [
      "Custom fibreglass A-pillars and door pods, trimmed to match your interior",
      "Active 3-way or 4-way with dedicated amplification per driver",
      "Reference DSP with 96 kHz processing and optical input",
      "Full electrical rebuild — big three upgrade, second battery, distribution",
      "Two tuning sessions with the lead engineer and a measurement report",
    ],
  },
];

export const AUDIO_STAGES = [
  {
    key: "source",
    label: "Source",
    options: [
      { name: "Retain factory head unit", price: 0 },
      { name: "12.3\" Android QLED head unit", price: 29_900 },
      { name: "Reference DSP with optical input", price: 42_900 },
    ],
  },
  {
    key: "front",
    label: "Front stage",
    options: [
      { name: "Coaxial 6.5\"", price: 8900 },
      { name: "2-way component 6.5\"", price: 18_900 },
      { name: "Signature 3-way (mid + midrange + tweeter)", price: 54_900 },
    ],
  },
  {
    key: "amp",
    label: "Amplification",
    options: [
      { name: "None — head unit power", price: 0 },
      { name: "4-channel, 75 W RMS", price: 21_900 },
      { name: "8-channel DSP amplifier", price: 42_900 },
    ],
  },
  {
    key: "sub",
    label: "Subwoofer",
    options: [
      { name: "None", price: 0 },
      { name: "10\" active under-seat", price: 16_900 },
      { name: "10\" sealed custom enclosure", price: 32_900 },
      { name: "12\" ported competition build", price: 58_900 },
    ],
  },
  {
    key: "deadening",
    label: "Sound deadening",
    options: [
      { name: "Front doors only", price: 6900 },
      { name: "All four doors", price: 11_900 },
      { name: "Full cabin — doors, floor, boot, arches", price: 34_900 },
    ],
  },
] as const;

/* --------------------------------------------------------- PPF & detailing */

export type DetailService = {
  slug: string;
  name: string;
  price: number;
  priceNote: string;
  duration: string;
  warranty: string;
  blurb: string;
  includes: string[];
  image: MediaKey;
  category: "protection" | "correction" | "wrap";
};

export const DETAIL_SERVICES: DetailService[] = [
  {
    slug: "paint-protection-film",
    name: "Paint Protection Film",
    price: 1_45_000,
    priceNote: "full body, hatchback onwards",
    duration: "4–6 days",
    warranty: "10 years against yellowing and cracking",
    blurb:
      "TPU film with a self-healing top coat, cut on a plotter from your model's pattern and wrapped around every edge so there is no visible film line.",
    includes: [
      "Full paint decontamination and single-stage correction first",
      "Plotter-cut panels with wrapped edges — no exposed lines",
      "Self-healing top coat, 200 micron",
      "Front-end-only and high-impact-zone options available",
      "Ceramic top coat over the film included",
    ],
    image: "wrapHeatGun",
    category: "protection",
  },
  {
    slug: "ceramic-coating",
    name: "9H Ceramic Coating",
    price: 34_900,
    priceNote: "sedan / compact SUV",
    duration: "2–3 days",
    warranty: "5 years with annual inspection",
    blurb:
      "A real SiO₂ coating over corrected paint. Water sheets off, dust stops sticking, and washing takes half the time for the next five years.",
    includes: [
      "Two-stage paint correction before coating",
      "Iron and tar decontamination, clay treatment",
      "9H SiO₂ base coat plus hydrophobic top layer",
      "Glass, wheels and trim coated",
      "Aftercare kit and wash instructions",
    ],
    image: "detailingPolish",
    category: "protection",
  },
  {
    slug: "graphene-coating",
    name: "Graphene Coating",
    price: 49_900,
    priceNote: "sedan / compact SUV",
    duration: "3 days",
    warranty: "7 years with annual inspection",
    blurb:
      "Graphene-infused chemistry that runs cooler than standard ceramic — noticeably fewer water spots in Indian summer parking.",
    includes: [
      "Three-stage paint correction",
      "Graphene-infused base with 7-year chemistry",
      "Reduced surface temperature, fewer water spots",
      "Wheel faces, barrels and glass included",
      "Annual maintenance detail at 40% off",
    ],
    image: "washBay",
    category: "protection",
  },
  {
    slug: "paint-correction",
    name: "Paint Correction",
    price: 18_900,
    priceNote: "two-stage, sedan",
    duration: "2 days",
    warranty: "—",
    blurb:
      "Swirls, holograms and wash marks cut back under inspection lighting with paint-depth readings taken on every panel first.",
    includes: [
      "Paint depth gauge readings recorded per panel",
      "Compound and polish stages with measured cut",
      "Trim and badge masking, no compound residue",
      "Before-and-after under inspection lights",
    ],
    image: "detailingPolish",
    category: "correction",
  },
  {
    slug: "interior-detailing",
    name: "Interior Detailing",
    price: 12_900,
    priceNote: "full cabin",
    duration: "1 day",
    warranty: "—",
    blurb:
      "Steam extraction on fabric, pH-correct cleaner and conditioner on leather, and every vent, rail and seam done by hand.",
    includes: [
      "Hot-water extraction on fabric and carpets",
      "Leather cleaned and conditioned, not silicone-sprayed",
      "Headliner, vents, rails and seat rails detailed",
      "Anti-microbial AC evaporator treatment",
      "Odour removal with ozone if required",
    ],
    image: "cockpitScreen",
    category: "correction",
  },
  {
    slug: "headlight-restoration",
    name: "Headlight Restoration",
    price: 4900,
    priceNote: "pair",
    duration: "4 hours",
    warranty: "2 years on UV clear coat",
    blurb:
      "Wet-sanded through five grits and finished with a proper 2K UV clear — not a polish that yellows again in four months.",
    includes: [
      "Five-stage wet sanding",
      "Machine polish to optical clarity",
      "2K UV-stable clear coat, oven cured",
      "Beam pattern rechecked after refit",
    ],
    image: "chromeGrille",
    category: "correction",
  },
  {
    slug: "colour-change-wrap",
    name: "Colour Change Wrap",
    price: 1_25_000,
    priceNote: "full body, gloss or satin",
    duration: "5–7 days",
    warranty: "5 years on film, 2 years on installation",
    blurb:
      "Cast vinyl in over 200 finishes, wrapped with panels removed so there is no film edge visible when a door is open.",
    includes: [
      "Handles, mirrors and lamps removed for a true wrap",
      "Cast vinyl — gloss, satin, matte, metallic or colour-shift",
      "Original paint fully preserved underneath",
      "Post-heat and inspection after 48 hours",
    ],
    image: "cityNightRain",
    category: "wrap",
  },
  {
    slug: "chrome-delete",
    name: "Chrome Delete / De-Chrome",
    price: 18_900,
    priceNote: "full exterior brightwork",
    duration: "2 days",
    warranty: "3 years on film",
    blurb:
      "Every piece of exterior brightwork wrapped in gloss or satin black — window surrounds, grille slats, handles, badges and roof rails.",
    includes: [
      "Window surrounds, pillars and belt-line trim",
      "Grille slats, badges and handle inserts",
      "Gloss black, satin black or body colour",
      "Fully reversible, original trim untouched",
    ],
    image: "estateRear",
    category: "wrap",
  },
];

/* ---------------------------------------------------- body kits & facelift */

export type FaceliftConversion = {
  slug: string;
  from: string;
  to: string;
  modelSlug: string;
  price: number;
  duration: string;
  includes: string[];
  image: MediaKey;
  popular?: boolean;
};

export const FACELIFT_CONVERSIONS: FaceliftConversion[] = [
  {
    slug: "creta-2020-to-2024",
    from: "Hyundai Creta 2020–2023",
    to: "2024 Creta facelift look",
    modelSlug: "creta",
    price: 1_45_000,
    duration: "5–7 days",
    includes: [
      "Front bumper with parametric grille",
      "Quad-beam LED headlamp conversion with connected DRL",
      "Connected LED tail lamp bar",
      "Rear bumper and skid plate",
      "Bonnet garnish, painted to your colour code",
    ],
    image: "crossoverTeal",
    popular: true,
  },
  {
    slug: "fortuner-2016-to-legender",
    from: "Toyota Fortuner 2016–2020",
    to: "Legender look",
    modelSlug: "fortuner",
    price: 2_95_000,
    duration: "8–10 days",
    includes: [
      "Legender front bumper and grille assembly",
      "Twin LED projector headlamp conversion",
      "Sequential LED tail lamps",
      "Rear bumper with reflector garnish",
      "Legender-spec alloy wheels (optional)",
    ],
    image: "suvSnowRoad",
    popular: true,
  },
  {
    slug: "swift-2018-to-2024",
    from: "Maruti Swift 2018–2023",
    to: "2024 Swift look",
    modelSlug: "swift",
    price: 68_000,
    duration: "4–5 days",
    includes: [
      "Front bumper and honeycomb grille",
      "LED projector headlamp conversion",
      "Rear bumper with diffuser",
      "Roof spoiler and side skirts",
    ],
    image: "cityNightRain",
  },
  {
    slug: "city-2017-to-2023",
    from: "Honda City 2014–2019",
    to: "2023 City look",
    modelSlug: "city",
    price: 1_15_000,
    duration: "6–7 days",
    includes: [
      "Front bumper, grille and bonnet garnish",
      "LED projector headlamp conversion",
      "Full LED tail lamp set",
      "Rear bumper with chrome garnish",
    ],
    image: "luxurySaloonMotion",
  },
  {
    slug: "thar-body-kit",
    from: "Mahindra Thar 2020+",
    to: "Wide-arch off-road kit",
    modelSlug: "thar",
    price: 1_65_000,
    duration: "6–8 days",
    includes: [
      "Wide fender flares with rivet detail",
      "Steel front bumper with winch cradle",
      "Rear tyre carrier and step bumper",
      "Bonnet scoop and side decals",
      "Painted or textured black finish",
    ],
    image: "suvDesertRocks",
    popular: true,
  },
  {
    slug: "scorpio-n-black-pack",
    from: "Mahindra Scorpio N",
    to: "Blacked-out street pack",
    modelSlug: "scorpio-n",
    price: 1_25_000,
    duration: "5–6 days",
    includes: [
      "Gloss black grille and full chrome delete",
      "Body kit — front lip, side skirts, rear diffuser",
      "Smoked lamp treatment",
      "18\" black alloy wheels (optional)",
    ],
    image: "suvGrille",
  },
];

export const BODY_KIT_SERVICES = [
  "Facelift conversions",
  "Front bumper conversion",
  "Rear bumper conversion",
  "Grille conversion",
  "Headlamp conversion",
  "DRL conversion",
  "Tail lamp conversion",
  "Body kits",
  "Spoilers",
  "Fender upgrades",
  "Exhaust tips",
  "Custom paint",
  "Wraps",
];

/* --------------------------------------------------------------- off-road */

export type ServiceGroup = {
  slug: string;
  name: string;
  blurb: string;
  items: { name: string; from: number }[];
  image: MediaKey;
};

export const OFFROAD_GROUPS: ServiceGroup[] = [
  {
    slug: "suspension",
    name: "SUSPENSION",
    blurb: "Lift with the geometry corrected, not just spacers under the springs.",
    items: [
      { name: "2-inch progressive lift kit", from: 54_900 },
      { name: "Heavy-duty load springs", from: 22_900 },
      { name: "Remote-reservoir dampers", from: 78_000 },
      { name: "Long-travel setup", from: 1_85_000 },
    ],
    image: "defenderSaltFlat",
  },
  {
    slug: "protection",
    name: "PROTECTION",
    blurb: "Steel where it counts, mounted to the chassis and rated to take a hit.",
    items: [
      { name: "Full underbody skid plate set", from: 38_000 },
      { name: "Steel rock sliders", from: 26_900 },
      { name: "Bull bar with recovery points", from: 42_000 },
      { name: "Diff and tank guards", from: 14_500 },
    ],
    image: "suvGrille",
  },
  {
    slug: "recovery",
    name: "RECOVERY",
    blurb: "Rated gear, rated mounting points, and the training to use both.",
    items: [
      { name: "12,000 lb winch, fitted", from: 62_900 },
      { name: "Recovery boards (pair)", from: 8900 },
      { name: "Kinetic rope and soft shackles", from: 7500 },
      { name: "Chassis-rated recovery points", from: 12_900 },
    ],
    image: "suvDesertRocks",
  },
  {
    slug: "expedition",
    name: "EXPEDITION",
    blurb: "Sleep, cook, charge and carry — everything for multi-day travel.",
    items: [
      { name: "Platform roof rack", from: 44_900 },
      { name: "Hard-shell roof tent", from: 1_85_000 },
      { name: "Drawer and fridge slide system", from: 96_000 },
      { name: "Dual battery with 200 W solar", from: 68_000 },
      { name: "270° awning", from: 34_000 },
    ],
    image: "wagonRoofBox",
  },
];

/* ------------------------------------------------------------- interiors */

export const INTERIOR_SERVICES = [
  { name: "Custom leather upholstery", from: 89_000, note: "Full cabin, Italian hide" },
  { name: "Alcantara trim package", from: 1_45_000, note: "Roof lining, pillars, door inserts" },
  { name: "Diamond stitching", from: 68_000, note: "Seats, doors, dashboard" },
  { name: "Ventilated seat conversion", from: 54_000, note: "Front pair, factory-style controls" },
  { name: "Heated seat conversion", from: 32_000, note: "Front pair, three-stage" },
  { name: "Captain seat conversion", from: 1_25_000, note: "Middle row, MUV and 7-seat SUV" },
  { name: "Electric recliner seats", from: 2_45_000, note: "With memory and lumbar" },
  { name: "Automatic footrest", from: 38_000, note: "Rear seat, electrically deployed" },
  { name: "Custom door panels", from: 72_000, note: "Trimmed, lit, speaker-integrated" },
  { name: "Roof lining replacement", from: 34_000, note: "Alcantara or perforated leather" },
  { name: "Ambient lighting", from: 8900, note: "64-colour, concealed fibre optic" },
  { name: "Steering wheel customisation", from: 24_000, note: "Leather, alcantara or carbon" },
  { name: "Dashboard customisation", from: 88_000, note: "Wrapped, stitched or veneered" },
  { name: "Rear entertainment", from: 96_000, note: "Twin headrest or roof-mount screens" },
  { name: "Luxury SUV conversion", from: 6_50_000, note: "Complete lounge-spec rebuild" },
];

/* ----------------------------------------------------------- performance */

export const PERFORMANCE_SERVICES = [
  { name: "ECU remapping — Stage 1", from: 34_900, gain: "+20–30% torque" },
  { name: "ECU remapping — Stage 2", from: 62_000, gain: "With intake and exhaust" },
  { name: "Performance exhaust", from: 46_900, gain: "+5–12 bhp" },
  { name: "Cold air intake", from: 18_900, gain: "+4–8 bhp" },
  { name: "Turbo upgrade", from: 2_45_000, gain: "Platform dependent" },
  { name: "Intercooler upgrade", from: 68_000, gain: "−18 °C intake temps" },
  { name: "Cooling package", from: 42_000, gain: "Radiator, oil cooler, fans" },
  { name: "Big brake kit", from: 89_900, gain: "−6 m from 100 km/h" },
  { name: "Coilover suspension", from: 74_900, gain: "32-way adjustable" },
  { name: "Dyno testing and tuning", from: 12_000, gain: "Per session, sheet included" },
];

export const PERFORMANCE_DISCLAIMER =
  "Performance modifications must comply with the Central Motor Vehicles Rules and your state RTO's requirements. Riderzpro retains all emissions equipment, keeps sound output within CMVR limits, archives your original ECU map, and will advise where an endorsement or re-certification is required before we begin work. We do not remove catalytic converters, DPFs or any emissions hardware.";

/* --------------------------------------------------------------- garage */

export const GARAGE_SERVICES = [
  { name: "Accessory installation", blurb: "Anything bought from us, fitted the same day." },
  { name: "Modification builds", blurb: "Bumpers, kits, lighting, wide-arch conversions." },
  { name: "Detailing", blurb: "Correction, coating and interior restoration bays." },
  { name: "PPF", blurb: "Dust-controlled room with plotter-cut patterns." },
  { name: "Audio", blurb: "Dedicated bay with an RTA rig and a tuning room." },
  { name: "Performance", blurb: "Dyno, remapping, exhaust fabrication, braking." },
  { name: "Off-road builds", blurb: "Two-post and four-post lifts, welding bay." },
  { name: "Interior customisation", blurb: "In-house trim shop and upholstery." },
  { name: "Electrical work", blurb: "Harnesses, relays, dual battery, diagnostics." },
];

export const APPOINTMENT_SERVICES = [
  "Accessory installation",
  "Car audio",
  "PPF / ceramic coating",
  "Detailing",
  "Body kit / facelift",
  "Off-road build",
  "Custom interiors",
  "Performance / ECU tuning",
  "General inspection",
  "Something else",
];
