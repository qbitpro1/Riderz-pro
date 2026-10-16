import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Breadcrumbs } from "@/components/layout/PageHero";
import { FitsYourCar } from "@/components/product/FitsYourCar";
import { ProductGallery } from "@/components/product/ProductGallery";
import { VendorAddToCart } from "@/components/marketplace/VendorAddToCart";
import { policyFacts } from "@/components/marketplace/storeFacts";
import { Icon } from "@/components/ui/Icon";
import { absUrl, breadcrumbLd, ldJson, pageMeta } from "@/lib/data/seo";
import { DEPARTMENT_BY_SLUG, departmentHref, groupHref } from "@/lib/data/taxonomy";
import { rupees } from "@/lib/format";
import { liveVendorProduct } from "@/lib/server/marketplace";
import type { ProductImage } from "@/lib/store/types";
import { fileHref, PART_TYPE_LABELS, storeHref, vendorProductHref } from "@/lib/vendor/types";

// Rendered per request: stock and approvals change without a deploy.
export const dynamic = "force-dynamic";

const LOW_STOCK = 5;

type Params = Promise<{ slug: string; product: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { slug, product } = await params;
  const page = await liveVendorProduct(slug, product);
  if (!page) return { title: "Product not found", robots: { index: false, follow: false } };
  const { product: p, seller } = page;
  return pageMeta({
    title: `${p.title} by ${p.brand}, sold by ${seller.name}`,
    description: p.summary?.slice(0, 155) ?? `${p.title} by ${p.brand}, sold by ${seller.name}, a verified seller on Riderzpro.`,
    path: vendorProductHref(seller.slug, p.slug),
    image: p.images[0] ? fileHref(p.images[0]) : undefined,
    imageAlt: p.title,
  });
}

