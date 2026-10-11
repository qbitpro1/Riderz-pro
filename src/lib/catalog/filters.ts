/**
 * THE CATALOGUE FILTER ENGINE
 *
 * Filtering, sorting, facets and URL mapping over a list of `CatalogItem`s.
 * Kept free of any catalogue data so client components can import it without
 * pulling the brand catalogues — and their dealer pricing — into the browser.
 */

import type { CategorySlug, PriceTier } from "@/lib/data/products";
import { DEPARTMENTS, DEPARTMENT_BY_SLUG } from "@/lib/data/taxonomy";
import { BRANDS, type BrandSlug } from "./brands";
import { TIER_BOUNDS, type Availability, type CatalogItem } from "./types";

/* ----------------------------------------------------------------- filters */

export type SortKey = "popular" | "price-asc" | "price-desc" | "rating" | "discount";

export const SORTS: { key: SortKey; label: string }[] = [
  { key: "popular", label: "Most popular" },
  { key: "price-asc", label: "Price: low to high" },
  { key: "price-desc", label: "Price: high to low" },
  { key: "rating", label: "Highest rated" },
  { key: "discount", label: "Biggest saving" },
];

export const AVAILABILITY_LABELS: Record<Availability, string> = {
  "in-stock": "In stock",
  "made-to-order": "Made to order",
  "coming-soon": "Coming soon",
};

export type CatalogFilters = {
  brands: BrandSlug[];
  categories: CategorySlug[];
  /** Group slugs within the department. */
  groups: string[];
  subs: string[];
  tiers: PriceTier[];
  /** Price ceiling in rupees: items with a price at or under it. */
  maxPrice: number | null;
  availability: Availability[];
  /** Original Equipment parts only. */
  oe: boolean;
  /** Vehicle model slug from the garage picker. */
  fits: string | null;
  installation: boolean;
  q: string;
  sort: SortKey;
};

export const EMPTY_FILTERS: CatalogFilters = {
  brands: [],
  categories: [],
  groups: [],
  subs: [],
  tiers: [],
  maxPrice: null,
  availability: [],
  oe: false,
  fits: null,
  installation: false,
  q: "",
  sort: "popular",
};

/** Every dimension except sort, so "clear all" and the active-chip row agree. */
export function activeFilterCount(f: CatalogFilters): number {
  return (
    f.brands.length +
    f.categories.length +
    f.groups.length +
    f.subs.length +
    f.tiers.length +
    (f.maxPrice !== null ? 1 : 0) +
    f.availability.length +
    (f.fits ? 1 : 0) +
    (f.installation ? 1 : 0) +
    (f.oe ? 1 : 0) +
    (f.q.trim() ? 1 : 0)
  );
}

/**
 * A universal part fits everything. An item whose source carries no model list
 * — a made-to-order seat cover, a RECOIL amplifier — is *not* claimed to fit:
 * it drops out of a fitment-filtered view rather than being asserted.
 */
export function itemFits(item: CatalogItem, modelSlug: string): boolean {
  return item.fitment.includes("universal") || item.fitment.includes(modelSlug);
}

type Dimension = keyof CatalogFilters;

/** Applies every filter except the named dimension — the basis of facet counts. */
function matches(item: CatalogItem, f: CatalogFilters, except?: Dimension): boolean {
  if (except !== "brands" && f.brands.length && !f.brands.includes(item.brand)) return false;
  if (except !== "categories" && f.categories.length && !f.categories.includes(item.category)) return false;
  if (except !== "groups" && f.groups.length && !f.groups.includes(item.group)) return false;
  if (except !== "oe" && f.oe && !item.oe) return false;
  if (except !== "subs" && f.subs.length && !f.subs.includes(item.sub)) return false;
  if (except !== "tiers" && f.tiers.length && !f.tiers.includes(item.tier)) return false;
  if (except !== "maxPrice" && f.maxPrice !== null && (item.price === null || item.price > f.maxPrice)) return false;
  if (except !== "availability" && f.availability.length && !f.availability.includes(item.availability)) return false;
  if (except !== "fits" && f.fits && !itemFits(item, f.fits)) return false;
  if (except !== "installation" && f.installation && !item.installation) return false;
  if (except !== "q") {
    const q = f.q.trim().toLowerCase();
    if (q) {
      const haystack = `${item.title.toLowerCase()} ${item.code?.toLowerCase() ?? ""} ${item.keywords}`;
      for (const term of q.split(/\s+/)) if (!haystack.includes(term)) return false;
    }
  }
  return true;
}

