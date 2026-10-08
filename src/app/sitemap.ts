import type { MetadataRoute } from "next";
import { SITE } from "@/lib/data/site";
import { CARS } from "@/lib/data/cars";
import { CATEGORIES, PRODUCTS } from "@/lib/data/products";
import { BUILDS } from "@/lib/data/community";
import { LANDING_MODELS } from "@/lib/data/vehicles";
import { SEO_LANDINGS } from "@/lib/data/seo";
import { LEGAL_POLICIES, SUPPORT_POLICIES } from "@/lib/data/policies";
import { DESIGNS as AUTOFORM_DESIGNS } from "@/lib/autoform/catalog";
import { PPF_LANDINGS } from "@/lib/ppf/landings";
import { PPF_FILMS } from "@/lib/ppf/films";
import { GUIDE as PPF_GUIDE } from "@/lib/ppf/guide";
import { CATEGORIES as RECOIL_CATEGORIES, COMING_SOON as RECOIL_COMING_SOON, PRODUCTS as RECOIL_PRODUCTS } from "@/lib/data/recoil";
import { BRANDS } from "@/lib/catalog/brands";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
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
    entry("/partners", 0.8),
    entry("/autoform", 0.85),
    entry("/ppf/quote", 0.85),
    entry("/ppf/films", 0.8),
    entry("/ppf/guide", 0.75),
    entry("/sell", 0.8),
    entry("/shop", 0.9),
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
    entry("/compare", 0.5),

    ...BRANDS.map((b) => entry(`/brands/${b.slug}`, 0.75)),

    ...SEO_LANDINGS.map((l) => entry(`/${l.slug}`, 0.75)),
    ...AUTOFORM_DESIGNS.map((d) => entry(`/autoform/${d.slug}`, 0.7)),
    ...PPF_LANDINGS.map((l) => entry(`/ppf/${l.slug}`, 0.75)),
    ...PPF_FILMS.map((f) => entry(`/ppf/films/${f.slug}`, 0.6)),
    ...PPF_GUIDE.map((a) => entry(`/ppf/guide/${a.slug}`, 0.6)),
    ...RECOIL_CATEGORIES.map((c) => entry(`/recoil/${c.slug}`, 0.7)),
    // Coming-soon SKUs stay in the sitemap but their pages are noindex.
    ...RECOIL_PRODUCTS.map((p) => entry(`/products/${p.slug}`, 0.6)),
    ...RECOIL_COMING_SOON.map((p) => entry(`/products/${p.slug}`, 0.3, "monthly")),
    ...CATEGORIES.map((c) => entry(`/shop/${c.slug}`, 0.8)),
    ...LANDING_MODELS.map((m) => entry(`/accessories/${m.slug}`, 0.8)),
    ...CARS.map((c) => entry(`/cars/${c.slug}`, 0.7, "daily")),
    ...PRODUCTS.map((p) => entry(`/product/${p.slug}`, 0.65)),
    ...BUILDS.map((b) => entry(`/builds/${b.slug}`, 0.6)),
    ...SUPPORT_POLICIES.map((p) => entry(`/support/${p.slug}`, 0.4, "monthly")),
    ...LEGAL_POLICIES.map((p) => entry(`/legal/${p.slug}`, 0.3, "yearly")),
  ];
}
