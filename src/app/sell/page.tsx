import type { Metadata } from "next";
import { PageHero } from "@/components/layout/PageHero";
import { SellFlow } from "@/components/sell/SellFlow";
import { SectionHead } from "@/components/ui/Section";
import { Icon } from "@/components/ui/Icon";
import { Accordion } from "@/components/ui/Accordion";
import { whatsapp } from "@/lib/data/site";

export const metadata: Metadata = {
  title: "Sell Your Car — Free Valuation & Same-Day Payment",
  description:
    "Sell your used car to Riderzpro. Free valuation, free 200-point inspection at your home, payment before RC transfer, and full documentation support.",
  alternates: { canonical: "/sell" },
};

const STEPS = [
  { n: "01", title: "Enter registration number", body: "We pull make, model, variant and year from VAHAN." },
  { n: "02", title: "Select your vehicle", body: "Confirm the variant — it can be worth up to 18% of the price." },
  { n: "03", title: "Upload photos", body: "Four exteriors, the odometer, and the interior is enough to start." },
  { n: "04", title: "Enter kilometres", body: "Honest numbers get honest offers. We verify against the OBD anyway." },
  { n: "05", title: "Enter condition", body: "Tell us about dents, repaints and anything pending." },
  { n: "06", title: "Get estimated valuation", body: "An indicative range in under sixty seconds, on this page." },
  { n: "07", title: "Schedule inspection", body: "At your home or any Riderzpro garage. Around 45 minutes, free." },
  { n: "08", title: "Receive offer", body: "A firm written offer, valid for seven days. No pressure, no haggling." },
];

const TRUST = [
  { title: "Transparent valuation", body: "You see the same data we do — comparable sales, age, kilometres and condition adjustments." },
  { title: "Physical inspection", body: "200 points, at your doorstep, at no cost, with the report shared with you in full." },
  { title: "Documentation assistance", body: "Form 29, Form 30, NOC, insurance transfer and loan closure handled by our team." },
  { title: "Secure payment", body: "Funds transferred to your account before the RC transfer is filed. Never the other way round." },
  { title: "Ownership transfer support", body: "We track the transfer with the RTO and send you the updated RC when it lands." },
];

const FAQ = [
  {
    q: "Do I have to pay anything to sell my car?",
    a: "No. Valuation, inspection, paperwork and RC transfer are all free. We make our margin on the resale, not on you.",
  },
  {
    q: "What if my car still has a loan on it?",
    a: "We settle the outstanding loan directly with your lender, collect the NOC, and pay you the balance. It typically adds five to seven working days.",
  },
  {
    q: "Will you buy a modified car?",
    a: "Yes — modified cars are a large part of what we do. Bring the invoices and the original parts if you have them; both push the offer up.",
  },
  {
    q: "How fast can I get paid?",
    a: "For a clean, loan-free car with papers in order, payment is usually the same day as the inspection.",
  },
];

export default function SellPage() {
  return (
    <>
      <PageHero
        eyebrow="Sell your car"
        title="SELL YOUR CAR WITHOUT THE HEADACHE."
        blurb="No dealer round-trips, no lowball surprises at the door, no chasing the RTO. One valuation, one inspection, one payment."
        media="openRoadRear"
        actions={[{ href: "#valuation", label: "Get my car valued", variant: "primary" }]}
      />

      <section className="section" id="valuation">
        <div className="shell">
          <SectionHead
            eyebrow="60-second valuation"
            title="GET MY CAR VALUED."
            blurb="An indicative range right here, then a firm written offer after a free inspection."
          />
          <SellFlow />
        </div>
      </section>

      <section className="section border-y border-tint/8 bg-carbon">
        <div className="shell">
          <SectionHead eyebrow="How it works" title="EIGHT STEPS. NO SURPRISES." />
          <ol className="grid gap-px overflow-hidden border border-tint/8 bg-tint/8 sm:grid-cols-2 lg:grid-cols-4">
            {STEPS.map((s) => (
              <li key={s.n} className="bg-carbon p-5">
                <p className="font-display text-2xl font-extrabold text-accent/40 tnum">{s.n}</p>
                <p className="mt-2 font-display text-sm font-extrabold uppercase">{s.title}</p>
                <p className="mt-1.5 text-xs leading-relaxed text-ash">{s.body}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="section">
        <div className="shell grid gap-8 lg:grid-cols-[1fr_1.2fr]">
          <SectionHead
            eyebrow="Why sell to us"
            title="THE PART EVERYONE ELSE SKIPS."
            blurb="Selling a car in India goes wrong in the paperwork, not the price. That is the part we take off your hands."
          />
          <ul className="grid gap-3 sm:grid-cols-2">
            {TRUST.map((t) => (
              <li key={t.title} className="card p-4">
                <p className="flex items-center gap-2 font-display text-sm font-extrabold uppercase">
                  <Icon name="shield" size={15} className="text-accent" />
                  {t.title}
                </p>
                <p className="mt-2 text-xs leading-relaxed text-ash">{t.body}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="section border-t border-tint/8 bg-carbon">
        <div className="shell grid gap-8 lg:grid-cols-2 lg:items-start">
          <div>
            <SectionHead eyebrow="Questions" title="BEFORE YOU DECIDE." />
            <Accordion items={FAQ} />
          </div>
          <div className="card p-6">
            <p className="font-display text-lg font-extrabold uppercase">Prefer to just talk?</p>
            <p className="mt-2 text-sm text-ash">
              Send us the registration number on WhatsApp. We will come back with a range and a slot for
              a free inspection, usually within twenty minutes.
            </p>
            <a
              href={whatsapp("Hi Riderzpro, I want to sell my car. Registration number: ")}
              target="_blank"
              rel="noreferrer noopener"
              className="btn btn-whatsapp btn-block mt-5"
            >
              <Icon name="whatsapp" size={16} />
              Sell my car on WhatsApp
            </a>
          </div>
        </div>
      </section>
    </>
  );
}
