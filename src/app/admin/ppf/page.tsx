import type { Metadata } from "next";
import Link from "next/link";
import { Icon } from "@/components/ui/Icon";
import { PPF_BRANDS, PPF_FILMS, isPublishable, verifiedFieldCount } from "@/lib/ppf/films";
import { PPF_PACKAGES, TIER_RATES, VEHICLE_CLASSES, quote } from "@/lib/ppf/coverage";
import { PPF_LANDINGS } from "@/lib/ppf/landings";
import { GUIDE } from "@/lib/ppf/guide";
import { rupees } from "@/lib/format";

export const metadata: Metadata = {
  title: "PPF Division — Internal Dashboard",
  description: "Internal PPF catalogue readiness, lead pipeline and pricing configuration.",
  robots: { index: false, follow: false, nocache: true },
};

/** The lead lifecycle a PPF enquiry moves through. */
const PIPELINE = [
  { stage: "NEW LEAD", blurb: "Quote configured on the site or sent on WhatsApp." },
  { stage: "CONTACTED", blurb: "Reached the customer, confirmed the vehicle and coverage." },
  { stage: "INSPECTION BOOKED", blurb: "Slot held at a studio. Free, about twenty minutes." },
  { stage: "QUOTE SENT", blurb: "Firm itemised quote after reading the paint. Valid 15 days." },
  { stage: "BOOKED", blurb: "Deposit taken, installation date held, film ordered." },
  { stage: "INSTALLATION", blurb: "Vehicle in the dust-controlled room." },
  { stage: "COMPLETED", blurb: "Handover, aftercare brief, warranty documentation issued." },
];

const LEAD_FIELDS = [
  "Customer", "Phone", "Vehicle", "Package", "Film", "Estimated price", "Final quote",
  "Appointment", "Status", "Assigned salesperson", "Installation date", "Payment", "Completion",
];

