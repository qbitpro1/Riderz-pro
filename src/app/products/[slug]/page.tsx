import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Icon } from "@/components/ui/Icon";
import { Breadcrumbs } from "@/components/layout/PageHero";
import { SectionHead } from "@/components/ui/Section";
import { Accordion } from "@/components/ui/Accordion";
import { ProductGallery } from "@/components/recoil/ProductGallery";
import { RecoilCard } from "@/components/recoil/RecoilCard";
import { RecoilActions } from "@/components/recoil/RecoilActions";
import {
  ALL_PRODUCTS,
  catSlug,
  completeTheBuild,
  getBySlug,
  relatedInSeries,
  toPublic,
  type CatalogProduct,
} from "@/lib/data/recoil";
import { rupees } from "@/lib/format";
import { SITE, whatsapp } from "@/lib/data/site";

export function generateStaticParams() {
  return ALL_PRODUCTS.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const p = getBySlug(slug);
  if (!p) return {};
  return {
    title: p.seo.title.replace(/ \| RIDERZPRO$/, ""),
    description: p.seo.metaDescription,
    keywords: p.seo.keywords,
    alternates: { canonical: `/products/${p.slug}` },
    openGraph: {
      title: p.seo.title,
      description: p.seo.metaDescription,
      images: p.images[0] ? [p.images[0].url] : undefined,
    },
    robots: p.published ? { index: true, follow: true } : { index: false, follow: true },
  };
}

