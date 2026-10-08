import { CARS } from "@/lib/data/cars";
import { CATEGORIES, PRODUCTS } from "@/lib/data/products";
import { AUDIO_PACKAGES, DETAIL_SERVICES, FACELIFT_CONVERSIONS } from "@/lib/data/services";
import { BUILDS } from "@/lib/data/community";
import { LANDING_MODELS, findModelBySlug } from "@/lib/data/vehicles";
import { COMING_SOON as RECOIL_COMING_SOON, PRODUCTS as RECOIL_PRODUCTS } from "@/lib/data/recoil";
import { DESIGNS as AUTOFORM_DESIGNS, bandFor, priceFor } from "@/lib/autoform/catalog";
import { BRANDS, CATALOG_BY_BRAND } from "@/lib/catalog";
import { lakh, rupees } from "@/lib/format";

export type SearchKind =
  | "Car"
  | "Product"
  | "Category"
  | "Service"
  | "Build"
  | "My Car"
  | "Brand"
  | "RECOIL"
  | "Autoform";

export type SearchEntry = {
  id: string;
  kind: SearchKind;
  title: string;
  meta: string;
  href: string;
  keywords: string;
};

function norm(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9 ]/g, " ").replace(/\s+/g, " ").trim();
}

export const SEARCH_INDEX: SearchEntry[] = [
  // Brands come first in construction order so an exact brand name — "recoil",
  // "autoform", "blaupunkt" — always has a destination, whether or not that
  // brand has products listed yet.
  ...BRANDS.map((b) => {
    const count = CATALOG_BY_BRAND[b.slug]?.length ?? 0;
    return {
      id: `brand-${b.slug}`,
      kind: "Brand" as const,
      title: `${b.name} — all products`,
      meta: count > 0 ? `${b.position} · ${count} products` : "Catalogue not published yet",
      href: `/brands/${b.slug}`,
      keywords: norm(`${b.name} ${b.position} ${b.tagline} ${b.categories.join(" ")} brand shop by brand`),
    };
  }),
  ...CARS.map((c) => ({
    id: `car-${c.slug}`,
    kind: "Car" as const,
    title: `${c.year} ${c.brand} ${c.model} ${c.variant}`,
    meta: `${lakh(c.price)} · ${c.city}`,
    href: `/cars/${c.slug}`,
    keywords: norm(
      `${c.brand} ${c.model} ${c.variant} ${c.body} ${c.fuel} ${c.transmission} ${c.city} ${c.condition} used car buy`,
    ),
  })),
  ...PRODUCTS.map((p) => {
    // Expand fitment slugs into brand + model names so "BMW ambient lighting"
    // finds a part listed only against the 3 Series and GLC.
    const fitment = p.fitment
      .map((slug) => {
        const model = findModelBySlug(slug);
        return model ? `${model.brand} ${model.name}` : slug;
      })
      .join(" ");
    return {
      id: `product-${p.slug}`,
      kind: "Product" as const,
      title: p.name,
      meta: `${rupees(p.price)} · ${p.sub}`,
      href: `/product/${p.slug}`,
      keywords: norm(`${p.name} ${p.sub} ${p.category} ${p.maker} ${fitment} accessories`),
    };
  }),
  // The RECOIL catalogue is SKU-first: "SPL4200" has to find SPL4200.4.
  ...RECOIL_PRODUCTS.concat(RECOIL_COMING_SOON).map((p) => ({
    id: `recoil-${p.slug}`,
    kind: "RECOIL" as const,
    title: `${p.sku} — ${p.priceListName}`,
    meta:
      p.status === "COMING_SOON"
        ? `Coming soon · ${p.subcategory}`
        : `${p.sellingPrice ? rupees(p.sellingPrice) : "Price on request"} · ${p.subcategory}`,
    href: `/products/${p.slug}`,
    keywords: norm(`recoil ${p.sku} ${p.searchTokens.join(" ")} car audio`),
  })),
  // Autoform designs are named things people search for by code — "u-volt",
  // "x-cross" — so they need their own entries, not just a brand page.
  ...AUTOFORM_DESIGNS.map((d) => ({
    id: `autoform-${d.slug}`,
    kind: "Autoform" as const,
    title: `Autoform ${d.code}`,
    meta: `From ${rupees(priceFor(d, 2).sellingPrice)} · ${d.tagline}`,
    href: `/autoform/${d.slug}`,
    keywords: norm(`autoform ${d.code} ${d.tagline} ${bandFor(d).series} seat cover seat covers interior`),
  })),
  ...CATEGORIES.map((c) => ({
    id: `cat-${c.slug}`,
    kind: "Category" as const,
    title: `${c.name} accessories`,
    meta: c.tagline,
    href: `/shop/${c.slug}`,
    keywords: norm(`${c.name} ${c.subcategories.join(" ")} accessories shop`),
  })),
  ...LANDING_MODELS.map((m) => ({
    id: `model-${m.brandSlug}-${m.slug}`,
    kind: "My Car" as const,
    title: `${m.name} accessories`,
    meta: `${m.brand} · ${m.body}`,
    href: `/accessories/${m.slug}`,
    keywords: norm(`${m.brand} ${m.name} ${m.body} accessories modification parts fitment`),
  })),
  ...AUDIO_PACKAGES.map((a) => ({
    id: `audio-${a.slug}`,
    kind: "Service" as const,
    title: `${a.name} audio package`,
    meta: `${rupees(a.price)} ${a.priceNote}`,
    href: `/audio#${a.slug}`,
    keywords: norm(`${a.name} audio speakers dsp amplifier subwoofer sound ${a.bestFor}`),
  })),
  ...DETAIL_SERVICES.map((d) => ({
    id: `ppf-${d.slug}`,
    kind: "Service" as const,
    title: d.name,
    meta: `From ${rupees(d.price)}`,
    href: `/ppf#${d.slug}`,
    keywords: norm(`${d.name} ppf paint protection ceramic detailing wrap ${d.category}`),
  })),
  ...FACELIFT_CONVERSIONS.map((f) => ({
    id: `facelift-${f.slug}`,
    kind: "Service" as const,
    title: `${f.to}`,
    meta: `${f.from} · from ${rupees(f.price)}`,
    href: `/body-kits#${f.slug}`,
    keywords: norm(`${f.from} ${f.to} facelift conversion body kit bumper headlamp`),
  })),
  ...BUILDS.map((b) => ({
    id: `build-${b.slug}`,
    kind: "Build" as const,
    title: b.title,
    meta: `${b.vehicle} · ${rupees(b.cost)}`,
    href: `/builds/${b.slug}`,
    keywords: norm(`${b.title} ${b.vehicle} ${b.tag} build modified`),
  })),
];

