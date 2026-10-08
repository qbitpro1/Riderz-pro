// Carries the dealer price (`dp`): importing this from a client component fails the build.
import "server-only";

/**
 * AUTOFORM SEAT COVER CATALOGUE
 *
 * Built from two source documents, both supplied by the customer:
 *
 *   [PRICE]  "Autoform Dealer SAM price & MRP Price List 22nd Sep 2025.xlsx"
 *   [CAT24]  "Autoform Product Catalogue 2024.pdf" (image-only, no text layer —
 *            pages rendered and read visually; design pages are 5–24)
 *
 * Every field below carries the document it came from. The price list is the
 * pricing authority; the catalogue is the design and imagery authority. Nothing
 * is inferred from one to fill a gap in the other, and nothing is invented.
 *
 * The one thing neither document contains is per-model vehicle fitment. Autoform
 * seat covers are made to the vehicle, and the price list distinguishes only
 * 2-row from 3-row. So compatibility is expressed the way the source expresses
 * it — by seat rows — and model-level fitment is confirmed at booking rather
 * than guessed here.
 */

export type SourceDoc = "PRICE" | "CAT24" | "NEWCAT";

export const SOURCE_DOCS: Record<SourceDoc, { name: string; dated: string; note: string }> = {
  PRICE: {
    name: "Autoform Dealer SAM price & MRP Price List",
    dated: "22 September 2025",
    note: "Series-level dealer and MRP pricing, split by 2-row and 3-row. Also carries accessories and mats pricing.",
  },
  CAT24: {
    name: "Autoform Product Catalogue 2024",
    dated: "2024",
    note: "Image-only PDF, 46 pages. Seat cover designs on pages 5–24; accessories from page 25. Pages rendered and read visually — there is no text layer to extract.",
  },
  NEWCAT: {
    name: "New Catalog — Brand Store Exclusive Designs",
    dated: "supplied 2025",
    note: "Image-only PDF. Not yet read — see the verification queue.",
  },
};

/* --------------------------------------------------------------- pricing */

/**
 * [PRICE] The price list is organised by series band, not per design. Each band
 * gives a dealer price and an MRP for a 2-row car and a 3-row car.
 */
export type PriceBand = {
  id: string;
  series: string;
  seriesGroup: "ECO" | "PREMIUM";
  /** Design names exactly as printed in the price list row. */
  designsListed: string[];
  twoRow: { dp: number; mrp: number };
  threeRow: { dp: number; mrp: number };
  source: SourceDoc;
};

export const PRICE_BANDS: PriceBand[] = [
  {
    id: "eco-lucenzo",
    series: "Autoform Eco Series (Lucenzo)",
    seriesGroup: "ECO",
    designsListed: ["AMAZE+", "DUO+", "E1", "E2", "E4", "E5", "D3", "D5", "Q2", "H CROSS", "FOCUS", "HIGHWAY", "ARROW"],
    twoRow: { dp: 6555, mrp: 11069 },
    threeRow: { dp: 8182, mrp: 14999 },
    source: "PRICE",
  },
  {
    id: "sports",
    series: "Sports Series",
    seriesGroup: "PREMIUM",
    designsListed: ["SPORTS SERIES"],
    twoRow: { dp: 7584, mrp: 14999 },
    threeRow: { dp: 10083, mrp: 19999 },
    source: "PRICE",
  },
  {
    id: "signature",
    series: "Signature Series",
    seriesGroup: "PREMIUM",
    designsListed: [
      "SIGNATURE SERIES", "LADDER", "BLADE", "VOLT", "H GRAND", "NAVIGATION PLUS", "X-CROSS",
      "POLO", "XCLUSIVE", "XCLUSIVE+", "LIMITED SERIES", "RIVIERA SERIES", "IMPRESS",
    ],
    twoRow: { dp: 9417, mrp: 17079 },
    threeRow: { dp: 11717, mrp: 22999 },
    source: "PRICE",
  },
  {
    id: "emporio",
    series: "Emporio",
    seriesGroup: "PREMIUM",
    designsListed: ["EMPORIO"],
    twoRow: { dp: 11062, mrp: 19799 },
    threeRow: { dp: 15699, mrp: 28579 },
    source: "PRICE",
  },
  {
    id: "oe-riviera-tnt",
    series: "OE-Riviera / TNT Series",
    seriesGroup: "PREMIUM",
    designsListed: ["OE- RIVIERA", "TNT SERIES"],
    twoRow: { dp: 12468, mrp: 24939 },
    threeRow: { dp: 17823, mrp: 35649 },
    source: "PRICE",
  },
];

