import type { Metadata } from "next";
import Link from "next/link";
import { PageHero } from "@/components/layout/PageHero";
import { Photo } from "@/components/ui/Photo";
import { Icon } from "@/components/ui/Icon";
import { Reveal } from "@/components/ui/Reveal";
import { SectionHead } from "@/components/ui/Section";
import { CatalogBrowser } from "@/components/catalog/CatalogBrowser";
import { BrandStrip } from "@/components/catalog/BrandStrip";
import { FitmentPicker } from "@/components/fitment/FitmentPicker";
import { CATEGORIES, PRICE_BANDS } from "@/lib/data/products";
import { DEPARTMENT_BY_SLUG } from "@/lib/data/taxonomy";
import { CATALOG, CATALOG_TOTALS, filtersFromQuery, type CatalogQuery } from "@/lib/catalog";
import { LANDING_MODELS } from "@/lib/data/vehicles";
import { breadcrumbLd, itemListLd, ldJson, pageMeta } from "@/lib/data/seo";
import { liveVendorItems } from "@/lib/server/marketplace";

export const metadata: Metadata = pageMeta({
  title: "Car Accessories Online India: Interior, Exterior, Audio, Lighting & Off-Road",
  description:
    "Shop car accessories across eight departments and every brand we stock. Filter by brand, department, price and fitment, with installation at Riderzpro garages in Bengaluru, Hyderabad and Pune.",
  path: "/shop",
});

export default async function ShopPage({ searchParams }: { searchParams: Promise<CatalogQuery> }) {
  const filters = filtersFromQuery(await searchParams);
  // Approved sellers' live products follow the house range; empty when there is no database.
  const items = [...CATALOG, ...(await liveVendorItems())];

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: ldJson(breadcrumbLd([{ name: "Home", path: "/" }, { name: "Shop", path: "/shop" }])) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: ldJson(itemListLd("Shop departments", CATEGORIES.map((c) => ({ name: c.name, path: `/shop/${c.slug}` })))) }} />
      <PageHero
        eyebrow="Accessories store"
        title="EVERYTHING THAT BOLTS ON."
        blurb="Eight departments, every brand we stock, every part fitment-checked against your variant. If it shows up for your car, it fits your car — or we collect it and refund in full."
        media="tailLightBokeh"
        size="sm"
      />

      <section className="section">
        <div className="shell">
          <Reveal>
            <FitmentPicker />
          </Reveal>

          <ul className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {CATEGORIES.map((c, i) => (
              <li key={c.slug}>
                <Reveal delay={i * 55} className="h-full">
                  <Link href={`/shop/${c.slug}`} className="card card-hover group block h-full">
                    <div data-theme="dark" className="relative aspect-[16/9] overflow-hidden bg-graphite">
                      <Photo media={c.image} sizes="(min-width:1024px) 33vw, (min-width:640px) 50vw, 92vw" className="zoom opacity-85" />
                      <div className="absolute inset-0 scrim-soft" />
                      <div className="absolute inset-x-0 bottom-0 p-4">
                        <p className="font-display text-2xl font-extrabold uppercase leading-none tracking-[-0.03em]">
                          {c.name}
                        </p>
                        <p className="mt-1 text-xs text-accent">{c.tagline}</p>
                      </div>
                    </div>
                    <div className="p-4">
                      <p className="text-xs leading-relaxed text-ash">{c.blurb}</p>
                      <p className="mt-3 flex flex-wrap gap-1.5">
                        {DEPARTMENT_BY_SLUG[c.slug].groups
                          .filter((g) => g.slug !== "more")
                          .slice(0, 4)
                          .map((g) => (
                            <span key={g.slug} className="chip">
                              {g.name}
                            </span>
                          ))}
                        {DEPARTMENT_BY_SLUG[c.slug].groups.length > 4 && (
                          <span className="chip">+{DEPARTMENT_BY_SLUG[c.slug].groups.length - 4}</span>
                        )}
                      </p>
                    </div>
                  </Link>
                </Reveal>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="section border-y border-tint/8 bg-carbon">
        <div className="shell">
          <SectionHead
            eyebrow="Shop by brand"
            title="EVERY BRAND WE STOCK."
            blurb="RECOIL and Autoform keep their own stores, and everything in them is also here — so you can filter across brands, or stay inside one."
            href="/brands"
            hrefLabel="All brands"
          />
          <BrandStrip />
        </div>
      </section>

      <section className="section">
        <div className="shell">
          <SectionHead
            eyebrow="Everything in stock"
            title="THE FULL CATALOGUE."
            blurb={`${CATALOG_TOTALS.products} products across ${CATALOG_TOTALS.brands} brands. Filter by brand, category, type, price band or fitment. Prices include GST; installation is quoted separately and is often free.`}
          />
          <CatalogBrowser items={items} initial={filters} />
        </div>
      </section>

      <section className="section border-t border-tint/8 bg-carbon">
        <div className="shell">
          <SectionHead eyebrow="Pricing" title="₹299 TO ₹2 LAKH+." blurb="We stock for the first-time owner and the signature build, deliberately." />
          <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {PRICE_BANDS.map((b) => (
              <li key={b.slug} className="card p-5">
                <p className="eyebrow">{b.label}</p>
                <p className="mt-2 font-display text-xl font-extrabold tnum">{b.range}</p>
                <p className="mt-2 text-xs leading-relaxed text-ash">{b.blurb}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="section border-t border-tint/8">
        <div className="shell">
          <SectionHead eyebrow="Shop by car" title="PARTS FOR YOUR EXACT MODEL." />
          <ul className="flex flex-wrap gap-2">
            {LANDING_MODELS.map((m) => (
              <li key={m.slug}>
                <Link href={`/accessories/${m.slug}`} className="chip hover:border-accent hover:text-accent">
                  <Icon name="chevron" size={11} className="text-accent" />
                  {m.brand} {m.name}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </>
  );
}
