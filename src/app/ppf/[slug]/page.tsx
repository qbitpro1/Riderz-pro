import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PageHero, Breadcrumbs } from "@/components/layout/PageHero";
import { StickyPpfCta } from "@/components/ppf/StickyPpfCta";
import { SectionHead } from "@/components/ui/Section";
import { Icon } from "@/components/ui/Icon";
import { PPF_LANDINGS, getLanding } from "@/lib/ppf/landings";
import { PPF_PACKAGES, PRICE_DISCLAIMER, quote } from "@/lib/ppf/coverage";
import { GUIDE } from "@/lib/ppf/guide";
import { LOCATIONS, whatsapp } from "@/lib/data/site";
import { rupees } from "@/lib/format";
import type { MediaKey } from "@/lib/media";

export function generateStaticParams() {
  return PPF_LANDINGS.map((l) => ({ slug: l.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const landing = getLanding(slug);
  if (!landing) return {};
  return {
    title: landing.title,
    description: landing.description,
    alternates: { canonical: `/ppf/${landing.slug}` },
  };
}

const OFFROAD_MEDIA: MediaKey = "defenderSaltFlat";

export default async function PpfLandingPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const landing = getLanding(slug);
  if (!landing) notFound();

  const packages = PPF_PACKAGES.filter((p) => p.id !== "signature").map((pkg) => ({
    pkg,
    q: quote({
      sizeClass: landing.sizeClass,
      tier: pkg.audience === "entry" ? "essential" : "premium",
      areaIds: pkg.areaIds,
      fullBody: pkg.fullBody,
      paintCondition: "excellent",
    }),
  }));

  const media: MediaKey =
    landing.vehicle?.body === "Off-Roader" || landing.vehicle?.body === "Pickup"
      ? OFFROAD_MEDIA
      : landing.kind === "city"
        ? "washBay"
        : "wrapHeatGun";

  const guideLinks = GUIDE.filter((a) =>
    landing.vehicle?.body === "SUV" || landing.vehicle?.body === "Off-Roader"
      ? ["ppf-for-suvs", "ppf-for-off-road-vehicles", "full-body-vs-full-front", "is-ppf-worth-it"].includes(a.slug)
      : ["what-is-ppf", "ppf-vs-ceramic", "full-body-vs-full-front", "is-ppf-worth-it"].includes(a.slug),
  );

  return (
    <>
      <PageHero
        eyebrow={landing.kind === "city" ? `PPF in ${landing.city?.name}` : `${landing.vehicle?.brand} ${landing.vehicle?.model}`}
        title={landing.h1}
        blurb={landing.intro}
        media={media}
        size="sm"
        actions={[
          { href: "/ppf/quote", label: "Get PPF quote", variant: "primary" },
          { href: "/ppf/films", label: "Compare films", variant: "outline" },
        ]}
      />

      <section className="section">
        <div className="shell">
          <Breadcrumbs
            items={[
              { label: "Home", href: "/" },
              { label: "PPF", href: "/ppf" },
              { label: landing.kind === "city" ? landing.city!.name : landing.vehicle!.model },
            ]}
          />

          <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {landing.points.map((p) => (
              <li key={p} className="flex items-start gap-2.5 border border-tint/8 bg-tint/2 p-3 text-sm text-ash">
                <Icon name="check" size={15} className="mt-0.5 shrink-0 text-accent" />
                {p}
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="section border-y border-tint/8 bg-carbon">
        <div className="shell">
          <SectionHead
            eyebrow="Packages"
            title={landing.kind === "vehicle" ? `PRICED FOR THE ${landing.vehicle!.model.toUpperCase()}.` : "CHOOSE YOUR COVERAGE."}
            blurb="Indicative ranges on excellent paint. Correction, trim removal and existing film all change the figure."
          />
          <ul className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {packages.map(({ pkg, q }) => (
              <li key={pkg.id}>
                <div className="card flex h-full flex-col p-5">
                  <p className="font-display text-lg font-extrabold uppercase">{pkg.name}</p>
                  <p className="mt-1 text-xs text-accent">{pkg.headline}</p>
                  <p className="mt-3 flex-1 text-sm leading-relaxed text-ash">{pkg.blurb}</p>
                  <p className="mt-4 font-display text-xl font-extrabold tnum">
                    {rupees(q.low)} – {rupees(q.high)}
                  </p>
                  <p className="text-[11px] text-dim">≈ {q.sqFt} sq ft · {q.coveragePct}% coverage</p>
                  <Link href={`/ppf/quote?package=${pkg.id}`} className="btn btn-outline btn-sm btn-block mt-4">
                    {pkg.cta}
                  </Link>
                </div>
              </li>
            ))}
          </ul>
          <p className="mt-6 text-xs text-dim">{PRICE_DISCLAIMER}</p>
        </div>
      </section>

      {landing.kind === "city" && (
        <section className="section">
          <div className="shell">
            <SectionHead eyebrow="Where to bring it" title="OUR STUDIOS." href="/locations" hrefLabel="All locations" />
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
            {!landing.city?.address && (
              <p className="mt-4 text-xs leading-relaxed text-dim">
                We do not have a studio in {landing.city?.name} yet. Customers there use the nearest
                Riderzpro workshop — tell us on WhatsApp and we will sort out logistics.
              </p>
            )}
          </div>
        </section>
      )}

      <section className="section border-t border-tint/8 bg-carbon">
        <div className="shell grid gap-8 lg:grid-cols-2 lg:items-start">
          <div>
            <SectionHead eyebrow="Read first" title="WORTH KNOWING." href="/ppf/guide" hrefLabel="Full guide" />
            <ul className="space-y-2">
              {guideLinks.map((a) => (
                <li key={a.slug}>
                  <Link href={`/ppf/guide/${a.slug}`} className="flex items-start gap-2 text-sm text-ash transition-colors hover:text-accent">
                    <Icon name="chevron" size={13} className="mt-1 shrink-0 text-accent" />
                    <span>
                      {a.title}
                      <span className="block text-xs text-dim">{a.summary}</span>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div className="card p-6">
            <p className="font-display text-lg font-extrabold uppercase">
              {landing.kind === "vehicle" ? `Get a price for your ${landing.vehicle!.model}` : `Book an inspection in ${landing.city!.name}`}
            </p>
            <p className="mt-2 text-sm text-ash">
              Free inspection, about twenty minutes. We read the paint and quote properly.
            </p>
            <Link href="/ppf/quote" className="btn btn-accent btn-block mt-5">
              Build your package
              <Icon name="arrow" size={15} />
            </Link>
            <a
              href={whatsapp(
                landing.kind === "vehicle"
                  ? `Hi Riderzpro, I want a PPF quote for my ${landing.vehicle!.brand} ${landing.vehicle!.model}.`
                  : `Hi Riderzpro, I want PPF in ${landing.city!.name}. My car is: `,
              )}
              target="_blank"
              rel="noreferrer noopener"
              className="btn btn-whatsapp btn-block mt-3"
            >
              <Icon name="whatsapp" size={16} />
              Get PPF quote on WhatsApp
            </a>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="shell">
          <SectionHead eyebrow="More PPF pages" title="KEEP LOOKING." />
          <ul className="flex flex-wrap gap-2">
            {PPF_LANDINGS.filter((l) => l.slug !== landing.slug).map((l) => (
              <li key={l.slug}>
                <Link href={`/ppf/${l.slug}`} className="chip hover:border-accent hover:text-accent">
                  {l.kind === "city" ? `PPF in ${l.city!.name}` : `PPF for ${l.vehicle!.model}`}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <StickyPpfCta vehicle={landing.vehicle ? `${landing.vehicle.brand} ${landing.vehicle.model}` : undefined} />
    </>
  );
}
