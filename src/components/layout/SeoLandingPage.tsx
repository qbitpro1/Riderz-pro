import Link from "next/link";
import { PageHero } from "./PageHero";
import { Icon } from "@/components/ui/Icon";
import { Reveal } from "@/components/ui/Reveal";
import { SectionHead } from "@/components/ui/Section";
import { LANDING_MODELS } from "@/lib/data/vehicles";
import { LOCATIONS, whatsapp } from "@/lib/data/site";
import type { SeoLanding } from "@/lib/data/seo";

export function SeoLandingPage({ landing }: { landing: SeoLanding }) {
  return (
    <>
      <PageHero
        eyebrow={landing.eyebrow}
        title={landing.h1}
        blurb={landing.intro}
        media={landing.media}
        size="sm"
        actions={[
          { href: landing.cta.href, label: landing.cta.label, variant: "primary" },
          ...(landing.secondary
            ? [{ href: landing.secondary.href, label: landing.secondary.label, variant: "outline" as const }]
            : []),
        ]}
      />

      <section className="section">
        <div className="shell max-w-4xl">
          <ul className="space-y-8">
            {landing.sections.map((s, i) => (
              <li key={s.heading}>
                <Reveal delay={Math.min(i * 60, 240)}>
                  <h2 className="display-3">{s.heading.toUpperCase()}</h2>
                  <p className="mt-3 text-sm leading-relaxed text-ash md:text-base">{s.body}</p>
                </Reveal>
              </li>
            ))}
          </ul>

          <div className="mt-12 flex flex-wrap gap-3">
            <Link href={landing.cta.href} className="btn btn-primary">
              {landing.cta.label}
              <Icon name="arrow" size={15} />
            </Link>
            <a
              href={whatsapp(`Hi Riderzpro, I found you looking for ${landing.eyebrow.toLowerCase()}. `)}
              target="_blank"
              rel="noreferrer noopener"
              className="btn btn-whatsapp"
            >
              <Icon name="whatsapp" size={16} />
              Ask on WhatsApp
            </a>
          </div>
        </div>
      </section>

      <section className="section border-y border-tint/8 bg-carbon">
        <div className="shell">
          <SectionHead eyebrow="Where next" title="KEEP GOING." />
          <ul className="flex flex-wrap gap-2">
            {landing.links.map((l) => (
              <li key={l.href}>
                <Link href={l.href} className="chip hover:border-accent hover:text-accent">
                  <Icon name="chevron" size={11} className="text-accent" />
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>

          <p className="label mt-8">Popular vehicles</p>
          <ul className="flex flex-wrap gap-2">
            {LANDING_MODELS.map((m) => (
              <li key={m.slug}>
                <Link href={`/accessories/${m.slug}`} className="chip hover:border-accent hover:text-accent">
                  {m.brand} {m.name}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="section">
        <div className="shell">
          <SectionHead eyebrow="Near you" title="THREE CITIES. 26 BAYS." href="/locations" hrefLabel="All locations" />
          <ul className="grid gap-4 md:grid-cols-3">
            {LOCATIONS.map((l) => (
              <li key={l.slug} className="card p-5">
                <p className="font-display text-base font-extrabold uppercase">{l.city}</p>
                <p className="mt-2 text-xs leading-relaxed text-ash">{l.address}</p>
                <a href={l.mapUrl} target="_blank" rel="noreferrer noopener" className="btn btn-outline btn-sm mt-4">
                  <Icon name="map" size={13} />
                  Directions
                </a>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </>
  );
}
