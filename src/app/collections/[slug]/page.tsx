import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PageHero, Breadcrumbs } from "@/components/layout/PageHero";
import { CatalogBrowser } from "@/components/catalog/CatalogBrowser";
import { CATALOG, filtersFromQuery, sortItems, type CatalogQuery } from "@/lib/catalog";
import { COLLECTIONS, COLLECTION_BY_SLUG } from "@/lib/data/collections";
import { breadcrumbLd, itemListLd, ldJson, pageMeta } from "@/lib/data/seo";

const LIVE = COLLECTIONS.filter((c) => CATALOG.some(c.match));

export function generateStaticParams() {
  return LIVE.map((c) => ({ slug: c.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const c = COLLECTION_BY_SLUG[slug];
  if (!c) return {};
  return pageMeta({
    title: `${c.name}: ${c.tagline}`,
    description: `${c.blurb} Car accessories from Riderzpro.`,
    path: `/collections/${c.slug}`,
  });
}

export default async function CollectionPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<CatalogQuery>;
}) {
  const { slug } = await params;
  const c = COLLECTION_BY_SLUG[slug];
  if (!c) notFound();
  const items = CATALOG.filter(c.match);
  if (items.length === 0) notFound();

  const query = await searchParams;
  const filters = filtersFromQuery(query);
  // The collection's own order is the default; an explicit ?sort= wins.
  if (typeof query.sort !== "string") filters.sort = c.sort;

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: ldJson(breadcrumbLd([{ name: "Home", path: "/" }, { name: "Collections", path: "/collections" }, { name: c.name, path: `/collections/${c.slug}` }])) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: ldJson(itemListLd("Products", sortItems(items, c.sort).slice(0, 24).map((i) => ({ name: i.title, path: i.href })))) }} />
      <PageHero
        eyebrow="Collection"
        title={c.name.toUpperCase()}
        blurb={`${c.blurb} ${items.length} product${items.length === 1 ? "" : "s"}.`}
        media={c.image}
        size="sm"
      />
      <section className="section">
        <div className="shell">
          <Breadcrumbs
            items={[
              { label: "Home", href: "/" },
              { label: "Collections", href: "/collections" },
              { label: c.name },
            ]}
          />
          <div className="mb-6 flex flex-wrap items-center gap-2">
            <span className="text-[11px] uppercase tracking-[0.14em] text-dim">Collections</span>
            {LIVE.map((x) => (
              <Link
                key={x.slug}
                href={`/collections/${x.slug}`}
                className={`chip ${x.slug === c.slug ? "chip-active" : "hover:border-accent hover:text-accent"}`}
              >
                {x.name}
              </Link>
            ))}
          </div>
          <CatalogBrowser key={c.slug} items={items} initial={filters} />
        </div>
      </section>
    </>
  );
}