function discountPct(i: CatalogItem): number {
  if (!i.price || !i.mrp || i.mrp <= i.price) return 0;
  return (i.mrp - i.price) / i.mrp;
}

/** Sorts nulls last regardless of direction, so "no price" never leads the grid. */
function byPrice(dir: 1 | -1) {
  return (a: CatalogItem, b: CatalogItem) => {
    if (a.price === null) return 1;
    if (b.price === null) return -1;
    return (a.price - b.price) * dir;
  };
}

export function sortItems(items: CatalogItem[], sort: SortKey): CatalogItem[] {
  const out = [...items];
  switch (sort) {
    case "price-asc":
      return out.sort(byPrice(1));
    case "price-desc":
      return out.sort(byPrice(-1));
    case "rating":
      return out.sort((a, b) => (b.rating ?? -1) - (a.rating ?? -1) || (b.reviews ?? 0) - (a.reviews ?? 0));
    case "discount":
      return out.sort((a, b) => discountPct(b) - discountPct(a));
    default:
      // Bestsellers, then genuinely reviewed products, then everything else in
      // catalogue order — which keeps each brand's own ordering intact.
      return out.sort(
        (a, b) =>
          Number(b.bestseller) - Number(a.bestseller) ||
          Number(a.availability === "coming-soon") - Number(b.availability === "coming-soon") ||
          (b.reviews ?? 0) - (a.reviews ?? 0),
      );
  }
}

export function filterCatalog(items: CatalogItem[], f: CatalogFilters): CatalogItem[] {
  return sortItems(
    items.filter((i) => matches(i, f)),
    f.sort,
  );
}

/* ------------------------------------------------------------------ facets */

export type Facet<T extends string> = { value: T; label: string; count: number };

export type CatalogFacets = {
  brands: Facet<BrandSlug>[];
  categories: Facet<CategorySlug>[];
  /** Groups of the one department in view; empty when the view spans departments. */
  groups: Facet<string>[];
  subs: Facet<string>[];
  tiers: Facet<PriceTier>[];
  availability: Facet<Availability>[];
  installation: number;
  /** Original Equipment items in the current view. */
  oe: number;
  fits: number;
};

export const TIER_LABELS: Record<PriceTier, string> = {
  value: `Under ₹${TIER_BOUNDS.value[1].toLocaleString("en-IN")}`,
  mid: "₹5,000 – ₹25,000",
  premium: "₹25,000 +",
};

function count<T extends string>(
  items: CatalogItem[],
  f: CatalogFilters,
  dimension: Dimension,
  pick: (i: CatalogItem) => T | null,
  label: (v: T) => string,
  order?: T[],
): Facet<T>[] {
  const counts = new Map<T, number>();
  for (const i of items) {
    if (!matches(i, f, dimension)) continue;
    const v = pick(i);
    if (v === null) continue;
    counts.set(v, (counts.get(v) ?? 0) + 1);
  }
  const out = [...counts.entries()].map(([value, n]) => ({ value, label: label(value), count: n }));
  if (order) return out.sort((a, b) => order.indexOf(a.value) - order.indexOf(b.value));
  return out.sort((a, b) => b.count - a.count || a.label.localeCompare(b.label));
}

/**
 * Counts are computed per dimension with that dimension's own selection
 * ignored, so ticking "RECOIL" doesn't zero out every other brand's count —
 * you can still see how many Autoform products you'd get by adding it.
 */
/** Brands and categories are shown by their own name, never by their slug. */
export const brandName = (slug: BrandSlug): string => BRANDS.find((b) => b.slug === slug)?.name ?? slug;
export const categoryName = (slug: CategorySlug): string => DEPARTMENT_BY_SLUG[slug]?.name ?? slug;

/** Group names are only unique within a department, so groups are faceted for one department at a time. */
function groupFacets(items: CatalogItem[], f: CatalogFilters): Facet<string>[] {
  if (f.categories.length !== 1) return [];
  const dept = DEPARTMENT_BY_SLUG[f.categories[0]];
  if (!dept) return [];
  const names = new Map(dept.groups.map((g) => [g.slug, g.name]));
  return count<string>(items, f, "groups", (i) => i.group, (v) => names.get(v) ?? v, dept.groups.map((g) => g.slug));
}

