import type { Metadata } from "next";
import { SITE } from "@/lib/data/site";

/* ------------------------------------------------------- shared SEO helpers */
/* Pure functions, no catalogue import: safe in any server file. */

/** Absolute URL for a site path. */
export const absUrl = (path: string): string => `${SITE.url}${path}`;

/** JSON for a `<script type="application/ld+json">`; `<` is escaped so data can never close the tag. */
export const ldJson = (data: unknown): string => JSON.stringify(data).replace(/</g, "\\u003c");

export type LdLink = { name: string; path: string };

export function breadcrumbLd(trail: LdLink[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: trail.map((t, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: t.name,
      item: absUrl(t.path),
    })),
  };
}

export function itemListLd(name: string, items: LdLink[]) {
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name,
    numberOfItems: items.length,
    itemListElement: items.map((t, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: t.name,
      url: absUrl(t.path),
    })),
  };
}

/** Site default share image (file-convention routes in `src/app`). */
const DEFAULT_OG = { url: "/opengraph-image", width: 1200, height: 630, alt: "Riderzpro: Car & Bike Accessories" };
const DEFAULT_TWITTER = "/twitter-image";

/**
 * Page metadata with a canonical that ignores the query string (filtered views
 * such as `?group=…&oe=1&sort=…` all point at the clean page), plus complete
 * Open Graph and Twitter fields. A page's own `openGraph` replaces the layout's
 * wholesale, so siteName / locale / type are repeated here.
 *
 * `title` goes through the root `%s | Riderzpro` template; a title that already
 * names the brand is emitted as `title.absolute` so it is not doubled. Optional:
 * `image` (absolute or root-relative URL, falls back to the site image),
 * `ogTitle` / `ogDescription` (share-card wording that differs from the page's),
 * `type` (Open Graph type, default "website"), `robots`.
 */
export function pageMeta(opts: {
  title: string;
  description: string;
  path: string;
  image?: string;
  imageAlt?: string;
  ogTitle?: string;
  ogDescription?: string;
  type?: "website" | "article";
  robots?: Metadata["robots"];
}): Metadata {
  const named = /riderzpro/i.test(opts.title);
  const shareTitle = opts.ogTitle ?? (named ? opts.title : `${opts.title} | ${SITE.name}`);
  const shareDescription = opts.ogDescription ?? opts.description;
  const image = opts.image ? { url: opts.image, alt: opts.imageAlt ?? shareTitle } : DEFAULT_OG;
  return {
    title: named ? { absolute: opts.title } : opts.title,
    description: opts.description,
    alternates: { canonical: opts.path },
    ...(opts.robots ? { robots: opts.robots } : {}),
    openGraph: {
      type: opts.type ?? "website",
      locale: "en_IN",
      siteName: SITE.name,
      title: shareTitle,
      description: shareDescription,
      url: opts.path,
      images: [image],
    },
    twitter: {
      card: "summary_large_image",
      title: shareTitle,
      description: shareDescription,
      images: [opts.image ?? DEFAULT_TWITTER],
    },
  };
}
