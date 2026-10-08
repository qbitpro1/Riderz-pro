import type { Metadata } from "next";
import Link from "next/link";
import { PageHero } from "@/components/layout/PageHero";
import { Configurator } from "@/components/build/Configurator";
import { SectionHead } from "@/components/ui/Section";
import { BuildCard } from "@/components/community/Cards";
import { Icon } from "@/components/ui/Icon";
import { BUILD_STAGES } from "@/lib/data/configurator";
import { BUILDS } from "@/lib/data/community";

export const metadata: Metadata = {
  title: "Build Your Car — Configurator with Live Build Cost",
  description:
    "Configure your car at Motorbotz: exterior, wheels and tyres, interior, audio and performance. Real parts, real installed prices, a live estimated build cost and a one-tap quote.",
  alternates: { canonical: "/build" },
};

export default function BuildPage() {
  return (
    <>
      <PageHero
        eyebrow="Build your car"
        title="BUILD DIFFERENT."
        blurb="Pick your car, then walk through five stages. Everything you select is a part we stock at a price we actually charge — labour and GST included in the running total."
        media="garageSpotlit"
        size="sm"
      />

      <section className="section">
        <div className="shell">
          <Configurator />
        </div>
      </section>

      <section className="section border-y border-white/8 bg-carbon">
        <div className="shell">
          <SectionHead
            eyebrow="Five stages"
            title="WHAT YOU CAN CHANGE."
            blurb="Anything not listed here, we can still do. The configurator covers what we fit most often."
          />
          <ul className="grid gap-px overflow-hidden border border-white/8 bg-white/8 md:grid-cols-2 lg:grid-cols-5">
            {BUILD_STAGES.map((s) => (
              <li key={s.slug} className="bg-carbon p-5">
                <p className="font-display text-base font-extrabold uppercase tracking-[-0.01em] text-accent">
                  {s.name}
                </p>
                <p className="mt-2 text-xs leading-relaxed text-ash">{s.caption}</p>
                <ul className="mt-3 space-y-1">
                  {s.options.slice(0, 6).map((o) => (
                    <li key={o.slug} className="text-[11px] text-dim">
                      {o.name}
                    </li>
                  ))}
                  <li className="text-[11px] text-dim">+{Math.max(s.options.length - 6, 0)} more</li>
                </ul>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="section">
        <div className="shell">
          <SectionHead
            eyebrow="How a build runs"
            title="FROM QUOTE TO KEYS."
            blurb="No surprises, no scope creep, no calls asking for more money halfway through."
          />
          <ol className="grid gap-px overflow-hidden border border-white/8 bg-white/8 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { n: "01", t: "Configure & send", b: "You build the sheet here and send it over. We check fitment against your exact variant." },
              { n: "02", t: "Firm quote & schedule", b: "A fixed written quote with a dated schedule. 40% to book parts, balance on delivery." },
              { n: "03", t: "Build with updates", b: "Photo updates on WhatsApp at every milestone. You approve anything that changes." },
              { n: "04", t: "Handover & warranty", b: "Road test, walkthrough, all invoices, original parts back, 12-month workmanship warranty." },
            ].map((s) => (
              <li key={s.n} className="bg-void p-5">
                <p className="font-display text-2xl font-extrabold text-accent/40 tnum">{s.n}</p>
                <p className="mt-2 font-display text-sm font-extrabold uppercase">{s.t}</p>
                <p className="mt-1.5 text-xs leading-relaxed text-ash">{s.b}</p>
              </li>
            ))}
          </ol>

          <p className="mt-6 flex items-start gap-2 text-xs leading-relaxed text-dim">
            <Icon name="shield" size={14} className="mt-0.5 shrink-0 text-accent" />
            Every build is carried out within the Central Motor Vehicles Rules. Where a modification
            requires an RTO endorsement or affects your insurance, we tell you in writing before we
            start — and we will decline work that cannot be made road-legal.
          </p>
        </div>
      </section>

      <section className="section border-t border-white/8 bg-carbon">
        <div className="shell">
          <SectionHead
            eyebrow="Finished builds"
            title="BUILD SOMETHING LIKE THIS."
            href="/builds"
            hrefLabel="All builds"
          />
          <ul className="rail -mx-4 px-4 md:mx-0 md:grid md:grid-cols-3 md:gap-4 md:px-0">
            {BUILDS.slice(0, 3).map((b) => (
              <li key={b.slug} className="w-[74vw] max-w-[330px] md:w-auto md:max-w-none">
                <BuildCard build={b} sizes="(min-width:768px) 33vw, 74vw" />
              </li>
            ))}
          </ul>
          <Link href="/garage" className="btn btn-outline btn-sm mt-6">
            Book a consultation at the garage
          </Link>
        </div>
      </section>
    </>
  );
}
