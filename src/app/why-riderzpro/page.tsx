import type { Metadata } from "next";
import Link from "next/link";
import { PageHero } from "@/components/layout/PageHero";
import { SectionHead } from "@/components/ui/Section";
import { Icon } from "@/components/ui/Icon";
import { Reveal } from "@/components/ui/Reveal";
import { ReviewCard } from "@/components/community/Cards";
import { TRUST_POINTS, whatsapp } from "@/lib/data/site";
import { REVIEWS, STATS } from "@/lib/data/community";

export const metadata: Metadata = {
  title: "Why Riderzpro",
  description:
    "What Riderzpro does differently: one workshop for the whole car, published prices, documented builds, legal compliance, and a badge that means something.",
  alternates: { canonical: "/why-riderzpro" },
};

const PRINCIPLES = [
  {
    title: "One garage, the whole car",
    body: "Buying, selling, accessories, audio, PPF, off-road, interiors and tuning under one roof. You stop coordinating four workshops that each blame the other.",
  },
  {
    title: "Prices you can see",
    body: "Every service, package and conversion carries a published starting price. If we can't publish a price for something, we tell you why before you ask.",
  },
  {
    title: "Documented work",
    body: "Every build leaves with an itemised invoice, the original parts boxed, and photos of each stage. It is also what makes the car easy to sell later.",
  },
  {
    title: "Reversible by default",
    body: "We archive ECU maps, keep original suspension and bumpers, and avoid cutting anything structural. A modification you cannot undo is a decision you cannot revisit.",
  },
  {
    title: "Legal, and honest about it",
    body: "We work within the Central Motor Vehicles Rules, keep emissions hardware intact, and tell you in writing when something needs RTO endorsement. We turn down work we cannot make road-legal.",
  },
  {
    title: "We own these cars too",
    body: "The people speccing your build daily-drive modified Thars, Polos and Fortuners. That is why we will talk you out of the expensive thing you don't need.",
  },
];

export default function WhyPage() {
  return (
    <>
      <PageHero
        eyebrow="Why Riderzpro"
        title="IF IT HAS WHEELS, WE CAN HELP."
        blurb="Buy it, sell it, modify it, protect it, upgrade it or build it. One brand, one standard, one number to call when something isn't right."
        media="garageHeadlights"
        size="sm"
      >
        <dl className="mt-8 grid max-w-2xl grid-cols-2 gap-x-6 gap-y-5 border-t border-tint/12 pt-6 md:grid-cols-4">
          {STATS.map((s) => (
            <div key={s.label}>
              <dd className="font-display text-2xl font-extrabold tnum">{s.value}</dd>
              <dt className="mt-1 text-[11px] uppercase tracking-[0.14em] text-dim">{s.label}</dt>
            </div>
          ))}
        </dl>
      </PageHero>

      <section className="section">
        <div className="shell">
          <SectionHead eyebrow="How we work" title="SIX THINGS WE DON'T BEND ON." />
          <ul className="grid gap-px overflow-hidden border border-tint/8 bg-tint/8 md:grid-cols-2 lg:grid-cols-3">
            {PRINCIPLES.map((p, i) => (
              <li key={p.title} className="bg-void p-6">
                <Reveal delay={(i % 3) * 60}>
                  <p className="font-display text-base font-extrabold uppercase tracking-[-0.01em]">
                    {p.title}
                  </p>
                  <p className="mt-2.5 text-sm leading-relaxed text-ash">{p.body}</p>
                </Reveal>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="section border-y border-tint/8 bg-carbon">
        <div className="shell">
          <SectionHead
            eyebrow="Trust system"
            title="THE VERIFIED BADGE."
            blurb="Nine checks, all of them cleared and signed off, before a car can carry it."
          />
          <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {TRUST_POINTS.map((t) => (
              <li key={t.title} className="card p-4">
                <p className="flex items-center gap-2 font-display text-sm font-extrabold uppercase">
                  <Icon name="check" size={15} className="text-accent" />
                  {t.title}
                </p>
                <p className="mt-2 text-xs leading-relaxed text-ash">{t.body}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="section">
        <div className="shell">
          <SectionHead eyebrow="Customers" title="JUDGE US ON THIS." />
          <ul className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {REVIEWS.map((r) => (
              <li key={r.name}>
                <ReviewCard review={r} />
              </li>
            ))}
          </ul>

          <div className="card mt-8 flex flex-col items-start justify-between gap-4 p-6 md:flex-row md:items-center">
            <div>
              <p className="font-display text-lg font-extrabold uppercase">Start somewhere</p>
              <p className="mt-1 text-sm text-ash">
                A ₹899 steering cover or a ₹6 lakh overland build — both get the same workshop.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link href="/shop" className="btn btn-primary btn-sm">
                Shop accessories
              </Link>
              <a
                href={whatsapp("Hi Riderzpro, I'd like to talk about my car.")}
                target="_blank"
                rel="noreferrer noopener"
                className="btn btn-whatsapp btn-sm"
              >
                <Icon name="whatsapp" size={15} />
                Ask us anything
              </a>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
