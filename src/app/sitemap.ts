import type { MetadataRoute } from "next";
import { SITE } from "@/lib/data/site";
import { CATEGORIES } from "@/lib/data/products";
import { LEGAL_POLICIES, SUPPORT_POLICIES } from "@/lib/data/policies";
import { PRODUCT_DETAILS } from "@/lib/store/products";
import { productHref } from "@/lib/store/types";
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
    entry("/shop", 0.9),
    entry("/vendor", 0.6, "monthly"),
    entry("/contact", 0.6, "monthly"),
    // Every indexable house product once, at its unified URL (held-back products stay out).
    ...PRODUCT_DETAILS.filter((d) => d.indexable).map((d) => entry(productHref(d.slug), 0.65)),
    ...CATEGORIES.map((c) => entry(`/shop/${c.slug}`, 0.8)),
    ...market.map((m) => ({
      url: url(m.path),
      lastModified: m.lastModified ?? now,
      changeFrequency: "weekly" as const,
      priority: m.path.split("/").length > 3 ? 0.6 : 0.7,
    })),
    entry("/faq", 0.5, "monthly"),
    entry("/track-order", 0.3, "yearly"),
    entry("/offers", 0.5, "daily"),
    entry("/assistant", 0.5, "monthly"),
    ...SUPPORT_POLICIES.map((p) => entry(`/support/${p.slug}`, 0.4, "monthly")),
    ...LEGAL_POLICIES.map((p) => entry(`/legal/${p.slug}`, 0.3, "yearly")),
  ];
}
