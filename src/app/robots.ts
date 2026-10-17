import type { MetadataRoute } from "next";
import { SITE } from "@/lib/data/site";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        // Filtered / sorted catalogue views duplicate the clean pages (which carry canonicals).
        // /store is a seller's Offline Store screen (signed-in only), not a public page.
        // /sellers (public storefronts and product pages) stays allowed.
        disallow: ["/admin", "/api", "/cart", "/store", "/*?*sort=", "/*?*max=", "/*?*q="],
      },
    ],
    sitemap: `${SITE.url}/sitemap.xml`,
    host: SITE.url,
  };
}