/** [PRICE] "Custom Charges Applicable On All Desing : Rs 895 Including 18% GST" */
export const CUSTOM_CHARGE = { amount: 895, note: "Custom charges applicable on all designs, including 18% GST.", source: "PRICE" as const };

/** [PRICE] "PRICE WITH GS 99+GST Logistic Charges & Installation charges extra" */
export const PRICE_NOTES = [
  "Dealer pricing is quoted inclusive of transport logistics.",
  "Logistics charges and installation charges are extra, as stated on the price list.",
  "Custom charges of ₹895 (incl. 18% GST) apply on all designs.",
];

/* --------------------------------------------------------------- designs */

export type SeatRows = 2 | 3;

export type AutoformDesign = {
  /** Exactly as printed on the catalogue page. Never reformatted. */
  code: string;
  slug: string;
  /** Tagline printed on the catalogue page. */
  tagline: string;
  /** Which price band row lists this design, and under what name. */
  bandId: string;
  listedAs: string;
  /** Catalogue page the design appears on. */
  page: number;
  image: string;
  imageSource: string;
  sources: SourceDoc[];
};

/**
 * [CAT24 pages 5–24] Read from the rendered catalogue pages. `listedAs` is the
 * name used in the [PRICE] sheet, which differs slightly in punctuation — both
 * are kept so the mapping is auditable rather than assumed.
 */
