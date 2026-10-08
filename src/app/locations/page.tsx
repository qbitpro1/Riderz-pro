import type { Metadata } from "next";
import { PageHero } from "@/components/layout/PageHero";
import { SectionHead } from "@/components/ui/Section";
import { Icon } from "@/components/ui/Icon";
import { Photo } from "@/components/ui/Photo";
import { BookingForm } from "@/components/garage/BookingForm";
import { LOCATIONS, SITE, whatsapp } from "@/lib/data/site";

export const metadata: Metadata = {
  title: "Visit Motorbotz — Bengaluru, Hyderabad & Pune",
  description:
    "Motorbotz garage addresses, phone numbers, opening hours and directions. Car modification, accessories, audio, PPF and off-road builds in Bengaluru, Hyderabad and Pune.",
  alternates: { canonical: "/locations" },
};

const WORKSHOP_MEDIA = ["garageSpotlit", "washBay", "mechanicEngine"] as const;

export default function LocationsPage() {
  return (
    <>
      <PageHero
        eyebrow="Visit Motorbotz"
        title="COME AND SEE THE WORK."
        blurb="Walk into any bay, look at what's on the lifts, talk to the person who will actually build your car. No appointment needed to visit."
        media="garageSpotlit"
        size="sm"
      />

      <section className="section">
        <div className="shell space-y-6">
          {LOCATIONS.map((l, i) => (
            <article key={l.slug} className="card grid gap-0 overflow-hidden md:grid-cols-[1.1fr_1fr]">
              <div className="relative aspect-[16/10] bg-graphite md:aspect-auto md:min-h-[300px]">
                <Photo media={WORKSHOP_MEDIA[i % WORKSHOP_MEDIA.length]} sizes="(min-width:768px) 50vw, 100vw" />
                <div className="absolute inset-0 bg-gradient-to-t from-void/70 to-transparent" />
              </div>
              <div className="p-6">
                <p className="flex flex-wrap items-center gap-2 font-display text-2xl font-extrabold uppercase tracking-[-0.03em]">
                  {l.city}
                  {l.flagship && <span className="chip border-accent/35 bg-accent/12 text-accent">Flagship</span>}
                </p>
                <p className="mt-3 text-sm leading-relaxed text-ash">{l.address}</p>

                <ul className="mt-4 flex flex-wrap gap-2">
                  {l.services.map((s) => (
                    <li key={s} className="chip">
                      {s}
                    </li>
                  ))}
                </ul>

                <dl className="mt-5 space-y-1.5 text-sm">
                  <div className="flex gap-2 text-ash">
                    <dt className="text-dim">Bays</dt>
                    <dd className="tnum">{l.bays}</dd>
                  </div>
                  <div className="flex gap-2 text-ash">
                    <dt className="text-dim">Hours</dt>
                    <dd>{SITE.hours}</dd>
                  </div>
                </dl>

                <div className="mt-5 flex flex-wrap gap-2">
                  <a href={`tel:${l.phone.replace(/\s/g, "")}`} className="btn btn-outline btn-sm">
                    <Icon name="phone" size={13} />
                    {l.phone}
                  </a>
                  <a
                    href={whatsapp(`Hi Motorbotz ${l.city}, I'd like to visit. `)}
                    target="_blank"
                    rel="noreferrer noopener"
                    className="btn btn-whatsapp btn-sm"
                  >
                    <Icon name="whatsapp" size={14} />
                    WhatsApp
                  </a>
                  <a href={l.mapUrl} target="_blank" rel="noreferrer noopener" className="btn btn-outline btn-sm">
                    <Icon name="map" size={13} />
                    Open in Maps
                  </a>
                </div>

                <iframe
                  title={`Map of ${l.name}`}
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  className="mt-5 h-48 w-full border border-white/8 grayscale-[60%]"
                  src={`https://maps.google.com/maps?q=${encodeURIComponent(l.embedQuery)}&t=&z=14&ie=UTF8&iwloc=&output=embed`}
                />
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="section border-t border-white/8 bg-carbon">
        <div className="shell grid gap-8 lg:grid-cols-[1fr_1.1fr] lg:items-start">
          <SectionHead
            eyebrow="More cities coming"
            title="NOT IN YOUR CITY YET?"
            blurb="We ship accessories across India and can arrange transport for larger builds. Chennai and Delhi NCR workshops are in fit-out for 2026."
          />
          <BookingForm />
        </div>
      </section>
    </>
  );
}
