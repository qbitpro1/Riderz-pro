import type { Metadata } from "next";
import Link from "next/link";
import { PageHero } from "@/components/layout/PageHero";
import { BuildCard, ReviewCard } from "@/components/community/Cards";
import { SectionHead } from "@/components/ui/Section";
import { Icon } from "@/components/ui/Icon";
import { Reveal } from "@/components/ui/Reveal";
import { liveBuilds } from "@/lib/server/builds";
import { approvedReviews } from "@/lib/server/reviews";
import { pageMeta } from "@/lib/data/seo";
import { EnquiryButton } from "@/components/enquiry/Enquiry";

export const metadata: Metadata = pageMeta({
  title: "Riderzpro Builds — Modified Cars, Full Spec & Build Costs",
  description:
    "Riderzpro builds with the full modification list and what they cost: off-road rigs, street builds, audio installs, interiors and performance cars.",
  path: "/builds",
});

export default async function BuildsPage() {
  const [REVIEWS, BUILDS] = await Promise.all([approvedReviews(6), liveBuilds()]);
  return (
    <>
      <PageHero
        eyebrow="Riderzpro builds"
        title="Riderzpro builds"
        blurb="Every build we publish lists exactly what went into it and what it cost. Builds appear here once their owners agree to share them."
        media="garageSpotlit"
        size="sm"
      />

      <section className="section">
        <div className="shell">
          {BUILDS.length === 0 && (
            <p className="text-sm text-ash">Finished customer builds are added here as they are completed. Check back soon.</p>
          )}
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
              <p className="font-display text-lg font-extrabold uppercase">Plan your build</p>
              <p className="mt-1 text-sm text-ash">
                Send us a reference and a budget. We&apos;ll come back with a spec sheet and a schedule.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link href="/build" className="btn btn-accent btn-sm">
                Open the configurator
                <Icon name="arrow" size={14} />
              </Link>
              <EnquiryButton topic="installation" message={"Hi Riderzpro, I'd like to plan a build. My car is: "} className="btn btn-primary btn-sm">
                Send a reference
              </EnquiryButton>
            </div>
          </div>
        </div>
      </section>

      {REVIEWS.length > 0 && (
      <section className="section border-t border-tint/8 bg-carbon">
        <div className="shell">
          <SectionHead eyebrow="Owners" title="WHAT THEY SAY AFTER." />
          <ul className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {REVIEWS.map((r) => (
              <li key={r.id}>
                <ReviewCard review={r} />
              </li>
            ))}
          </ul>
        </div>
      </section>
      )}
    </>
  );
}