export default async function RecoilProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const product = getBySlug(slug);
  if (!product) notFound();

  const related = relatedInSeries(product);
  const build = completeTheBuild(product);
  const comingSoon = product.status === "COMING_SOON";

  const schema = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.title,
    sku: product.sku,
    mpn: product.sku,
    brand: { "@type": "Brand", name: "RECOIL" },
    category: `${product.category} > ${product.subcategory}`,
    description: product.seo.metaDescription,
    image: product.images.map((i) => i.url),
    ...(product.sellingPrice
      ? {
          offers: {
            "@type": "Offer",
            price: product.sellingPrice,
            priceCurrency: "INR",
            availability: comingSoon ? "https://schema.org/PreOrder" : "https://schema.org/InStock",
            seller: { "@type": "Organization", name: SITE.name },
            url: `${SITE.url}/products/${product.slug}`,
          },
        }
      : {}),
  };

  const faq = buildFaq(product);

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />

      <section className="pt-20 md:pt-28">
        <div className="shell">
          <Breadcrumbs
            items={[
              { label: "Home", href: "/" },
              { label: "RECOIL", href: "/recoil" },
              { label: product.category, href: `/recoil/${catSlug(product.category)}` },
              { label: product.sku },
            ]}
          />

          <div className="grid gap-8 lg:grid-cols-2 lg:gap-12">
            <ProductGallery images={product.images} sku={product.sku} />

            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="verified">
                  <Icon name="shield" size={11} />
                  Authentic RECOIL
                </span>
                <span className="chip">Authorised Riderzpro reseller</span>
                {comingSoon && <span className="chip border-gold/40 bg-gold/12 text-gold">Coming soon</span>}
              </div>

              <p className="eyebrow mt-4">
                {product.brand}
                {product.series ? ` · ${product.series} Series` : ""}
              </p>
              <h1 className="display-3 mt-2">{product.priceListName}</h1>

              <dl className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-1 text-xs text-ash">
                <div className="flex gap-1.5">
                  <dt className="text-dim">Model no.</dt>
                  <dd className="font-display font-bold tracking-[0.06em] text-chalk">{product.printedSku}</dd>
                </div>
                <div className="flex gap-1.5">
                  <dt className="text-dim">Category</dt>
                  <dd>
                    {product.category} · {product.subcategory}
                  </dd>
                </div>
              </dl>

              {/* Pricing — MRP and the Riderzpro price only. Dealer price never
                  leaves the server. */}
              <div className="mt-6">
                {comingSoon ? (
                  <p className="font-display text-2xl font-extrabold uppercase tracking-[-0.02em] text-gold">
                    Launching soon
                  </p>
                ) : product.sellingPrice ? (
                  <div className="flex flex-wrap items-baseline gap-3">
                    <span className="font-display text-4xl font-extrabold tracking-[-0.04em] tnum">
                      {rupees(product.sellingPrice)}
                    </span>
                    {product.mrp && product.mrp > product.sellingPrice && (
                      <>
                        <span className="text-lg text-dim line-through tnum">{rupees(product.mrp)}</span>
                        <span className="font-display text-sm font-bold text-accent">
                          Save {rupees(product.mrp - product.sellingPrice)}
                        </span>
                      </>
                    )}
                  </div>
                ) : (
                  <p className="font-display text-xl uppercase text-ash">Price on request</p>
                )}
                <p className="mt-1 text-xs text-dim">
                  {comingSoon
                    ? "Pre-book to hold a unit from the first shipment."
                    : "Inclusive of GST · MRP as published in the RECOIL May 2026 price list"}
                </p>
              </div>

              {product.priceListSpecs.length > 0 && (
                <ul className="mt-6 space-y-1.5">
                  {product.priceListSpecs.slice(0, 5).map((s) => (
                    <li key={s} className="flex items-start gap-2.5 text-sm text-chalk/85">
                      <Icon name="check" size={14} className="mt-0.5 shrink-0 text-accent" />
                      {s}
                    </li>
                  ))}
                </ul>
              )}

              <RecoilActions product={toPublic(product)} />

              <ul className="mt-6 grid gap-2 sm:grid-cols-2">
                <Fact icon="shield" label="Genuine product, sourced direct" />
                <Fact icon="wrench" label="Professional installation available" />
                <Fact
                  icon="car"
                  label={
                    product.compatibility.type === "universal"
                      ? "Universal — fitment verified before dispatch"
                      : "Vehicle specific — confirm your variant"
                  }
                />
                <Fact
                  icon="check"
                  label={product.masterPack ? `Master pack ${product.masterPack}` : "Master pack: not specified"}
                />
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Overview + specifications ---------------------------------- */}
      <section className="section">
        <div className="shell grid gap-10 lg:grid-cols-[1.15fr_1fr] lg:items-start">
          <div>
            <h2 className="display-3">OVERVIEW</h2>
            <p className="mt-3 text-sm leading-relaxed text-ash md:text-base">{overview(product)}</p>

            {product.manufacturer?.description && (
              <>
                <h3 className="mt-8 font-display text-sm font-bold uppercase tracking-[0.16em] text-dim">
                  From the manufacturer
                </h3>
                <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-ash">
                  {trim(product.manufacturer.description, 1400)}
                </p>
                <a
                  href={product.manufacturer.url}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="mt-3 inline-flex items-center gap-1.5 text-xs text-accent underline underline-offset-4"
                >
                  Official RECOIL product page
                  <Icon name="arrow" size={13} />
                </a>
              </>
            )}

            <h3 className="mt-8 font-display text-sm font-bold uppercase tracking-[0.16em] text-dim">Installation</h3>
            <p className="mt-2 text-sm leading-relaxed text-ash">{installationNote(product)}</p>

            <h3 className="mt-8 font-display text-sm font-bold uppercase tracking-[0.16em] text-dim">Compatibility</h3>
            <p className="mt-2 text-sm leading-relaxed text-ash">{product.compatibility.note}</p>

            <h3 className="mt-8 font-display text-sm font-bold uppercase tracking-[0.16em] text-dim">Ideal for</h3>
            <ul className="mt-2 flex flex-wrap gap-2">
              {idealFor(product).map((t) => (
                <li key={t} className="chip">
                  {t}
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h2 className="display-3">SPECIFICATIONS</h2>
            <p className="mt-2 text-xs text-dim">
              As published in the RECOIL {product.priceListEdition} price list. Anything the
              manufacturer does not state is shown as not specified rather than estimated.
            </p>
            <dl className="mt-4 divide-y divide-tint/8 border-y border-tint/8">
              <Spec label="Model number" value={product.printedSku} />
              <Spec label="Brand" value="RECOIL" />
              <Spec label="Series" value={product.series} />
              <Spec label="Category" value={`${product.category} · ${product.subcategory}`} />
              {product.priceListSpecs.map((s, i) => (
                <Spec key={s} label={i === 0 ? "Specification" : ""} value={s} />
              ))}
              <Spec label="Master pack" value={product.masterPack ? String(product.masterPack) : null} />
              <Spec label="MRP" value={product.mrp ? rupees(product.mrp) : null} />
              <Spec label="Availability" value={comingSoon ? "Coming soon" : "Available"} />
              <Spec label="Price list" value={`RECOIL ${product.priceListEdition}`} />
            </dl>

            <p className="mt-4 text-[11px] leading-relaxed text-dim">
              Frequency response, sensitivity, dimensions, weight and warranty are only listed where
              RECOIL publishes them. We do not infer one specification from another.
            </p>
          </div>
        </div>
      </section>

      <section className="section border-y border-tint/8 bg-carbon">
        <div className="shell max-w-3xl">
          <SectionHead eyebrow="FAQs" title="BEFORE YOU BUY." />
          <Accordion items={faq} />
        </div>
      </section>

      {build.length > 0 && (
        <section className="section">
          <div className="shell">
            <SectionHead
              eyebrow="Complete your build"
              title="WHAT THIS NEEDS AROUND IT."
              blurb="Chosen because the combination works, not because it adds to the basket."
              href="/build-audio"
              hrefLabel="Build a full system"
            />
            <ul className="grid grid-cols-2 gap-3 md:grid-cols-3 md:gap-4 lg:grid-cols-6">
              {build.map((p) => (
                <li key={p.slug}>
                  <RecoilCard product={toPublic(p)} sizes="(min-width:1024px) 16vw, (min-width:768px) 33vw, 46vw" />
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}

      {related.length > 0 && (
        <section className="section border-t border-tint/8 bg-carbon">
          <div className="shell">
            <SectionHead
              eyebrow={product.series ? `${product.series} Series` : "Same category"}
              title="COMPARE THE RANGE."
              href={`/recoil/${catSlug(product.category)}`}
              hrefLabel={`All ${product.category.toLowerCase()}`}
            />
            <ul className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4">
              {related.map((p) => (
                <li key={p.slug}>
                  <RecoilCard product={toPublic(p)} />
                </li>
              ))}
            </ul>
            <Link
              href={`/compare?skus=${[product.sku, ...related.slice(0, 2).map((r) => r.sku)].join(",")}`}
              className="btn btn-outline btn-sm mt-6"
            >
              Compare these side by side
              <Icon name="arrow" size={14} />
            </Link>
          </div>
        </section>
      )}
    </>
  );
}

/* -------------------------------------------------------------- helpers */

function Spec({ label, value }: { label: string; value: string | null }) {
  return (
    <div className="flex justify-between gap-6 py-3">
      <dt className="shrink-0 text-sm text-dim">{label}</dt>
      <dd className="text-right text-sm">{value ?? <span className="text-dim">Not specified by manufacturer</span>}</dd>
    </div>
  );
}

function Fact({ icon, label }: { icon: "shield" | "wrench" | "car" | "check"; label: string }) {
  return (
    <li className="flex items-start gap-2.5 border border-tint/8 bg-tint/2 p-3 text-xs text-ash">
      <Icon name={icon} size={14} className="mt-0.5 shrink-0 text-accent" />
      {label}
    </li>
  );
}

function trim(s: string, max: number) {
  return s.length <= max ? s : `${s.slice(0, max).trimEnd()}…`;
}

/**
 * Overview copy is assembled from verified fields only — the price list name,
 * the series, and the manufacturer's own short description where one exists.
 */
function overview(p: CatalogProduct): string {
  const lead = `The RECOIL ${p.sku} is a ${p.priceListName.toLowerCase()}${
    p.series ? ` from the ${p.series} series` : ""
  }.`;
  const short = p.manufacturer?.shortDescription?.trim();
  if (short && short.length > 40) return `${lead} ${trim(short, 600)}`;
  const spec = p.priceListSpecs.slice(0, 2).join(". ");
  const sourced =
    " Supplied by Riderzpro as an authorised RECOIL reseller, with installation available at our Bengaluru, Hyderabad and Pune workshops.";
  return `${lead}${spec ? ` ${spec}.` : ""}${sourced}`;
}

function installationNote(p: CatalogProduct): string {
  switch (p.category) {
    case "Amplifiers":
    case "Processors":
      return "Professional installation strongly recommended. Amplifiers and processors need correctly sized power and ground runs, a fused distribution point and a clean signal take-off; the gain structure then has to be set with a meter rather than by ear. Fitting and tuning are available at any Riderzpro garage.";
    case "Subwoofers":
      return "Professional installation recommended. Enclosure volume and porting determine how a subwoofer performs, so we build the box to the driver rather than dropping it into a generic enclosure.";
    case "Speakers":
      return "Professional installation recommended. Most cars need model-specific adapter rings, and the doors should be damped at the same time — it is the single biggest improvement you can make to a speaker.";
    case "Damping":
      return "Fits without special tools, but doing it properly means removing door cards and trim. We fit it in around six hours per car if you would rather not.";
    case "Wiring":
    case "Power":
      return "Suitable for self-installation by an experienced installer. Power distribution must be fused within 30 cm of the battery. If you are unsure, book the workshop — bad power wiring is a fire risk.";
    default:
      return "Fits without workshop equipment. Installation is available at any Riderzpro garage if you would prefer us to do it.";
  }
}

/** Only claims the specification actually supports. */
function idealFor(p: CatalogProduct): string[] {
  const out: string[] = [];
  const specs = p.priceListSpecs.join(" ").toLowerCase();
  const name = p.priceListName.toLowerCase();

  if (p.category === "Marine" || name.includes("marine")) out.push("Marine applications");
  if (p.subcategory === "SPL" || p.series === "SPL High End" || p.series === "Black Myth") out.push("SPL builds", "Competition systems");
  if (p.series === "L1" || p.series === "Echo Max") out.push("Premium audio builds");
  if (p.series === "L3" || p.series === "Echo") out.push("Daily driver upgrades", "OEM audio upgrades");
  if (p.subcategory === "Pro Midrange" || p.subcategory === "Pro Coaxial") out.push("Pro-audio style builds");
  if (p.category === "Damping") out.push("Every build", "OEM audio upgrades");
  if (specs.includes("shallow") || name.includes("shallow") || name.includes("spare tire")) out.push("SUV audio systems", "Space-constrained installs");
  if (p.category === "Processors") out.push("Premium audio builds", "OEM audio upgrades");
  if (out.length === 0) out.push("Daily driver upgrades");
  return [...new Set(out)];
}

function buildFaq(p: CatalogProduct) {
  const items = [
    {
      q: "Is this a genuine RECOIL product?",
      a: `Yes. Riderzpro is an authorised RECOIL reseller. ${p.sku} is stocked against the RECOIL ${p.priceListEdition} price list, and the product photography on this page comes from RECOIL's own media library — matched to this exact model number, never to a similar one.`,
    },
    {
      q: "Will it fit my car?",
      a:
        p.compatibility.type === "universal"
          ? "This is a universal-fitment item, but installation still has to be verified against your car — speaker apertures, mounting depth and harness types vary. Send us your brand, model, variant and year on WhatsApp and we will confirm before you order."
          : `${p.compatibility.note} Send us your exact variant and year and we will confirm fitment in writing before dispatch.`,
    },
    {
      q: "Do you install it?",
      a: installationNote(p),
    },
    {
      q: "What warranty does it carry?",
      a: "Warranty is as offered by RECOIL for this model; we register the claim on your behalf rather than sending you to a helpline. Riderzpro workmanship on any installation we carry out is warranted for 12 months. We do not publish a warranty period for a product unless RECOIL states one.",
    },
  ];

  if (p.status === "COMING_SOON") {
    items.unshift({
      q: "When is this available?",
      a: `${p.sku} is listed as Coming Soon in the RECOIL ${p.priceListEdition} price list. We are not taking payment for it. Tell us on WhatsApp and we will hold a unit from the first shipment and confirm the price before it arrives.`,
    });
  }

  if (p.flags.includes("MRP_IS_SET_PRICE")) {
    items.push({
      q: "Is the price for one piece or a set?",
      a: "The price list quotes this item as a set or multi-piece pack rather than a single unit. Confirm quantities with us before ordering so the two of us are counting the same thing.",
    });
  }

  return items;
}
