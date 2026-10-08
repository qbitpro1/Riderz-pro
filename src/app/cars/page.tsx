import type { Metadata } from "next";
import Link from "next/link";
import { PageHero } from "@/components/layout/PageHero";
import { InventoryBrowser } from "@/components/inventory/InventoryBrowser";
import { EmiCalculator } from "@/components/finance/EmiCalculator";
import { SectionHead } from "@/components/ui/Section";
import { Icon } from "@/components/ui/Icon";
import { toCardData } from "@/lib/inventory/card-data";
import { BROWSABLE, FACETS, KM_BANDS, PRICE_BANDS, SPECIAL_FILTERS } from "@/lib/inventory/store";
import { SEARCH_EXAMPLES } from "@/lib/inventory/query";
import { TRUST_POINTS, whatsapp } from "@/lib/data/site";

export const metadata: Metadata = {
  title: "Buy Used Cars in India — Verified, Inspected & Certified",
  description:
    "Browse Motorbotz Certified used, modified, off-road and luxury cars. 200-point inspection, RC and insurance verification, transparent pricing and finance from 11 lenders.",
  alternates: { canonical: "/cars" },
};

const COLLECTIONS = [
  { label: "Off-road ready", note: "4x4 and lifted builds" },
  { label: "Modified", note: "Documented, reversible work" },
  { label: "Luxury", note: "BMW, Mercedes-Benz, Audi" },
  { label: "Under ₹15 lakh", note: "First-car territory" },
  { label: "Automatic", note: "City-friendly" },
  { label: "Single owner", note: "Cleanest paperwork" },
];

export default function CarsPage() {
  const cards = BROWSABLE.map(toCardData);
  const specialFilters = Object.entries(SPECIAL_FILTERS).map(([key, f]) => ({
    key,
    label: f.label,
    tags: [...f.tags],
    matches: BROWSABLE.filter(f.match).map((l) => l.id),
  }));

  return (
    <>
      <PageHero
        eyebrow="Motorbotz Marketplace"
        title="CARS WORTH BUYING."
        blurb="New, used, certified, modified, off-road, luxury and performance. Every listing carries an inspection report you can read before you call us."
        media="luxurySaloonMotion"
        actions={[
          { href: "/cars/latest", label: "Latest cars", variant: "primary" },
          { href: "/sell", label: "Sell your car", variant: "outline" },
        ]}
      >
        <div className="mt-8 flex flex-wrap gap-2">
          {COLLECTIONS.map((c) => (
            <span key={c.label} className="chip">
              {c.label}
            </span>
          ))}
        </div>
      </PageHero>

      <section className="section" id="listings">
        <div className="shell">
          <InventoryBrowser
            listings={cards}
            facets={FACETS}
            bands={{ priceBands: PRICE_BANDS, kmBands: KM_BANDS }}
            specialFilters={specialFilters}
            examples={SEARCH_EXAMPLES}
          />
        </div>
      </section>

      <section className="section border-t border-white/8 bg-carbon">
        <div className="shell grid gap-8 lg:grid-cols-[1fr_1.1fr] lg:items-start">
          <div>
            <SectionHead
              eyebrow="Financing"
              title="FINANCE AVAILABLE."
              blurb="We work with 11 lenders including private banks and NBFCs. Approval usually lands the same day, and we will show you every offer, not just the one that pays us most."
            />
            <ul className="space-y-3">
              {[
                "Loans on used cars up to 90% of value",
                "Tenures from 12 to 84 months",
                "Modification and accessory financing on eligible builds",
                "Balance transfer and top-up on existing car loans",
              ].map((t) => (
                <li key={t} className="flex items-start gap-2.5 text-sm text-ash">
                  <Icon name="check" size={15} className="mt-0.5 shrink-0 text-accent" />
                  {t}
                </li>
              ))}
            </ul>
          </div>
          <EmiCalculator context="a car from Motorbotz" />
        </div>
      </section>

      <section className="section">
        <div className="shell">
          <SectionHead eyebrow="Trust system" title="WHAT WE CHECK BEFORE WE LIST." />
          <ul className="grid gap-px overflow-hidden border border-white/8 bg-white/8 sm:grid-cols-2 lg:grid-cols-3">
            {TRUST_POINTS.map((t) => (
              <li key={t.title} className="bg-void p-5">
                <p className="flex items-center gap-2 font-display text-sm font-extrabold uppercase">
                  <Icon name="check" size={16} className="text-accent" />
                  {t.title}
                </p>
                <p className="mt-2 text-xs leading-relaxed text-ash">{t.body}</p>
              </li>
            ))}
          </ul>

          <div className="card mt-8 flex flex-col items-start justify-between gap-4 p-6 md:flex-row md:items-center">
            <div>
              <p className="font-display text-lg font-extrabold uppercase">Can't find the right car?</p>
              <p className="mt-1 text-sm text-ash">
                Tell us the spec and budget. We source to order every week across three cities.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <a
                href={whatsapp("Hi Motorbotz, I'm looking for a car. My requirement is: ")}
                target="_blank"
                rel="noreferrer noopener"
                className="btn btn-whatsapp btn-sm"
              >
                <Icon name="whatsapp" size={15} />
                Tell us what you want
              </a>
              <Link href="/sell" className="btn btn-outline btn-sm">
                Sell my car
              </Link>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
