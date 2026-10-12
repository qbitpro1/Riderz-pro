import type { MetadataRoute } from "next";
import { SITE } from "@/lib/data/site";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        // Filtered / sorted catalogue views duplicate the clean pages (which carry canonicals).
        disallow: ["/admin", "/api", "/cart", "/*?*sort=", "/*?*max=", "/*?*q="],
      },
    ],
    sitemap: `${SITE.url}/sitemap.xml`,
    host: SITE.url,
  };
}
