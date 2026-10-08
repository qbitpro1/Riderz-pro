import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Breadcrumbs, PageHero } from "@/components/layout/PageHero";
import { SectionHead } from "@/components/ui/Section";
import { Icon } from "@/components/ui/Icon";
import { FitmentPicker } from "@/components/fitment/FitmentPicker";
import { CatalogBrowser } from "@/components/catalog/CatalogBrowser";
import { BrandStrip } from "@/components/catalog/BrandStrip";
import {
  BRANDS,
  catalogFor,
  filtersFromQuery,
  getBrand,
  type CatalogQuery,
} from "@/lib/catalog";
import { CATEGORIES } from "@/lib/data/products";
import { whatsapp } from "@/lib/data/site";

export function generateStaticParams() {
  return BRANDS.map((b) => ({ brand: b.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ brand: string }> }): Promise<Metadata> {
  const { brand } = await params;
  const b = getBrand(brand);
  if (!b) return {};
  return {
    title: `${b.name} — ${b.tagline}`,
    description: b.blurb,
    alternates: { canonical: `/brands/${b.slug}` },
  };
}

export default async function BrandPage({
  params,
  searchParams,
}: {
  params: Promise<{ brand: string }>;
  searchParams: Promise<CatalogQuery>;
}) {
  const { brand } = await params;
  const b = getBrand(brand);
  if (!b) notFound();

  const items = catalogFor(b.slug);
  const query = await searchParams;
  // The brand is the page, not a filter the visitor can clear.
  const filters = { ...filtersFromQuery(query), brands: [b.slug] };
  const categories = CATEGORIES.filter((c) => b.categories.includes(c.slug));

  return (
    <>
      <PageHero
        eyebrow={b.position}
        title={`${b.name.toUpperCase()}.`}
        blurb={b.blurb}
        media={b.image}
        size="sm"
        actions={
          b.storeHref
            ? [
                { href: b.storeHref, label: b.storeLabel!, variant: "primary" as const },
                { href: "#catalogue", label: "Filter the range", variant: "outline" as const },
              ]
            : [{ href: "#catalogue", label: "Browse the range", variant: "primary" as const }]
        }
      />

      <section className="border-b border-white/8 bg-carbon">
        <div className="shell flex flex-wrap items-center gap-x-8 gap-y-3 py-5">
          <p className="flex items-center gap-2 text-xs text-ash">
            <Icon name="shield" size={14} className="text-accent" />
            {b.provenance}
          </p>
          {b.storeHref && (
            <Link href={b.storeHref} className="ml-auto text-xs text-accent underline underline-offset-4">
              Open the {b.storeLabel}
            </Link>
          )}
        </div>
      </section>

      <section className="section" id="catalogue">
        <div className="shell">
          <Breadcrumbs
            items={[
              { label: "Home", href: "/" },
              { label: "Brands", href: "/brands" },
              { label: b.name },
            ]}
          />

          {items.length === 0 ? (
            <ImportPending name={b.name} />
          ) : (
            <>
              <div className="mb-8">
                <FitmentPicker compact />
              </div>
              <CatalogBrowser items={items} initial={filters} locked={["brands"]} showBrandOnCards={false} />
            </>
          )}
        </div>
      </section>

      {categories.length > 0 && items.length > 0 && (
        <section className="section border-t border-white/8 bg-carbon">
          <div className="shell">
            <SectionHead
              eyebrow={`${b.name} in the shop`}
              title="COMPARE IT AGAINST EVERYTHING ELSE."
              blurb="The same products sit in the main shop alongside every other brand, so you can judge them on price and fit rather than on the badge."
            />
            <ul className="flex flex-wrap gap-2">
              {categories.map((c) => (
                <li key={c.slug}>
                  <Link
                    href={`/shop/${c.slug}?brand=${b.slug}`}
                    className="chip hover:border-accent hover:text-accent"
                  >
                    <Icon name="chevron" size={11} className="text-accent" />
                    {b.name} {c.name.toLowerCase()}
                  </Link>
                </li>
              ))}
              <li>
                <Link href={`/shop?brand=${b.slug}`} className="chip hover:border-accent hover:text-accent">
                  <Icon name="chevron" size={11} className="text-accent" />
                  Everything by {b.name}
                </Link>
              </li>
            </ul>
          </div>
        </section>
      )}

      <section className="section">
        <div className="shell">
          <SectionHead eyebrow="Other brands" title="WHO ELSE WE STOCK." />
          <BrandStrip exclude={[b.slug]} />
        </div>
      </section>
    </>
  );
}

/**
 * A registered brand with nothing published yet. Says so plainly rather than
 * rendering an empty grid — and never implies a catalogue that isn't there.
 */
function ImportPending({ name }: { name: string }) {
  return (
    <div className="card p-8 md:p-10">
      <p className="eyebrow">Catalogue import in progress</p>
      <p className="mt-3 font-display text-2xl font-extrabold uppercase tracking-[-0.02em]">
        {name} isn't listed online yet.
      </p>
      <p className="mt-3 max-w-2xl text-sm leading-relaxed text-ash">
        Nothing goes live here until every SKU carries a verified price and a manufacturer image, so
        the range isn't published yet. Ask us and we'll quote you against the current price list.
      </p>
      <div className="mt-6 flex flex-wrap gap-3">
        <a
          href={whatsapp(`Hi Motorbotz, I'm looking for ${name} products. What do you have?`)}
          target="_blank"
          rel="noreferrer noopener"
          className="btn btn-whatsapp btn-sm"
        >
          <Icon name="whatsapp" size={15} />
          Ask on WhatsApp
        </a>
        <Link href="/shop" className="btn btn-outline btn-sm">
          Browse the full shop
        </Link>
      </div>
    </div>
  );
}
