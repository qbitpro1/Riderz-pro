import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Photo } from "@/components/ui/Photo";
import { Icon } from "@/components/ui/Icon";
import { Breadcrumbs } from "@/components/layout/PageHero";
import { SectionHead } from "@/components/ui/Section";
import { CarCard } from "@/components/cars/CarCard";
import { EmiCalculator } from "@/components/finance/EmiCalculator";
import { Accordion } from "@/components/ui/Accordion";
import {
  BuildItNext,
  ConditionTable,
  InspectionReport,
  ProvenanceBanner,
} from "@/components/inventory/ListingProvenance";
import { InspectionRequest } from "@/components/inventory/InspectionRequest";
import { getListing } from "@/lib/inventory/store";
import { formatIST } from "@/lib/inventory/freshness";
import { CARS, getCar, relatedCars } from "@/lib/data/cars";
import { emiFrom, km as fmtKm, lakh } from "@/lib/format";
import { SITE, TRUST_POINTS, whatsapp } from "@/lib/data/site";
import { MEDIA } from "@/lib/media";

export function generateStaticParams() {
  return CARS.map((c) => ({ slug: c.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const car = getCar(slug);
  if (!car) return {};
  const title = `${car.year} ${car.brand} ${car.model} ${car.variant} — ${lakh(car.price)}`;
  return {
    title,
    description: `${car.note} ${fmtKm(car.km)}, ${car.fuel}, ${car.transmission}, ${car.owner}, ${car.city}. Riderzpro Certified with a 200-point inspection report.`,
    alternates: { canonical: `/cars/${car.slug}` },
    openGraph: { title, description: car.note, images: [MEDIA[car.images[0]].src] },
  };
}

const FAQ = [
  {
    q: "Can I get the car inspected independently?",
    a: "Yes. Bring your own mechanic to any Riderzpro garage, or we will send the car to a third-party inspection agency of your choice at your cost. We have nothing to hide and the report usually matches ours.",
  },
  {
    q: "How does the RC transfer work?",
    a: "We handle it end to end. You sign Form 29 and 30, we file with the RTO, and the transfer is typically complete within 15 working days. You receive tracking updates on WhatsApp throughout.",
  },
  {
    q: "Is there a return window?",
    a: "Five days or 300 km, whichever comes first, on every Riderzpro Certified car. If something material was missed in our inspection, we take the car back and refund in full.",
  },
  {
    q: "Can I part-exchange my current car?",
    a: "Yes. We value your existing car through the same 200-point process and adjust it against the purchase. The valuation is free and there is no obligation to proceed.",
  },
];

export default async function CarDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const car = getCar(slug);
  if (!car) notFound();

  const related = relatedCars(car);
  const listing = getListing(slug);
  const waMessage = `Hi Riderzpro, I'm interested in the ${car.year} ${car.brand} ${car.model} ${car.variant} (${lakh(car.price)}) listed on your website.`;

  const schema = {
    "@context": "https://schema.org",
    "@type": "Car",
    name: `${car.year} ${car.brand} ${car.model} ${car.variant}`,
    brand: { "@type": "Brand", name: car.brand },
    model: car.model,
    vehicleModelDate: String(car.year),
    mileageFromOdometer: { "@type": "QuantitativeValue", value: car.km, unitCode: "KMT" },
    fuelType: car.fuel,
    vehicleTransmission: car.transmission,
    driveWheelConfiguration: car.drivetrain,
    numberOfPreviousOwners: car.owner.startsWith("1") ? 1 : 2,
    offers: {
      "@type": "Offer",
      price: car.price,
      priceCurrency: "INR",
      availability: "https://schema.org/InStock",
      seller: { "@type": "AutoDealer", name: SITE.name },
    },
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />

      {/* gallery ---------------------------------------------------- */}
      <section className="relative pt-14 md:pt-[68px]">
        <div className="grid gap-1 md:grid-cols-4 md:grid-rows-2">
          <div className="relative col-span-2 row-span-2 aspect-[4/3] bg-graphite md:aspect-auto md:min-h-[62vh]">
            <Photo media={car.images[0]} sizes="(min-width:768px) 50vw, 100vw" priority />
            <div className="absolute inset-0 bg-gradient-to-t from-void/70 to-transparent md:from-void/40" />
            <div className="absolute bottom-4 left-4 flex flex-wrap gap-2">
              {car.verified && (
                <span className="verified">
                  <Icon name="shield" size={12} />
                  Riderzpro Verified
                </span>
              )}
              <span className="chip bg-void/70">{car.photoCount} photos</span>
              {car.hasVideo && <span className="chip bg-void/70">Video walkaround</span>}
              {car.has360 && <span className="chip bg-void/70">360° gallery</span>}
            </div>
          </div>
          {car.images.slice(1, 5).map((m, i) => (
            <div key={`${m}-${i}`} className="relative hidden aspect-[4/3] bg-graphite md:block">
              <Photo media={m} sizes="25vw" />
            </div>
          ))}
        </div>
      </section>

      <section className="section">
        <div className="shell grid gap-10 lg:grid-cols-[1.6fr_1fr] lg:items-start">
          {/* main ---------------------------------------------------- */}
          <div>
            <Breadcrumbs
              items={[
                { label: "Home", href: "/" },
                { label: "Cars", href: "/cars" },
                { label: `${car.brand} ${car.model}` },
              ]}
            />

            <p className="font-display text-xs font-bold uppercase tracking-[0.2em] text-accent">
              {car.year} · {car.brand}
            </p>
            <h1 className="display-2 mt-2">
              {car.model} {car.variant}
            </h1>
            <p className="mt-4 max-w-xl text-sm leading-relaxed text-ash md:text-base">
              {listing?.description ?? car.note}
            </p>

            {listing && (
              <div className="mt-6">
                <ProvenanceBanner listing={listing} />
              </div>
            )}

            <dl className="mt-8 grid grid-cols-2 gap-px overflow-hidden border border-tint/8 bg-tint/8 sm:grid-cols-4">
              <Spec label="Kilometres" value={fmtKm(car.km)} />
              <Spec label="Fuel" value={car.fuel} />
              <Spec label="Transmission" value={car.transmission} />
              <Spec label="Ownership" value={car.owner} />
              <Spec label="Engine" value={car.engine} />
              <Spec label="Power" value={car.power} />
              <Spec label="Drivetrain" value={car.drivetrain} />
              <Spec label="Location" value={`${car.city}, ${car.state}`} />
            </dl>

            <div className="mt-8">
              <h2 className="display-3">HIGHLIGHTS</h2>
              <ul className="mt-4 grid gap-2.5 sm:grid-cols-2">
                {car.highlights.map((h) => (
                  <li key={h} className="flex items-start gap-2.5 text-sm text-chalk/85">
                    <Icon name="check" size={15} className="mt-0.5 shrink-0 text-accent" />
                    {h}
                  </li>
                ))}
              </ul>
            </div>

            {car.modifications && (
              <div className="mt-10">
                <h2 className="display-3">MODIFICATIONS</h2>
                <p className="mt-2 text-sm text-ash">
                  Every item below was fitted by a professional workshop with invoices retained. Original
                  parts are included in the sale where noted.
                </p>
                <ul className="mt-4 divide-y divide-tint/8 border-y border-tint/8">
                  {car.modifications.map((m) => (
                    <li key={m.name} className="flex flex-col gap-1 py-3 sm:flex-row sm:gap-6">
                      <span className="w-32 shrink-0 font-display text-[11px] font-bold uppercase tracking-[0.14em] text-accent">
                        {m.name}
                      </span>
                      <span className="text-sm text-ash">{m.value}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className={`mt-10 ${listing && listing.verification !== "RIDERZPRO_VERIFIED" ? "hidden" : ""}`}>
              <h2 className="display-3">INSPECTION REPORT</h2>
              <div className="card mt-4 p-5">
                <div className="flex flex-wrap items-center gap-5">
                  <div>
                    <p className="label mb-1">Overall score</p>
                    <p className="font-display text-4xl font-extrabold text-accent tnum">
                      {car.inspectionScore}
                      <span className="text-lg text-dim">/100</span>
                    </p>
                  </div>
                  <div className="h-12 w-px bg-tint/10" />
                  <ul className="grid flex-1 gap-1.5 text-sm text-ash sm:grid-cols-2">
                    <li>Insurance — {car.insurance}</li>
                    <li>Registration — {car.registration}</li>
                    <li className="sm:col-span-2">Service history — {car.serviceHistory}</li>
                  </ul>
                </div>
                <p className="mt-4 border-t border-tint/8 pt-4 text-xs text-dim">
                  The full 200-point report, paint thickness readings and OBD scan are shared over
                  WhatsApp before any payment. Ask for it — we send it to everyone who asks.
                </p>
              </div>
            </div>

            {/* Only a completed inspection lets us call these "cleared". Until
                then this is the checklist we will run, not a claim about this car. */}
            <div className="mt-10">
              <h2 className="display-3">
                {listing?.verification === "RIDERZPRO_VERIFIED" ? "TRUST CHECKS CLEARED" : "WHAT WE CHECK BEFORE WE VERIFY"}
              </h2>
              {listing?.verification !== "RIDERZPRO_VERIFIED" && (
                <p className="mt-2 max-w-xl text-sm text-ash">
                  None of these has been completed on this car yet. Request an inspection and we work
                  through every one, then publish the result here.
                </p>
              )}
              <ul className="mt-4 flex flex-wrap gap-2">
                {TRUST_POINTS.map((t) => {
                  const cleared = listing?.verification === "RIDERZPRO_VERIFIED";
                  return (
                    <li
                      key={t.title}
                      className={`chip ${cleared ? "border-accent/25 text-chalk/80" : "text-dim"}`}
                    >
                      <Icon name={cleared ? "check" : "shield"} size={11} className={cleared ? "text-accent" : "text-dim"} />
                      {t.title}
                    </li>
                  );
                })}
              </ul>
            </div>

            {listing && (
              <>
                <div className="mt-10">
                  <h2 className="display-3">CONDITION</h2>
                  <p className="mt-2 max-w-xl text-sm text-ash">
                    What the source states and what Riderzpro has actually confirmed are kept in
                    separate columns. Anything we have not checked ourselves says so.
                  </p>
                  <div className="mt-4">
                    <ConditionTable listing={listing} />
                  </div>
                </div>

                <div className="mt-10">
                  <h2 className="display-3 mb-4">RIDERZPRO INSPECTION</h2>
                  <InspectionReport listing={listing} />
                </div>
              </>
            )}

            <div className="mt-10">
              <h2 className="display-3 mb-4">QUESTIONS</h2>
              <Accordion items={FAQ} />
            </div>
          </div>

          {/* sticky buy panel --------------------------------------- */}
          <aside className="lg:sticky lg:top-24">
            <div className="card p-5">
              <p className="label mb-1">Riderzpro price</p>
              <p className="font-display text-4xl font-extrabold tracking-[-0.04em] tnum">
                {lakh(car.price)}
              </p>
              {car.financing && (
                <p className="mt-1.5 text-sm text-ash tnum">
                  EMI from <span className="text-accent">{emiFrom(car.price)}</span> · finance available
                </p>
              )}

              <div className="mt-5 grid gap-3">
                <a
                  href={whatsapp(`${waMessage} I'd like to book a test drive.`)}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="btn btn-primary btn-block"
                >
                  Book a test drive
                  <Icon name="arrow" size={15} />
                </a>
                <div className="grid grid-cols-2 gap-3">
                  <a href={SITE.phoneHref} className="btn btn-outline">
                    <Icon name="phone" size={15} />
                    Call
                  </a>
                  <a
                    href={whatsapp(waMessage)}
                    target="_blank"
                    rel="noreferrer noopener"
                    className="btn btn-whatsapp"
                  >
                    <Icon name="whatsapp" size={16} />
                    WhatsApp
                  </a>
                </div>
                <a
                  href={whatsapp(`${waMessage} I'd like to make an offer of ₹`)}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="btn btn-outline btn-block"
                >
                  Make an offer
                </a>
                <a
                  href={whatsapp(`${waMessage} Please send me finance options.`)}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="btn btn-outline btn-block"
                >
                  Get finance
                </a>
                <InspectionRequest
                  vehicle={`${car.year} ${car.brand} ${car.model} ${car.variant}`}
                  city={car.city}
                />
              </div>

              {listing && (
                <p className="mt-4 border-t border-tint/8 pt-3 text-[11px] text-dim">
                  Last verified {formatIST(listing.lastVerifiedAt)}
                </p>
              )}

              <ul className="mt-5 space-y-2 border-t border-tint/8 pt-4 text-xs text-ash">
                <li className="flex gap-2">
                  <Icon name="check" size={13} className="mt-0.5 shrink-0 text-accent" />
                  Free home test drive across {car.city}
                </li>
                <li className="flex gap-2">
                  <Icon name="check" size={13} className="mt-0.5 shrink-0 text-accent" />
                  5-day / 300 km return window
                </li>
                <li className="flex gap-2">
                  <Icon name="check" size={13} className="mt-0.5 shrink-0 text-accent" />
                  RC transfer and documentation handled
                </li>
              </ul>
            </div>

            <div className="card mt-4 p-5">
              <p className="font-display text-sm font-extrabold uppercase">Want it modified first?</p>
              <p className="mt-2 text-xs text-ash">
                We can build this car before delivery and roll the cost into your finance. Lift kits,
                audio, PPF, interiors — quoted alongside the car.
              </p>
              <Link href="/build" className="btn btn-outline btn-sm btn-block mt-4">
                Configure a build
              </Link>
            </div>
          </aside>
        </div>
      </section>

      {listing && (
        <section className="section border-t border-tint/8 bg-carbon">
          <div className="shell">
            <BuildItNext listing={listing} />
          </div>
        </section>
      )}

      <section className="section border-t border-tint/8 bg-carbon">
        <div className="shell">
          <SectionHead eyebrow="Financing" title="WORK OUT THE EMI." />
          <EmiCalculator
            defaultPrice={car.price}
            context={`the ${car.year} ${car.brand} ${car.model}`}
          />
        </div>
      </section>

      {related.length > 0 && (
        <section className="section">
          <div className="shell">
            <SectionHead eyebrow="Similar cars" title="YOU MIGHT ALSO LIKE." href="/cars" />
            <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {related.map((c) => (
                <li key={c.slug}>
                  <CarCard car={c} />
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}
    </>
  );
}

function Spec({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-void p-4">
      <dt className="text-[10px] font-bold uppercase tracking-[0.14em] text-dim">{label}</dt>
      <dd className="mt-1 text-sm font-medium">{value}</dd>
    </div>
  );
}