export default function PpfAdminPage() {
  const publishable = PPF_FILMS.filter(isPublishable);
  const totalFields = PPF_FILMS.reduce((n, f) => n + verifiedFieldCount(f).total, 0);
  const verifiedFields = PPF_FILMS.reduce((n, f) => n + verifiedFieldCount(f).verified, 0);

  return (
    <section className="section pt-24 md:pt-32">
      <div className="shell">
        <p className="eyebrow mb-3">Internal · not indexed</p>
        <h1 className="display-2">PPF DIVISION</h1>
        <p className="mt-4 max-w-2xl text-sm leading-relaxed text-ash">
          Catalogue readiness, pricing configuration and the lead pipeline. Lead and installation
          counters read zero because no CRM is connected yet — the pipeline below is the definition
          those counters will populate.
        </p>

        {/* readiness ------------------------------------------------- */}
        <ul className="mt-8 grid grid-cols-2 gap-3 md:grid-cols-4">
          {[
            { label: "Films catalogued", value: PPF_FILMS.length },
            { label: "Publishable", value: publishable.length },
            { label: "Specs verified", value: `${verifiedFields}/${totalFields}` },
            { label: "Brands", value: PPF_BRANDS.length },
            { label: "Packages", value: PPF_PACKAGES.length },
            { label: "Landing pages", value: PPF_LANDINGS.length },
            { label: "Guide articles", value: GUIDE.length },
            { label: "Vehicle classes priced", value: VEHICLE_CLASSES.length },
          ].map((s) => (
            <li key={s.label} className="card p-4">
              <p className="font-display text-2xl font-extrabold tnum">{s.value}</p>
              <p className="mt-1 text-[11px] uppercase tracking-[0.12em] text-dim">{s.label}</p>
            </li>
          ))}
        </ul>

        <div className="card mt-6 border-gold/30 bg-gold/6 p-5">
          <p className="flex items-center gap-2 font-display text-sm font-extrabold uppercase text-gold">
            <Icon name="shield" size={16} />
            Blocking catalogue launch
          </p>
          <ul className="mt-3 space-y-1.5 text-xs leading-relaxed text-chalk/85">
            <li>
              • No supplier account with XPEL or Garware. Films show as &ldquo;to order&rdquo; and we
              hold no purchase rate, so the per-sq-ft figures on site are our own retail estimates.
            </li>
            <li>
              • No technical data sheets. Thickness, gloss level, clarity, self-healing and hydrophobic
              performance are all unpublished — {totalFields - verifiedFields} fields across the range.
            </li>
            <li>
              • No image authorisation. Every film currently shows an honest &ldquo;no product
              image&rdquo; state rather than a stock photo of a different product.
            </li>
            <li>
              • Warranty data is verified for XPEL only, from xpel.com/warranty-information.
            </li>
          </ul>
        </div>

        {/* film readiness -------------------------------------------- */}
        <h2 className="display-3 mt-12">FILM CATALOGUE</h2>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[900px] border-collapse text-sm">
            <thead>
              <tr className="border-b border-tint/12 text-left text-[10px] uppercase tracking-[0.14em] text-dim">
                <th className="p-2.5">SKU</th>
                <th className="p-2.5">Brand</th>
                <th className="p-2.5">Tier</th>
                <th className="p-2.5">Finish</th>
                <th className="p-2.5 text-center">Specs</th>
                <th className="p-2.5 text-center">Warranty</th>
                <th className="p-2.5 text-center">Images</th>
                <th className="p-2.5">Availability</th>
                <th className="p-2.5">Published</th>
              </tr>
            </thead>
            <tbody>
              {PPF_FILMS.map((film) => {
                const cov = verifiedFieldCount(film);
                const live = isPublishable(film);
                return (
                  <tr key={film.sku} className="border-b border-tint/8 align-top">
                    <td className="p-2.5 text-xs">
                      <Link href={`/ppf/films/${film.slug}`} className="text-accent hover:underline">
                        {film.sku}
                      </Link>
                    </td>
                    <td className="p-2.5 text-xs text-ash">{PPF_BRANDS.find((b) => b.id === film.brandId)?.name}</td>
                    <td className="p-2.5 text-xs text-ash">{TIER_RATES[film.tier].label}</td>
                    <td className="p-2.5 text-xs text-ash">{film.finish}</td>
                    <td className="p-2.5 text-center text-xs tnum">
                      <span className={cov.verified >= 6 ? "text-accent" : "text-gold"}>
                        {cov.verified}/{cov.total}
                      </span>
                    </td>
                    <td className="p-2.5 text-center text-xs">
                      {film.warrantyYears.value ? (
                        <span className="text-accent">{film.warrantyYears.value}y</span>
                      ) : (
                        <span className="text-danger">✗</span>
                      )}
                    </td>
                    <td className="p-2.5 text-center text-xs">
                      {film.images.length > 0 ? <span className="text-accent">{film.images.length}</span> : <span className="text-danger">✗</span>}
                    </td>
                    <td className="p-2.5 text-[11px] text-dim">{film.availability.replace(/_/g, " ").toLowerCase()}</td>
                    <td className="p-2.5">
                      <span className={`chip ${live ? "border-accent/35 text-accent" : "border-gold/35 text-gold"}`}>
                        {live ? "Live" : "Held"}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* pipeline -------------------------------------------------- */}
        <h2 className="display-3 mt-12">LEAD PIPELINE</h2>
        <p className="mt-2 max-w-3xl text-sm text-ash">
          Every quote configured on the site becomes a lead carrying the full configuration, so the
          salesperson opens the conversation knowing the car, the coverage and the number the customer
          already saw.
        </p>
        <ol className="mt-4 grid gap-px overflow-hidden border border-tint/8 bg-tint/8 sm:grid-cols-2 lg:grid-cols-4">
          {PIPELINE.map((s, i) => (
            <li key={s.stage} className="bg-void p-4">
              <p className="font-display text-lg font-extrabold text-accent/40 tnum">0{i + 1}</p>
              <p className="mt-1.5 font-display text-xs font-extrabold uppercase tracking-[0.08em]">{s.stage}</p>
              <p className="mt-1.5 text-[11px] leading-relaxed text-ash">{s.blurb}</p>
              <p className="mt-2 font-display text-lg font-extrabold text-dim tnum">0</p>
            </li>
          ))}
        </ol>
        <p className="mt-3 text-xs text-dim">
          Lead record: {LEAD_FIELDS.join(" · ")}.
        </p>

        {/* pricing --------------------------------------------------- */}
        <h2 className="display-3 mt-12">PRICING CONFIGURATION</h2>
        <div className="mt-4 grid gap-4 lg:grid-cols-2">
          <div className="card p-5">
            <p className="label">Installed rate per sq ft</p>
            <dl className="space-y-2 text-sm">
              {(Object.keys(TIER_RATES) as (keyof typeof TIER_RATES)[]).map((t) => (
                <div key={t} className="flex items-center justify-between gap-4">
                  <dt className="text-ash">{TIER_RATES[t].label}</dt>
                  <dd className="tnum">
                    ₹{TIER_RATES[t].min} – ₹{TIER_RATES[t].max}
                  </dd>
                </div>
              ))}
            </dl>
            <p className="mt-3 text-[11px] leading-relaxed text-dim">
              Riderzpro retail rates, not supplier cost. Once a purchase rate exists, set margin here
              rather than editing the rates by hand.
            </p>
          </div>

          <div className="card p-5">
            <p className="label">Vehicle class factors</p>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="text-left text-[10px] uppercase tracking-[0.12em] text-dim">
                    <th className="py-1.5">Class</th>
                    <th className="py-1.5 text-right">Area</th>
                    <th className="py-1.5 text-right">Complexity</th>
                    <th className="py-1.5 text-right">Full body</th>
                  </tr>
                </thead>
                <tbody>
                  {VEHICLE_CLASSES.map((c) => (
                    <tr key={c.id} className="border-t border-tint/8">
                      <td className="py-1.5">{c.label}</td>
                      <td className="py-1.5 text-right tnum">×{c.areaFactor}</td>
                      <td className="py-1.5 text-right tnum">×{c.complexityFactor}</td>
                      <td className="py-1.5 text-right tnum">
                        {rupees(quote({ sizeClass: c.id, tier: "premium", areaIds: [], fullBody: true, paintCondition: "excellent" }).low)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="card mt-12 p-5">
          <p className="font-display text-sm font-extrabold uppercase">Storefront</p>
          <div className="mt-4 flex flex-wrap gap-3">
            <Link href="/ppf" className="btn btn-outline btn-sm">
              PPF landing
            </Link>
            <Link href="/ppf/quote" className="btn btn-outline btn-sm">
              Quote calculator
            </Link>
            <Link href="/ppf/films" className="btn btn-outline btn-sm">
              Film catalogue
            </Link>
            <Link href="/ppf/guide" className="btn btn-outline btn-sm">
              Guide
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
