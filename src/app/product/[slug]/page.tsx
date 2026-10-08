import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Photo } from "@/components/ui/Photo";
import { Icon } from "@/components/ui/Icon";
import { Breadcrumbs } from "@/components/layout/PageHero";
import { SectionHead, Stars } from "@/components/ui/Section";
import { Accordion } from "@/components/ui/Accordion";
import { ProductCard } from "@/components/shop/ProductCard";
import { ProductActions } from "@/components/shop/ProductActions";
import { getCategory, getProduct, PRODUCTS, relatedProducts } from "@/lib/data/products";
import { findModelBySlug } from "@/lib/data/vehicles";
import { rupees } from "@/lib/format";
import { MEDIA } from "@/lib/media";
import { SITE } from "@/lib/data/site";

export function generateStaticParams() {
  return PRODUCTS.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const p = getProduct(slug);
  if (!p) return {};
  return {
    title: `${p.name} — ${rupees(p.price)}`,
    description: p.summary,
    alternates: { canonical: `/product/${p.slug}` },
    openGraph: { title: p.name, description: p.summary, images: [MEDIA[p.image].src] },
  };
}

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const product = getProduct(slug);
  if (!product) notFound();

  const category = getCategory(product.category);
  const related = relatedProducts(product);
  const off = Math.round(((product.mrp - product.price) / product.mrp) * 100);
  const gallery = product.gallery ?? [product.image];

  const fitmentLabels =
    product.fitment[0] === "universal"
      ? ["Universal — fits any car"]
      : product.fitment.map((f) => {
          const m = findModelBySlug(f);
          return m ? `${m.brand} ${m.name}` : f;
        });

  const faq = [
    {
      q: "Will this fit my exact variant?",
      a: `We check fitment against your variant and year before dispatch. ${
        product.fitment[0] === "universal"
          ? "This part is universal, but send us your car details anyway and we will confirm."
          : "If your model is not listed, message us — we often have a variant-specific version that is not on the site yet."
      }`,
    },
    {
      q: "Do you install this?",
      a: product.installation
        ? `Yes. Installation takes about ${product.installTime} at any Motorbotz garage${
            product.installPrice ? ` and costs ${rupees(product.installPrice)}` : " and is included free with the part"
          }. Workmanship is warranted for 12 months.`
        : "This part is designed for self-fitment and needs no tools or workshop time. If you would still rather we did it, book a slot and we will fit it while you wait.",
    },
    { q: "What is the warranty?", a: product.warranty },
    {
      q: "How fast is delivery?",
      a: `${product.delivery}. Orders placed before 2 PM on a working day ship the same day. You get a tracking link on WhatsApp.`,
    },
    {
      q: "What if I don't like it?",
      a: "Unused items in original packaging can be returned within 7 days for a full refund. If a part was fitted and does not fit properly, we remove it and refund you including the labour.",
    },
  ];

  const schema = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.summary,
    brand: { "@type": "Brand", name: product.maker },
    image: MEDIA[product.image].src,
    aggregateRating: {
      "@type": "AggregateRating",
      ratingValue: product.rating,
      reviewCount: product.reviews,
    },
    offers: {
      "@type": "Offer",
      price: product.price,
      priceCurrency: "INR",
      availability: product.stock > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
      seller: { "@type": "Organization", name: SITE.name },
    },
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />

      <section className="pt-20 md:pt-28">
        <div className="shell">
          <Breadcrumbs
            items={[
              { label: "Home", href: "/" },
              { label: "Shop", href: "/shop" },
              { label: category?.name ?? "", href: `/shop/${product.category}` },
              { label: product.sub },
            ]}
          />

          <div className="grid gap-8 lg:grid-cols-2 lg:gap-12">
            {/* gallery ------------------------------------------- */}
            <div>
              <div className="card relative aspect-square overflow-hidden bg-graphite">
                <Photo media={gallery[0]} sizes="(min-width:1024px) 50vw, 100vw" priority />
                {off > 0 && (
                  <span className="absolute left-3 top-3 bg-accent px-2 py-1 font-display text-xs font-bold text-[#04161d]">
                    {off}% OFF
                  </span>
                )}
                {product.hasVideo && (
                  <span className="absolute bottom-3 left-3 chip bg-void/70">
                    <Icon name="play" size={11} /> Product video
                  </span>
                )}
              </div>
              {gallery.length > 1 && (
                <ul className="mt-3 grid grid-cols-4 gap-3">
                  {gallery.map((g, i) => (
                    <li key={`${g}-${i}`} className="card relative aspect-square overflow-hidden bg-graphite">
                      <Photo media={g} sizes="120px" />
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* buy box ------------------------------------------- */}
            <div>
              <p className="eyebrow">{product.maker}</p>
              <h1 className="display-3 mt-2">{product.name}</h1>

              <div className="mt-3 flex flex-wrap items-center gap-3">
                <Stars rating={product.rating} />
                <span className="text-xs text-ash tnum">
                  {product.rating} · {product.reviews} reviews
                </span>
                {product.bestseller && <span className="chip border-gold/40 bg-gold/12 text-gold">Bestseller</span>}
              </div>

              <div className="mt-5 flex flex-wrap items-baseline gap-3">
                <span className="font-display text-4xl font-extrabold tracking-[-0.04em] tnum">
                  {rupees(product.price)}
                </span>
                <span className="text-lg text-dim line-through tnum">{rupees(product.mrp)}</span>
                {off > 0 && <span className="font-display text-sm font-bold text-accent">Save {rupees(product.mrp - product.price)}</span>}
              </div>
              <p className="mt-1 text-xs text-dim">Inclusive of all taxes</p>

              <p className="mt-5 text-sm leading-relaxed text-ash">{product.summary}</p>

              <ul className="mt-5 grid gap-2 sm:grid-cols-2">
                <Fact
                  icon="check"
                  label={product.stock > 10 ? "In stock" : `Only ${product.stock} left`}
                  tone={product.stock > 10 ? "ok" : "warn"}
                />
                <Fact icon="shield" label={product.warranty} />
                <Fact icon="car" label={product.delivery} />
                <Fact
                  icon="wrench"
                  label={
                    product.installation
                      ? `Installation ${product.installPrice ? rupees(product.installPrice) : "free"} · ${product.installTime}`
                      : "Self-fitment, no tools needed"
                  }
                />
              </ul>

              <div className="mt-5">
                <p className="label">Compatibility</p>
                <ul className="flex flex-wrap gap-1.5">
                  {fitmentLabels.map((f) => (
                    <li key={f} className="chip">
                      {f}
                    </li>
                  ))}
                </ul>
              </div>

              <ProductActions product={product} />
            </div>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="shell grid gap-10 lg:grid-cols-2 lg:items-start">
          <div>
            <h2 className="display-3 mb-4">WHAT YOU GET</h2>
            <ul className="space-y-2.5">
              {product.features.map((f) => (
                <li key={f} className="flex items-start gap-2.5 text-sm text-chalk/85">
                  <Icon name="check" size={15} className="mt-0.5 shrink-0 text-accent" />
                  {f}
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h2 className="display-3 mb-4">SPECIFICATIONS</h2>
            <dl className="divide-y divide-white/8 border-y border-white/8">
              {product.specs.map((s) => (
                <div key={s.label} className="flex justify-between gap-6 py-3">
                  <dt className="text-sm text-dim">{s.label}</dt>
                  <dd className="text-right text-sm">{s.value}</dd>
                </div>
              ))}
            </dl>
          </div>
        </div>
      </section>

      <section className="section border-y border-white/8 bg-carbon">
        <div className="shell max-w-3xl">
          <SectionHead eyebrow="FAQs" title="BEFORE YOU BUY." />
          <Accordion items={faq} />
        </div>
      </section>

      <section className="section">
        <div className="shell">
          <SectionHead
            eyebrow="Goes well with"
            title="COMPLETE THE BUILD."
            href={`/shop/${product.category}`}
            hrefLabel={`All ${category?.name.toLowerCase()}`}
          />
          <ul className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4">
            {related.map((p) => (
              <li key={p.slug}>
                <ProductCard product={p} />
              </li>
            ))}
          </ul>

          <div className="card mt-8 flex flex-col items-start justify-between gap-4 p-6 md:flex-row md:items-center">
            <div>
              <p className="font-display text-lg font-extrabold uppercase">Building more than one thing?</p>
              <p className="mt-1 text-sm text-ash">
                Put it all in the configurator and we'll price the whole build, labour included.
              </p>
            </div>
            <Link href="/build" className="btn btn-accent btn-sm">
              Open the configurator
              <Icon name="arrow" size={14} />
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}

function Fact({
  icon,
  label,
  tone = "ok",
}: {
  icon: "check" | "shield" | "car" | "wrench";
  label: string;
  tone?: "ok" | "warn";
}) {
  return (
    <li className="flex items-start gap-2.5 border border-white/8 bg-white/2 p-3 text-xs">
      <Icon name={icon} size={14} className={`mt-0.5 shrink-0 ${tone === "warn" ? "text-gold" : "text-accent"}`} />
      <span className={tone === "warn" ? "text-gold" : "text-ash"}>{label}</span>
    </li>
  );
}
