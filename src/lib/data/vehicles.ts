/**
 * Vehicle catalogue that powers fitment ("What do you drive?"), the build
 * configurator, the marketplace filters and the SEO landing pages.
 */

export type Segment = "mass" | "premium" | "luxury";

export type Model = {
  slug: string;
  name: string;
  /** Body style used for accessory + service recommendations. */
  body: "Hatchback" | "Sedan" | "SUV" | "MUV" | "Pickup" | "Off-Roader" | "Coupe";
  years: number[];
  variants: string[];
  /** Off-road capable platforms unlock the 4x4 catalogue. */
  offroad?: boolean;
  /** Models we publish a dedicated accessories landing page for. */
  landing?: boolean;
  blurb?: string;
};

export type Brand = {
  slug: string;
  name: string;
  segment: Segment;
  models: Model[];
};

const yr = (from: number, to = 2026) =>
  Array.from({ length: to - from + 1 }, (_, i) => to - i);

export const BRANDS: Brand[] = [
  {
    slug: "mahindra",
    name: "Mahindra",
    segment: "mass",
    models: [
      {
        slug: "thar",
        name: "Thar",
        body: "Off-Roader",
        years: yr(2020),
        variants: ["AX Opt 4x4", "LX 4x2 Petrol", "LX 4x4 Diesel", "Earth Edition"],
        offroad: true,
        landing: true,
        blurb:
          "India's most modified vehicle. Lift kits, alloys, snorkels, recovery gear, audio and full interiors — all fitment-tested on the 2020+ platform.",
      },
      {
        slug: "thar-roxx",
        name: "Thar Roxx",
        body: "SUV",
        years: yr(2024),
        variants: ["MX1", "MX3", "AX5L", "AX7L 4x4"],
        offroad: true,
        landing: true,
      },
      {
        slug: "scorpio-n",
        name: "Scorpio N",
        body: "SUV",
        years: yr(2022),
        variants: ["Z2", "Z4", "Z6", "Z8", "Z8L 4x4"],
        offroad: true,
        landing: true,
        blurb:
          "The big-bruiser SUV. Our Scorpio N catalogue covers lighting, protection, captain-seat conversions and Sony-beating audio rebuilds.",
      },
      {
        slug: "xuv700",
        name: "XUV700",
        body: "SUV",
        years: yr(2021),
        variants: ["MX", "AX3", "AX5", "AX7", "AX7L"],
        landing: true,
      },
      { slug: "bolero", name: "Bolero", body: "SUV", years: yr(2018), variants: ["B4", "B6", "B6 Opt"] },
      { slug: "xuv3xo", name: "XUV 3XO", body: "SUV", years: yr(2024), variants: ["MX1", "MX3", "AX5L", "AX7L"] },
    ],
  },
  {
    slug: "maruti-suzuki",
    name: "Maruti Suzuki",
    segment: "mass",
    models: [
      {
        slug: "jimny",
        name: "Jimny",
        body: "Off-Roader",
        years: yr(2023),
        variants: ["Zeta MT", "Zeta AT", "Alpha MT", "Alpha AT"],
        offroad: true,
        landing: true,
      },
      { slug: "brezza", name: "Brezza", body: "SUV", years: yr(2016), variants: ["LXi", "VXi", "ZXi", "ZXi+"], landing: true },
      { slug: "grand-vitara", name: "Grand Vitara", body: "SUV", years: yr(2022), variants: ["Sigma", "Delta", "Zeta", "Alpha"] },
      { slug: "swift", name: "Swift", body: "Hatchback", years: yr(2018), variants: ["LXi", "VXi", "ZXi", "ZXi+"], landing: true },
      { slug: "baleno", name: "Baleno", body: "Hatchback", years: yr(2015), variants: ["Sigma", "Delta", "Zeta", "Alpha"] },
      { slug: "ertiga", name: "Ertiga", body: "MUV", years: yr(2018), variants: ["LXi", "VXi", "ZXi", "ZXi+"] },
      { slug: "fronx", name: "Fronx", body: "SUV", years: yr(2023), variants: ["Sigma", "Delta", "Delta+", "Alpha"] },
    ],
  },
  {
    slug: "toyota",
    name: "Toyota",
    segment: "mass",
    models: [
      {
        slug: "fortuner",
        name: "Fortuner",
        body: "SUV",
        years: yr(2016),
        variants: ["2.7 Petrol 4x2", "2.8 Diesel 4x2 AT", "2.8 4x4 MT", "Legender", "GR-S"],
        offroad: true,
        landing: true,
        blurb:
          "The default flagship SUV in India. Lift kits, PPF, captain seats, DSP audio and Legender-look conversions for 2016 onwards.",
      },
      { slug: "hilux", name: "Hilux", body: "Pickup", years: yr(2022), variants: ["Standard 4x4", "High 4x4 MT", "High 4x4 AT"], offroad: true, landing: true },
      { slug: "innova-crysta", name: "Innova Crysta", body: "MUV", years: yr(2016), variants: ["GX", "VX", "ZX"], landing: true },
      { slug: "innova-hycross", name: "Innova Hycross", body: "MUV", years: yr(2023), variants: ["GX", "VX", "ZX", "ZX(O)"] },
      { slug: "urban-cruiser-hyryder", name: "Urban Cruiser Hyryder", body: "SUV", years: yr(2022), variants: ["E", "S", "G", "V"] },
      { slug: "land-cruiser", name: "Land Cruiser", body: "SUV", years: yr(2018), variants: ["LC300 ZX", "LC Prado"], offroad: true },
    ],
  },
  {
    slug: "hyundai",
    name: "Hyundai",
    segment: "mass",
    models: [
      {
        slug: "creta",
        name: "Creta",
        body: "SUV",
        years: yr(2015),
        variants: ["E", "EX", "S", "SX", "SX(O)", "SX(O) Turbo DCT", "N Line N8"],
        landing: true,
        blurb:
          "India's best-selling mid SUV, and our most requested facelift conversion. 2020 Creta to 2024 Creta look in five working days.",
      },
      { slug: "venue", name: "Venue", body: "SUV", years: yr(2019), variants: ["E", "S", "S+", "SX", "SX(O)"], landing: true },
      { slug: "verna", name: "Verna", body: "Sedan", years: yr(2017), variants: ["EX", "S", "SX", "SX(O) Turbo"] },
      { slug: "i20", name: "i20", body: "Hatchback", years: yr(2020), variants: ["Era", "Magna", "Sportz", "Asta(O)", "N Line N8"] },
      { slug: "alcazar", name: "Alcazar", body: "SUV", years: yr(2021), variants: ["Prestige", "Platinum", "Signature"] },
      { slug: "tucson", name: "Tucson", body: "SUV", years: yr(2022), variants: ["Platinum", "Signature AWD"] },
    ],
  },
  {
    slug: "tata",
    name: "Tata",
    segment: "mass",
    models: [
      { slug: "harrier", name: "Harrier", body: "SUV", years: yr(2019), variants: ["Smart", "Pure", "Adventure", "Fearless", "XZ+ Dark"], landing: true },
      { slug: "safari", name: "Safari", body: "SUV", years: yr(2021), variants: ["Smart", "Pure", "Adventure", "Accomplished"] },
      { slug: "nexon", name: "Nexon", body: "SUV", years: yr(2017), variants: ["Smart", "Pure", "Creative", "Fearless+"], landing: true },
      { slug: "punch", name: "Punch", body: "SUV", years: yr(2021), variants: ["Pure", "Adventure", "Accomplished"] },
      { slug: "curvv", name: "Curvv", body: "SUV", years: yr(2024), variants: ["Smart", "Pure", "Creative", "Accomplished"] },
    ],
  },
  {
    slug: "kia",
    name: "Kia",
    segment: "mass",
    models: [
      { slug: "seltos", name: "Seltos", body: "SUV", years: yr(2019), variants: ["HTE", "HTK", "HTK+", "HTX", "GTX+"], landing: true },
      { slug: "sonet", name: "Sonet", body: "SUV", years: yr(2020), variants: ["HTE", "HTK", "HTX", "GTX+"] },
      { slug: "carens", name: "Carens", body: "MUV", years: yr(2022), variants: ["Premium", "Prestige", "Luxury", "Luxury Plus"] },
      { slug: "syros", name: "Syros", body: "SUV", years: yr(2025), variants: ["HTK", "HTK+", "HTX", "HTX+"] },
    ],
  },
  {
    slug: "honda",
    name: "Honda",
    segment: "mass",
    models: [
      { slug: "city", name: "City", body: "Sedan", years: yr(2014), variants: ["SV", "V", "VX", "ZX"], landing: true },
      { slug: "elevate", name: "Elevate", body: "SUV", years: yr(2023), variants: ["SV", "V", "VX", "ZX"] },
      { slug: "amaze", name: "Amaze", body: "Sedan", years: yr(2018), variants: ["E", "S", "VX"] },
    ],
  },
  {
    slug: "force",
    name: "Force",
    segment: "mass",
    models: [
      { slug: "gurkha", name: "Gurkha", body: "Off-Roader", years: yr(2021), variants: ["3-Door 4x4", "5-Door 4x4"], offroad: true, landing: true },
    ],
  },
  {
    slug: "isuzu",
    name: "Isuzu",
    segment: "mass",
    models: [
      { slug: "d-max-v-cross", name: "D-Max V-Cross", body: "Pickup", years: yr(2016), variants: ["Standard", "Z", "Z Prestige"], offroad: true, landing: true },
    ],
  },
  { slug: "renault", name: "Renault", segment: "mass", models: [
    { slug: "kiger", name: "Kiger", body: "SUV", years: yr(2021), variants: ["RXE", "RXL", "RXT", "RXZ"] },
    { slug: "triber", name: "Triber", body: "MUV", years: yr(2019), variants: ["RXE", "RXL", "RXT", "RXZ"] },
  ] },
  { slug: "nissan", name: "Nissan", segment: "mass", models: [
    { slug: "magnite", name: "Magnite", body: "SUV", years: yr(2020), variants: ["XE", "XL", "XV", "XV Premium"] },
  ] },
  { slug: "volkswagen", name: "Volkswagen", segment: "premium", models: [
    { slug: "taigun", name: "Taigun", body: "SUV", years: yr(2021), variants: ["Comfortline", "Highline", "Topline", "GT Plus"], landing: true },
    { slug: "virtus", name: "Virtus", body: "Sedan", years: yr(2022), variants: ["Comfortline", "Highline", "Topline", "GT Plus"] },
    { slug: "polo", name: "Polo", body: "Hatchback", years: yr(2014, 2022), variants: ["Trendline", "Comfortline", "Highline+", "GT TSI"] },
  ] },
  { slug: "skoda", name: "Skoda", segment: "premium", models: [
    { slug: "kushaq", name: "Kushaq", body: "SUV", years: yr(2021), variants: ["Active", "Ambition", "Style", "Monte Carlo"] },
    { slug: "slavia", name: "Slavia", body: "Sedan", years: yr(2022), variants: ["Active", "Ambition", "Style"] },
    { slug: "kodiaq", name: "Kodiaq", body: "SUV", years: yr(2017), variants: ["Style", "L&K", "Sportline"] },
  ] },
  { slug: "mg", name: "MG", segment: "premium", models: [
    { slug: "hector", name: "Hector", body: "SUV", years: yr(2019), variants: ["Style", "Shine", "Smart", "Sharp Pro"] },
    { slug: "gloster", name: "Gloster", body: "SUV", years: yr(2020), variants: ["Super", "Smart", "Sharp", "Savvy 4x4"], offroad: true },
    { slug: "zs-ev", name: "ZS EV", body: "SUV", years: yr(2020), variants: ["Excite", "Exclusive", "Essence"] },
  ] },
  { slug: "jeep", name: "Jeep", segment: "premium", models: [
    { slug: "compass", name: "Compass", body: "SUV", years: yr(2017), variants: ["Sport", "Longitude", "Limited", "Trailhawk 4x4"], offroad: true, landing: true },
    { slug: "meridian", name: "Meridian", body: "SUV", years: yr(2022), variants: ["Limited", "Limited(O)", "Overland 4x4"], offroad: true },
    { slug: "wrangler", name: "Wrangler", body: "Off-Roader", years: yr(2018), variants: ["Unlimited", "Rubicon"], offroad: true, landing: true },
  ] },
  { slug: "bmw", name: "BMW", segment: "luxury", models: [
    { slug: "3-series", name: "3 Series", body: "Sedan", years: yr(2016), variants: ["320d Sport", "330i M Sport", "330Li"], landing: true },
    { slug: "5-series", name: "5 Series", body: "Sedan", years: yr(2017), variants: ["530i M Sport", "530d"] },
    { slug: "x1", name: "X1", body: "SUV", years: yr(2016), variants: ["sDrive20i", "sDrive18d M Sport"] },
    { slug: "x5", name: "X5", body: "SUV", years: yr(2019), variants: ["xDrive30d", "xDrive40i M Sport"], offroad: true },
  ] },
  { slug: "mercedes-benz", name: "Mercedes-Benz", segment: "luxury", models: [
    { slug: "c-class", name: "C-Class", body: "Sedan", years: yr(2015), variants: ["C200", "C300d AMG Line"] },
    { slug: "glc", name: "GLC", body: "SUV", years: yr(2016), variants: ["220d 4MATIC", "300d AMG Line"], landing: true },
    { slug: "gle", name: "GLE", body: "SUV", years: yr(2019), variants: ["300d 4MATIC", "450 4MATIC"], offroad: true },
    { slug: "g-class", name: "G-Class", body: "Off-Roader", years: yr(2019), variants: ["G350d", "G63 AMG"], offroad: true },
  ] },
  { slug: "audi", name: "Audi", segment: "luxury", models: [
    { slug: "q3", name: "Q3", body: "SUV", years: yr(2019), variants: ["Premium Plus", "Technology"] },
    { slug: "q7", name: "Q7", body: "SUV", years: yr(2016), variants: ["45 TFSI Premium Plus", "45 TFSI Technology"], offroad: true },
    { slug: "a4", name: "A4", body: "Sedan", years: yr(2016), variants: ["Premium Plus", "Technology"] },
  ] },
  { slug: "land-rover", name: "Land Rover", segment: "luxury", models: [
    { slug: "defender", name: "Defender", body: "Off-Roader", years: yr(2020), variants: ["90 S", "110 SE", "110 X-Dynamic"], offroad: true, landing: true },
    { slug: "discovery-sport", name: "Discovery Sport", body: "SUV", years: yr(2015), variants: ["S", "SE", "HSE"], offroad: true },
    { slug: "range-rover-evoque", name: "Range Rover Evoque", body: "SUV", years: yr(2016), variants: ["S", "SE", "R-Dynamic"], offroad: true },
  ] },
  { slug: "volvo", name: "Volvo", segment: "luxury", models: [
    { slug: "xc60", name: "XC60", body: "SUV", years: yr(2018), variants: ["Inscription", "Ultimate B5"], offroad: true },
    { slug: "xc90", name: "XC90", body: "SUV", years: yr(2016), variants: ["Inscription", "Ultimate B6 AWD"], offroad: true },
  ] },
  { slug: "jaguar", name: "Jaguar", segment: "luxury", models: [
    { slug: "f-pace", name: "F-Pace", body: "SUV", years: yr(2017), variants: ["Prestige", "R-Dynamic S"] },
    { slug: "xf", name: "XF", body: "Sedan", years: yr(2016), variants: ["Prestige", "Portfolio"] },
  ] },
  { slug: "lexus", name: "Lexus", segment: "luxury", models: [
    { slug: "nx", name: "NX", body: "SUV", years: yr(2018), variants: ["Exquisite", "Luxury", "F-Sport"] },
    { slug: "es", name: "ES", body: "Sedan", years: yr(2018), variants: ["Exquisite", "Luxury"] },
  ] },
  { slug: "porsche", name: "Porsche", segment: "luxury", models: [
    { slug: "macan", name: "Macan", body: "SUV", years: yr(2017), variants: ["Base", "S", "GTS"] },
    { slug: "cayenne", name: "Cayenne", body: "SUV", years: yr(2018), variants: ["Base", "S", "Coupe"], offroad: true },
  ] },
  { slug: "mini", name: "MINI", segment: "luxury", models: [
    { slug: "cooper-s", name: "Cooper S", body: "Hatchback", years: yr(2016), variants: ["3-Door", "5-Door", "JCW"] },
    { slug: "countryman", name: "Countryman", body: "SUV", years: yr(2018), variants: ["Cooper S", "JCW ALL4"] },
  ] },
  { slug: "byd", name: "BYD", segment: "premium", models: [
    { slug: "atto-3", name: "Atto 3", body: "SUV", years: yr(2022), variants: ["Dynamic", "Premium", "Superior"] },
    { slug: "seal", name: "Seal", body: "Sedan", years: yr(2024), variants: ["Dynamic", "Premium", "Performance AWD"] },
  ] },
];

export const ALL_MODELS = BRANDS.flatMap((b) =>
  b.models.map((m) => ({ ...m, brand: b.name, brandSlug: b.slug, segment: b.segment })),
);

export type CatalogModel = (typeof ALL_MODELS)[number];

export const LANDING_MODELS = ALL_MODELS.filter((m) => m.landing);

export function findModel(brandSlug: string, modelSlug: string): CatalogModel | undefined {
  return ALL_MODELS.find((m) => m.brandSlug === brandSlug && m.slug === modelSlug);
}

export function findModelBySlug(modelSlug: string): CatalogModel | undefined {
  return ALL_MODELS.find((m) => m.slug === modelSlug);
}
