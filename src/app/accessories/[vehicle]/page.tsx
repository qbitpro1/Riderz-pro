import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PageHero, Breadcrumbs } from "@/components/layout/PageHero";
import { CatalogBrowser } from "@/components/catalog/CatalogBrowser";
import { SectionHead } from "@/components/ui/Section";
import { Icon } from "@/components/ui/Icon";
import { Accordion } from "@/components/ui/Accordion";
import { LANDING_MODELS, findModelBySlug } from "@/lib/data/vehicles";
import { EMPTY_FILTERS, itemsForModel } from "@/lib/catalog";
import { FACELIFT_CONVERSIONS } from "@/lib/data/services";
import { CARS } from "@/lib/data/cars";
import { CarCard } from "@/components/cars/CarCard";
import { whatsapp } from "@/lib/data/site";
import { rupees } from "@/lib/format";
import type { MediaKey } from "@/lib/media";

export function generateStaticParams() {
  return LANDING_MODELS.map((m) => ({ vehicle: m.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ vehicle: string }>;
}): Promise<Metadata> {
  const { vehicle } = await params;
  const model = findModelBySlug(vehicle);
  if (!model) return {};
  const title = `${model.name} Accessories & Modification — ${model.brand} ${model.name}`;
  return {
    title,
    description: `Accessories, lighting, audio, interiors, PPF and ${
      model.offroad ? "off-road" : "performance"
    } upgrades for the ${model.brand} ${model.name}. Fitment-checked for every variant and year, installed at Riderzpro garages.`,
    alternates: { canonical: `/accessories/${model.slug}` },
  };
}

const HERO_MEDIA: Record<string, MediaKey> = {
  thar: "suvDesertRocks",
  "thar-roxx": "suvGrille",
  "scorpio-n": "suvGrille",
  xuv700: "suvSnowRoad",
  jimny: "suvDesertTrail",
  brezza: "crossoverTeal",
  swift: "cityNightRain",
  fortuner: "suvSnowRoad",
  hilux: "defenderSaltFlat",
  "innova-crysta": "cockpitScreen",
  creta: "crossoverTeal",
  venue: "frontGrilleRed",
  harrier: "suvDesertTrail",
  nexon: "crossoverTeal",
  seltos: "frontGrilleRed",
  city: "luxurySaloonMotion",
  gurkha: "defenderSaltFlat",
  "d-max-v-cross": "suvDesertRocks",
  taigun: "coupeGrey",
  compass: "suvSnowRoad",
  wrangler: "suvDesertRocks",
  "3-series": "sportSaloonBlue",
  glc: "awdSnow",
  defender: "defenderSaltFlat",
};

export default async function VehicleAccessoriesPage({
  params,
}: {
  params: Promise<{ vehicle: string }>;
}) {
  const { vehicle } = await params;
  const model = findModelBySlug(vehicle);
  if (!model) notFound();

  const products = itemsForModel(model.slug);
  const facelift = FACELIFT_CONVERSIONS.filter((f) => f.modelSlug === model.slug);
  const listings = CARS.filter((c) => c.model === model.name).slice(0, 3);

  const recommended = [
    "Floor mats and interior protection",
    "Seat covers cut to your seat pattern",
    "LED and projector lighting",
    "Audio — speakers, DSP, deadening",
    model.offroad ? "Off-road recovery and protection" : "Performance intake and exhaust",
    "PPF and ceramic coating",
    "Body kits and styling",
    model.offroad ? "Lift kits and all-terrain tyres" : "Suspension and braking upgrades",
  ];

  const faq = [
    {
      q: `Do these parts fit every ${model.name} variant?`,
      a: `We stock variant-specific parts wherever the ${model.name} differs between trims — bumpers, lamp housings, seat patterns and speaker sizes all change between variants. Tell us your variant and year and we confirm before dispatch.`,
    },
    {
      q: `How long does a full ${model.name} build take?`,
      a: "A lighting and audio package is usually two days. A full exterior and interior build runs three to six weeks depending on paint and parts lead times. We give you a dated schedule before we start.",
    },
    {
      q: "Will modifications affect my warranty or insurance?",
      a: "Bolt-on accessories generally do not affect a manufacturer warranty. Structural, suspension and engine work can, and some modifications need to be declared to your insurer or endorsed on your RC. We tell you which is which before we begin, in writing.",
    },
    {
      q: "Can I get everything done in one visit?",
      a: `Yes. Bring the ${model.name} in once and we sequence the work across bays — trim shop, paint, audio and mechanical — so it leaves finished rather than coming back four times.`,
    },
  ];

  return (
    <>
      <PageHero
        eyebrow={`${model.brand} ${model.name}`}
        title={`${model.name.toUpperCase()} ACCESSORIES & MODIFICATION.`}
        blurb={
          model.blurb ??
          `Everything for the ${model.brand} ${model.name} — accessories, lighting, audio, interiors, protection and ${
            model.offroad ? "off-road hardware" : "performance upgrades"
          }. Fitment checked against your variant and year, installed by our workshop.`
        }
        media={HERO_MEDIA[model.slug] ?? "openRoadRear"}
        actions={[
          { href: "#parts", label: "Shop parts", variant: "primary" },
          { href: "/build", label: "Build this car", variant: "outline" },
        ]}
        size="sm"
      >
        <ul className="mt-7 flex flex-wrap gap-2">
          {model.variants.map((v) => (
            <li key={v} className="chip">
              {v}
            </li>
          ))}
        </ul>
      </PageHero>

      <section className="section" id="parts">
        <div className="shell">
          <Breadcrumbs
            items={[
              { label: "Home", href: "/" },
              { label: "Shop", href: "/shop" },
              { label: `${model.name} accessories` },
            ]}
          />
          <SectionHead
            eyebrow="Confirmed fitment"
            title={`PARTS THAT FIT YOUR ${model.name.toUpperCase()}.`}
            blurb={`${products.length} products currently listed for the ${model.name}, plus everything else we stock but haven't put online yet.`}
          />
          <CatalogBrowser items={products} initial={EMPTY_FILTERS} />
        </div>
      </section>

      <section className="section border-y border-white/8 bg-carbon">
        <div className="shell grid gap-8 lg:grid-cols-[1fr_1.15fr]">
          <SectionHead
            eyebrow="Most requested"
            title={`WHAT ${model.name.toUpperCase()} OWNERS ACTUALLY BUY.`}
            blurb="Ranked from what left our workshop this quarter, not from what we want to sell you."
          />
          <ul className="grid gap-2.5 sm:grid-cols-2">
            {recommended.map((r) => (
              <li key={r} className="flex items-start gap-2.5 border border-white/8 bg-white/2 p-3 text-sm text-ash">
                <Icon name="check" size={15} className="mt-0.5 shrink-0 text-accent" />
                {r}
              </li>
            ))}
          </ul>
        </div>
      </section>

      {facelift.length > 0 && (
        <section className="section">
          <div className="shell">
            <SectionHead
              eyebrow="Facelift & body kits"
              title="MAKE IT LOOK NEW AGAIN."
              href="/body-kits"
              hrefLabel="All conversions"
            />
            <ul className="grid gap-4 md:grid-cols-2">
              {facelift.map((f) => (
                <li key={f.slug} className="card p-5">
                  <p className="text-xs text-dim">{f.from}</p>
                  <p className="mt-1 font-display text-xl font-extrabold uppercase">{f.to}</p>
                  <p className="mt-3 font-display text-lg text-accent tnum">From {rupees(f.price)}</p>
                  <p className="mt-1 text-xs text-dim">{f.duration} in the workshop</p>
                  <ul className="mt-4 space-y-1.5">
                    {f.includes.map((i) => (
                      <li key={i} className="flex items-start gap-2 text-xs text-ash">
                        <Icon name="check" size={12} className="mt-0.5 shrink-0 text-accent" />
                        {i}
                      </li>
                    ))}
                  </ul>
                  <a
                    href={whatsapp(`Hi Riderzpro, I want a quote for: ${f.to} on my ${f.from}.`)}
                    target="_blank"
                    rel="noreferrer noopener"
                    className="btn btn-outline btn-sm btn-block mt-5"
                  >
                    Get a quote
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}

      {listings.length > 0 && (
        <section className="section border-t border-white/8 bg-carbon">
          <div className="shell">
            <SectionHead
              eyebrow="In stock now"
              title={`${model.name.toUpperCase()} FOR SALE.`}
              href="/cars"
              hrefLabel="All cars"
            />
            <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {listings.map((c) => (
                <li key={c.slug}>
                  <CarCard car={c} />
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}

      <section className="section">
        <div className="shell grid gap-8 lg:grid-cols-2 lg:items-start">
          <div>
            <SectionHead eyebrow="Questions" title={`${model.name.toUpperCase()} FAQs.`} />
            <Accordion items={faq} />
          </div>
          <div className="card p-6">
            <p className="font-display text-lg font-extrabold uppercase">
              Not sure what suits your {model.name}?
            </p>
            <p className="mt-2 text-sm text-ash">
              Send us your variant, year and what you want the car to do. We'll come back with two or
              three options at different budgets — not a catalogue dump.
            </p>
            <a
              href={whatsapp(`Hi Riderzpro, I drive a ${model.brand} ${model.name}. I'm looking for: `)}
              target="_blank"
              rel="noreferrer noopener"
              className="btn btn-whatsapp btn-block mt-5"
            >
              <Icon name="whatsapp" size={16} />
              Ask on WhatsApp
            </a>
            <Link href="/garage" className="btn btn-outline btn-block mt-3">
              Book an installation slot
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
