import type { Metadata } from "next";
import Link from "next/link";
import { PageHero } from "@/components/layout/PageHero";
import { BuildCard, ReviewCard } from "@/components/community/Cards";
import { SectionHead } from "@/components/ui/Section";
import { Icon } from "@/components/ui/Icon";
import { Reveal } from "@/components/ui/Reveal";
import { BUILDS, REVIEWS } from "@/lib/data/community";
import { whatsapp } from "@/lib/data/site";

export const metadata: Metadata = {
  title: "Motorbotz Builds — Modified Cars, Full Spec & Real Build Costs",
  description:
    "Every Motorbotz build with the full modification list and what it actually cost. Off-road rigs, street builds, audio installs, luxury interiors and performance cars.",
  alternates: { canonical: "/builds" },
};

export default function BuildsPage() {
  return (
    <>
      <PageHero
        eyebrow="Motorbotz builds"
        title="BUILT BY US. DRIVEN BY THEM."
        blurb="Real cars, real invoices, real owners. Every build lists exactly what went into it and what it cost — because that is the number nobody else publishes."
        media="garageSpotlit"
        size="sm"
      />

      <section className="section">
        <div className="shell">
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {BUILDS.map((b, i) => (
              <li key={b.slug}>
                <Reveal delay={(i % 3) * 70} className="h-full">
                  <BuildCard build={b} />
                </Reveal>
              </li>
            ))}
          </ul>

          <div className="card mt-8 flex flex-col items-start justify-between gap-4 p-6 md:flex-row md:items-center">
            <div>
              <p className="font-display text-lg font-extrabold uppercase">Build something like this</p>
              <p className="mt-1 text-sm text-ash">
                Send us a reference and a budget. We'll come back with a spec sheet and a schedule.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link href="/build" className="btn btn-accent btn-sm">
                Open the configurator
                <Icon name="arrow" size={14} />
              </Link>
              <a
                href={whatsapp("Hi Motorbotz, I want to build something like one of your builds. My car is: ")}
                target="_blank"
                rel="noreferrer noopener"
                className="btn btn-whatsapp btn-sm"
              >
                <Icon name="whatsapp" size={15} />
                Send a reference
              </a>
            </div>
          </div>
        </div>
      </section>

      <section className="section border-t border-white/8 bg-carbon">
        <div className="shell">
          <SectionHead eyebrow="Owners" title="WHAT THEY SAY AFTER." />
          <ul className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {REVIEWS.map((r) => (
              <li key={r.name}>
                <ReviewCard review={r} />
              </li>
            ))}
          </ul>
        </div>
      </section>
    </>
  );
}
