import Link from "next/link";
import type { Metadata } from "next";
import { Photo } from "@/components/ui/Photo";
import { Icon } from "@/components/ui/Icon";
import { Reveal } from "@/components/ui/Reveal";
import { SectionHead, SectionFootLink } from "@/components/ui/Section";
import { HeroCarousel } from "@/components/home/HeroCarousel";
import { CatalogCard } from "@/components/catalog/CatalogCard";
import { CATALOG } from "@/lib/catalog";
import { DEPARTMENTS, departmentHref, groupHref, type DepartmentSlug } from "@/lib/data/taxonomy";
import { SITE } from "@/lib/data/site";
import { rupees } from "@/lib/format";
import type { MediaKey } from "@/lib/media";
import { pageMeta } from "@/lib/data/seo";
import { liveVendorItems } from "@/lib/server/marketplace";
import { storeHref } from "@/lib/vendor/types";

export const metadata: Metadata = pageMeta({
  title: "Riderzpro — Car Accessories from Verified Sellers",
  description:
    "Car accessories from verified sellers across India: seat covers, floor mats, multimedia, lighting, covers and guards, and off-roading gear.",
  path: "/",
});

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

const WHY = [
  {
    title: "Verified sellers only",
    body: "Every store is reviewed by Riderzpro, with its business and tax details checked, before it can sell.",
  },
  {
    title: "Prices checked at checkout",
    body: "What you pay is worked out on our server from the seller's live price and stock, never from the page.",
  },
  {
    title: "Track every order",
    body: "Follow your order from the store to your door, with a GST invoice for every purchase.",
  },
  {
    title: "Help whenever you ask",
    body: "Our AI assistant answers product questions any time, and a real person is a message away.",
  },
];

export const dynamic = "force-dynamic";

