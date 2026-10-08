import type { Metadata } from "next";
import Link from "next/link";
import { PageHero } from "@/components/layout/PageHero";
import { SectionHead } from "@/components/ui/Section";
import { Icon } from "@/components/ui/Icon";
import { Reveal } from "@/components/ui/Reveal";
import { BrandStrip } from "@/components/catalog/BrandStrip";
import { BRAND_STORES, BRANDS, CATALOG_BY_BRAND, CATALOG_TOTALS } from "@/lib/catalog";
import { CATEGORIES } from "@/lib/data/products";

export const metadata: Metadata = {
  title: "Shop by Brand — RECOIL, Autoform, Blaupunkt & Motorbotz",
  description:
    "Every brand Motorbotz stocks in one place. Browse RECOIL car audio, Autoform seat covers and the Motorbotz house range by brand, category, price and fitment.",
  alternates: { canonical: "/brands" },
};

export default function BrandsPage() {
  return (
    <>
      <PageHero
        eyebrow="Shop by brand"
        title="THE BRANDS WE STAND BEHIND."
        blurb="Each brand keeps its own store, with its own catalogue and its own sourcing trail. They also all feed one shop — so you can filter across every brand at once, or stay inside just one."
        media="showroomRed"
        size="sm"
        actions={[
          { href: "/shop", label: "Browse the full shop", variant: "primary" },
          { href: "#brands", label: "See every brand", variant: "outline" },
        ]}
      >
        <dl className="mt-8 grid max-w-2xl grid-cols-2 gap-x-6 gap-y-5 border-t border-white/12 pt-6 md:grid-cols-4">
          <Stat value={String(BRANDS.length)} label="Brands stocked" />
          <Stat value={String(CATALOG_TOTALS.products)} label="Products listed" />
          <Stat value={String(CATALOG_TOTALS.subcategories)} label="Product types" />
          <Stat value={String(BRAND_STORES.length)} label="Standalone stores" />
        </dl>
      </PageHero>

      <section className="section" id="brands">
        <div className="shell">
          <SectionHead
            eyebrow="Every brand"
            title="PICK A BRAND."
            blurb="Brand pages show the whole range with the same filters as the shop. The brand stores go further — sourcing notes, series guides and the manufacturer's own data."
          />
          <BrandStrip />
        </div>
      </section>

      <section className="section border-y border-white/8 bg-carbon">
        <div className="shell">
          <SectionHead
            eyebrow="Brand stores"
            title="THE DEEP CATALOGUES."
            blurb="Two brands are big enough to warrant a store of their own. Both stay exactly where they are — the shop filters are an additional way in, not a replacement."
          />
          <ul className="grid gap-3 md:grid-cols-2">
            {BRAND_STORES.map((b, i) => (
              <li key={b.slug}>
                <Reveal delay={i * 60} className="h-full">
                  <div className="card flex h-full flex-col p-6">
                    <p className="eyebrow">{b.position}</p>
                    <p className="mt-2 font-display text-3xl font-extrabold uppercase tracking-[-0.03em]">{b.name}</p>
                    <p className="mt-3 text-sm leading-relaxed text-ash">{b.blurb}</p>
                    <p className="mt-4 text-xs leading-relaxed text-dim">{b.provenance}</p>
                    <div className="mt-auto flex flex-wrap gap-3 pt-6">
                      <Link href={b.storeHref!} className="btn btn-primary btn-sm">
                        {b.storeLabel}
                        <Icon name="arrow" size={14} />
                      </Link>
                      <Link href={`/brands/${b.slug}`} className="btn btn-outline btn-sm">
                        Filter in the shop
                        <span className="text-dim tnum">({CATALOG_BY_BRAND[b.slug].length})</span>
                      </Link>
                    </div>
                  </div>
                </Reveal>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="section">
        <div className="shell">
          <SectionHead
            eyebrow="Or shop by what it does"
            title="BRAND IS JUST ONE FILTER."
            blurb="Inside a category, brand is just another filter — products are ranked on fit and price rather than on whose name is on the box."
          />
          <ul className="flex flex-wrap gap-2">
            {CATEGORIES.map((c) => (
              <li key={c.slug}>
                <Link href={`/shop/${c.slug}`} className="chip hover:border-accent hover:text-accent">
                  <Icon name="chevron" size={11} className="text-accent" />
                  {c.name}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div>
      <dt className="font-display text-3xl font-extrabold tnum md:text-4xl">{value}</dt>
      <dd className="mt-1 text-[11px] uppercase tracking-[0.14em] text-dim">{label}</dd>
    </div>
  );
}
