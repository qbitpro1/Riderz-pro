import type { Metadata } from "next";
import Link from "next/link";
import { PageHero } from "@/components/layout/PageHero";
import { BookingForm } from "@/components/garage/BookingForm";
import { SectionHead } from "@/components/ui/Section";
import { Icon } from "@/components/ui/Icon";
import { Photo } from "@/components/ui/Photo";
import { Reveal } from "@/components/ui/Reveal";
import { GARAGE_SERVICES } from "@/lib/data/services";
import { SITE } from "@/lib/data/site";
import { siteStats } from "@/lib/server/reviews";
import { pageMeta } from "@/lib/data/seo";

export const metadata: Metadata = pageMeta({
  title: "Riderzpro Garage — Installation, Modification & Service Workshop",
  description:
    "Book installation, modification, detailing, PPF, audio, performance, off-road and interior work at the Riderzpro garage.",
  path: "/garage",
});

const WORKSHOP_MEDIA = ["mechanicEngine", "garageSpotlit", "washBay", "detailingPolish"] as const;

export default async function GaragePage() {
  const STATS = await siteStats();
  return (
    <>
      <PageHero
        eyebrow="Riderzpro Garage"
        title="ONE GARAGE. ONE STANDARD."
        blurb="Everything happens under one roof — trim shop, paint room, audio bay, dyno, welding and lifts. No sending your car to three different markets and hoping."
        media="mechanicEngine"
        actions={[{ href: "#book", label: "Book an appointment", variant: "primary" }]}
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
        <div className="shell grid gap-10 lg:grid-cols-[1fr_1.1fr] lg:items-start" id="book">
          <div>
            <SectionHead
              eyebrow="What we do here"
              title="EVERY JOB, ONE ROOF."
              blurb="If it can be done to a car, our garage does it. If we cannot do something properly, we say so instead of learning on your car."
            />
            <ul className="grid gap-px overflow-hidden border border-tint/8 bg-tint/8 sm:grid-cols-2">
              {GARAGE_SERVICES.map((s) => (
                <li key={s.name} className="bg-void p-4">
                  <p className="flex items-center gap-2 font-display text-sm font-extrabold uppercase">
                    <Icon name="wrench" size={14} className="text-accent" />
                    {s.name}
                  </p>
                  <p className="mt-1.5 text-xs text-ash">{s.blurb}</p>
                </li>
              ))}
            </ul>
          </div>

          <BookingForm />
        </div>
      </section>

      <section className="section border-y border-tint/8 bg-carbon">
        <div className="shell">
          <SectionHead eyebrow="Inside the workshop" title="WHERE IT HAPPENS." />
          <ul className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            {WORKSHOP_MEDIA.map((m, i) => (
              <li key={m}>
                <Reveal delay={i * 60}>
                  <div className="relative aspect-[4/5] overflow-hidden bg-graphite">
                    <Photo media={m} sizes="(min-width:1024px) 25vw, 46vw" />
                    <div className="absolute inset-0 scrim-soft" />
                  </div>
                </Reveal>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="section">
        <div className="shell">
          <SectionHead eyebrow="Visit us" title="VISIT RIDERZPRO." blurb="Call or message us to book a slot before you come in." />
          <a href={SITE.phoneHref} className="btn btn-outline btn-sm">
            <Icon name="phone" size={13} />
            {SITE.phone}
          </a>
          <p className="mt-6 text-sm text-dim">{SITE.hours}</p>
          <Link href="/build" className="btn btn-accent btn-sm mt-6">
            Configure a build before you come in
            <Icon name="arrow" size={14} />
          </Link>
        </div>
      </section>
    </>
  );
}
