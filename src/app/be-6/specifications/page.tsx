import Link from "next/link";
import type { Metadata } from "next";
import { SectionHead } from "@/components/ui/Section";
import { Icon } from "@/components/ui/Icon";
import { Reveal } from "@/components/ui/Reveal";
import { Explorer } from "@/components/be6/Explorer";
import { ProvenanceTag } from "@/components/be6/Label";
import { FeatureExplainers, ManualNotice, SourceList, SpecTables, TeqSuites } from "@/components/be6/Blocks";
import { VARIANTS, REAL_WORLD_RANGE, BE6 } from "@/lib/data/be6";

export const metadata: Metadata = {
  title: "Mahindra BE 6 SPORTEQ — Full Factory Specifications",
  description:
    "Every published Mahindra BE 6 SPORTEQ specification — powertrain, range, charging, dimensions, wheels, safety and warranty — sourced from Mahindra's official brochure, with the gaps left visible.",
  alternates: { canonical: "/be-6/specifications" },
};

/**
 * The factory detail, on its own page.
 *
 * This is where the BE 6 page's specification tables, explorer and feature
 * explainers went when the flagship page was cut back. Nothing was dropped —
 * it just stopped competing with the configurator for attention.
 */
export default function Be6SpecificationsPage() {
  return (
    <>
      <section className="border-b border-tint/[0.06] bg-carbon pb-10 pt-28 md:pt-32">
        <div className="shell">
          <Link
            href="/be-6"
            className="mb-5 inline-flex items-center gap-2 font-display text-[0.625rem] uppercase tracking-[0.16em] text-ash transition-colors hover:text-accent"
          >
            <Icon name="arrow" size={13} className="rotate-180" />
            Back to the BE 6
          </Link>
          <ProvenanceTag provenance="MAHINDRA FACTORY" className="mb-3" />
          <h1 className="display-2">FACTORY SPECIFICATIONS</h1>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-ash">
            Mahindra&apos;s figures for the BE 6 SPORTEQ, taken from the official brochure and verified on{" "}
            {BE6.dataVerified}. Where Mahindra has not published something, the row says so rather than filling the
            gap with an estimate.
          </p>
        </div>
      </section>

      {/* Variant quick-reference — the chart everyone actually wants ------ */}
      <section className="section">
        <div className="shell">
          <SectionHead
            eyebrow="At a glance"
            title="EVERY VARIANT, SIDE BY SIDE"
            blurb="Screens, wheels and packs per variant, exactly as the brochure states them."
          />
          <div className="card overflow-x-auto">
            <table className="w-full min-w-[42rem] border-collapse text-left">
              <thead>
                <tr className="border-b border-tint/10">
                  {["Variant", "Battery", "Screens", "Wheels"].map((h) => (
                    <th key={h} className="p-3 font-display text-[0.5625rem] uppercase tracking-[0.14em] text-dim">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {VARIANTS.map((v) => (
                  <tr key={v.slug} className="border-b border-tint/[0.06] last:border-0">
                    <td className="p-3 align-top">
                      <span className="font-display text-xs font-bold text-chalk">{v.name}</span>
                      {v.edition && <span className="ml-1.5 text-[0.5625rem] text-gold">EDITION</span>}
                    </td>
                    <td className="tnum p-3 align-top text-[0.6875rem] text-ash">
                      {v.prices.map((p) => `${p.batteryId} kWh`).join(" · ")}
                    </td>
                    <td className="p-3 align-top text-[0.6875rem] leading-snug text-ash">{v.screens}</td>
                    <td className="p-3 align-top text-[0.6875rem] leading-snug text-ash">{v.wheel}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Explorer --------------------------------------------------------- */}
      <section className="section border-t border-tint/[0.06] bg-carbon">
        <div className="shell">
          <SectionHead
            eyebrow="Explore"
            title="EXPLORE THE BE 6"
            blurb="Tap a point on the car. Every answer is a Mahindra fact, or an admission that we do not have it."
          />
          <Explorer />
        </div>
      </section>

      {/* Spec tables ------------------------------------------------------ */}
      <section className="section border-t border-tint/[0.06]">
        <div className="shell">
          <SpecTables />

          <div className="mt-6 grid gap-4 lg:grid-cols-2">
            <Reveal className="card p-4 md:p-5">
              <h3 className="font-display text-xs font-bold uppercase tracking-[0.16em] text-chalk">
                {REAL_WORLD_RANGE.headline}
              </h3>
              <p className="mt-2 text-[0.6875rem] leading-relaxed text-ash">{REAL_WORLD_RANGE.body}</p>
              <dl className="mt-3 divide-y divide-tint/[0.06]">
                {REAL_WORLD_RANGE.estimates.map((e) => (
                  <div key={e.label} className="flex items-baseline justify-between gap-3 py-2">
                    <dt className="text-[0.6875rem] text-dim">{e.label} — certified</dt>
                    <dd className="tnum text-xs font-semibold text-chalk">{e.certified} km</dd>
                  </div>
                ))}
              </dl>
              <p className="mt-2 text-[0.625rem] leading-relaxed text-dim">{REAL_WORLD_RANGE.note}</p>
            </Reveal>
            <Reveal delay={60}>
              <ManualNotice />
            </Reveal>
          </div>
        </div>
      </section>

      {/* Feature explainers ------------------------------------------------ */}
      <section className="section border-t border-tint/[0.06] bg-carbon">
        <div className="shell">
          <SectionHead
            eyebrow="Plain English"
            title="WHAT DOES THIS FEATURE ACTUALLY DO?"
            blurb="A specification sheet tells you a car has something. It rarely tells you why you would want it."
          />
          <FeatureExplainers />
        </div>
      </section>

      {/* TEQ suites -------------------------------------------------------- */}
      <section className="section border-t border-tint/[0.06]">
        <div className="shell">
          <SectionHead
            eyebrow="Mahindra's own software"
            title="MAIA AND THE SIX TEQ SUITES"
            blurb="Worth reading closely — the factory BE 6 already runs its own AI. Anything Riderzpro proposes is separate from these six."
          />
          <TeqSuites />

          <div className="mt-8">
            <SourceList />
          </div>

          <div className="mt-6 flex flex-wrap gap-2.5">
            <Link href="/be-6" className="btn btn-primary">
              CONFIGURE A BE 6
              <Icon name="arrow" size={15} />
            </Link>
            <Link href="/be-6#build" className="btn btn-outline">
              BUILD YOUR BE 6
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
