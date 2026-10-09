import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PageHero, Breadcrumbs } from "@/components/layout/PageHero";
import { CatalogBrowser } from "@/components/catalog/CatalogBrowser";
import { FitmentPicker } from "@/components/fitment/FitmentPicker";
import { SectionHead } from "@/components/ui/Section";
import { Icon } from "@/components/ui/Icon";
import { CATEGORIES, getCategory, type CategorySlug } from "@/lib/data/products";
import { BRANDS, CATALOG, filtersFromQuery, type CatalogQuery } from "@/lib/catalog";

export function generateStaticParams() {
  return CATEGORIES.map((c) => ({ category: c.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ category: string }>;
}): Promise<Metadata> {
  const { category } = await params;
  const cat = getCategory(category);
  if (!cat) return {};
  return {
    title: `${cat.name} Car Accessories — ${cat.tagline}`,
    description: cat.blurb,
    alternates: { canonical: `/shop/${cat.slug}` },
  };
}

export default async function CategoryPage({
  params,
  searchParams,
}: {
  params: Promise<{ category: string }>;
  searchParams: Promise<CatalogQuery>;
}) {
  const { category } = await params;
  const cat = getCategory(category);
  if (!cat) notFound();

  const slug = cat.slug as CategorySlug;
  const items = CATALOG.filter((i) => i.category === slug);
  // The category is the page; everything else stays a filter the visitor owns.
  const filters = { ...filtersFromQuery(await searchParams), categories: [slug] };

  // Only brands that actually sell into this category get a shortcut.
  const brands = BRANDS.filter((b) => items.some((i) => i.brand === b.slug));

  // Types we have listed, then the rest of the category's range, deduplicated.
  const counts = new Map<string, number>();
  for (const i of items) counts.set(i.sub, (counts.get(i.sub) ?? 0) + 1);
  const subcategoryChips = [
    ...[...counts.entries()]
      .sort((a, b) => b[1] - a[1])
      .map(([name, count]) => ({ name, count, listed: true })),
    ...cat.subcategories
      .filter((s) => !counts.has(s))
      .map((name) => ({ name, count: 0, listed: false })),
  ];

  return (
    <>
      <PageHero eyebrow={`${cat.name} accessories`} title={cat.tagline.toUpperCase()} blurb={cat.blurb} media={cat.image} size="sm" />

      <section className="section">
        <div className="shell">
          <Breadcrumbs
            items={[
              { label: "Home", href: "/" },
              { label: "Shop", href: "/shop" },
              { label: cat.name },
            ]}
          />

          {brands.length > 1 && (
            <div className="mb-6 flex flex-wrap items-center gap-2">
              <span className="text-[11px] uppercase tracking-[0.14em] text-dim">Brands here</span>
              {brands.map((b) => (
                <Link
                  key={b.slug}
                  href={`/shop/${cat.slug}?brand=${b.slug}`}
                  className="chip hover:border-accent hover:text-accent"
                >
                  {b.name}
                  <span className="text-dim tnum">{items.filter((i) => i.brand === b.slug).length}</span>
                </Link>
              ))}
            </div>
          )}

          <div className="mb-8">
            <FitmentPicker compact />
          </div>

          <CatalogBrowser items={items} initial={filters} locked={["categories"]} />
        </div>
      </section>

      <section className="section border-t border-tint/8 bg-carbon">
        <div className="shell">
          <SectionHead
            eyebrow={`${cat.name} range`}
            title="EVERYTHING IN THIS CATEGORY."
            blurb="Listed online or not, we stock or source all of it. Ask on WhatsApp for anything you can't find here."
          />
          {/* A type we actually have listed links into the filtered grid. One we
              stock but haven't listed stays a plain chip rather than a link to
              an empty result. */}
          <ul className="flex flex-wrap gap-2">
            {subcategoryChips.map((s) =>
              s.listed ? (
                <li key={s.name}>
                  <Link
                    href={`/shop/${cat.slug}?sub=${encodeURIComponent(s.name)}`}
                    className="chip hover:border-accent hover:text-accent"
                  >
                    <Icon name="chevron" size={11} className="text-accent" />
                    {s.name}
                    <span className="text-dim tnum">{s.count}</span>
                  </Link>
                </li>
              ) : (
                <li key={s.name} className="chip text-dim">
                  {s.name}
                </li>
              ),
            )}
          </ul>
        </div>
      </section>
    </>
  );
}
