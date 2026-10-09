import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Breadcrumbs } from "@/components/layout/PageHero";
import { SectionHead } from "@/components/ui/Section";
import { Icon } from "@/components/ui/Icon";
import { ProductCard } from "@/components/shop/ProductCard";
import {
  DESIGNS,
  DESIGN_FEATURES,
  NOT_SPECIFIED,
  SOURCE_DOCS,
  bandFor,
  designStatus,
  designsInBand,
  getDesign,
  priceFor,
} from "@/lib/autoform/catalog";
import { PRODUCTS } from "@/lib/data/products";
import { rupees } from "@/lib/format";
import { SITE, whatsapp } from "@/lib/data/site";

export function generateStaticParams() {
  return DESIGNS.map((d) => ({ design: d.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ design: string }> }): Promise<Metadata> {
  const { design: slug } = await params;
  const design = getDesign(slug);
  if (!design) return {};
  const band = bandFor(design);
  const two = priceFor(design, 2);
  return {
    title: `Autoform ${design.code} Seat Covers — ${band.series}`,
    description: `Autoform ${design.code} seat covers from ${rupees(two.sellingPrice)} for a 5-seater. ${design.tagline}. Made to your car, fitted at Riderzpro.`.slice(0, 158),
    keywords: ["Autoform", `Autoform ${design.code}`, "seat covers", "car seat covers", band.series, "Riderzpro"],
    alternates: { canonical: `/autoform/${design.slug}` },
    openGraph: { title: `Autoform ${design.code}`, description: design.tagline, images: [design.image] },
  };
}

export default async function AutoformDesignPage({ params }: { params: Promise<{ design: string }> }) {
  const { design: slug } = await params;
  const design = getDesign(slug);
  if (!design) notFound();

  const band = bandFor(design);
  const two = priceFor(design, 2);
  const three = priceFor(design, 3);
  const status = designStatus(design);
  const siblings = designsInBand(design.bandId).filter((d) => d.slug !== design.slug);

  // Complete your interior — from the Riderzpro accessories catalogue.
  const crossSell = PRODUCTS.filter((p) => p.category === "interior" || p.sub === "Steering covers").slice(0, 4);

  const schema = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: `Autoform ${design.code} Seat Covers`,
    sku: design.code,
    brand: { "@type": "Brand", name: "Autoform" },
    description: design.tagline,
    image: [`${SITE.url}${design.image}`],
    offers: {
      "@type": "AggregateOffer",
      priceCurrency: "INR",
      lowPrice: two.sellingPrice,
      highPrice: three.sellingPrice,
      offerCount: 2,
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
              { label: "Autoform", href: "/autoform" },
              { label: design.code },
            ]}
          />

          <div className="grid gap-8 lg:grid-cols-2 lg:gap-12">
            <div>
              <div className="card relative aspect-[4/3] overflow-hidden bg-[#f3f4f5]">
                <Image
                  src={design.image}
                  alt={`Autoform ${design.code} seat cover design — ${design.tagline}`}
                  fill
                  sizes="(min-width:1024px) 50vw, 100vw"
                  priority
                  className="object-cover"
                />
              </div>
              <p className="mt-3 flex items-center gap-1.5 text-[11px] text-dim">
                <Icon name="check" size={11} className="text-accent" />
                Manufacturer image — {SOURCE_DOCS.CAT24.name}, page {design.page}. Used under Riderzpro
                reseller authorisation.
              </p>
            </div>

            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="verified">
                  <Icon name="shield" size={11} />
                  Genuine Autoform
                </span>
                <span className="chip">Authorised Riderzpro reseller</span>
              </div>

              <p className="eyebrow mt-4">{band.series}</p>
              <h1 className="display-2 mt-2">{design.code}</h1>
              <p className="mt-2 text-sm text-accent">{design.tagline}</p>

              <dl className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-1 text-xs text-ash">
                <div className="flex gap-1.5">
                  <dt className="text-dim">Design code</dt>
                  <dd className="font-display font-bold tracking-[0.06em] text-chalk">{design.code}</dd>
                </div>
                <div className="flex gap-1.5">
                  <dt className="text-dim">Price list name</dt>
                  <dd>{design.listedAs}</dd>
                </div>
              </dl>

              {/* pricing by seat rows */}
              <div className="mt-6 grid gap-3 sm:grid-cols-2">
                {[
                  { label: "5-seater", sub: "2-row set", p: two },
                  { label: "6 / 7-seater", sub: "3-row set", p: three },
                ].map((opt) => (
                  <div key={opt.label} className="border border-tint/10 bg-tint/3 p-4">
                    <p className="font-display text-xs font-bold uppercase tracking-[0.14em] text-accent">{opt.label}</p>
                    <p className="text-[11px] text-dim">{opt.sub}</p>
                    <p className="mt-3 font-display text-2xl font-extrabold tnum">{rupees(opt.p.sellingPrice)}</p>
                    <p className="text-xs text-dim tnum">
                      MRP <span className="line-through">{rupees(opt.p.mrp)}</span> · save {opt.p.discountPct}%
                    </p>
                  </div>
                ))}
              </div>
              <p className="mt-2 text-[11px] text-dim">
                Inclusive of GST. Custom charges of {rupees(two.customCharge)} apply on all designs;
                logistics and fitting are quoted separately.
              </p>

              <ul className="mt-6 flex flex-wrap gap-1.5">
                {DESIGN_FEATURES.map((f) => (
                  <li key={f} className="chip">
                    <Icon name="check" size={10} className="text-accent" />
                    {f}
                  </li>
                ))}
              </ul>

              <div className="mt-6 grid gap-3 sm:grid-cols-2">
                <a
                  href={whatsapp(`Hi Riderzpro, I want Autoform ${design.code} seat covers. My car is: `)}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="btn btn-primary"
                >
                  Order this design
                </a>
                <a
                  href={whatsapp(`Hi Riderzpro, I'd like to book fitting for Autoform ${design.code}. My car is: `)}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="btn btn-whatsapp"
                >
                  <Icon name="whatsapp" size={16} />
                  Book installation
                </a>
              </div>

              {/* fitment honesty */}
              <div className="card mt-6 border-gold/25 bg-gold/5 p-4">
                <p className="flex items-center gap-2 font-display text-xs font-extrabold uppercase text-gold">
                  <Icon name="shield" size={14} />
                  Fitment and specification
                </p>
                <p className="mt-2 text-xs leading-relaxed text-chalk/85">
                  Autoform makes each set to the vehicle. The price list distinguishes only 2-row and
                  3-row sets, so that is what we price against — we confirm the exact pattern for your
                  brand, model, variant and year when you order.
                </p>
                <dl className="mt-3 space-y-1 text-[11px]">
                  {["Material", "Colour options", "Stitching", "Airbag compatibility", "Warranty period"].map((f) => (
                    <div key={f} className="flex justify-between gap-4">
                      <dt className="text-dim">{f}</dt>
                      <dd className="text-dim">{NOT_SPECIFIED}</dd>
                    </div>
                  ))}
                </dl>
                <p className="mt-3 text-[11px] leading-relaxed text-chalk/85">
                  Airbag compatibility is a safety matter and neither source document states it. We
                  confirm it with Autoform for your exact car before anything is fitted.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* sources -------------------------------------------------- */}
      <section className="section">
        <div className="shell grid gap-10 lg:grid-cols-2 lg:items-start">
          <div>
            <h2 className="display-3">WHERE THIS COMES FROM</h2>
            <p className="mt-3 text-sm leading-relaxed text-ash">
              Everything on this page is traceable to a document Autoform supplied. Nothing is
              inferred from one source to fill a gap in another.
            </p>
            <dl className="mt-5 divide-y divide-tint/8 border-y border-tint/8">
              {design.sources.map((s) => (
                <div key={s} className="py-3">
                  <dt className="font-display text-xs font-bold uppercase tracking-[0.12em] text-accent">
                    {SOURCE_DOCS[s].name}
                  </dt>
                  <dd className="mt-1 text-xs text-ash">
                    {SOURCE_DOCS[s].dated} — {SOURCE_DOCS[s].note}
                  </dd>
                </div>
              ))}
            </dl>
            {status.reasons.length > 0 && (
              <ul className="mt-4 space-y-1.5">
                {status.reasons.map((r) => (
                  <li key={r} className="flex items-start gap-2 text-[11px] text-dim">
                    <Icon name="shield" size={11} className="mt-0.5 shrink-0 text-gold" />
                    {r}
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div>
            <h2 className="display-3">INSTALLATION</h2>
            <p className="mt-3 text-sm leading-relaxed text-ash">
              Fitted at any Riderzpro workshop, usually around two hours for a 5-seater. Seats are not
              removed unless the pattern needs it. If your car has side airbags in the seat bolster we
              confirm the correct Autoform pattern before we start — we will not fit a cover that
              obstructs one.
            </p>
            <div className="mt-5 flex flex-wrap gap-3">
              <Link href="/garage" className="btn btn-outline btn-sm">
                Book the workshop
              </Link>
              <Link href="/locations" className="btn btn-outline btn-sm">
                Locations
              </Link>
            </div>
          </div>
        </div>
      </section>

      {siblings.length > 0 && (
        <section className="section border-y border-tint/8 bg-carbon">
          <div className="shell">
            <SectionHead
              eyebrow={band.series}
              title="SAME SERIES, SAME PRICE."
              href="/autoform"
              hrefLabel="All designs"
              blurb="Every design in this series costs the same — pick on looks, not budget."
            />
            <ul className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4">
              {siblings.slice(0, 8).map((d) => (
                <li key={d.slug}>
                  <Link href={`/autoform/${d.slug}`} className="card card-hover block h-full">
                    <span className="relative block aspect-[4/3] overflow-hidden bg-[#f3f4f5]">
                      <Image src={d.image} alt={`Autoform ${d.code}`} fill sizes="(min-width:768px) 25vw, 46vw" className="object-cover" />
                    </span>
                    <span className="block p-3">
                      <span className="block font-display text-sm font-extrabold uppercase">{d.code}</span>
                      <span className="mt-0.5 block text-[11px] text-dim">{d.tagline}</span>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}

      <section className="section">
        <div className="shell">
          <SectionHead eyebrow="Complete your interior" title="WHILE THE CAR IS WITH US." href="/shop/interior" hrefLabel="All interior" />
          <ul className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4">
            {crossSell.map((p) => (
              <li key={p.slug}>
                <ProductCard product={p} />
              </li>
            ))}
          </ul>
        </div>
      </section>
    </>
  );
}
