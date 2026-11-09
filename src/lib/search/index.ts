import "server-only";

import { PRODUCTS } from "@/lib/data/products";
import { DEPARTMENTS, departmentHref } from "@/lib/data/taxonomy";
import { findModelBySlug } from "@/lib/data/vehicles";
import { rupees } from "@/lib/format";
import { storeSlug } from "@/lib/store/slugs";
import { productHref } from "@/lib/store/types";
import { storeHref } from "@/lib/vendor/types";
import { liveVendorItems } from "@/lib/server/marketplace";
import { norm, type SearchBrand, type SearchEntry, type SearchIndex } from "./match";

export * from "./match";

/** Entries that never change: house products, help pages and the shop departments. */
const STATIC_ENTRIES: SearchEntry[] = [
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
      href: productHref(storeSlug.house(p)),
      keywords: norm(`${p.name} ${p.sub} ${p.category} ${p.maker} ${fitment} accessories`),
    };
  }),
  // Help pages people look for by name.
  ...[
    { id: "faq", title: "FAQ — ordering, fitment, delivery, returns", href: "/faq", k: "faq help questions ordering fitment delivery returns payment" },
    { id: "track", title: "Track your order", href: "/track-order", k: "track order tracking where is my order delivery status" },
    { id: "shipping", title: "Shipping & delivery", href: "/support/shipping", k: "shipping delivery charges free shipping dispatch" },
    { id: "returns", title: "Returns & refunds", href: "/support/returns", k: "returns refund exchange cancel cancellation fitment guarantee" },
    { id: "wishlist", title: "Your wishlist", href: "/wishlist", k: "wishlist saved items favourites" },
    { id: "sell", title: "Sell on Riderzpro", href: "/vendor", k: "sell seller vendor open a store marketplace" },
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
];

/**
 * What the search panel downloads (`/search-index.json`): the fixed entries plus every live
 * product approved sellers have listed, each labelled with its store; the shortcuts are the stores.
 */
export async function publicSearchIndex(): Promise<SearchIndex> {
  const items = await liveVendorItems();
  const products: SearchEntry[] = items.map((i) => ({
    id: `vendor-${i.id}`,
    kind: "Product" as const,
    title: i.title,
    meta: [i.price !== null ? rupees(i.price) : "Price on request", i.seller ? `Store: ${i.seller.name}` : i.sub].join(" · "),
    href: i.href,
    keywords: norm(`${i.title} ${i.brandName} ${i.sub} ${i.code ?? ""} ${i.seller?.name ?? ""} ${i.category}`),
  }));

  const stores = new Map<string, SearchBrand>();
  for (const i of items) {
    if (!i.seller) continue;
    const s = stores.get(i.seller.slug) ?? { slug: i.seller.slug, name: i.seller.name, href: storeHref(i.seller.slug), count: 0 };
    s.count += 1;
    stores.set(i.seller.slug, s);
  }
  const storeEntries: SearchEntry[] = [...stores.values()].map((s) => ({
    id: `store-${s.slug}`,
    kind: "Brand" as const,
    title: `${s.name} — store`,
    meta: `${s.count} product${s.count === 1 ? "" : "s"}`,
    href: s.href,
    keywords: norm(`${s.name} store seller shop`),
  }));

  return { entries: [...storeEntries, ...products, ...STATIC_ENTRIES], brands: [...stores.values()] };
}
