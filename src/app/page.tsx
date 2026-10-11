import Link from "next/link";
import type { Metadata } from "next";
import { Photo } from "@/components/ui/Photo";
import { Icon } from "@/components/ui/Icon";
import { Reveal } from "@/components/ui/Reveal";
import { SectionHead, SectionFootLink } from "@/components/ui/Section";
import { HeroCarousel } from "@/components/home/HeroCarousel";
import { CatalogCard } from "@/components/catalog/CatalogCard";
import { BrandStrip } from "@/components/catalog/BrandStrip";
import { FitmentPicker } from "@/components/fitment/FitmentPicker";
import { ReviewCard } from "@/components/community/Cards";
import { CATALOG, sortItems } from "@/lib/catalog";
import { COLLECTIONS } from "@/lib/data/collections";
import {
  DEPARTMENTS,
  DEPARTMENT_BY_SLUG,
  departmentHref,
  groupHref,
  oeHref,
  type DepartmentSlug,
} from "@/lib/data/taxonomy";
import { REVIEWS, STATS } from "@/lib/data/community";
import { LANDING_MODELS } from "@/lib/data/vehicles";
import { LOCATIONS, SITE, whatsapp } from "@/lib/data/site";
import { rupees } from "@/lib/format";
import type { MediaKey } from "@/lib/media";

export const metadata: Metadata = {
  title: "Riderzpro — Car Accessories, Fitted Right",
  description:
    "Seat covers, floor mats, audio, lighting, protection and off-road gear for your car. Made and sold by Riderzpro, fitment-checked for your model and fitted at our garages in Bengaluru, Hyderabad and Pune.",
  alternates: { canonical: "/" },
};

const FREE_SHIPPING_OVER = 2000;

const SLIDES: {
  eyebrow: string;
  title: string;
  copy: string;
  cta: string;
  href: string;
  image: MediaKey;
}[] = [
  {
    eyebrow: "Interior",
    title: "Seat covers, cut to your car",
    copy: "Covers, mats and comfort pieces made for your exact model.",
    cta: "Shop seat covers",
    href: groupHref("interior", "seat-covers"),
    image: "cockpitScreen",
  },
  {
    eyebrow: "Multimedia",
    title: "Sound that fills the cabin",
    copy: "Speakers, subwoofers, amplifiers and head units, installed properly.",
    cta: "Shop multimedia",
    href: departmentHref("multimedia"),
    image: "speakerCone",
  },
  {
    eyebrow: "Lighting Solutions",
    title: "See further. Be seen.",
    copy: "Projectors, LED bulbs, DRLs and fog lamps, wired with relays and fuses.",
    cta: "Shop lighting",
    href: departmentHref("lighting"),
    image: "tailLightBokeh",
  },
  {
    eyebrow: "Off-Roading",
    title: "Gear for the unpaved",
    copy: "Recovery, armour and expedition hardware for the trail.",
    cta: "Shop off-roading",
    href: departmentHref("off-roading"),
    image: "defenderSaltFlat",
  },
];

const SERVICES = [
  { href: "/ppf", label: "Paint protection film" },
  { href: "/audio", label: "Audio installation" },
  { href: "/body-kits", label: "Body kits" },
];

const WHY = [
  {
    title: "We make what we sell",
    body: "Riderzpro is our own registered brand. We manufacture car accessories and sell them directly.",
  },
  {
    title: "Checked against your car",
    body: "Pick your car once and we show what fits it. Parts without a confirmed fit are not claimed to fit.",
  },
  {
    title: "Fitted by people who know them",
    body: "Installation is available at our garages for the products marked with the wrench.",
  },
  {
    title: "Support on WhatsApp",
    body: "Ask about fitment, fitting or an order and talk to a real person.",
  },
];

