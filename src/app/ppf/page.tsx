import type { Metadata } from "next";
import Link from "next/link";
import { PageHero } from "@/components/layout/PageHero";
import { BeforeAfter } from "@/components/ppf/BeforeAfter";
import { StickyPpfCta } from "@/components/ppf/StickyPpfCta";
import { SectionHead } from "@/components/ui/Section";
import { Icon } from "@/components/ui/Icon";
import { Photo } from "@/components/ui/Photo";
import { Reveal } from "@/components/ui/Reveal";
import { Accordion } from "@/components/ui/Accordion";
import { DETAIL_SERVICES } from "@/lib/data/services";
import { PPF_BRANDS, PPF_FILMS, isPublishable } from "@/lib/ppf/films";
import {
  PPF_PACKAGES,
  PRICE_DISCLAIMER,
  TIER_RATES,
  VEHICLE_CLASSES,
  fromPrice,
  getPackage,
  quote,
} from "@/lib/ppf/coverage";
import { GUIDE, PREP_STEPS, QUALITY_CHECKLIST } from "@/lib/ppf/guide";
import { rupees } from "@/lib/format";
import { whatsapp } from "@/lib/data/site";

export const metadata: Metadata = {
  title: "Paint Protection Film (PPF) — Packages, Films & Installation",
  description:
    "Premium paint protection film at Riderzpro. Essential, full front and full body packages for mid-range SUVs through to luxury and exotic cars. Build your package and get an indicative price.",
  alternates: { canonical: "/ppf" },
};

const OFFROAD_MODELS = ["Thar", "Gurkha", "Fortuner", "Wrangler", "V-Cross", "Hilux", "Jimny", "Scorpio N", "XUV700"];

const LUXURY_MARQUES = ["BMW", "Mercedes-Benz", "Audi", "Porsche", "Land Rover", "Jaguar", "Lexus", "Volvo"];

const FAQ = GUIDE.slice(0, 6).map((a) => ({ q: a.question, a: a.summary }));

