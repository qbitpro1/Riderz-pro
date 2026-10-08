import type { Metadata } from "next";
import Link from "next/link";
import { PageHero } from "@/components/layout/PageHero";
import { BookingForm } from "@/components/garage/BookingForm";
import { SectionHead } from "@/components/ui/Section";
import { Icon } from "@/components/ui/Icon";
import { Photo } from "@/components/ui/Photo";
import { Reveal } from "@/components/ui/Reveal";
import { GARAGE_SERVICES } from "@/lib/data/services";
import { LOCATIONS, SITE } from "@/lib/data/site";
import { STATS } from "@/lib/data/community";

export const metadata: Metadata = {
  title: "Riderzpro Garage — Installation, Modification & Service Workshop",
  description:
    "Book installation, modification, detailing, PPF, audio, performance, off-road and interior work at Riderzpro garages in Bengaluru, Hyderabad and Pune. 26 bays, one standard.",
  alternates: { canonical: "/garage" },
};

const WORKSHOP_MEDIA = ["mechanicEngine", "garageSpotlit", "washBay", "detailingPolish"] as const;

export default function GaragePage() {
  return (
    <>
      <PageHero
        eyebrow="Riderzpro Garage"
        title="26 BAYS. ONE STANDARD."
        blurb="Everything happens under one roof — trim shop, paint room, audio bay, dyno, welding and lifts. No sending your car to three different markets and hoping."
        media="mechanicEngine"
        actions={[{ href: "#book", label: "Book an appointment", variant: "primary" }]}
      >
        <dl className="mt-8 grid max-w-2xl grid-cols-2 gap-x-6 gap-y-5 border-t border-white/12 pt-6 md:grid-cols-4">
          {STATS.map((s) => (
            <div key={s.label}>
              <dd className="font-display text-2xl font-extrabold tnum">{s.value}</dd>
              <dt className="mt-1 text-[11px] uppercase tracking-[0.14em] text-dim">{s.label}</dt>
            </div>
          ))}
        </dl>
      </PageHero>

      <section className="section">
        <div className="shell grid gap-10 lg:grid-cols-[1fr_1.1fr] lg:items-start" id="book">
          <div>
            <SectionHead
              eyebrow="What we do here"
              title="EVERY JOB, ONE ROOF."
              blurb="If it can be done to a car, one of our bays does it. If we cannot do something properly, we say so instead of learning on your car."
            />
            <ul className="grid gap-px overflow-hidden border border-white/8 bg-white/8 sm:grid-cols-2">
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

      <section className="section border-y border-white/8 bg-carbon">
        <div className="shell">
          <SectionHead eyebrow="Inside the workshop" title="WHERE IT HAPPENS." />
          <ul className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            {WORKSHOP_MEDIA.map((m, i) => (
              <li key={m}>
                <Reveal delay={i * 60}>
                  <div className="relative aspect-[4/5] overflow-hidden bg-graphite">
                    <Photo media={m} sizes="(min-width:1024px) 25vw, 46vw" />
                    <div className="absolute inset-0 bg-gradient-to-t from-void/60 to-transparent" />
                  </div>
                </Reveal>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="section">
        <div className="shell">
          <SectionHead eyebrow="Locations" title="VISIT RIDERZPRO." href="/locations" hrefLabel="All locations" />
          <ul className="grid gap-4 md:grid-cols-3">
            {LOCATIONS.map((l) => (
              <li key={l.slug} className="card p-5">
                <p className="flex items-center gap-2 font-display text-base font-extrabold uppercase">
                  {l.city}
                  {l.flagship && <span className="chip border-accent/35 bg-accent/12 text-accent">Flagship</span>}
                </p>
                <p className="mt-2 text-xs leading-relaxed text-ash">{l.address}</p>
                <p className="mt-3 text-xs text-dim">{l.bays} bays · {l.services.join(" · ")}</p>
                <div className="mt-4 flex flex-wrap gap-2">
                  <a href={`tel:${l.phone.replace(/\s/g, "")}`} className="btn btn-outline btn-sm">
                    <Icon name="phone" size={13} />
                    Call
                  </a>
                  <a href={l.mapUrl} target="_blank" rel="noreferrer noopener" className="btn btn-outline btn-sm">
                    <Icon name="map" size={13} />
                    Directions
                  </a>
                </div>
              </li>
            ))}
          </ul>
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
