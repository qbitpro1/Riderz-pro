import type { MetadataRoute } from "next";
import { SITE } from "@/lib/data/site";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        // Filtered / sorted catalogue views duplicate the clean pages (which carry canonicals).
        // /store is a seller's Offline Store screen and /account a customer's own pages (signed-in only).
        // /sellers (public storefronts and product pages) stays allowed.
        disallow: ["/admin", "/api", "/account", "/cart", "/store", "/*?*sort=", "/*?*max=", "/*?*q="],
      },
    ],
    sitemap: `${SITE.url}/sitemap.xml`,
    host: SITE.url,
  };
}