export default function HomePage() {
  /* ---- everything below is computed from CATALOG; nothing is typed in ---- */
  const lowest = new Map<DepartmentSlug, number>();
  const groupCount = new Map<string, number>();
  for (const i of CATALOG) {
    if (i.price !== null) {
      const cur = lowest.get(i.category);
      if (cur === undefined || i.price < cur) lowest.set(i.category, i.price);
    }
    const k = `${i.category}/${i.group}`;
    groupCount.set(k, (groupCount.get(k) ?? 0) + 1);
  }

  // Busiest groups, at most two per department so the row isn't one aisle.
  const perDept = new Map<string, number>();
  const needs = DEPARTMENTS.flatMap((d) =>
    d.groups.map((g) => ({ d, g, n: groupCount.get(`${d.slug}/${g.slug}`) ?? 0 })),
  )
    .filter((x) => x.n > 0 && x.g.slug !== "more")
    .sort((a, b) => b.n - a.n)
    .filter((x) => {
      const used = perDept.get(x.d.slug) ?? 0;
      if (used >= 2) return false;
      perDept.set(x.d.slug, used + 1);
      return true;
    })
    .slice(0, 8);

  const bestsellers = sortItems(
    CATALOG.filter((i) => i.bestseller),
    "popular",
  ).slice(0, 12);

  const collections = COLLECTIONS.map((c) => ({ c, count: CATALOG.filter(c.match).length })).filter((x) => x.count > 0);

  const models = LANDING_MODELS.slice(0, 12);

  return (
    <>
      <h1 className="sr-only">Riderzpro — car accessories, fitted right</h1>

      {/* 1 — HERO CAROUSEL ------------------------------------------------ */}
      <HeroCarousel labels={SLIDES.map((s) => s.eyebrow)}>
        {SLIDES.map((s, i) => (
          <div key={s.eyebrow} className="relative flex min-h-[80svh] flex-col justify-end overflow-hidden bg-void md:min-h-[88svh]">
            <Photo media={s.image} sizes="100vw" priority={i === 0} className="opacity-90" />
            <div className="absolute inset-0 scrim" />
            <div className="shell relative pb-24 pt-28 md:pb-32">
              <p className="eyebrow mb-3 text-accent">{s.eyebrow}</p>
              <h2 className="display-1 max-w-3xl text-balance !text-[clamp(2.25rem,9vw,5rem)] !leading-[0.95]">{s.title}</h2>
              <p className="mt-4 max-w-md text-base text-ash md:text-lg">{s.copy}</p>
              <Link href={s.href} className="btn btn-accent mt-7">
                {s.cta}
                <Icon name="arrow" size={16} />
              </Link>
            </div>
          </div>
        ))}
      </HeroCarousel>

      {/* 2 — TRUST STRIP --------------------------------------------------- */}
      <section className="bg-carbon py-6 md:py-8" aria-label="Why shop with us">
        <div className="shell">
          <ul className="grid grid-cols-2 gap-x-4 gap-y-5 md:grid-cols-4 lg:grid-cols-8">
            {STATS.map((s) => (
              <li key={s.label}>
                <p className="font-display text-xl font-extrabold tnum">{s.value}</p>
                <p className="text-[11px] text-dim">{s.label}</p>
              </li>
            ))}
            {[
              "Fitment-checked for your car",
              `Free shipping over ${rupees(FREE_SHIPPING_OVER)}`,
              "Installation at our garages",
            ].map((t) => (
              <li key={t} className="flex items-start gap-2 text-xs text-ash">
                <Icon name="check" size={14} className="mt-0.5 shrink-0 text-accent" />
                {t}
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* 3 — SHOP BY DEPARTMENT ------------------------------------------- */}
      <section className="section bg-void">
        <div className="shell">
          <SectionHead eyebrow="Shop" title="Shop by department" href="/shop" hrefLabel="View all" />
          <ul className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4">
            {DEPARTMENTS.map((d, i) => {
              const from = lowest.get(d.slug);
              return (
                <li key={d.slug}>
                  <Reveal delay={(i % 4) * 55} className="h-full">
                    <Link
                      data-theme="dark"
                      href={departmentHref(d.slug)}
                      className="card card-hover relative block aspect-[4/5] overflow-hidden bg-graphite"
                    >
                      <Photo media={d.image} sizes="(min-width:1024px) 22vw, (min-width:768px) 24vw, 46vw" className="zoom opacity-85" />
                      <div className="absolute inset-0 scrim-soft" />
                      <div className="absolute inset-x-0 bottom-0 p-3.5 md:p-4">
                        <p className="font-display text-lg font-extrabold leading-tight md:text-xl">{d.name}</p>
                        {from !== undefined && <p className="mt-1 text-xs text-ash">Starting at {rupees(from)}</p>}
                      </div>
                    </Link>
                  </Reveal>
                </li>
              );
            })}
          </ul>
          <SectionFootLink href="/shop" label="View all" />
        </div>
      </section>

      {/* 4 — SHOP BY CAR --------------------------------------------------- */}
      <section className="section bg-carbon">
        <div className="shell">
          <SectionHead
            eyebrow="Fitment"
            title="Shop by car"
            blurb="Tell us what you drive and we will show what fits it."
          />
          <div className="grid gap-6 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:gap-10">
            <div className="card p-5 md:p-6">
              <FitmentPicker />
            </div>
            <div>
              <p className="eyebrow mb-3">Popular models</p>
              <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                {models.map((m) => (
                  <li key={`${m.brandSlug}/${m.slug}`}>
                    <Link
                      href={`/accessories/${m.slug}`}
                      className="card card-hover flex min-h-[44px] flex-col justify-center px-3.5 py-3"
                    >
                      <span className="text-[10px] uppercase tracking-[0.14em] text-dim">{m.brand}</span>
                      <span className="text-sm font-semibold">{m.name}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* 5 — SHOP BY NEED -------------------------------------------------- */}
      <section className="section bg-void">
        <div className="shell">
          <SectionHead eyebrow="Popular" title="Shop by need" href="/shop" hrefLabel="All products" />
          <ul className="grid grid-cols-2 gap-3 md:grid-cols-4">
            {needs.map(({ d, g, n }) => (
              <li key={`${d.slug}/${g.slug}`}>
                <Link href={groupHref(d.slug, g.slug)} className="card card-hover flex h-full min-h-[88px] flex-col justify-between p-4">
                  <span className="text-[10px] uppercase tracking-[0.14em] text-dim">{d.name}</span>
                  <span className="mt-2 block font-display text-base font-bold leading-snug">{g.name}</span>
                  <span className="mt-2 text-xs text-accent tnum">{n} products</span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* 6 — BESTSELLERS --------------------------------------------------- */}
      {bestsellers.length > 0 && (
        <section className="section bg-carbon">
          <div className="shell">
            <SectionHead eyebrow="Customer favourites" title="Bestsellers" href="/shop?sort=popular" />
            <ul className="rail -mx-4 px-4 pb-2 md:mx-0 md:px-0">
              {bestsellers.map((item) => (
                <li key={item.id} className="w-[62%] sm:w-[36%] md:w-[28%] lg:w-[22%]">
                  <CatalogCard item={item} sizes="(min-width:1024px) 22vw, (min-width:768px) 28vw, 62vw" />
                </li>
              ))}
            </ul>
            <SectionFootLink href="/shop?sort=popular" label="View all" />
          </div>
        </section>
      )}

      {/* 7 — COLLECTIONS --------------------------------------------------- */}
      <section className="section bg-void">
        <div className="shell">
          <SectionHead eyebrow="Collections" title="Shop by price and offer" href="/collections" />
          <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 md:gap-4">
            {collections.map(({ c, count }, i) => (
              <li key={c.slug}>
                <Reveal delay={i * 55} className="h-full">
                  <Link
                    data-theme="dark"
                    href={`/collections/${c.slug}`}
                    className="card card-hover relative flex aspect-[16/10] flex-col justify-end overflow-hidden bg-graphite lg:aspect-[4/5]"
                  >
                    <Photo media={c.image} sizes="(min-width:1024px) 24vw, (min-width:640px) 48vw, 92vw" className="zoom opacity-75" />
                    <div className="absolute inset-0 scrim-soft" />
                    <div className="relative p-4">
                      <p className="font-display text-xl font-extrabold leading-tight">{c.name}</p>
                      <p className="mt-1 text-xs text-ash">{c.tagline}</p>
                      <p className="mt-2 text-xs text-accent tnum">{count} product{count === 1 ? "" : "s"}</p>
                    </div>
                  </Link>
                </Reveal>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* 8 — ORIGINAL EQUIPMENT ------------------------------------------- */}
      <section className="section border-y border-tint/10 bg-graphite">
        <div className="shell grid gap-8 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:items-center lg:gap-14">
          <div>
            <p className="eyebrow mb-3 text-accent">Original Equipment</p>
            <h2 className="display-3">OE parts, in every department</h2>
            <p className="mt-4 max-w-md text-sm leading-relaxed text-ash md:text-base">
              Original Equipment (OE) parts are made to the car maker&apos;s own specification, for a factory fit and finish.
            </p>
          </div>
          <ul className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {DEPARTMENTS.map((d) => (
              <li key={d.slug}>
                <Link
                  href={oeHref(d.slug)}
                  className="chip flex min-h-[44px] w-full items-center justify-between gap-2 hover:border-accent hover:text-accent"
                >
                  <span className="truncate">{DEPARTMENT_BY_SLUG[d.slug].short} OE</span>
                  <Icon name="chevron" size={11} className="shrink-0 text-accent" />
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* 9 — BRANDS -------------------------------------------------------- */}
      <section className="section bg-void">
        <div className="shell">
          <SectionHead eyebrow="Brands" title="Shop by brand" />
          <BrandStrip />
        </div>
      </section>

      {/* 10 — INSTALLATION TEASER ----------------------------------------- */}
      <section className="section bg-carbon">
        <div className="shell grid items-center gap-8 lg:grid-cols-2 lg:gap-14">
          <div className="card relative aspect-[16/10] overflow-hidden bg-graphite">
            <Photo media="mechanicEngine" sizes="(min-width:1024px) 46vw, 92vw" />
          </div>
          <div>
            <p className="eyebrow mb-3">Installation</p>
            <h2 className="display-2">We fit what we sell</h2>
            <ul className="mt-5 space-y-3 text-sm text-ash md:text-base">
              {[
                "Fitting at our garages in Bengaluru, Hyderabad and Pune.",
                "Look for the wrench on a product: installation is available for it.",
                "Book a slot and we confirm fitment before we start.",
              ].map((t) => (
                <li key={t} className="flex gap-3">
                  <Icon name="check" size={16} className="mt-1 shrink-0 text-accent" />
                  {t}
                </li>
              ))}
            </ul>
            <div className="mt-7 flex flex-wrap items-center gap-x-6 gap-y-3">
              <Link href="/garage" className="btn btn-primary">
                Visit the garage
                <Icon name="arrow" size={16} />
              </Link>
              {SERVICES.map((s) => (
                <Link
                  key={s.href}
                  href={s.href}
                  className="inline-flex min-h-[44px] items-center text-sm text-ash underline underline-offset-4 hover:text-accent"
                >
                  {s.label}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* 11 — WHY RIDERZPRO ------------------------------------------------ */}
      <section className="section bg-void">
        <div className="shell">
          <SectionHead eyebrow="Why Riderzpro" title="Made, fitted and backed by us" />
          <div className="grid gap-8 lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)] lg:gap-14">
            <ul className="grid gap-4 sm:grid-cols-2">
              {WHY.map((w) => (
                <li key={w.title} className="card p-5">
                  <h3 className="font-display text-base font-bold">{w.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-ash">{w.body}</p>
                </li>
              ))}
            </ul>
            <dl className="grid grid-cols-2 content-start gap-x-4 gap-y-6">
              {STATS.map((s) => (
                <div key={s.label} className="border-t border-tint/15 pt-3">
                  <dd className="font-display text-3xl font-extrabold tnum">{s.value}</dd>
                  <dt className="mt-1 text-xs text-dim">{s.label}</dt>
                </div>
              ))}
            </dl>
          </div>
        </div>
      </section>

      {/* 12 — REVIEWS ------------------------------------------------------ */}
      <section className="section bg-carbon">
        <div className="shell">
          <SectionHead eyebrow="Reviews" title="What customers say" />
          <ul className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {REVIEWS.slice(0, 6).map((r) => (
              <li key={r.name}>
                <ReviewCard review={r} />
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* 13 — STORES ------------------------------------------------------- */}
      <section className="section bg-void">
        <div className="shell">
          <SectionHead eyebrow="Visit us" title="Our garages" href="/locations" hrefLabel="All locations" />
          <ul className="grid gap-3 md:grid-cols-3 md:gap-4">
            {LOCATIONS.map((l) => (
              <li key={l.slug}>
                <Link href="/locations" className="card card-hover flex h-full min-h-[44px] flex-col p-5">
                  <span className="font-display text-lg font-bold">{l.city}</span>
                  <span className="mt-1 text-sm text-ash">{l.name}</span>
                  <span className="mt-2 text-xs leading-relaxed text-dim">{l.address}</span>
                  <span className="mt-4 inline-flex items-center gap-1 text-xs text-accent">
                    Hours and directions
                    <Icon name="arrow" size={12} />
                  </span>
                </Link>
              </li>
            ))}
          </ul>
          <SectionFootLink href="/locations" label="All locations" />
        </div>
      </section>

      {/* 14 — WHATSAPP ----------------------------------------------------- */}
      <section data-theme="dark" className="relative overflow-hidden bg-void py-16 md:py-24">
        <Photo media="garageSpotlit" sizes="100vw" className="opacity-60" />
        <div className="absolute inset-0 scrim" />
        <div className="shell relative text-center">
          <h2 className="display-2 mx-auto max-w-2xl text-balance">Not sure what fits your car?</h2>
          <p className="mx-auto mt-4 max-w-md text-base text-ash">
            Message us your car model and what you are looking for. A real person replies.
          </p>
          <a
            href={whatsapp("Hi Riderzpro, I'd like help choosing accessories for my car.")}
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-accent mt-7"
          >
            <Icon name="whatsapp" size={18} />
            Chat on WhatsApp
          </a>
          <p className="mt-4 text-xs text-dim">{SITE.hours}</p>
        </div>
      </section>
    </>
  );
}
