import type { Metadata } from "next";
import Link from "next/link";
import { PageHero } from "@/components/layout/PageHero";
import { SectionHead } from "@/components/ui/Section";
import { Reveal } from "@/components/ui/Reveal";
import { ReviewCard } from "@/components/community/Cards";
import { approvedReviews, siteStats } from "@/lib/server/reviews";
import { pageMeta } from "@/lib/data/seo";
import { EnquiryButton } from "@/components/enquiry/Enquiry";

export const metadata: Metadata = pageMeta({
  title: "Why Riderzpro",
  description:
    "What Riderzpro does differently: one team for the whole car, published prices, documented builds, legal compliance, and a badge that means something.",
  path: "/why-riderzpro",
});

const PRINCIPLES = [
  {
    title: "One team, the whole car",
    body: "Accessories, audio, PPF, off-road, interiors and installation from one team. One team to talk to for all of it.",
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

export default async function WhyPage() {
  const [REVIEWS, STATS] = await Promise.all([approvedReviews(6), siteStats()]);
  return (
    <>
      <PageHero
        eyebrow="Why Riderzpro"
        title="If it has wheels, we can help"
        blurb="Buy it, sell it, modify it, protect it, upgrade it or build it. One brand, one standard, one number to call when something isn't right."
        media="garageHeadlights"
        size="sm"
      >
        {STATS.length > 0 && <dl className="mt-8 grid max-w-2xl grid-cols-2 gap-x-6 gap-y-5 border-t border-tint/12 pt-6 md:grid-cols-4">
          {STATS.map((s) => (
            <div key={s.label}>
              <dd className="font-display text-2xl font-extrabold tnum">{s.value}</dd>
              <dt className="mt-1 text-[11px] uppercase tracking-[0.14em] text-dim">{s.label}</dt>
            </div>
          ))}
        </dl>}
      </PageHero>

      <section className="section">
        <div className="shell">
          <SectionHead eyebrow="How we work" title="Six things we don't bend on" />
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

      <section className="section">
        <div className="shell">
          {REVIEWS.length > 0 && (
            <>
              <SectionHead eyebrow="Customers" title="JUDGE US ON THIS." />
              <ul className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {REVIEWS.map((r) => (
                  <li key={r.id}>
                    <ReviewCard review={r} />
                  </li>
                ))}
              </ul>
            </>
          )}

          <div className="card mt-8 flex flex-col items-start justify-between gap-4 p-6 md:flex-row md:items-center">
            <div>
              <p className="font-display text-lg font-extrabold uppercase">Start somewhere</p>
              <p className="mt-1 text-sm text-ash">
                A ₹899 steering cover or a ₹6 lakh overland build — both get the same care.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link href="/shop" className="btn btn-primary btn-sm">
                Shop accessories
              </Link>
              <EnquiryButton topic="other" message={"Hi Riderzpro, I'd like to talk about my car."} className="btn btn-primary btn-sm">
                Ask us anything
              </EnquiryButton>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