export function facetsFor(items: CatalogItem[], f: CatalogFilters): CatalogFacets {
  return {
    brands: count<BrandSlug>(items, f, "brands", (i) => i.brand, brandName),
    categories: count<CategorySlug>(
      items,
      f,
      "categories",
      (i) => i.category,
      categoryName,
      DEPARTMENTS.map((d) => d.slug),
    ),
    groups: groupFacets(items, f),
    subs: count<string>(items, f, "subs", (i) => i.sub, (v) => v),
    tiers: count<PriceTier>(items, f, "tiers", (i) => i.tier, (v) => TIER_LABELS[v], ["value", "mid", "premium"]),
    availability: count<Availability>(
      items,
      f,
      "availability",
      (i) => i.availability,
      (v) => AVAILABILITY_LABELS[v],
      ["in-stock", "made-to-order", "coming-soon"],
    ),
    installation: items.filter((i) => i.installation && matches(i, f, "installation")).length,
    oe: items.filter((i) => i.oe && matches(i, f, "oe")).length,
    fits: f.fits ? items.filter((i) => itemFits(i, f.fits!) && matches(i, f, "fits")).length : 0,
  };
}

/* ------------------------------------------------------------- URL mapping */

/**
 * Filters round-trip through the query string so a filtered view is a real,
 * shareable URL — `/shop?brand=recoil&category=multimedia` is what "search by brand"
 * links to from anywhere in the site.
 */
export type CatalogQuery = Record<string, string | string[] | undefined>;

const list = (v: string | string[] | undefined): string[] =>
  v === undefined ? [] : (Array.isArray(v) ? v : v.split(",")).map((s) => s.trim()).filter(Boolean);

function parseMax(v: string | string[] | undefined): number | null {
  const n = typeof v === "string" ? Number(v) : NaN;
  return Number.isFinite(n) && n > 0 ? Math.round(n) : null;
}

export const priceCeilingLabel = (n: number): string => `Under ₹${n.toLocaleString("en-IN")}`;

export function filtersFromQuery(query: CatalogQuery): CatalogFilters {
  const brandSlugs = new Set(BRANDS.map((b) => b.slug as string));
  const categorySlugs = new Set(DEPARTMENTS.map((d) => d.slug as string));
  const sort = typeof query.sort === "string" ? query.sort : "";

  return {
    brands: list(query.brand).filter((b) => brandSlugs.has(b)) as BrandSlug[],
    categories: list(query.category).filter((c) => categorySlugs.has(c)) as CategorySlug[],
    groups: list(query.group),
    subs: list(query.sub),
    tiers: list(query.tier).filter((t): t is PriceTier => t === "value" || t === "mid" || t === "premium"),
    maxPrice: parseMax(query.max),
    availability: list(query.stock).filter(
      (a): a is Availability => a === "in-stock" || a === "made-to-order" || a === "coming-soon",
    ),
    oe: query.oe === "1",
    fits: typeof query.fits === "string" && query.fits ? query.fits : null,
    installation: query.install === "1",
    q: typeof query.q === "string" ? query.q : "",
    sort: SORTS.some((s) => s.key === sort) ? (sort as SortKey) : "popular",
  };
}

export function queryFromFilters(f: CatalogFilters): string {
  const p = new URLSearchParams();
  if (f.brands.length) p.set("brand", f.brands.join(","));
  if (f.categories.length) p.set("category", f.categories.join(","));
  if (f.groups.length) p.set("group", f.groups.join(","));
  if (f.oe) p.set("oe", "1");
  if (f.subs.length) p.set("sub", f.subs.join(","));
  if (f.tiers.length) p.set("tier", f.tiers.join(","));
  if (f.maxPrice !== null) p.set("max", String(f.maxPrice));
  if (f.availability.length) p.set("stock", f.availability.join(","));
  if (f.fits) p.set("fits", f.fits);
  if (f.installation) p.set("install", "1");
  if (f.q.trim()) p.set("q", f.q.trim());
  if (f.sort !== "popular") p.set("sort", f.sort);
  return p.toString();
}
