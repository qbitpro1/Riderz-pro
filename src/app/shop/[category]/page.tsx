import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CatalogBrowser } from "@/components/catalog/CatalogBrowser";
import { SectionHead } from "@/components/ui/Section";
import { Icon } from "@/components/ui/Icon";
import { CATEGORIES, getCategory, type CategorySlug } from "@/lib/data/products";
import { CATALOG, filtersFromQuery, sortItems, type CatalogQuery } from "@/lib/catalog";
import { breadcrumbLd, itemListLd, ldJson, pageMeta } from "@/lib/data/seo";
import { liveVendorItems } from "@/lib/server/marketplace";

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
  // Canonical ignores ?group= / ?oe= / ?max= / ?sort= so every filtered view consolidates here.
  return pageMeta({
    title: `${cat.name} Car Accessories: ${cat.tagline}`,
    description: cat.blurb,
    path: `/shop/${cat.slug}`,
  });
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
  const items = [...CATALOG.filter((i) => i.category === slug), ...(await liveVendorItems({ department: slug }))];
  // The category is the page; everything else stays a filter the visitor owns.
  const filters = { ...filtersFromQuery(await searchParams), categories: [slug] };

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
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: ldJson(breadcrumbLd([{ name: "Home", path: "/" }, { name: "Shop", path: "/shop" }, { name: cat.name, path: `/shop/${cat.slug}` }])) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: ldJson(itemListLd("Products", sortItems(items, "popular").slice(0, 24).map((i) => ({ name: i.title, path: i.href })))) }} />
      <CatalogBrowser
        items={items}
        initial={filters}
        locked={["categories"]}
        vehicleBar
        header={{
          crumbs: [
            { label: "Home", href: "/" },
            { label: cat.name, href: `/shop/${cat.slug}` },
          ],
          title: cat.name,
        }}
      />

      <section className="section border-t border-tint/8 bg-carbon">
        <div className="shell">
          <SectionHead
            eyebrow={`${cat.name} range`}
            title="Everything in this category"
            blurb="Listed online or not, we stock or source all of it. Ask us for anything you can't find here."
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
                    <span className="opacity-60 tnum">{s.count}</span>
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
