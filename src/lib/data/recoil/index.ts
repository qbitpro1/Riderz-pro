import raw from "./catalog.generated.json";

/* --------------------------------------------------------------- types */

export type VerificationStatus = "READY" | "NEEDS_REVIEW" | "MISSING_DATA" | "COMING_SOON";
export type ProductStatus = "ACTIVE" | "COMING_SOON" | "DISCONTINUED";

export type CatalogImage = {
  url: string;
  type: string;
  alt: string;
  source: string;
  sourceLabel: string;
  sourceUrl: string;
  sku: string;
  accessedAt: string | null;
  usage: string;
  verified: boolean;
};

export type ManufacturerRef = {
  matchTier: string;
  title: string;
  titleIsProse: boolean;
  url: string;
  source: string;
  sourceLabel: string;
  categories: string[];
  description: string | null;
  shortDescription: string | null;
  alternates: { title: string; url: string; source: string }[];
};

/**
 * The full record, including the confidential dealer price. Server-side only —
 * pass `toPublic()` output across any boundary that reaches the browser.
 */
export type CatalogProduct = {
  sku: string;
  printedSku: string;
  slug: string;
  brand: "RECOIL";
  category: string;
  subcategory: string;
  series: string | null;
  productType: string;
  priceListName: string;
  priceListSpecs: string[];
  /** Confidential dealer price. Never rendered. */
  dp: number | null;
  mrp: number | null;
  masterPack: number | null;
  priceListFile: string;
  priceListEdition: string;
  sellingPrice: number | null;
  discountPct: number | null;
  status: ProductStatus;
  manufacturer: ManufacturerRef | null;
  images: CatalogImage[];
  title: string;
  seo: { title: string; metaDescription: string; url: string; keywords: string[] };
  searchTokens: string[];
  flags: string[];
  compatibility: { type: "universal" | "vehicle-specific"; note: string };
  verification: VerificationStatus;
  published: boolean;
};

/** What the storefront is allowed to see. No dealer pricing, no cost data. */
export type PublicProduct = Omit<CatalogProduct, "dp" | "priceListFile">;

export type CatalogSummary = {
  generatedAt: string;
  priceListEdition: string;
  manufacturerMirrorFetchedAt: string | null;
  totals: Record<string, number>;
  flagCounts: Record<string, number>;
  flagMeanings: Record<string, string>;
};

const data = raw as unknown as { summary: CatalogSummary; products: CatalogProduct[] };

/* ------------------------------------------------------------- catalogue */

/** Every imported row, including everything in the verification queue. */
export const ALL_PRODUCTS: CatalogProduct[] = data.products;
export const CATALOG_SUMMARY: CatalogSummary = data.summary;

/** Storefront-visible products: verified, priced and image-matched. */
export const PRODUCTS: CatalogProduct[] = ALL_PRODUCTS.filter((p) => p.published);

/** Held back from sale but shown as upcoming. */
export const COMING_SOON: CatalogProduct[] = ALL_PRODUCTS.filter((p) => p.verification === "COMING_SOON");

/** Anything a human still has to look at before it can go live. */
export const VERIFICATION_QUEUE: CatalogProduct[] = ALL_PRODUCTS.filter(
  (p) => p.verification === "NEEDS_REVIEW" || p.verification === "MISSING_DATA",
);

export function toPublic(p: CatalogProduct): PublicProduct {
  const { dp: _dp, priceListFile: _file, ...rest } = p;
  return rest;
}

export function getBySlug(slug: string): CatalogProduct | undefined {
  return ALL_PRODUCTS.find((p) => p.slug === slug);
}

export function getBySku(sku: string): CatalogProduct | undefined {
  const key = sku.toUpperCase().replace(/\s+/g, "");
  return ALL_PRODUCTS.find((p) => p.sku.toUpperCase().replace(/\s+/g, "") === key);
}

/* ------------------------------------------------------------ categories */

export type CategoryNode = {
  name: string;
  slug: string;
  group: "CAR AUDIO" | "INSTALLATION";
  count: number;
  subcategories: { name: string; slug: string; count: number }[];
};

const AUDIO_CATEGORIES = new Set(["Amplifiers", "Speakers", "Subwoofers", "Processors", "Marine", "Soundbars", "Two Wheeler"]);

export const catSlug = (name: string) => name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");

export const CATEGORIES: CategoryNode[] = (() => {
  const byCategory = new Map<string, CatalogProduct[]>();
  for (const p of PRODUCTS.concat(COMING_SOON)) {
    if (!byCategory.has(p.category)) byCategory.set(p.category, []);
    byCategory.get(p.category)!.push(p);
  }
  return [...byCategory.entries()]
    .map(([name, items]) => {
      const subs = new Map<string, number>();
      for (const p of items) subs.set(p.subcategory, (subs.get(p.subcategory) ?? 0) + 1);
      return {
        name,
        slug: catSlug(name),
        group: AUDIO_CATEGORIES.has(name) ? ("CAR AUDIO" as const) : ("INSTALLATION" as const),
        count: items.length,
        subcategories: [...subs.entries()]
          .map(([sub, count]) => ({ name: sub, slug: catSlug(sub), count }))
          .sort((a, b) => b.count - a.count),
      };
    })
    .sort((a, b) => b.count - a.count);
})();

export function getCategory(slug: string): CategoryNode | undefined {
  return CATEGORIES.find((c) => c.slug === slug);
}

export function productsInCategory(slug: string): CatalogProduct[] {
  const cat = getCategory(slug);
  if (!cat) return [];
  return PRODUCTS.concat(COMING_SOON).filter((p) => p.category === cat.name);
}