export const DESIGNS: AutoformDesign[] = [
  { code: "E-2", slug: "e-2", tagline: "Emboss it Hexa", bandId: "eco-lucenzo", listedAs: "E2", page: 5, image: "/autoform/designs/e-2.jpg", imageSource: "CAT24 p.5", sources: ["CAT24", "PRICE"] },
  { code: "E-4", slug: "e-4", tagline: "Emboss it Straight", bandId: "eco-lucenzo", listedAs: "E4", page: 6, image: "/autoform/designs/e-4.jpg", imageSource: "CAT24 p.6", sources: ["CAT24", "PRICE"] },
  { code: "E-5", slug: "e-5", tagline: "Emboss it Arrow", bandId: "eco-lucenzo", listedAs: "E5", page: 7, image: "/autoform/designs/e-5.jpg", imageSource: "CAT24 p.7", sources: ["CAT24", "PRICE"] },
  { code: "D-3", slug: "d-3", tagline: "Get your interiors in control", bandId: "eco-lucenzo", listedAs: "D3", page: 8, image: "/autoform/designs/d-3.jpg", imageSource: "CAT24 p.8", sources: ["CAT24", "PRICE"] },
  { code: "D-5", slug: "d-5", tagline: "Simple and Smart II", bandId: "eco-lucenzo", listedAs: "D5", page: 9, image: "/autoform/designs/d-5.jpg", imageSource: "CAT24 p.9", sources: ["CAT24", "PRICE"] },
  { code: "Q-2", slug: "q-2", tagline: "Queen's King Design", bandId: "eco-lucenzo", listedAs: "Q2", page: 10, image: "/autoform/designs/q-2.jpg", imageSource: "CAT24 p.10", sources: ["CAT24", "PRICE"] },
  { code: "H-CROSS", slug: "h-cross", tagline: "The Highway Crossing", bandId: "eco-lucenzo", listedAs: "H CROSS", page: 11, image: "/autoform/designs/h-cross.jpg", imageSource: "CAT24 p.11", sources: ["CAT24", "PRICE"] },
  { code: "U-IMRESS", slug: "u-imress", tagline: "Impress the World", bandId: "signature", listedAs: "IMPRESS", page: 12, image: "/autoform/designs/u-imress.jpg", imageSource: "CAT24 p.12", sources: ["CAT24", "PRICE"] },
  { code: "U-FOCUS", slug: "u-focus", tagline: "Focus with a new avatar", bandId: "eco-lucenzo", listedAs: "FOCUS", page: 13, image: "/autoform/designs/u-focus.jpg", imageSource: "CAT24 p.13", sources: ["CAT24", "PRICE"] },
  { code: "U-HIGHWAY", slug: "u-highway", tagline: "Enjoy the highway feeling", bandId: "eco-lucenzo", listedAs: "HIGHWAY", page: 14, image: "/autoform/designs/u-highway.jpg", imageSource: "CAT24 p.14", sources: ["CAT24", "PRICE"] },
  { code: "U-ARROW", slug: "u-arrow", tagline: "Arrow effect is the new statement", bandId: "eco-lucenzo", listedAs: "ARROW", page: 15, image: "/autoform/designs/u-arrow.jpg", imageSource: "CAT24 p.15", sources: ["CAT24", "PRICE"] },
  { code: "X-CLUSIVE", slug: "x-clusive", tagline: "Refined ride, remastered", bandId: "signature", listedAs: "XCLUSIVE", page: 16, image: "/autoform/designs/x-clusive.jpg", imageSource: "CAT24 p.16", sources: ["CAT24", "PRICE"] },
  { code: "X-CLUSIVE +", slug: "x-clusive-plus", tagline: "Elevating the ordinary", bandId: "signature", listedAs: "XCLUSIVE+", page: 17, image: "/autoform/designs/x-clusive-plus.jpg", imageSource: "CAT24 p.17", sources: ["CAT24", "PRICE"] },
  { code: "U-VOLT", slug: "u-volt", tagline: "Elevated elegance on the road", bandId: "signature", listedAs: "VOLT", page: 18, image: "/autoform/designs/u-volt.jpg", imageSource: "CAT24 p.18", sources: ["CAT24", "PRICE"] },
  { code: "U-BLADE", slug: "u-blade", tagline: "Elevate your ride sporty", bandId: "signature", listedAs: "BLADE", page: 19, image: "/autoform/designs/u-blade.jpg", imageSource: "CAT24 p.19", sources: ["CAT24", "PRICE"] },
  { code: "H-GRAND", slug: "h-grand", tagline: "Feel Grand!!", bandId: "signature", listedAs: "H GRAND", page: 20, image: "/autoform/designs/h-grand.jpg", imageSource: "CAT24 p.20", sources: ["CAT24", "PRICE"] },
  { code: "U-NAVIGATION PLUS", slug: "u-navigation-plus", tagline: "German technology, exceptional design", bandId: "signature", listedAs: "NAVIGATION PLUS", page: 21, image: "/autoform/designs/u-navigation-plus.jpg", imageSource: "CAT24 p.21", sources: ["CAT24", "PRICE"] },
  { code: "U-LADDER", slug: "u-ladder", tagline: "Race with it to success", bandId: "signature", listedAs: "LADDER", page: 22, image: "/autoform/designs/u-ladder.jpg", imageSource: "CAT24 p.22", sources: ["CAT24", "PRICE"] },
  { code: "X-CROSS", slug: "x-cross", tagline: "Let us do the cross effect", bandId: "signature", listedAs: "X-CROSS", page: 23, image: "/autoform/designs/x-cross.jpg", imageSource: "CAT24 p.23", sources: ["CAT24", "PRICE"] },
  { code: "POLO", slug: "polo", tagline: "Design that offers elegance", bandId: "signature", listedAs: "POLO", page: 24, image: "/autoform/designs/polo.jpg", imageSource: "CAT24 p.24", sources: ["CAT24", "PRICE"] },
];

/**
 * [PRICE] Named in the price list but with no page in the 2024 catalogue. They
 * are almost certainly in the Brand Store Exclusive catalogue, which has not
 * been read yet — so they are listed, priced, and held back from sale until an
 * image and a design page confirm them.
 */