export default async function HomePage() {
  // Everything below comes from what approved sellers have listed (plus any house products).
  const items = [...CATALOG, ...(await liveVendorItems())];

  const lowest = new Map<DepartmentSlug, number>();
  const groupCount = new Map<string, number>();
  for (const i of items) {
    if (i.price !== null && i.buyable) {
      const cur = lowest.get(i.category);
      if (cur === undefined || i.price < cur) lowest.set(i.category, i.price);
    }
    const k = `${i.category}/${i.group}`;
    groupCount.set(k, (groupCount.get(k) ?? 0) + 1);
  }

  // Busiest groups, at most two per department so the row isn't one aisle.
  const perDept = new Map<string, number>();
  const needs = DEPARTMENTS.flatMap((d) => d.groups.map((g) => ({ d, g, n: groupCount.get(`${d.slug}/${g.slug}`) ?? 0 })))
    .filter((x) => x.n > 0 && x.g.slug !== "more")
    .sort((a, b) => b.n - a.n)
    .filter((x) => {
      const used = perDept.get(x.d.slug) ?? 0;
      if (used >= 2) return false;
      perDept.set(x.d.slug, used + 1);
      return true;
    })
    .slice(0, 8);

  // Newest listings first (liveVendorItems is already newest-first).
  const latest = items.filter((i) => i.availability !== "coming-soon").slice(0, 12);

  // The stores selling here, busiest first.
  const stores = new Map<string, { name: string; slug: string; count: number }>();
  for (const i of items) {
    if (!i.seller) continue;
    const s = stores.get(i.seller.id) ?? { name: i.seller.name, slug: i.seller.slug, count: 0 };
    s.count += 1;
    stores.set(i.seller.id, s);
  }
  const storeList = [...stores.values()].sort((a, b) => b.count - a.count).slice(0, 8);

  return (
    <>
      <h1 className="sr-only">Riderzpro — car accessories from verified sellers</h1>

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
          <ul className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            {["Verified sellers only", "Secure checkout", "GST invoice with every order"].map((t) => (
              <li key={t} className="flex items-center gap-2.5 text-sm font-medium text-ash">
                <Icon name="check" size={16} className="shrink-0 text-accent" />
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

      {/* 4 — LATEST FROM OUR SELLERS --------------------------------------- */}
      <section className="section bg-carbon">
        <div className="shell">
          <SectionHead eyebrow="Just listed" title="Latest from our sellers" href="/shop" hrefLabel="All products" />
          {latest.length > 0 ? (
            <ul className="rail -mx-4 px-4 pb-2 md:mx-0 md:px-0">
              {latest.map((item) => (
                <li key={item.id} className="w-[62%] sm:w-[36%] md:w-[28%] lg:w-[22%]">
                  <CatalogCard item={item} sizes="(min-width:1024px) 22vw, (min-width:768px) 28vw, 62vw" />
                </li>
              ))}
            </ul>
          ) : (
            <div className="card p-6 text-sm text-ash">
              No products are listed yet. Sellers&apos; products appear here as soon as they are approved.{" "}
              <Link href="/vendor" className="text-accent underline underline-offset-4">
                Sell on Riderzpro
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* 5 — SHOP BY NEED -------------------------------------------------- */}
      {needs.length > 0 && (
        <section className="section bg-void">
          <div className="shell">
            <SectionHead eyebrow="Popular" title="Shop by need" href="/shop" hrefLabel="All products" />
            <ul className="grid grid-cols-2 gap-3 md:grid-cols-4">
              {needs.map(({ d, g, n }) => (
                <li key={`${d.slug}/${g.slug}`}>
                  <Link href={groupHref(d.slug, g.slug)} className="card card-hover flex h-full min-h-[88px] flex-col justify-between p-4">
                    <span className="text-[10px] uppercase tracking-[0.14em] text-dim">{d.name}</span>
                    <span className="mt-2 block font-display text-base font-bold leading-snug">{g.name}</span>
                    <span className="mt-2 text-xs text-accent tnum">
                      {n} product{n === 1 ? "" : "s"}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}

      {/* 6 — STORES -------------------------------------------------------- */}
      {storeList.length > 0 && (
        <section className="section bg-carbon">
          <div className="shell">
            <SectionHead eyebrow="Stores" title="Shop by store" />
            <ul className="grid grid-cols-2 gap-3 md:grid-cols-4">
              {storeList.map((s) => (
                <li key={s.slug}>
                  <Link href={storeHref(s.slug)} className="card card-hover flex h-full min-h-[88px] flex-col justify-between p-4">
                    <span className="text-[10px] uppercase tracking-[0.14em] text-dim">Store</span>
                    <span className="mt-2 block font-display text-base font-bold leading-snug">{s.name}</span>
                    <span className="mt-2 text-xs text-accent tnum">
                      {s.count} product{s.count === 1 ? "" : "s"}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}

      {/* 7 — WHY RIDERZPRO ------------------------------------------------- */}
      <section className="section bg-void">
        <div className="shell">
          <SectionHead eyebrow="Why Riderzpro" title="A marketplace you can trust" />
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {WHY.map((w) => (
              <li key={w.title} className="card p-5">
                <h3 className="font-display text-base font-bold">{w.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-ash">{w.body}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* 8 — SELL ON RIDERZPRO --------------------------------------------- */}
      <section className="section border-y border-tint/10 bg-graphite">
        <div className="shell grid gap-6 lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)] lg:items-center">
          <div>
            <p className="eyebrow mb-3 text-accent">For sellers</p>
            <h2 className="display-3">Sell your products on Riderzpro</h2>
            <p className="mt-4 max-w-md text-sm leading-relaxed text-ash md:text-base">
              Open your store, list products one by one or upload your whole catalogue as a JSON file, and manage orders and
              payouts from one dashboard.
            </p>
          </div>
          <div className="flex flex-wrap gap-3 lg:justify-end">
            <Link href="/vendor/auth?mode=signup" className="btn btn-accent">
              Start selling
              <Icon name="arrow" size={16} />
            </Link>
            <Link href="/vendor/auth" className="btn btn-primary">
              Seller sign in
            </Link>
          </div>
        </div>
      </section>

      {/* 9 — ASK AI -------------------------------------------------------- */}
      <section data-theme="dark" className="relative overflow-hidden bg-void py-16 md:py-24">
        <Photo media="garageSpotlit" sizes="100vw" className="opacity-60" />
        <div className="absolute inset-0 scrim" />
        <div className="shell relative text-center">
          <h2 className="display-2 mx-auto max-w-2xl text-balance">Not sure what you need?</h2>
          <p className="mx-auto mt-4 max-w-md text-base text-ash">
            Tell our AI assistant your car and what you are looking for. It suggests products within your budget.
          </p>
          <Link href="/assistant" className="btn btn-accent mt-7">
            <Icon name="spark" size={18} />
            Ask our AI assistant
          </Link>
          <p className="mt-4 text-xs text-dim">{SITE.hours}</p>
        </div>
      </section>
    </>
  );
}
