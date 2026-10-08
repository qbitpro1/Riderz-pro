import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Breadcrumbs } from "@/components/layout/PageHero";
import { StickyPpfCta } from "@/components/ppf/StickyPpfCta";
import { SectionHead } from "@/components/ui/Section";
import { Icon } from "@/components/ui/Icon";
import {
  NOT_SPECIFIED,
  PPF_FILMS,
  getBrand,
  getFilm,
  specText,
  verifiedFieldCount,
  type Spec,
} from "@/lib/ppf/films";
import { TIER_RATES } from "@/lib/ppf/coverage";
import { whatsapp } from "@/lib/data/site";

export function generateStaticParams() {
  return PPF_FILMS.map((f) => ({ slug: f.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const film = getFilm(slug);
  if (!film) return {};
  const brand = getBrand(film.brandId);
  return {
    title: `${brand?.name} ${film.name} — PPF Specifications & Warranty`,
    description: `${brand?.name} ${film.name}: ${film.finish.toLowerCase()} paint protection film${
      film.warrantyYears.value ? ` with a published ${film.warrantyYears.value}-year manufacturer warranty` : ""
    }. Installed by Motorbotz.`,
    alternates: { canonical: `/ppf/films/${film.slug}` },
  };
}

export default async function PpfFilmPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const film = getFilm(slug);
  if (!film) notFound();

  const brand = getBrand(film.brandId);
  const coverage = verifiedFieldCount(film);

  return (
    <>
      <section className="section pt-24 md:pt-32">
        <div className="shell">
          <Breadcrumbs
            items={[
              { label: "Home", href: "/" },
              { label: "PPF", href: "/ppf" },
              { label: "Films", href: "/ppf/films" },
              { label: film.name },
            ]}
          />

          <div className="grid gap-8 lg:grid-cols-[1.3fr_1fr] lg:items-start">
            <div>
              <p className="eyebrow">{brand?.name}</p>
              <h1 className="display-2 mt-2">{film.name}</h1>
              <p className="mt-3 flex flex-wrap gap-2">
                <span className="chip">{film.finish}</span>
                <span className="chip">{TIER_RATES[film.tier].label} tier</span>
                <span className="chip">{film.sku}</span>
                <span className="chip">
                  {film.availability === "IN_STOCK" ? "In stock" : film.availability === "TO_ORDER" ? "To order" : "Not stocked"}
                </span>
              </p>

              {film.installationNotes.length > 0 && (
                <ul className="mt-6 space-y-2.5">
                  {film.installationNotes.map((n) => (
                    <li key={n} className="flex items-start gap-2.5 text-sm text-chalk/85">
                      <Icon name="check" size={15} className="mt-0.5 shrink-0 text-accent" />
                      {n}
                    </li>
                  ))}
                </ul>
              )}

              {/* images ------------------------------------------- */}
              {film.images.length === 0 && (
                <div className="card mt-6 border-gold/25 bg-gold/5 p-4">
                  <p className="flex items-center gap-2 font-display text-xs font-extrabold uppercase text-gold">
                    <Icon name="shield" size={14} />
                    No product image
                  </p>
                  <p className="mt-2 text-xs leading-relaxed text-chalk/85">{film.imagesUnavailableReason}</p>
                </div>
              )}

              {/* specifications ----------------------------------- */}
              <h2 className="display-3 mt-10">SPECIFICATIONS</h2>
              <p className="mt-2 text-xs text-dim tnum">
                {coverage.verified} of {coverage.total} fields confirmed from manufacturer documentation.
              </p>
              <dl className="mt-4 divide-y divide-white/8 border-y border-white/8">
                <SpecRow label="Brand" spec={{ value: brand?.name ?? null, source: null, verifiedAt: null }} />
                <SpecRow label="SKU" spec={{ value: film.sku, source: null, verifiedAt: null }} />
                <SpecRow label="Finish" spec={{ value: film.finish, source: null, verifiedAt: null }} />
                <SpecRow label="Series" spec={{ value: film.series, source: null, verifiedAt: null }} />
                <SpecRow label="Thickness" spec={film.thicknessMicron} suffix=" µm" />
                <SpecRow label="Roll width" spec={film.widthMm} suffix=" mm" />
                <SpecRow label="Roll length" spec={film.lengthM} suffix=" m" />
                <SpecRow label="Self-healing" spec={film.selfHealing} />
                <SpecRow label="Hydrophobic" spec={film.hydrophobic} />
                <SpecRow label="UV stabilised" spec={film.uvStabilised} />
                <SpecRow label="Gloss level" spec={film.glossLevel} />
                <SpecRow label="Clarity" spec={film.clarity} />
              </dl>

              <p className="mt-4 flex flex-wrap gap-4 text-xs">
                <a href={film.manufacturerUrl} target="_blank" rel="noreferrer noopener" className="text-accent underline underline-offset-4">
                  Manufacturer website
                </a>
                <span className="text-dim">
                  Technical data sheet: {film.tdsUrl ? <a href={film.tdsUrl} className="text-accent underline">TDS</a> : "not held"}
                </span>
                <span className="text-dim">
                  Safety data sheet: {film.sdsUrl ? <a href={film.sdsUrl} className="text-accent underline">SDS</a> : "not held"}
                </span>
              </p>

              {/* warranty ----------------------------------------- */}
              <h2 className="display-3 mt-10">WARRANTY</h2>
              {film.warrantyYears.value == null ? (
                <p className="mt-3 text-sm text-ash">
                  We do not yet hold this product&apos;s warranty documentation, so nothing is published
                  here. Ask us and we will get it from the distributor before you commit.
                </p>
              ) : (
                <div className="card mt-4 p-5">
                  <p className="font-display text-3xl font-extrabold text-accent tnum">
                    {film.warrantyYears.value} years
                  </p>
                  <p className="text-xs text-dim">Manufacturer warranty from installation</p>

                  <div className="mt-5 grid gap-5 sm:grid-cols-2">
                    <div>
                      <p className="label">Covers</p>
                      <ul className="space-y-1">
                        {(film.warrantyCovers.value ?? []).map((c) => (
                          <li key={c} className="flex items-start gap-2 text-xs text-ash">
                            <Icon name="check" size={12} className="mt-0.5 shrink-0 text-accent" />
                            {c}
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <p className="label">Excludes</p>
                      <ul className="space-y-1">
                        {(film.warrantyExcludes.value ?? []).map((c) => (
                          <li key={c} className="flex items-start gap-2 text-xs text-dim">
                            <Icon name="close" size={11} className="mt-0.5 shrink-0" />
                            {c}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  {film.warrantyConditions.value && (
                    <p className="mt-5 border-t border-white/8 pt-4 text-xs text-ash">
                      <span className="text-dim">Conditions: </span>
                      {film.warrantyConditions.value}
                    </p>
                  )}
                  {film.warrantyYears.source && (
                    <p className="mt-2 text-[11px] text-dim">
                      Source: {film.warrantyYears.source}, read {film.warrantyYears.verifiedAt}.
                    </p>
                  )}
                </div>
              )}

              <p className="mt-4 text-xs leading-relaxed text-dim">
                Separately, Motorbotz warrants its own installation workmanship for 12 months. That is
                our warranty, not the manufacturer&apos;s, and the two do not overlap.
              </p>
            </div>

            {/* sidebar -------------------------------------------- */}
            <aside className="lg:sticky lg:top-24">
              <div className="card p-5">
                <p className="label mb-1">Motorbotz installed rate</p>
                <p className="font-display text-3xl font-extrabold tracking-[-0.04em] tnum">
                  ₹{TIER_RATES[film.tier].min}–{TIER_RATES[film.tier].max}
                </p>
                <p className="text-xs text-dim">per sq ft, film and labour</p>
                <p className="mt-3 text-xs leading-relaxed text-ash">{TIER_RATES[film.tier].blurb}</p>

                <Link href="/ppf/quote" className="btn btn-accent btn-block mt-5">
                  Price this on my car
                  <Icon name="arrow" size={15} />
                </Link>
                <a
                  href={whatsapp(`Hi Motorbotz, I'm interested in ${brand?.name} ${film.name} PPF. My car is: `)}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="btn btn-whatsapp btn-block mt-3"
                >
                  <Icon name="whatsapp" size={16} />
                  Ask about this film
                </a>

                {coverage.missing.length > 0 && (
                  <div className="mt-5 border-t border-white/8 pt-4">
                    <p className="label">Not yet confirmed</p>
                    <p className="flex flex-wrap gap-1.5">
                      {coverage.missing.map((m) => (
                        <span key={m} className="chip text-[10px] text-dim">
                          {m}
                        </span>
                      ))}
                    </p>
                    <p className="mt-2 text-[11px] leading-relaxed text-dim">
                      We would rather show you a gap than a number we cannot stand behind.
                    </p>
                  </div>
                )}
              </div>
            </aside>
          </div>
        </div>
      </section>

      <section className="section border-t border-white/8 bg-carbon">
        <div className="shell">
          <SectionHead eyebrow="Other films" title="COMPARE THE RANGE." href="/ppf/films" hrefLabel="All films" />
          <ul className="flex flex-wrap gap-2">
            {PPF_FILMS.filter((f) => f.slug !== film.slug).map((f) => (
              <li key={f.sku}>
                <Link href={`/ppf/films/${f.slug}`} className="chip hover:border-accent hover:text-accent">
                  {getBrand(f.brandId)?.name} {f.name}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <StickyPpfCta />
    </>
  );
}

function SpecRow({ label, spec, suffix = "" }: { label: string; spec: Spec<string | number | boolean | string[]>; suffix?: string }) {
  const text = specText(spec, suffix);
  return (
    <div className="flex justify-between gap-6 py-3">
      <dt className="shrink-0 text-sm text-dim">{label}</dt>
      <dd className={`text-right text-sm ${text === NOT_SPECIFIED ? "text-dim" : ""}`}>{text}</dd>
    </div>
  );
}