export const SEARCH_SUGGESTIONS = [
  "Thar accessories",
  "Creta facelift",
  "Fortuner lift kit",
  "SPL4200",
  "4 channel amplifier",
  "Autoform seat covers",
  "6.5 midrange",
  "BMW ambient lighting",
  "7D mats",
  "Sound deadening",
  "Used cars in Bengaluru",
];

/** Brand shortcuts for the search panel — name, destination and product count. */
export const SEARCH_BRANDS = BRANDS.map((b) => ({
  slug: b.slug,
  name: b.name,
  href: `/brands/${b.slug}`,
  count: CATALOG_BY_BRAND[b.slug]?.length ?? 0,
}));

export function searchAll(query: string, limit = 8): SearchEntry[] {
  const q = norm(query);
  if (q.length < 2) return [];
  const terms = q.split(" ");

  return SEARCH_INDEX.map((entry) => {
    const haystack = `${norm(entry.title)} ${entry.keywords}`;
    let score = 0;
    for (const term of terms) {
      if (!haystack.includes(term)) return { entry, score: -1 };
      score += norm(entry.title).startsWith(term) ? 6 : norm(entry.title).includes(term) ? 4 : 1;
    }
    // Nudge shopping intent above listings when both match equally, and let an
    // exact model number outrank everything.
    if (entry.kind === "My Car") score += 2;
    if (entry.kind === "Category") score += 1;
    // A brand name should land on the brand, not on the first of its 250 SKUs.
    if (entry.kind === "Brand") score += 3;
    if (entry.kind === "RECOIL" && terms.some((t) => norm(entry.title).split(" ")[0] === t)) score += 12;
    return { entry, score };
  })
    .filter((r) => r.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((r) => r.entry);
}
