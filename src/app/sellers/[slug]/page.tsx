import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Breadcrumbs } from "@/components/layout/PageHero";
import { CatalogBrowser } from "@/components/catalog/CatalogBrowser";
import { Icon } from "@/components/ui/Icon";
import { policyFacts, sinceLabel } from "@/components/marketplace/storeFacts";
import { filtersFromQuery, type CatalogQuery } from "@/lib/catalog/filters";
import { DEPARTMENT_BY_SLUG } from "@/lib/data/taxonomy";
import { absUrl, breadcrumbLd, ldJson, pageMeta } from "@/lib/data/seo";
import { liveVendorItems, publicStore } from "@/lib/server/marketplace";
import { fileHref, storeHref } from "@/lib/vendor/types";

// Rendered per request: stock and approvals change without a deploy.
export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const store = await publicStore(slug);
  if (!store) return { title: "Store not found", robots: { index: false, follow: false } };
  return pageMeta({
    title: `${store.name}: Verified Seller on Riderzpro`,
    description:
      store.description.slice(0, 155) ||
      `Shop car and bike accessories from ${store.name}, a KYC-verified seller on Riderzpro.`,
    path: storeHref(store.slug),
    image: store.banner ? fileHref(store.banner) : store.logo ? fileHref(store.logo) : undefined,
    imageAlt: store.name,
  });
}

export default async function StorePage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<CatalogQuery>;
}) {
  const { slug } = await params;
  const store = await publicStore(slug);
  if (!store) notFound();

  const items = await liveVendorItems({ vendorId: store.id });
  const filters = filtersFromQuery(await searchParams);
  const since = sinceLabel(store.approvedAt);
  const facts = policyFacts(store);
  const path = storeHref(store.slug);

  const schema = {
    "@context": "https://schema.org",
    "@type": "Store",
    name: store.name,
    url: absUrl(path),
    ...(store.description ? { description: store.description } : {}),
    ...(store.logo ? { logo: absUrl(fileHref(store.logo)) } : {}),
    ...(store.banner ? { image: absUrl(fileHref(store.banner)) } : {}),
    ...(store.pickupCity || store.pickupState
      ? {
          address: {
            "@type": "PostalAddress",
            ...(store.pickupCity ? { addressLocality: store.pickupCity } : {}),
            ...(store.pickupState ? { addressRegion: store.pickupState } : {}),
            addressCountry: "IN",
          },
        }
      : {}),
    parentOrganization: { "@type": "Organization", name: "Riderzpro", url: absUrl("/") },
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: ldJson(schema) }} />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: ldJson(breadcrumbLd([{ name: "Home", path: "/" }, { name: "Shop", path: "/shop" }, { name: store.name, path }])),
        }}
      />

      {/* Banner: the photo and its text live inside one dark island. */}
      <section data-theme="dark" className="relative overflow-hidden border-b border-tint/8 bg-graphite">
        {store.banner && (
          <div className="absolute inset-0">
            <Image src={fileHref(store.banner)} alt="" fill priority sizes="100vw" className="object-cover opacity-80" />
          </div>
        )}
        <div className="absolute inset-0 scrim" />
        <div className="shell relative pb-8 pt-28 md:pb-12 md:pt-40">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-end">
            <div className="relative h-20 w-20 shrink-0 overflow-hidden border border-tint/15 bg-void md:h-28 md:w-28">
              {store.logo ? (
                <Image src={fileHref(store.logo)} alt={`${store.name} logo`} fill sizes="112px" className="object-contain p-2" />
              ) : (
                <span className="grid h-full w-full place-items-center font-display text-3xl font-extrabold uppercase text-accent">
                  {store.name.slice(0, 1)}
                </span>
              )}
            </div>
            <div className="min-w-0">
              <p className="eyebrow mb-2 flex items-center gap-2">
                <Icon name="shield" size={13} />
                {since ? `Verified seller since ${since}` : "Verified seller"}
              </p>
              <h1 className="display-2 text-balance">{store.name}</h1>
              {(store.sellerType || store.pickupCity) && (
                <p className="mt-2 text-sm text-ash">
                  {[store.sellerType, store.pickupCity && store.pickupState ? `${store.pickupCity}, ${store.pickupState}` : store.pickupCity]
                    .filter(Boolean)
                    .join(" · ")}
                </p>
              )}
            </div>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="shell">
          <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Shop", href: "/shop" }, { label: store.name }]} />

          <div className="grid gap-8 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)] lg:gap-12">
            <div className="min-w-0 space-y-6">
              {store.description && <p className="max-w-2xl text-sm leading-relaxed text-ash md:text-base">{store.description}</p>}

              {store.departments.length > 0 && (
                <div>
                  <p className="eyebrow mb-2">Sells</p>
                  <ul className="flex flex-wrap gap-2">
                    {store.departments.map((d) => (
                      <li key={d} className="chip">
                        {DEPARTMENT_BY_SLUG[d]?.name ?? d}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {store.brands.length > 0 && (
                <div>
                  <p className="eyebrow mb-2">Brands</p>
                  <ul className="flex flex-wrap gap-2">
                    {store.brands.map((b) => (
                      <li key={b} className="chip">
                        {b}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            <aside className="card p-5" aria-label="Seller policies">
              <p className="eyebrow mb-3">Seller facts</p>
              <ul className="space-y-2.5 text-sm text-ash">
                <li className="flex gap-2.5">
                  <Icon name="check" size={15} className="mt-0.5 shrink-0 text-accent" />
                  Passed Riderzpro KYC
                </li>
                <li className="flex gap-2.5">
                  <Icon name="check" size={15} className="mt-0.5 shrink-0 text-accent" />
                  {store.gstRegistered ? "GST-registered seller" : "Not GST-registered"}
                </li>
                {facts.map((f) => (
                  <li key={f} className="flex gap-2.5">
                    <Icon name="check" size={15} className="mt-0.5 shrink-0 text-accent" />
                    {f}
                  </li>
                ))}
              </ul>
            </aside>
          </div>
        </div>
      </section>

      <section className="section border-t border-tint/8 bg-carbon">
        <div className="shell">
          <h2 className="display-3 mb-6">Products from {store.name}</h2>
          {items.length === 0 ? (
            <div className="card p-10 text-center">
              <p className="font-display text-xl uppercase">No products listed yet</p>
              <p className="mt-2 text-sm text-ash">This seller has not published products. Browse the full range in the shop.</p>
              <Link href="/shop" className="btn btn-outline btn-sm mt-5">
                Browse the shop
              </Link>
            </div>
          ) : (
            <CatalogBrowser items={items} initial={filters} showBrandOnCards />
          )}
        </div>
      </section>
    </>
  );
}
