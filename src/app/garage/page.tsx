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
import { pageMeta } from "@/lib/data/seo";

export const metadata: Metadata = pageMeta({
  title: "Riderzpro Garage — Installation, Modification & Service Workshop",
  description:
    "Book installation, modification, detailing, PPF, audio, performance, off-road and interior work with Riderzpro. We call you to confirm the slot and the fitment.",
  path: "/garage",
});

const WORKSHOP_MEDIA = ["mechanicEngine", "garageSpotlit", "washBay", "detailingPolish"] as const;

export default function GaragePage() {
  return (
    <>
      <PageHero
        eyebrow="Riderzpro Garage"
        title="Installation & service"
        blurb="Tell us what your car needs. We call you to confirm the slot and the fitment before any work starts."
        media="mechanicEngine"
        actions={[{ href: "#book", label: "Book an appointment", variant: "primary" }]}
      />

      <section className="section">
        <div className="shell grid gap-10 lg:grid-cols-[1fr_1.1fr] lg:items-start" id="book">
          <div>
            <SectionHead
              eyebrow="What we do"
              title="What we can do"
              blurb="If we cannot do something properly, we say so instead of learning on your car."
            />
            {/* An odd last service spans both columns, so the grid never ends on an empty cell. */}
            <ul className="grid gap-px overflow-hidden border border-tint/8 bg-tint/8 sm:grid-cols-2 sm:[&>li:last-child:nth-child(odd)]:col-span-2">
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
            <div className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-3">
              <Link href="/build" className="btn btn-accent btn-sm">
                Configure a build before you come in
                <Icon name="arrow" size={14} />
              </Link>
              <p className="text-sm text-dim">{SITE.hours}</p>
            </div>
          </div>

          <BookingForm />
        </div>
      </section>

      <section className="section border-y border-tint/8 bg-carbon">
        <div className="shell">
          <SectionHead eyebrow="Inside the workshop" title="Where it happens" />
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

      {LOCATIONS.length > 0 && (
      <section className="section">
        <div className="shell">
            <>
              <SectionHead eyebrow="Locations" title="Visit Riderzpro" />
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
            </>
        </div>
      </section>
      )}
    </>
  );
}