export const DESIGNS_AWAITING_CATALOGUE: { listedAs: string; bandId: string }[] = [
  { listedAs: "AMAZE+", bandId: "eco-lucenzo" },
  { listedAs: "DUO+", bandId: "eco-lucenzo" },
  { listedAs: "E1", bandId: "eco-lucenzo" },
  { listedAs: "SPORTS SERIES", bandId: "sports" },
  { listedAs: "SIGNATURE SERIES", bandId: "signature" },
  { listedAs: "LIMITED SERIES", bandId: "signature" },
  { listedAs: "RIVIERA SERIES", bandId: "signature" },
  { listedAs: "EMPORIO", bandId: "emporio" },
  { listedAs: "OE- RIVIERA", bandId: "oe-riviera-tnt" },
  { listedAs: "TNT SERIES", bandId: "oe-riviera-tnt" },
];

/**
 * [CAT24] The feature icons printed on every design page. Reproduced as the
 * manufacturer states them — no interpretation, no added claims.
 */
export const DESIGN_FEATURES = [
  "UV Resistant",
  "Skin Fit",
  "Warranty",
  "Hi Recoil",
  "Dry Feel",
  "Odour Free",
];

/**
 * Things neither document states. Rendered as "Not specified by manufacturer"
 * rather than filled in — material, airbag compatibility and colour options are
 * exactly the fields a customer would be misled by.
 */
export const NOT_IN_SOURCE = [
  "Material composition",
  "Colour options per design",
  "Stitching specification",
  "Airbag compatibility",
  "Warranty period and terms",
  "Per-model vehicle fitment",
] as const;

export const NOT_SPECIFIED = "Not specified by manufacturer";

/* --------------------------------------------------------------- pricing */

export function bandFor(design: AutoformDesign): PriceBand {
  return PRICE_BANDS.find((b) => b.id === design.bandId)!;
}

/** Motorbotz retail margin off MRP. Admin-editable; DP never leaves the server. */
const DISCOUNT = 0.1;

export type DesignPrice = {
  rows: SeatRows;
  mrp: number;
  sellingPrice: number;
  discountPct: number;
  customCharge: number;
  /** Confidential. Server-side only. */
  dp: number;
};

export function priceFor(design: AutoformDesign, rows: SeatRows): DesignPrice {
  const band = bandFor(design);
  const tier = rows === 2 ? band.twoRow : band.threeRow;
  const selling = Math.round((tier.mrp * (1 - DISCOUNT)) / 10) * 10;
  return {
    rows,
    mrp: tier.mrp,
    sellingPrice: selling,
    discountPct: Math.round(((tier.mrp - selling) / tier.mrp) * 100),
    customCharge: CUSTOM_CHARGE.amount,
    dp: tier.dp,
  };
}

/** What the browser is allowed to see. Dealer price is stripped. */
export type PublicPrice = Omit<DesignPrice, "dp">;

export function toPublicPrice(p: DesignPrice): PublicPrice {
  const { dp: _dp, ...rest } = p;
  return rest;
}

/**
 * [PRICE] The list distinguishes only 2-row and 3-row, so seat count maps to a
 * row count and nothing finer. This is the whole of the vehicle-specific
 * pricing the source supports.
 */
export function rowsForSeats(seats: number): SeatRows {
  return seats >= 6 ? 3 : 2;
}

export function getDesign(slug: string): AutoformDesign | undefined {
  return DESIGNS.find((d) => d.slug === slug);
}

export function designsInBand(bandId: string): AutoformDesign[] {
  return DESIGNS.filter((d) => d.bandId === bandId);
}

/* ------------------------------------------------------------------ mats */

/**
 * [PRICE sheet 3] Mats are priced the same way — by design and row count — and
 * this sheet does carry genuine vehicle groupings for boot mats.
 */
export type MatProduct = {
  sno: number;
  design: string;
  colours: string[];
  twoRow: { dp: number | null; mrp: number | null };
  threeRow: { dp: number | null; mrp: number | null };
  category: "Carpet & Care" | "7D Mats";
  flags: string[];
};

