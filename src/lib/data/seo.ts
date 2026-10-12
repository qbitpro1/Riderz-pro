import type { Metadata } from "next";
import type { MediaKey } from "@/lib/media";
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


export type SeoLanding = {
  slug: string;
  eyebrow: string;
  h1: string;
  title: string;
  description: string;
  intro: string;
  media: MediaKey;
  /** Primary destination the page funnels into. */
  cta: { href: string; label: string };
  secondary?: { href: string; label: string };
  sections: { heading: string; body: string }[];
  links: { label: string; href: string }[];
  /** Render the store block: departments, collections and brands. */
  store?: boolean;
};

export const SEO_LANDINGS: SeoLanding[] = [
  {
    slug: "used-cars",
    eyebrow: "Used cars",
    h1: "USED CARS, WITHOUT THE ASTERISKS.",
    title: "Used Cars for Sale in India — Riderzpro Certified",
    description:
      "Buy used cars in Bengaluru, Hyderabad and Pune with a 200-point inspection, RC and insurance verification, transparent pricing and a 5-day return window.",
    intro:
      "Most used-car problems are not mechanical, they are informational. You cannot see the accident history, the odometer truth or the pending loan — so you overpay for risk. Riderzpro publishes all of it before you call.",
    media: "luxurySaloonMotion",
    cta: { href: "/cars", label: "Browse used cars" },
    secondary: { href: "/sell", label: "Sell your car" },
    sections: [
      {
        heading: "Every car inspected on 200 points",
        body: "Engine, transmission, suspension, electricals, body panel thickness and an OBD scan. The report is shared in full before any payment, not summarised into a star rating.",
      },
      {
        heading: "Paperwork verified, not assumed",
        body: "RC cross-checked against VAHAN, insurance status and claim history confirmed, service record pulled, ownership chain validated, and any outstanding loan settled directly with the lender.",
      },
      {
        heading: "One price, published",
        body: "No dealer margin games and no 'come and discuss'. The number on the listing is the number, and the same number is offered to everyone who walks in.",
      },
      {
        heading: "Finance from eleven lenders",
        body: "Up to 90% funding on used cars, tenures from 12 to 84 months, and every offer shown to you — including the ones that pay us less.",
      },
      {
        heading: "Five days to change your mind",
        body: "Five days or 300 km on every Riderzpro Certified car. If our inspection missed something material, we take the car back and refund in full.",
      },
    ],
    links: [
      { label: "Browse all cars", href: "/cars" },
      { label: "Sell your car", href: "/sell" },
      { label: "EMI calculator", href: "/cars#listings" },
      { label: "Why Riderzpro", href: "/why-riderzpro" },
    ],
  },
  {
    slug: "car-modification",
    eyebrow: "Car modification",
    h1: "CAR MODIFICATION, DONE PROPERLY.",
    title: "Car Modification Near Me — Body Kits, Audio & Off-Road",
    description:
      "Car modification in Bengaluru, Hyderabad and Pune: body kits, facelifts, custom interiors, car audio, PPF, off-road builds and performance tuning at Riderzpro.",
    intro:
      "Modification goes wrong for three reasons: parts that do not fit, work that cannot be undone, and nobody taking responsibility afterwards. We fix all three by doing everything in one workshop and documenting all of it.",
    media: "garageSpotlit",
    cta: { href: "/build", label: "Configure your build" },
    secondary: { href: "/garage", label: "Book the garage" },
    sections: [
      {
        heading: "A costed build sheet, not a vague quote",
        body: "Use the configurator to pick exterior, wheels, interior, audio and performance items and watch a live estimate build up — parts, labour and GST included, filtered to your platform.",
      },
      {
        heading: "Everything in one workshop",
        body: "Trim shop, paint room, audio bay, dyno, welding and lifts across 26 bays in three cities. Your car does not tour four markets and come back with four opinions.",
      },
      {
        heading: "Reversible where it matters",
        body: "Original bumpers, suspension and ECU maps are archived and returned. A car that can be put back to standard is worth considerably more when you sell it.",
      },
      {
        heading: "Within the law",
        body: "All work follows the Central Motor Vehicles Rules. We keep emissions hardware intact, keep exhaust noise within limits, aim headlamps on a beam setter, and put in writing anything that needs an RTO endorsement.",
      },
      {
        heading: "Twelve-month workmanship warranty",
        body: "If something we fitted rattles, leaks or fails within a year, we fix it free — including removing and refitting whatever is in the way.",
      },
    ],
    links: [
      { label: "Build your car", href: "/build" },
      { label: "Body kits & facelifts", href: "/body-kits" },
      { label: "Custom interiors", href: "/interiors" },
      { label: "Performance garage", href: "/performance" },
      { label: "Off-road garage", href: "/off-road" },
      { label: "Riderzpro builds", href: "/builds" },
    ],
  },
  {
    slug: "car-accessories",
    eyebrow: "Car & bike accessories",
    h1: "CAR ACCESSORIES THAT ACTUALLY FIT.",
    title: "Car Accessories Online India — Seat Covers, Mats & Multimedia",
    description:
      "Buy car accessories online in India: seat covers, floor mats, speakers, lighting, covers and guards, utilities and off-roading gear. Made by Riderzpro, fitted at our garages.",
    intro:
      "Riderzpro makes and sells car accessories. Pick your car once and the shop shows what fits it: seat covers cut to your seat pattern, mats cut to your floor, lighting and audio matched to your model.",
    media: "tailLightBokeh",
    cta: { href: "/shop", label: "Shop accessories" },
    secondary: { href: "/garage", label: "Book installation" },
    store: true,
    sections: [
      {
        heading: "Eight departments, one shop",
        body: "Interior, exterior, multimedia, covers and guards, utilities, off-roading, lighting and a performance and travel section. Each department is split into the product types people actually search for, and every one has an Original Equipment view.",
      },
      {
        heading: "Fitment checked before dispatch",
        body: "Tell us your make, model, variant and year and we confirm the part fits before it ships. If a part we confirmed as compatible does not fit, we collect it and refund in full.",
      },
      {
        heading: "Several brands, one cart",
        body: "The Riderzpro house range sits next to RECOIL and Blaupunkt car audio and Autoform seat covers. Filter across all of them by brand, department, price and fitment, and check out once.",
      },
      {
        heading: "Fitted at our garages",
        body: "Anything bought here can be fitted at a Riderzpro garage in Bengaluru, Hyderabad or Pune, with a 12-month workmanship warranty on the fitting.",
      },
      {
        heading: "Savings only where they are real",
        body: "Products show their selling price and MRP. The Biggest savings collection only includes items where the price sits at least 10% below the MRP.",
      },
    ],
    links: [
      { label: "Bestsellers", href: "/collections/bestsellers" },
      { label: "Under \u20b9999", href: "/collections/under-999" },
      { label: "All collections", href: "/collections" },
      { label: "Shop by brand", href: "/brands" },
      { label: "Book installation", href: "/garage" },
      { label: "Audio builds", href: "/audio" },
    ],
  },
  {
    slug: "suv-modification",
    eyebrow: "SUV modification",
    h1: "SUV MODIFICATION & OFF-ROAD BUILDS.",
    title: "SUV Modification & Off-Road Accessories in India",
    description:
      "SUV modification for Thar, Fortuner, Scorpio N, XUV700, Gurkha, Jimny, Wrangler, Hilux and Defender. Lift kits, underbody guards, recovery, expedition gear, interiors.",
    intro:
      "An SUV can be built three ways: for the trail, for the highway, or for the second row. We do all three, and the first question we ask is which one you actually want.",
    media: "defenderSaltFlat",
    cta: { href: "/off-road", label: "Off-road garage" },
    secondary: { href: "/interiors", label: "Luxury interiors" },
    sections: [
      {
        heading: "Trail builds",
        body: "Progressive lift kits with corrected geometry, chassis-mounted sliders and skid plates, rated recovery points, winches, snorkels and all-terrain rubber.",
      },
      {
        heading: "Expedition builds",
        body: "Platform racks, hard-shell tents, drawer and fridge systems, dual battery with solar, awnings and auxiliary lighting — wired properly and fused.",
      },
      {
        heading: "Lounge builds",
        body: "Captain seats, electric recliners, automatic footrests, alcantara headliners, rear entertainment and full acoustic treatment for the second row.",
      },
      {
        heading: "Street builds",
        body: "Chrome delete, body kits, forged wheels, lowered or levelled stance, projector lighting and a DSP audio system that suits a big cabin.",
      },
    ],
    links: [
      { label: "Thar accessories", href: "/accessories/thar" },
      { label: "Fortuner accessories", href: "/accessories/fortuner" },
      { label: "Scorpio N accessories", href: "/accessories/scorpio-n" },
      { label: "XUV700 accessories", href: "/accessories/xuv700" },
      { label: "Gurkha accessories", href: "/accessories/gurkha" },
      { label: "Jimny accessories", href: "/accessories/jimny" },
    ],
  },
];

export function findLanding(slug: string): SeoLanding | undefined {
  return SEO_LANDINGS.find((l) => l.slug === slug);
}