/* ---------------------------------------------------------------- search */

/**
 * SKU-first search. "SPL4200" finds SPL4200.4, "4 channel amplifier" finds
 * every four-channel amp, "6.5 midrange" finds the pro midranges.
 */
export function searchCatalog(query: string, limit = 20): CatalogProduct[] {
  const q = query.toLowerCase().trim();
  if (q.length < 2) return [];
  const terms = q.split(/[^a-z0-9.]+/).filter(Boolean);
  if (terms.length === 0) return [];

  const pool = PRODUCTS.concat(COMING_SOON);
  return pool
    .map((p) => {
      const sku = p.sku.toLowerCase();
      const haystack = p.searchTokens.join(" ");
      let score = 0;
      for (const term of terms) {
        if (sku === term) score += 100;
        else if (sku.startsWith(term)) score += 40;
        else if (sku.includes(term)) score += 20;
        else if (p.searchTokens.includes(term)) score += 8;
        else if (haystack.includes(term)) score += 3;
        else return { p, score: -1 };
      }
      if (p.verification === "COMING_SOON") score -= 5;
      return { p, score };
    })
    .filter((r) => r.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((r) => r.p);
}

/* -------------------------------------------------------------- compare */

/** Only fields the price list actually carries are offered for comparison. */
export const COMPARE_FIELDS: { key: string; label: string; get: (p: CatalogProduct) => string | null }[] = [
  { key: "price", label: "Motorbotz price", get: (p) => (p.sellingPrice ? `₹${p.sellingPrice.toLocaleString("en-IN")}` : null) },
  { key: "mrp", label: "MRP", get: (p) => (p.mrp ? `₹${p.mrp.toLocaleString("en-IN")}` : null) },
  { key: "category", label: "Category", get: (p) => p.category },
  { key: "series", label: "Series", get: (p) => p.series },
  { key: "type", label: "Type", get: (p) => p.subcategory },
  { key: "rms", label: "RMS power", get: (p) => specMatch(p, /rms[^;]*/i) },
  { key: "peak", label: "Peak / max power", get: (p) => specMatch(p, /(peak|max)[^;]*/i) },
  { key: "impedance", label: "Impedance", get: (p) => specMatch(p, /[^;]*ohm[^;]*/i) },
  { key: "voiceCoil", label: "Voice coil", get: (p) => specMatch(p, /voice coil[^;]*/i) },
  { key: "inputs", label: "Inputs", get: (p) => specMatch(p, /inputs?[^;]*/i) },
  { key: "outputs", label: "Outputs", get: (p) => specMatch(p, /outputs?[^;]*/i) },
  { key: "masterPack", label: "Master pack", get: (p) => (p.masterPack ? String(p.masterPack) : null) },
  { key: "status", label: "Availability", get: (p) => (p.status === "COMING_SOON" ? "Coming soon" : "Available") },
];

function specMatch(p: CatalogProduct, re: RegExp): string | null {
  for (const line of p.priceListSpecs) {
    const m = line.match(re);
    if (m) return m[0].trim();
  }
  return null;
}

/* ------------------------------------------------- complete your build */

const COMPLEMENTS: Record<string, string[]> = {
  Amplifiers: ["Speakers", "Subwoofers", "Processors", "Wiring", "Power", "Damping"],
  Speakers: ["Amplifiers", "Processors", "Damping", "Wiring", "Installation"],
  Subwoofers: ["Amplifiers", "Wiring", "Power", "Damping", "Installation"],
  Processors: ["Amplifiers", "Speakers", "Wiring", "Signal"],
  Damping: ["Speakers", "Tools", "Installation"],
  Wiring: ["Amplifiers", "Power", "Tools"],
  Power: ["Amplifiers", "Wiring", "Tools"],
  Marine: ["Amplifiers", "Wiring", "Power"],
};

/**
 * "Complete your build" — pulls one sensible item from each complementary
 * category rather than a wall of the same thing.
 */
export function completeTheBuild(product: CatalogProduct, limit = 6): CatalogProduct[] {
  const wanted = COMPLEMENTS[product.category] ?? ["Wiring", "Power", "Damping"];
  const out: CatalogProduct[] = [];
  for (const category of wanted) {
    const pick = PRODUCTS.filter((p) => p.category === category && p.sku !== product.sku)
      .sort((a, b) => closeness(a, product) - closeness(b, product))[0];
    if (pick) out.push(pick);
    if (out.length >= limit) break;
  }
  return out;
}

/** Prefer accessories in the same price league as the anchor product. */
function closeness(candidate: CatalogProduct, anchor: CatalogProduct): number {
  const a = candidate.sellingPrice ?? 0;
  const b = (anchor.sellingPrice ?? 0) * 0.35;
  return Math.abs(a - b);
}

export function relatedInSeries(product: CatalogProduct, limit = 4): CatalogProduct[] {
  return PRODUCTS.filter(
    (p) => p.sku !== product.sku && (p.series === product.series || p.subcategory === product.subcategory),
  )
    .sort((a, b) => {
      const score = (p: CatalogProduct) => (p.series === product.series ? 2 : 0) + (p.subcategory === product.subcategory ? 1 : 0);
      return score(b) - score(a);
    })
    .slice(0, limit);
}

export const FEATURED_SKUS = ["SPL4200.4", "SAM365", "S810", "PW12D4", "XLBK", "RX65"];
export const FEATURED: CatalogProduct[] = FEATURED_SKUS.map((s) => getBySku(s)).filter(
  (p): p is CatalogProduct => Boolean(p),
);