export const MATS: MatProduct[] = [
  { sno: 1, design: "CARPET", colours: ["Black"], twoRow: { dp: 1118, mrp: 2299 }, threeRow: { dp: 1880, mrp: 3799 }, category: "Carpet & Care", flags: [] },
  { sno: 2, design: "12 MM CARE", colours: ["Black", "Beige", "Grey"], twoRow: { dp: 1615, mrp: 3299 }, threeRow: { dp: 2477, mrp: 4999 }, category: "Carpet & Care", flags: [] },
  { sno: 3, design: "SPIKE", colours: ["Black", "Beige", "Tan"], twoRow: { dp: 2202, mrp: 4507 }, threeRow: { dp: 3086, mrp: 6255 }, category: "Carpet & Care", flags: [] },
  { sno: 4, design: "CARE 18 MM UNIVERSAL", colours: ["Black", "Beige", "Grey"], twoRow: { dp: 1715, mrp: 3299 }, threeRow: { dp: 2262, mrp: 4199 }, category: "Carpet & Care", flags: [] },
  { sno: 5, design: "U-MAX ARROW/NHB", colours: ["Black", "Beige"], twoRow: { dp: 5477, mrp: 11039 }, threeRow: { dp: 6789, mrp: 13799 }, category: "7D Mats", flags: [] },
  { sno: 6, design: "U MAX EMBOSS", colours: ["Black", "Beige"], twoRow: { dp: 4439, mrp: 7819 }, threeRow: { dp: 6032, mrp: 10119 }, category: "7D Mats", flags: [] },
  { sno: 7, design: "U-MAX PLUS ARROW/NHB", colours: ["Black", "Beige"], twoRow: { dp: 3343, mrp: 6439 }, threeRow: { dp: 5303, mrp: 9199 }, category: "7D Mats", flags: [] },
  { sno: 8, design: "LLM MATS", colours: [], twoRow: { dp: 2423, mrp: null }, threeRow: { dp: 3940, mrp: null }, category: "7D Mats", flags: ["NO_MRP", "NO_COLOUR"] },
  { sno: 9, design: "MAX PREMIUM", colours: [], twoRow: { dp: 7999, mrp: null }, threeRow: { dp: 9260, mrp: null }, category: "7D Mats", flags: ["NO_MRP", "NO_COLOUR"] },
  { sno: 10, design: "LLM MATS THAR ROX", colours: [], twoRow: { dp: 2743, mrp: null }, threeRow: { dp: null, mrp: null }, category: "7D Mats", flags: ["NO_MRP", "NO_COLOUR", "VEHICLE_SPECIFIC"] },
];

/**
 * [PRICE sheet 3] Boot mats, with the manufacturer's own vehicle size grouping.
 * This is the only genuine model-level compatibility data in either document,
 * so it is reproduced verbatim rather than normalised.
 */