export default function PpfPage() {
  const published = PPF_FILMS.filter(isPublishable);

  // Indicative prices for the package cards, on a mid-size SUV.
  const packagePrices = PPF_PACKAGES.map((pkg) => {
    const q = quote({
      sizeClass: "mid-suv",
      tier: pkg.audience === "luxury" ? "signature" : pkg.audience === "entry" ? "essential" : "premium",
      areaIds: pkg.areaIds,
      fullBody: pkg.fullBody,
      paintCondition: "excellent",
    });
    return { pkg, q };
  });

  return (
    <>
      <PageHero
        eyebrow="Paint protection film"
        title="PROTECT WHAT YOU PAID FOR."
        blurb="Premium paint protection film engineered to protect your car from stone chips, scratches, road debris and everyday damage — on a ₹10 lakh SUV or a ₹2 crore supercar."
        media="wrapHeatGun"
        actions={[
          { href: "/ppf/quote", label: "Get PPF quote", variant: "primary" },
          { href: "/ppf/quote#coverage", label: "Build your package", variant: "outline" },
          { href: "/ppf/films", label: "Compare PPF options", variant: "outline" },
        ]}
      >
        <p className="mt-7 text-sm text-ash tnum">
          Essential protection from{" "}
          <span className="font-display text-lg font-extrabold text-chalk">{rupees(fromPrice("hatchback"))}</span> ·
          full front from{" "}
          <span className="font-display text-lg font-extrabold text-chalk">
            {rupees(
              quote({ sizeClass: "mid-suv", tier: "premium", areaIds: getPackage("full-front")!.areaIds, paintCondition: "excellent" })
                .low,
            )}
          </span>
        </p>
      </PageHero>

      {/* what is PPF ------------------------------------------------ */}
      <section className="section">
        <div className="shell grid items-start gap-10 lg:grid-cols-2">
          <Reveal>
            <p className="eyebrow mb-3">The basics</p>
            <h2 className="display-2">WHAT IS PPF?</h2>
            <p className="mt-4 text-sm leading-relaxed text-ash md:text-base">
              A transparent urethane film applied over your painted panels. Anything that would have
              hit the paint hits the film first.
            </p>
            <p className="mt-4 text-sm leading-relaxed text-ash">It helps protect against:</p>
            <ul className="mt-3 grid gap-2 sm:grid-cols-2">
              {[
                "Stone chips",
                "Minor scratches",
                "Road debris",
                "Insect residue",
                "Bird droppings",
                "Road grime",
                "Minor abrasions",
                "Environmental contaminants",
              ].map((t) => (
                <li key={t} className="flex items-start gap-2.5 text-sm text-chalk/85">
                  <Icon name="check" size={15} className="mt-0.5 shrink-0 text-accent" />
                  {t}
                </li>
              ))}
            </ul>
            <div className="mt-6 border border-gold/25 bg-gold/5 p-4">
              <p className="flex items-center gap-2 font-display text-sm font-extrabold uppercase text-gold">
                <Icon name="shield" size={15} />
                What it does not do
              </p>
              <p className="mt-2 text-xs leading-relaxed text-chalk/85">
                It is not armour. A hard impact, a kerbed bumper or a car park dent will still damage
                the panel underneath. Self-healing and UV performance vary by film and are published
                per product — we do not make blanket claims for &ldquo;PPF&rdquo; as a category.
              </p>
            </div>
            <Link href="/ppf/guide" className="btn btn-outline btn-sm mt-6">
              Read the full guide
              <Icon name="arrow" size={14} />
            </Link>
          </Reveal>

          <Reveal delay={80}>
            <div className="relative aspect-[4/3] overflow-hidden bg-graphite">
              <Photo media="detailingPolish" sizes="(min-width:1024px) 50vw, 100vw" />
              <div className="absolute inset-0 bg-gradient-to-t from-void/70 to-transparent" />
            </div>
          </Reveal>
        </div>
      </section>

      {/* packages --------------------------------------------------- */}
      <section className="section border-y border-tint/8 bg-carbon" id="packages">
        <div className="shell">
          <SectionHead
            eyebrow="Choose your coverage"
            title="FROM DOOR CUPS TO THE WHOLE CAR."
            blurb="Prices shown are indicative for a mid-size SUV on excellent paint. Your car, your coverage and your paint condition all move the number."
          />
          <ul className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {packagePrices.map(({ pkg, q }, i) => (
              <li key={pkg.id}>
                <Reveal delay={(i % 3) * 60} className="h-full">
                  <div className={`card flex h-full flex-col p-5 ${pkg.id === "full-front" ? "border-accent/45 bg-accent/6" : ""}`}>
                    {pkg.id === "full-front" && <span className="verified mb-3 self-start">Most chosen</span>}
                    <p className="font-display text-xl font-extrabold uppercase tracking-[-0.02em]">{pkg.name}</p>
                    <p className="mt-1 text-xs text-accent">{pkg.headline}</p>
                    <p className="mt-3 flex-1 text-sm leading-relaxed text-ash">{pkg.blurb}</p>

                    <p className="mt-4 font-display text-2xl font-extrabold tnum">
                      {rupees(q.low)} – {rupees(q.high)}
                    </p>
                    <p className="text-[11px] text-dim">
                      {pkg.fullBody ? "Full body" : `${pkg.areaIds.length} areas`} · ≈ {q.sqFt} sq ft · mid-size SUV
                    </p>

                    <Link href={`/ppf/quote?package=${pkg.id}`} className="btn btn-outline btn-sm btn-block mt-4">
                      {pkg.cta}
                    </Link>
                  </div>
                </Reveal>
              </li>
            ))}
          </ul>
          <p className="mt-6 text-xs text-dim">{PRICE_DISCLAIMER}</p>
        </div>
      </section>

      {/* segments --------------------------------------------------- */}
      <section className="section">
        <div className="shell space-y-10">
          <SectionHead
            eyebrow="Whatever you drive"
            title="ONE STUDIO, EVERY PRICE POINT."
            blurb="We do not price a Creta like a Cayenne, and we do not pretend PPF is a luxury-only service."
          />

          <div className="grid gap-4 lg:grid-cols-3">
            <SegmentCard
              eyebrow="Mid-range"
              title="PPF FROM ₹XX"
              price={rupees(fromPrice("compact-suv"))}
              media="crossoverTeal"
              blurb="Tata, Hyundai, Kia, Mahindra, Toyota, Honda, Maruti Suzuki, Volkswagen, Skoda, MG, Jeep. Start with the high-impact areas and build up."
              href="/ppf/quote?class=compact-suv"
              cta="Price my car"
            />
            <SegmentCard
              eyebrow="Off-road"
              title="BUILT FOR THE TRAIL."
              price={rupees(
                quote({ sizeClass: "full-suv", tier: "premium", areaIds: getPackage("trail")!.areaIds, paintCondition: "excellent" }).low,
              )}
              media="defenderSaltFlat"
              blurb="Stones, branches, dust, gravel and trail debris. Front end, doors, rockers and rear quarters — the panels a trail actually reaches."
              href="/ppf/quote?package=trail"
              cta="Protect the trail rig"
              tags={OFFROAD_MODELS}
            />
            <SegmentCard
              eyebrow="Signature"
              title="LUXURY PAINT DESERVES BETTER."
              price={rupees(
                quote({ sizeClass: "luxury", tier: "signature", areaIds: [], fullBody: true, paintCondition: "excellent" }).low,
              )}
              media="estateRear"
              blurb="More complex bodywork, softer clear coats and trim that has to come off to wrap an edge properly. Gloss, satin, matte and coloured film."
              href="/ppf/quote?package=signature"
              cta="Signature package"
              tags={LUXURY_MARQUES}
            />
          </div>
        </div>
      </section>

      {/* films ------------------------------------------------------ */}
      <section className="section border-y border-tint/8 bg-carbon">
        <div className="shell">
          <SectionHead
            eyebrow="PPF films"
            title="THE FILM MATTERS AS MUCH AS THE FITTER."
            blurb="Every film we list carries its own manufacturer warranty, with its own conditions. We publish them per product rather than rolling them into one promise."
            href="/ppf/films"
            hrefLabel="All films"
          />
          <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {published.slice(0, 6).map((film) => {
              const brand = PPF_BRANDS.find((b) => b.id === film.brandId);
              return (
                <li key={film.sku}>
                  <Link href={`/ppf/films/${film.slug}`} className="card card-hover flex h-full flex-col p-5">
                    <p className="font-display text-[11px] font-bold uppercase tracking-[0.16em] text-accent">
                      {brand?.name}
                    </p>
                    <p className="mt-1 font-display text-lg font-extrabold uppercase">{film.name}</p>
                    <p className="mt-2 flex flex-wrap gap-1.5">
                      <span className="chip">{film.finish}</span>
                      <span className="chip">{TIER_RATES[film.tier].label}</span>
                    </p>
                    <p className="mt-auto pt-4 text-sm text-ash">
                      {film.warrantyYears.value ? (
                        <>
                          <span className="font-display text-xl font-extrabold text-chalk tnum">
                            {film.warrantyYears.value}
                          </span>{" "}
                          year manufacturer warranty
                        </>
                      ) : (
                        "Warranty not specified by manufacturer"
                      )}
                    </p>
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      </section>

      {/* process ---------------------------------------------------- */}
      <section className="section">
        <div className="shell">
          <SectionHead
            eyebrow="Preparation"
            title="TEN STEPS BEFORE YOU GET IT BACK."
            blurb="Film locks in whatever is underneath it. Most of this job happens before any film is cut."
          />
          <ol className="grid gap-px overflow-hidden border border-tint/8 bg-tint/8 sm:grid-cols-2 lg:grid-cols-5">
            {PREP_STEPS.map((s) => (
              <li key={s.n} className="bg-void p-5">
                <p className="font-display text-2xl font-extrabold text-accent/40 tnum">{s.n}</p>
                <p className="mt-2 font-display text-sm font-extrabold uppercase">{s.t}</p>
                <p className="mt-1.5 text-xs leading-relaxed text-ash">{s.b}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* before/after ----------------------------------------------- */}
      <section className="section border-y border-tint/8 bg-carbon">
        <div className="shell">
          <SectionHead eyebrow="Before / after" title="DRAG TO SEE THE DIFFERENCE." />
          <div className="grid gap-5 md:grid-cols-2">
            <Reveal>
              <BeforeAfter
                before="estateRear"
                after="estateRear"
                beforeLabel="Swirled & dull"
                afterLabel="Corrected + film"
                caption="Correction before film on a black daily driver. The left side is a simulation of a swirled finish — real customer before-and-after sets are shot under our inspection lights and handed over at collection."
              />
            </Reveal>
            <Reveal delay={90}>
              <BeforeAfter
                before="chromeGrille"
                after="chromeGrille"
                beforeLabel="Unprotected"
                afterLabel="Front end filmed"
                caption="Front-end coverage: bumper, bonnet, fenders, mirrors and headlights. Left side simulated; ask us for the real set from any car we've done."
              />
            </Reveal>
          </div>
        </div>
      </section>

      {/* quality ---------------------------------------------------- */}
      <section className="section">
        <div className="shell grid gap-8 lg:grid-cols-2 lg:items-start">
          <div>
            <SectionHead eyebrow="What good looks like" title="OUR QUALITY CHECKLIST." blurb="What you should expect from any installer, including us." />
            <ul className="space-y-2.5">
              {QUALITY_CHECKLIST.map((item) => (
                <li key={item.claim} className="flex items-start gap-2.5 text-sm text-chalk/85">
                  <Icon name="check" size={15} className="mt-0.5 shrink-0 text-accent" />
                  <span>
                    {item.claim}
                    {item.note && <span className="mt-0.5 block text-xs text-dim">{item.note}</span>}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <SectionHead eyebrow="Why Riderzpro" title="WHAT WE ACTUALLY DO." />
            <ul className="grid gap-2 sm:grid-cols-2">
              {[
                "Professional installation",
                "Plotter-cut vehicle patterns",
                "Paint depth read per panel",
                "Dust-controlled installation room",
                "Edges wrapped where the panel allows",
                "48-hour settling indoors",
                "Final inspection with you present",
                "Aftercare briefing and documentation",
                "12-month workmanship warranty",
                "Manufacturer warranty passed through in full",
              ].map((t) => (
                <li key={t} className="flex items-start gap-2 border border-tint/8 bg-tint/2 p-3 text-xs text-ash">
                  <Icon name="check" size={13} className="mt-0.5 shrink-0 text-accent" />
                  {t}
                </li>
              ))}
            </ul>
            <p className="mt-4 text-[11px] leading-relaxed text-dim">
              We do not publish a generic &ldquo;Riderzpro warranty&rdquo; on the film itself. The
              film&apos;s warranty is the manufacturer&apos;s, and it is published per product with its
              own conditions and exclusions. Ours covers our workmanship.
            </p>
          </div>
        </div>
      </section>

      {/* adjacent services ------------------------------------------ */}
      <section className="section border-y border-tint/8 bg-carbon">
        <div className="shell">
          <SectionHead
            eyebrow="Goes with it"
            title="PPF ISN'T THE ONLY LAYER."
            blurb="A ceramic coating over film makes the whole car easier to wash. It is not a substitute for the physical protection film gives you."
          />
          <ul className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {DETAIL_SERVICES.filter((s) => s.slug !== "paint-protection-film")
              .slice(0, 4)
              .map((s) => (
                <li key={s.slug}>
                  <div className="card flex h-full flex-col p-5">
                    <p className="font-display text-base font-extrabold uppercase">{s.name}</p>
                    <p className="mt-2 flex-1 text-xs leading-relaxed text-ash">{s.blurb}</p>
                    <p className="mt-3 font-display text-lg font-extrabold text-accent tnum">From {rupees(s.price)}</p>
                    <p className="text-[11px] text-dim">{s.priceNote}</p>
                  </div>
                </li>
              ))}
          </ul>
          <Link href="/ppf/guide/ppf-vs-ceramic" className="btn btn-outline btn-sm mt-6">
            PPF vs ceramic coating — the honest comparison
            <Icon name="arrow" size={14} />
          </Link>
        </div>
      </section>

      {/* FAQ + CTA -------------------------------------------------- */}
      <section className="section">
        <div className="shell grid gap-8 lg:grid-cols-2 lg:items-start">
          <div>
            <SectionHead eyebrow="Questions" title="BEFORE YOU BOOK." href="/ppf/guide" hrefLabel="Full guide" />
            <Accordion items={FAQ} />
          </div>
          <div className="card p-6">
            <p className="font-display text-lg font-extrabold uppercase">Build your package</p>
            <p className="mt-2 text-sm text-ash">
              Pick your car, choose the panels, see an indicative range in a few taps. Then we confirm
              it properly with the car in front of us.
            </p>
            <Link href="/ppf/quote" className="btn btn-accent btn-block mt-5">
              Build your PPF package
              <Icon name="arrow" size={15} />
            </Link>
            <a
              href={whatsapp("Hi Riderzpro, I want a PPF quote for my ")}
              target="_blank"
              rel="noreferrer noopener"
              className="btn btn-whatsapp btn-block mt-3"
            >
              <Icon name="whatsapp" size={16} />
              Get PPF quote on WhatsApp
            </a>
            <p className="mt-4 text-[11px] text-dim">
              Vehicle classes we price against: {VEHICLE_CLASSES.map((c) => c.label).join(" · ")}.
            </p>
          </div>
        </div>
      </section>

      <StickyPpfCta />
    </>
  );
}

function SegmentCard({
  eyebrow,
  title,
  price,
  blurb,
  media,
  href,
  cta,
  tags,
}: {
  eyebrow: string;
  title: string;
  price: string;
  blurb: string;
  media: "crossoverTeal" | "defenderSaltFlat" | "estateRear";
  href: string;
  cta: string;
  tags?: string[];
}) {
  return (
    <div className="card card-hover flex h-full flex-col overflow-hidden">
      <div data-theme="dark" className="relative aspect-[16/10] bg-graphite">
        <Photo media={media} sizes="(min-width:1024px) 33vw, 100vw" className="opacity-85" />
        <div className="absolute inset-0 scrim-soft" />
        <p className="absolute bottom-3 left-4 font-display text-[11px] font-bold uppercase tracking-[0.18em] text-accent">
          {eyebrow}
        </p>
      </div>
      <div className="flex flex-1 flex-col p-5">
        <p className="font-display text-xl font-extrabold uppercase tracking-[-0.02em]">{title}</p>
        <p className="mt-3 flex-1 text-sm leading-relaxed text-ash">{blurb}</p>
        {tags && (
          <p className="mt-3 flex flex-wrap gap-1.5">
            {tags.slice(0, 6).map((t) => (
              <span key={t} className="chip text-[10px]">
                {t}
              </span>
            ))}
          </p>
        )}
        <p className="mt-4 font-display text-xl font-extrabold text-accent tnum">From {price}</p>
        <Link href={href} className="btn btn-outline btn-sm btn-block mt-4">
          {cta}
        </Link>
      </div>
    </div>
  );
}
