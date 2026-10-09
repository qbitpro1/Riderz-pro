import type { Metadata } from "next";
import Link from "next/link";
import { PageHero } from "@/components/layout/PageHero";
import { PpfConfigurator } from "@/components/ppf/PpfConfigurator";
import { StickyPpfCta } from "@/components/ppf/StickyPpfCta";
import { SectionHead } from "@/components/ui/Section";
import { Icon } from "@/components/ui/Icon";
import { PPF_BRANDS, PPF_FILMS, isPublishable } from "@/lib/ppf/films";
import { PRICE_DISCLAIMER } from "@/lib/ppf/coverage";

export const metadata: Metadata = {
  title: "PPF Quote Calculator — Build Your Paint Protection Package",
  description:
    "Pick your car, choose the panels, select the film and see an indicative PPF price. Final price confirmed after a physical inspection at a Riderzpro studio.",
  alternates: { canonical: "/ppf/quote" },
};

const JOURNEY = [
  "Select your car",
  "Select coverage",
  "Select finish",
  "Select film",
  "Estimated price",
  "Book inspection",
  "Final quote",
  "Installation",
];

export default function PpfQuotePage() {
  const films = PPF_FILMS.filter(isPublishable).map((f) => ({
    slug: f.slug,
    name: f.name,
    brandName: PPF_BRANDS.find((b) => b.id === f.brandId)?.name ?? "",
    tier: f.tier,
    finish: f.finish,
    warrantyYears: f.warrantyYears.value,
  }));

  return (
    <>
      <PageHero
        eyebrow="PPF quote calculator"
        title="GET YOUR PPF PRICE."
        blurb="Car, coverage, film, finish and paint condition. You get an indicative range in a few taps — and an honest one, because we tell you what still has to be confirmed on the car."
        media="wrapHeatGun"
        size="sm"
      >
        <ol className="mt-7 flex flex-wrap gap-x-2 gap-y-2 text-[10px] uppercase tracking-[0.12em] text-dim">
          {JOURNEY.map((step, i) => (
            <li key={step} className="flex items-center gap-2">
              <span className={i < 5 ? "text-accent" : ""}>{step}</span>
              {i < JOURNEY.length - 1 && <Icon name="chevron" size={9} />}
            </li>
          ))}
        </ol>
      </PageHero>

      <section className="section scroll-mt-24" id="coverage">
        <div className="shell">
          <PpfConfigurator films={films} />
        </div>
      </section>

      <section className="section border-t border-tint/8 bg-carbon">
        <div className="shell grid gap-8 lg:grid-cols-2 lg:items-start">
          <div>
            <SectionHead eyebrow="What happens next" title="THE PRICE ON SCREEN IS NOT THE QUOTE." />
            <ol className="space-y-4">
              {[
                { t: "You send the configuration", b: "Everything you picked arrives with us on WhatsApp, itemised." },
                { t: "We book an inspection", b: "Free, about twenty minutes, at any Riderzpro studio." },
                { t: "We read the paint", b: "Depth gauge on every panel, under inspection lighting. This is what moves the price." },
                { t: "You get a firm quote", b: "Fixed, itemised, valid for fifteen days. No surprises on collection day." },
              ].map((s, i) => (
                <li key={s.t} className="flex gap-4">
                  <span className="font-display text-sm font-extrabold text-accent/50 tnum">0{i + 1}</span>
                  <span>
                    <span className="block font-display text-sm font-extrabold uppercase">{s.t}</span>
                    <span className="mt-1 block text-sm text-ash">{s.b}</span>
                  </span>
                </li>
              ))}
            </ol>
            <p className="mt-6 border-t border-tint/8 pt-4 text-xs leading-relaxed text-dim">{PRICE_DISCLAIMER}</p>
          </div>

          <div className="card p-6">
            <p className="font-display text-lg font-extrabold uppercase">Not sure what you need?</p>
            <p className="mt-2 text-sm text-ash">
              Most owners land on a full front. If you are unsure whether your paint needs correcting
              first, bring the car in — we would rather do the cheaper job well than sell you film
              over marked paint.
            </p>
            <div className="mt-5 flex flex-col gap-3">
              <Link href="/ppf/guide/full-body-vs-full-front" className="btn btn-outline">
                Full body vs full front
              </Link>
              <Link href="/ppf/guide/is-ppf-worth-it" className="btn btn-outline">
                Is PPF worth it?
              </Link>
              <Link href="/ppf/films" className="btn btn-outline">
                Compare films and warranties
              </Link>
            </div>
          </div>
        </div>
      </section>

      <StickyPpfCta />
    </>
  );
}