export const BOOT_MATS = {
  products: [
    { design: "BOOT MAXX", colour: "Black", small: { dp: 1135, mrp: 2250 }, big: { dp: 1466, mrp: 2750 } },
    { design: "Q-BOOT MAXX", colour: "Black", small: { dp: 4143, mrp: 6999 }, big: null },
  ],
  sizing: {
    SMALL:
      "ALTO, A-STAR, BEAT, EON, FIGO, GETZ, MARUTI 800, MICRA, PULSE, PUNTO, RITZ, SANTRO XING, SPARK, TATA INDICA, WAGON R, ZEN, ESTILO, KWID, IGNIS, BRIO, SWIFT-14/18, CELERIO, I-20 ELITE, NEW I-20, LIVA, POLO, TIAGO, BALENO, BREZZA, ECO SPORT-14/17/18/20, S.CROSS, AMEO, JEEP COMPASS, I-10 MEGNA, I-10 NIOS",
    BIG:
      "AMAZE-18, AURA, CITY-17/20, DZIRE-15/17, VERNA-14/17/20, CRETA-18/20, SELTOS, ACCORD, CIVIC, CIAZ, ALTIS, OLD ETIOS, LOGAN, FIESTA CLASSIC, CITY-09, ACCENT, XCENT, OCTAVIA, NEXON, RAPID, SUNNY, SUPERB, VENTO, VERITO, YARIS, ALTROZ, AUDI, BMW, MERCEDES, JAGUAR, OUTLANDER, PAJERO, PORSCHE, PRADO, RANGE ROVER, SANTA FE, SCORPIO, INNOVA CRYSTA, FORTUNER, CAPTIVA, CAMRY, OPTRA, ELANTRA, BOLERO, ERTIGA, REXTON, SAFARI STORM, SAFARI NEW-20, PASSAT, TUV-300, DISCOVERY, ENJOY, CRV, MOBILIO, LODGY",
  },
  trunkGroups: {
    A: "CRETA, SELTOS, BREZZA, SWIFT-18, VENUE, SONET, I-10 NIOS",
    B: "WRV, JEEP COMPASS, POLO, TIAGO, AMEO, BALENO, I-20 ELITE, I-20 2020, SANTRO-18, XUV-300, CELERIO, IGNIS, ALTO, TIGUAN, TIGOR, KUV-100, RANGE ROVER EVOQUE, BMW X1, FORD FIGO FREESTYLE, AUDI A-8, RANGE ROVER FREELANDER, S.PRESSO, VOLVO V-40, SANTRO XING, TUV-300, S.CROSS, LIVA",
    C: "AMAZE-18, SCORPIO-14 TO 18, CITY-14/17/2020, DZIRE-17, VERNA-17",
    D: "VOLVO S-90, BMW X3, JAGUAR XE, DISCOVERY SPORT, BMW X-5, MERCEDES GLC 220, TATA HARRIER, NEXON, RAPID, CIAZ, DUSTER, YARIS, MG HECTOR, AURA, ALTROZ, ETIOS, DZIRE-15, NISSAN KICKS, TUCSON, RENAULT CAPTUR, SAFARI STORM, ALTIS-17, BMW 520, VENTO, BOLERO, PASSAT, MERCEDES GLA 200, BMW X4, BMW X6, MERCEDES S-320, CRV, AUDI Q-5, AUDI Q-3, VOLVO S-60, NISSAN SUNNY, AUDI A3, LEXUS, MERCEDES C-220, MERCEDES ML-350, AUDI A6, AUDI Q7, FIGO, RANGE ROVER, FIGO FREESTYLE, VOLVO XC-60, ELANTRA, PORSCHE, ENJOY, INNOVA CRYSTA, FORTUNER-17",
  },
  note: "Groups are set by trunk size. MOQ 10 sets minimum.",
  source: "PRICE" as const,
};

/* ------------------------------------------------------- accessories */

/**
 * [PRICE sheet 2] Accessories pricing. The spreadsheet uses merged cells, so
 * only the first row of each category carries a product name — the rest have a
 * row index where the name should be. Those rows are imported with their real
 * prices and flagged, because a price without a product name cannot be sold.
 */
export type AccessoryRow = {
  sno: number;
  category: string | null;
  productName: string | null;
  dp: number;
  mrp: number;
  moq: string | null;
  flags: string[];
};

