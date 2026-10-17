import type { MetadataRoute } from "next";
import { SITE } from "@/lib/data/site";
import { CARS } from "@/lib/data/cars";
import { CATEGORIES } from "@/lib/data/products";
import { BUILDS } from "@/lib/data/community";
import { LANDING_MODELS } from "@/lib/data/vehicles";
import { SEO_LANDINGS } from "@/lib/data/seo";
import { LEGAL_POLICIES, SUPPORT_POLICIES } from "@/lib/data/policies";
import { PRODUCT_DETAILS } from "@/lib/store/products";
import { productHref } from "@/lib/store/types";
import { PPF_LANDINGS } from "@/lib/ppf/landings";
import { PPF_FILMS } from "@/lib/ppf/films";
import { GUIDE as PPF_GUIDE } from "@/lib/ppf/guide";
import { CATEGORIES as RECOIL_CATEGORIES } from "@/lib/data/recoil";
import { BRANDS } from "@/lib/catalog/brands";
import { CATALOG } from "@/lib/catalog";
import { COLLECTIONS } from "@/lib/data/collections";
import { marketplaceUrls } from "@/lib/server/marketplace";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();
  // Approved storefronts and live seller products; empty (never an error) when there is no database.
  const market = await marketplaceUrls();
  const url = (path: string) => `${SITE.url}${path}`;

  const entry = (
    path: string,
    priority: number,
    changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"] = "weekly",
  ) => ({ url: url(path), lastModified: now, changeFrequency, priority });

  return [
    entry("/", 1),
    entry("/be-6", 0.95, "weekly"),
    entry("/be-6/specifications", 0.85, "weekly"),
    entry("/be-6/limited-edition", 0.8, "weekly"),
    entry("/cars", 0.9, "daily"),
    entry("/cars/latest", 0.85, "daily"),
    entry("/autoform", 0.85),
    entry("/ppf/quote", 0.85),
    entry("/ppf/films", 0.8),
    entry("/ppf/guide", 0.75),
    entry("/sell", 0.8),
    entry("/partners", 0.6, "monthly"),
    entry("/vendor", 0.6, "monthly"),
    entry("/shop", 0.9),
    entry("/collections", 0.8),
    entry("/build", 0.9),
    entry("/audio", 0.8),
    entry("/ppf", 0.8),
    entry("/off-road", 0.8),
    entry("/body-kits", 0.8),
    entry("/interiors", 0.8),
    entry("/performance", 0.8),
    entry("/garage", 0.8),
    entry("/builds", 0.7),
    entry("/locations", 0.6, "monthly"),
    entry("/contact", 0.6, "monthly"),
    entry("/why-riderzpro", 0.6, "monthly"),

    entry("/recoil", 0.85),
    entry("/brands", 0.85),
    entry("/build-audio", 0.75),

    ...BRANDS.map((b) => entry(`/brands/${b.slug}`, 0.75)),
    ...COLLECTIONS.filter((c) => CATALOG.some(c.match)).map((c) => entry(`/collections/${c.slug}`, 0.75)),

    ...SEO_LANDINGS.map((l) => entry(`/${l.slug}`, 0.75)),
    ...PPF_LANDINGS.map((l) => entry(`/ppf/${l.slug}`, 0.75)),
    ...PPF_FILMS.map((f) => entry(`/ppf/films/${f.slug}`, 0.6)),
    ...PPF_GUIDE.map((a) => entry(`/ppf/guide/${a.slug}`, 0.6)),
    ...RECOIL_CATEGORIES.map((c) => entry(`/recoil/${c.slug}`, 0.7)),
    // Every indexable product once, at its unified URL. Held-back products
    // (coming-soon, unpriced) are not indexable and stay out.
    ...PRODUCT_DETAILS.filter((d) => d.indexable).map((d) => entry(productHref(d.slug), 0.65)),
    ...CATEGORIES.map((c) => entry(`/shop/${c.slug}`, 0.8)),
    ...LANDING_MODELS.map((m) => entry(`/accessories/${m.slug}`, 0.8)),
    ...CARS.map((c) => entry(`/cars/${c.slug}`, 0.7, "daily")),
    ...BUILDS.map((b) => entry(`/builds/${b.slug}`, 0.6)),
    entry("/vendor", 0.6, "monthly"),
    ...market.map((m) => ({
      url: url(m.path),
      lastModified: m.lastModified ?? now,
      changeFrequency: "weekly" as const,
      priority: m.path.split("/").length > 3 ? 0.6 : 0.7,
    })),
    entry("/faq", 0.5, "monthly"),
    entry("/track-order", 0.3, "yearly"),
    entry("/offers", 0.5, "daily"),
    ...SUPPORT_POLICIES.map((p) => entry(`/support/${p.slug}`, 0.4, "monthly")),
    ...LEGAL_POLICIES.map((p) => entry(`/legal/${p.slug}`, 0.3, "yearly")),
  ];
}
