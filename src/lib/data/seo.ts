import type { MediaKey } from "@/lib/media";

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
};

export const SEO_LANDINGS: SeoLanding[] = [
  {
    slug: "used-cars",
    eyebrow: "Used cars",
    h1: "USED CARS, WITHOUT THE ASTERISKS.",
    title: "Used Cars for Sale in India — Motorbotz Certified",
    description:
      "Buy used cars in Bengaluru, Hyderabad and Pune with a 200-point inspection, RC and insurance verification, transparent pricing and a 5-day return window.",
    intro:
      "Most used-car problems are not mechanical, they are informational. You cannot see the accident history, the odometer truth or the pending loan — so you overpay for risk. Motorbotz publishes all of it before you call.",
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
        body: "Five days or 300 km on every Motorbotz Certified car. If our inspection missed something material, we take the car back and refund in full.",
      },
    ],
    links: [
      { label: "Browse all cars", href: "/cars" },
      { label: "Sell your car", href: "/sell" },
      { label: "EMI calculator", href: "/cars#listings" },
      { label: "Why Motorbotz", href: "/why-motorbotz" },
    ],
  },
  {
    slug: "car-modification",
    eyebrow: "Car modification",
    h1: "CAR MODIFICATION, DONE PROPERLY.",
    title: "Car Modification Near Me — Body Kits, Audio, Off-Road & Performance",
    description:
      "Car modification in Bengaluru, Hyderabad and Pune. Body kits, facelift conversions, custom interiors, car audio, PPF, off-road builds and performance tuning at Motorbotz.",
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
      { label: "Motorbotz builds", href: "/builds" },
    ],
  },
  {
    slug: "car-accessories",
    eyebrow: "Car accessories",
    h1: "CAR ACCESSORIES THAT ACTUALLY FIT.",
    title: "Car Accessories Online — Fitment-Checked for Your Exact Variant",
    description:
      "Buy car accessories online in India: floor mats, seat covers, lighting, audio, roof carriers, off-road gear and performance parts. Checked against your variant before dispatch.",
    intro:
      "Ninety percent of accessory returns are fitment problems. Tell us your brand, model, variant and year once, and we only ever show you parts that fit that car.",
    media: "tailLightBokeh",
    cta: { href: "/shop", label: "Shop accessories" },
    secondary: { href: "/garage", label: "Book installation" },
    sections: [
      {
        heading: "Six categories, one fitment engine",
        body: "Exterior, lighting, interior, audio, off-road and performance. Save your car once and every listing is filtered against it, including on your phone.",
      },
      {
        heading: "₹299 to ₹2 lakh, deliberately",
        body: "We stock the ₹899 steering cover and the ₹4 lakh audio build, because the same customer often buys both — three years apart.",
      },
      {
        heading: "Installation available on everything",
        body: "Anything bought from us can be fitted at a Motorbotz garage, usually the same day, with a 12-month workmanship warranty.",
      },
      {
        heading: "Fitment guarantee",
        body: "If a part we confirmed as compatible does not fit, we collect it at our cost and refund in full — including the labour you paid us.",
      },
    ],
    links: [
      { label: "Exterior", href: "/shop/exterior" },
      { label: "Lighting", href: "/shop/lighting" },
      { label: "Interior", href: "/shop/interior" },
      { label: "Audio", href: "/shop/audio" },
      { label: "Off-road", href: "/shop/off-road" },
      { label: "Performance", href: "/shop/performance" },
    ],
  },
  {
    slug: "suv-modification",
    eyebrow: "SUV modification",
    h1: "SUV MODIFICATION & OFF-ROAD BUILDS.",
    title: "SUV Modification & Off-Road Accessories in India",
    description:
      "SUV modification for Thar, Fortuner, Scorpio N, XUV700, Gurkha, Jimny, Wrangler, Hilux and Defender. Lift kits, protection, recovery, expedition gear and luxury interiors.",
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