export const ACCESSORIES: AccessoryRow[] = [
  { sno: 1, category: "Health Ortho Memory", productName: "LUMBAR (L1)", dp: 922, mrp: 1749, moq: "18", flags: [] },
  { sno: 2, category: "Health Ortho Memory", productName: null, dp: 888, mrp: 1749, moq: "20", flags: ["NAME_MISSING"] },
  { sno: 3, category: "Health Ortho Memory", productName: null, dp: 797, mrp: 1649, moq: "24", flags: ["NAME_MISSING"] },
  { sno: 4, category: "Health Ortho Memory", productName: null, dp: 881, mrp: 1549, moq: "26", flags: ["NAME_MISSING"] },
  { sno: 5, category: "Health Ortho Memory", productName: null, dp: 934, mrp: 1749, moq: "10", flags: ["NAME_MISSING"] },
  { sno: 6, category: "Health Ortho Memory", productName: null, dp: 733, mrp: 1549, moq: "72", flags: ["NAME_MISSING"] },
  { sno: 7, category: "Health Ortho Memory", productName: null, dp: 1062, mrp: 2195, moq: "30", flags: ["NAME_MISSING"] },
  { sno: 8, category: "Health Ortho Memory", productName: null, dp: 1144, mrp: 2195, moq: "30", flags: ["NAME_MISSING"] },
  { sno: 9, category: "Health Ortho Memory", productName: null, dp: 1333, mrp: 2499, moq: "12", flags: ["NAME_MISSING"] },
  { sno: 10, category: "Health Ortho Memory", productName: null, dp: 922, mrp: 1749, moq: "24", flags: ["NAME_MISSING"] },
  { sno: 11, category: "Health Ortho Memory", productName: null, dp: 947, mrp: 1799, moq: "20", flags: ["NAME_MISSING", "NEW_LAUNCH"] },
  { sno: 12, category: "Health Ortho Memory", productName: null, dp: 888, mrp: 1749, moq: "22", flags: ["NAME_MISSING"] },
  { sno: 13, category: "Stitch Type Steering Cover", productName: "ART LEATHER", dp: 337, mrp: 799, moq: "N/A", flags: [] },
  { sno: 14, category: "Stitch Type Steering Cover", productName: null, dp: 544, mrp: 999, moq: "N/A", flags: ["NAME_MISSING"] },
  { sno: 15, category: "Stitch Type Steering Cover", productName: null, dp: 425, mrp: 1199, moq: "280", flags: ["NAME_MISSING"] },
  { sno: 16, category: "Stitch Type Steering Cover", productName: null, dp: 759, mrp: 1349, moq: "40", flags: ["NAME_MISSING"] },
  { sno: 17, category: "Stitch Type Steering Cover", productName: null, dp: 1241, mrp: 2195, moq: "42", flags: ["NAME_MISSING"] },
  { sno: 18, category: "Tissue Box", productName: "CUP TISSUE", dp: 491, mrp: 899, moq: "50", flags: [] },
  { sno: 19, category: "Tissue Box", productName: null, dp: 507, mrp: 999, moq: "50", flags: ["NAME_MISSING"] },
  { sno: 20, category: "Padded Seat Cover", productName: "PU", dp: 2383, mrp: 3999, moq: "10", flags: [] },
  { sno: 21, category: "Padded Seat Cover", productName: null, dp: 2383, mrp: 3999, moq: "10", flags: ["NAME_MISSING"] },
  { sno: 22, category: "Padded Seat Cover", productName: null, dp: 3482, mrp: 5999, moq: "10", flags: ["NAME_MISSING"] },
  { sno: 23, category: "Polyfill", productName: "NECK REST", dp: 445, mrp: 999, moq: "N/A", flags: [] },
  { sno: 24, category: "Polyfill", productName: null, dp: 563, mrp: 999, moq: "N/A", flags: ["NAME_MISSING"] },
  { sno: 25, category: "Polyfill", productName: null, dp: 910, mrp: 1549, moq: "50", flags: ["NAME_MISSING"] },
  { sno: 26, category: "Polyfill", productName: null, dp: 1117, mrp: 2195, moq: "25", flags: ["NAME_MISSING"] },
  { sno: 27, category: "Polyfill", productName: null, dp: 964, mrp: 1749, moq: "N/A", flags: ["NAME_MISSING"] },
  { sno: 28, category: "Polyfill", productName: null, dp: 852, mrp: 1549, moq: "N/A", flags: ["NAME_MISSING"] },
  { sno: 29, category: "Polyfill", productName: null, dp: 838, mrp: 1549, moq: "18", flags: ["NAME_MISSING"] },
  { sno: 30, category: "Microfibre", productName: "MICRO FIBER CLOTH 340GSM", dp: 175, mrp: 330, moq: "240", flags: [] },
  { sno: 31, category: "Microfibre", productName: null, dp: 219, mrp: 449, moq: "240", flags: ["NAME_MISSING"] },
  { sno: 32, category: "Boot Organiser", productName: "Boot Large", dp: 1260, mrp: 2499, moq: "N/A", flags: [] },
  { sno: 33, category: "Boot Organiser", productName: null, dp: 1004, mrp: 1999, moq: "N/A", flags: ["NAME_MISSING"] },
  { sno: 34, category: "Eazy Fit", productName: "EZY 1", dp: 6529, mrp: 8709, moq: "5", flags: [] },
  { sno: 35, category: "Eazy Fit", productName: "EZY 2", dp: 6734, mrp: 8979, moq: "5", flags: [] },
  { sno: 36, category: "Eazy Fit", productName: "EZY 3A, EZY 3B & EZY 3C", dp: 6930, mrp: 8999, moq: "5", flags: ["MULTI_SKU_ROW"] },
  { sno: 37, category: "Eazy Fit", productName: "EZY 4A & EZY 4B", dp: 8941, mrp: 11929, moq: "5", flags: ["MULTI_SKU_ROW"] },
  { sno: 38, category: "Utility", productName: "Car Seat Hook With Mobile Holder", dp: 268, mrp: 649, moq: "100", flags: [] },
  { sno: 39, category: "Utility", productName: "Car Duster (Wax)", dp: 516, mrp: 899, moq: "100", flags: [] },
  { sno: 40, category: "Utility", productName: "Steering Wheel Dining Tray", dp: 568, mrp: 1499, moq: "28", flags: [] },
  { sno: 41, category: "Utility", productName: "Car Air Purifier", dp: 2275, mrp: 4999, moq: "N/A", flags: [] },
  { sno: 42, category: "Utility", productName: "Car Odour Eliminator", dp: 248, mrp: 399, moq: "50", flags: [] },
  { sno: 43, category: "Utility", productName: "Car Number Plate", dp: 142, mrp: 499, moq: "50", flags: ["NEW_LAUNCH"] },
  { sno: 44, category: null, productName: "Ventilated Cooling Car Cushion", dp: 3572, mrp: 5999, moq: null, flags: ["NO_CATEGORY"] },
];

