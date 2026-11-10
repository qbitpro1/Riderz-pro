import "server-only";

import { publicCars } from "@/lib/server/cars";
import { DEPARTMENTS, departmentHref } from "@/lib/data/taxonomy";
import { AUDIO_PACKAGES, DETAIL_SERVICES, FACELIFT_CONVERSIONS } from "@/lib/data/services";
import { liveBuilds } from "@/lib/server/builds";
import { LANDING_MODELS, findModelBySlug } from "@/lib/data/vehicles";
import { BRANDS, type CatalogItem } from "@/lib/catalog";
import { catalogSnapshot } from "@/lib/server/catalog";
import { COLLECTIONS } from "@/lib/data/collections";
import { lakh, rupees } from "@/lib/format";
import { productHref } from "@/lib/store/types";
import { norm, type SearchBrand, type SearchEntry, type SearchIndex } from "./match";

export * from "./match";

/** Detail-service ids rendered as anchors on /ppf ("Goes with it" cards: the first four non-film services). */
const PPF_PAGE_ANCHORS = new Set(
  DETAIL_SERVICES.filter((s) => s.slug !== "paint-protection-film")
    .slice(0, 4)
    .map((s) => s.slug),
);

/** One search entry per listed product, from the database. RECOIL is SKU-first ("SPL4200" finds SPL4200.4). */
function productEntry(i: CatalogItem): SearchEntry {
  const price = i.availability === "coming-soon" ? "Coming soon" : i.price !== null ? `${i.priceFrom ? "From " : ""}${rupees(i.price)}` : "Price on request";
  if (i.brand === "recoil") {
    return { id: `recoil-${i.slug}`, kind: "RECOIL", title: i.code ? `${i.code} — ${i.title}` : i.title, meta: `${price} · ${i.sub}`, href: productHref(i.slug), keywords: norm(`recoil ${i.code ?? ""} ${i.keywords} car audio`) };
  }
  if (i.id.startsWith("autoform:design-")) {
    return { id: `autoform-${i.slug}`, kind: "Autoform", title: i.title, meta: `${price} · ${i.sub}`, href: productHref(i.slug), keywords: norm(`autoform ${i.code ?? ""} ${i.keywords} seat cover seat covers interior`) };
  }
  // Expand fitment slugs into brand + model names so "BMW ambient lighting" finds a part listed only against the 3 Series and GLC.
  const fitment = i.fitment
    .map((slug) => {
      const model = findModelBySlug(slug);
      return model ? `${model.brand} ${model.name}` : slug;
    })
    .join(" ");
  return { id: `product-${i.slug}`, kind: "Product", title: i.title, meta: `${price} · ${i.sub}`, href: productHref(i.slug), keywords: norm(`${i.keywords} ${i.brandName} ${fitment} accessories`) };
}

/** The whole search index, built from the database (products) and the site's own pages. */
export async function buildSearchIndex(): Promise<SearchIndex> {
  const [{ items: CATALOG, byBrand: CATALOG_BY_BRAND }, allCars, BUILDS] = await Promise.all([catalogSnapshot(), publicCars(), liveBuilds()]);
  const CARS = allCars.filter((c) => c.status === "live");
  const SEARCH_INDEX: SearchEntry[] = [
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
      `${c.brand} ${c.model} ${c.variant} ${c.body} ${c.fuel} ${c.transmission} ${c.city} used car buy`,
    ),
  })),
  ...CATALOG.map(productEntry),
  // Help pages people look for by name.
  ...[
    { id: "faq", title: "FAQ — ordering, fitment, delivery, returns", href: "/faq", k: "faq help questions ordering fitment delivery returns payment" },
    { id: "track", title: "Track your order", href: "/track-order", k: "track order tracking where is my order delivery status" },
    { id: "shipping", title: "Shipping & delivery", href: "/support/shipping", k: "shipping delivery charges free shipping dispatch" },
    { id: "returns", title: "Returns & refunds", href: "/support/returns", k: "returns refund exchange cancel cancellation fitment guarantee" },
    { id: "wishlist", title: "Your wishlist", href: "/wishlist", k: "wishlist saved items favourites" },
  ].map((h) => ({
    id: `help-${h.id}`,
    kind: "Service" as const,
    title: h.title,
    meta: "Help",
    href: h.href,
    keywords: norm(h.k),
  })),
  ...DEPARTMENTS.map((d) => ({
    id: `cat-${d.slug}`,
    kind: "Category" as const,
    title: d.name,
    meta: d.tagline,
    href: departmentHref(d.slug),
    keywords: norm(
      `${d.name} ${d.groups.map((g) => `${g.name} ${g.subs.join(" ")}`).join(" ")} accessories shop department oe original equipment`,
    ),
  })),
  ...COLLECTIONS.map((c) => ({ c, count: CATALOG.filter(c.match).length }))
    .filter((x) => x.count > 0)
    .map(({ c, count }) => ({
      id: `collection-${c.slug}`,
      kind: "Category" as const,
      title: `${c.name} — collection`,
      meta: `${c.tagline} · ${count} product${count === 1 ? "" : "s"}`,
      href: `/collections/${c.slug}`,
      keywords: norm(`${c.name} ${c.tagline} ${c.blurb} collection offers deals`),
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
    // The PPF entry is priced per car on /ppf (from the quote helper), so no
    // "from" figure is shown here that could contradict it.
    meta: d.slug === "paint-protection-film" ? "Priced for your car" : `From ${rupees(d.price)}`,
    // Only the services /ppf lists as cards have an anchor; the rest go to the page.
    href: PPF_PAGE_ANCHORS.has(d.slug) ? `/ppf#${d.slug}` : d.slug === "paint-protection-film" ? "/ppf#packages" : "/ppf",
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
    meta: b.cost !== null ? `${b.vehicle} · ${rupees(b.cost)}` : b.vehicle,
    href: `/builds/${b.slug}`,
    keywords: norm(`${b.title} ${b.vehicle} ${b.tag} build modified`),
  })),
  ];

  /** Brand shortcuts for the search panel — name, destination and product count. */
  const SEARCH_BRANDS: SearchBrand[] = BRANDS.map((b) => ({
    slug: b.slug,
    name: b.name,
    href: `/brands/${b.slug}`,
    count: CATALOG_BY_BRAND[b.slug]?.length ?? 0,
  }));

  return { entries: SEARCH_INDEX, brands: SEARCH_BRANDS };
}