export default async function VendorProductPage({ params }: { params: Params }) {
  const { slug, product } = await params;
  const page = await liveVendorProduct(slug, product);
  if (!page) notFound();
  const { product: p, seller } = page;

  const path = vendorProductHref(seller.slug, p.slug);
  const department = DEPARTMENT_BY_SLUG[p.department];
  const inStock = p.stock > 0;
  const off = p.mrp > p.price ? Math.round(((p.mrp - p.price) / p.mrp) * 100) : 0;
  const images: ProductImage[] = p.images.map((id, i) => ({
    kind: "remote",
    src: fileHref(id),
    alt: i === 0 ? p.title : `${p.title}, image ${i + 1}`,
    fit: "contain",
    tone: "light",
  }));
  const facts = policyFacts(seller);

  const schema = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: p.title,
    brand: { "@type": "Brand", name: p.brand },
    sku: p.sku,
    ...(p.summary ? { description: p.summary } : {}),
    ...(p.images.length ? { image: p.images.map((id) => absUrl(fileHref(id))) } : {}),
    offers: {
      "@type": "Offer",
      price: p.price,
      priceCurrency: "INR",
      availability: inStock ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
      url: absUrl(path),
      seller: { "@type": "Organization", name: seller.name, url: absUrl(storeHref(seller.slug)) },
    },
  };

  const lowStock = inStock && p.stock <= LOW_STOCK ? `Only ${p.stock} left` : null;
  const details: { label: string; value: string }[] = [
    { label: "Brand", value: p.brand },
    { label: "Part type", value: PART_TYPE_LABELS[p.partType] },
    { label: "SKU", value: p.sku },
    { label: "Category", value: `${department.name} · ${p.groupName}` },
    ...(p.warrantyMonths ? [{ label: "Warranty", value: `${p.warrantyMonths} month${p.warrantyMonths === 1 ? "" : "s"}` }] : []),
  ];

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: ldJson(schema) }} />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: ldJson(
            breadcrumbLd([
              { name: "Home", path: "/" },
              { name: "Shop", path: "/shop" },
              { name: seller.name, path: storeHref(seller.slug) },
              { name: p.title, path },
            ]),
          ),
        }}
      />

      <section className="pb-12 pt-20 md:pb-16 md:pt-28">
        <div className="shell">
          <Breadcrumbs
            items={[
              { label: "Home", href: "/" },
              { label: "Shop", href: "/shop" },
              { label: department.name, href: departmentHref(p.department) },
              { label: p.groupName, href: groupHref(p.department, p.groupSlug) },
              { label: p.title },
            ]}
          />

          <div className="grid gap-8 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)] lg:gap-12">
            <div className="min-w-0 lg:sticky lg:top-24 lg:self-start">
              <ProductGallery images={images} brandName={p.brand} />
            </div>

            <div className="min-w-0">
              <p className="eyebrow">{p.brand}</p>
              <h1 className="display-3 mt-2 text-balance">{p.title}</h1>
              <p className="mt-2 text-xs text-dim">
                {PART_TYPE_LABELS[p.partType]} · SKU <span className="font-display font-bold tracking-[0.06em] text-chalk">{p.sku}</span>
              </p>

              <div className="mt-5">
                <p className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                  <span className="font-display text-3xl font-extrabold tnum">{rupees(p.price)}</span>
                  {off > 0 && (
                    <>
                      <span className="text-base text-dim line-through tnum">{rupees(p.mrp)}</span>
                      <span className="text-sm font-semibold text-accent tnum">
                        Save {rupees(p.mrp - p.price)} ({off}%)
                      </span>
                    </>
                  )}
                </p>
                <p className="mt-1 text-xs text-dim">Inclusive of GST</p>
              </div>

              <p className="mt-4 flex items-center gap-2 text-sm">
                <Icon name="check" size={15} className={inStock ? "text-accent" : "text-dim"} />
                <span className={inStock ? "font-semibold" : "text-ash"}>{inStock ? "In stock" : "Out of stock"}</span>
                {lowStock && <span className="text-xs text-gold">{lowStock}</span>}
              </p>

              <div className="mt-5">
                <VendorAddToCart
                  slug={p.slug}
                  href={path}
                  title={p.title}
                  price={p.price}
                  stock={p.stock}
                  image={images[0]?.kind === "remote" ? { src: images[0].src, alt: images[0].alt } : null}
                  seller={{ id: seller.id, name: seller.name, slug: seller.slug }}
                />
              </div>

              {/* Seller card */}
              <div className="card mt-6 p-4 md:p-5">
                <p className="eyebrow mb-2 flex items-center gap-2">
                  <Icon name="shield" size={13} />
                  Verified seller
                </p>
                <p className="text-sm">
                  Sold by{" "}
                  <Link href={storeHref(seller.slug)} className="font-semibold text-accent underline underline-offset-4">
                    {seller.name}
                  </Link>
                </p>
                {facts.length > 0 && (
                  <ul className="mt-3 space-y-1.5 text-sm text-ash">
                    {facts.map((f) => (
                      <li key={f} className="flex gap-2.5">
                        <Icon name="check" size={14} className="mt-0.5 shrink-0 text-accent" />
                        {f}
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <div className="mt-6">
                <FitsYourCar fitment={p.fitment} title={p.title} code={p.sku} />
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="shell">
          <div className="grid gap-8 md:gap-10 lg:grid-cols-2">
            <div className="min-w-0 space-y-8">
              {p.summary && (
                <div>
                  <h2 className="font-display text-lg font-bold uppercase tracking-[0.04em]">About this product</h2>
                  <p className="mt-3 text-sm leading-relaxed text-ash md:text-base">{p.summary}</p>
                </div>
              )}
              {p.highlights.length > 0 && (
                <div>
                  <h2 className="font-display text-lg font-bold uppercase tracking-[0.04em]">Highlights</h2>
                  <ul className="mt-3 space-y-2 text-sm text-ash md:text-base">
                    {p.highlights.map((h) => (
                      <li key={h} className="flex gap-3">
                        <span aria-hidden className="mt-2 h-1.5 w-1.5 shrink-0 bg-accent" />
                        <span>{h}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              <div>
                <h2 className="font-display text-lg font-bold uppercase tracking-[0.04em]">Product details</h2>
                <Rows rows={details} />
              </div>
            </div>

            {p.specs.length > 0 && (
              <div className="min-w-0">
                <h2 className="font-display text-lg font-bold uppercase tracking-[0.04em]">Specifications</h2>
                <Rows rows={p.specs} />
              </div>
            )}
          </div>
        </div>
      </section>
    </>
  );
}

function Rows({ rows }: { rows: { label: string; value: string }[] }) {
  return (
    <dl className="mt-3 divide-y divide-tint/8 border-y border-tint/8">
      {rows.map((r) => (
        <div key={r.label} className="flex justify-between gap-6 py-3">
          <dt className="shrink-0 text-sm text-dim">{r.label}</dt>
          <dd className="min-w-0 break-words text-right text-sm">{r.value}</dd>
        </div>
      ))}
    </dl>
  );
}