export const ACCESSORY_SELLING_DISCOUNT = 0.1;

export function accessorySellingPrice(row: AccessoryRow): number {
  return Math.round((row.mrp * (1 - ACCESSORY_SELLING_DISCOUNT)) / 10) * 10;
}

/** An accessory can only be sold if we know what it is. */
export function accessoryPublishable(row: AccessoryRow): boolean {
  return Boolean(row.productName) && !row.flags.includes("MULTI_SKU_ROW");
}

/* ------------------------------------------------------- verification */

export type VerificationStatus = "READY" | "REVIEW" | "VERIFICATION_REQUIRED" | "COMING_SOON";

export function designStatus(design: AutoformDesign): { status: VerificationStatus; reasons: string[] } {
  const reasons: string[] = [];
  const band = bandFor(design);

  if (!band.designsListed.some((n) => n.toUpperCase() === design.listedAs.toUpperCase())) {
    reasons.push("Design name does not match any price-list row");
  }
  // Every design is missing the same manufacturer fields, so this is a review
  // flag rather than a blocker — the design, price and image are all confirmed.
  reasons.push("Material, colour, stitching, airbag compatibility and warranty not stated in either document");

  const status: VerificationStatus = reasons.length > 1 ? "VERIFICATION_REQUIRED" : "REVIEW";
  return { status, reasons };
}

export const CATALOGUE_SUMMARY = {
  designsFromCatalogue: DESIGNS.length,
  designsAwaitingCatalogue: DESIGNS_AWAITING_CATALOGUE.length,
  priceBands: PRICE_BANDS.length,
  mats: MATS.length,
  accessories: ACCESSORIES.length,
  accessoriesPublishable: ACCESSORIES.filter(accessoryPublishable).length,
  accessoriesMissingName: ACCESSORIES.filter((a) => a.flags.includes("NAME_MISSING")).length,
};
