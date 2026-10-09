import type { Metadata } from "next";
import Link from "next/link";
import { PageHero } from "@/components/layout/PageHero";
import { SectionHead } from "@/components/ui/Section";
import { Icon } from "@/components/ui/Icon";
import { Reveal } from "@/components/ui/Reveal";
import { InventoryUploader } from "@/components/partners/InventoryUploader";
import { PartnerSignup } from "@/components/partners/PartnerSignup";
import {
  DEALER_PACKAGES,
  DEALER_TARGET_REGIONS,
  SUPPLY_CHANNELS,
  VERIFICATION_TIERS,
  type VerificationTier,
} from "@/lib/inventory/network";
import { FIELD_REQUIREMENTS, UPLOAD_TEMPLATE_HEADERS } from "@/lib/inventory/pipeline";
import { FRESHNESS_THRESHOLDS } from "@/lib/inventory/dealers";

export const metadata: Metadata = {
  title: "List Your Cars on Riderzpro — Dealer & Fleet Partners",
  description:
    "Put your used-car stock in front of Riderzpro buyers. Upload CSV, Excel, XML or JSON, sync a Google Sheet, or push through our dealer API. Free to join, no lock-in.",
  alternates: { canonical: "/partners" },
};

const STEPS = [
  { n: "01", t: "Register", b: "Business name, GSTIN and contact. One working day to approve." },
  { n: "02", t: "Upload inventory", b: "Whatever your system exports — CSV, Excel, XML, JSON, or a Google Sheet link." },
  { n: "03", t: "We validate", b: "Every row normalised and checked. You see exactly what was accepted and why." },
  { n: "04", t: "Cars go live", b: "Listings appear on the marketplace with your dealership named." },
  { n: "05", t: "Receive leads", b: "Buyer enquiries come to you on WhatsApp, with the vehicle attached." },
  { n: "06", t: "Keep it current", b: "Mark a car SOLD and it comes off the site. Stop updating and we hide your stock." },
];

export default function PartnersPage() {
  const tiers = Object.entries(VERIFICATION_TIERS) as [VerificationTier, (typeof VERIFICATION_TIERS)[VerificationTier]][];

  return (
    <>
      <PageHero
        eyebrow="Riderzpro Vehicle Network"
        title="HAVE CARS TO SELL?"
        blurb="Put your inventory in front of Riderzpro buyers. Upload the file your system already exports — we do the rest. Free to join, and you keep your customers."
        media="suvDesertTrail"
        actions={[
          { href: "#upload", label: "Try an upload", variant: "primary" },
          { href: "#register", label: "Register", variant: "outline" },
        ]}
      >
        <ul className="mt-8 flex flex-wrap gap-2">
          {["CSV", "Excel", "XML", "JSON", "Google Sheets", "REST API"].map((f) => (
            <li key={f} className="chip">
              {f}
            </li>
          ))}
        </ul>
      </PageHero>

      {/* why -------------------------------------------------------- */}
      <section className="border-b border-tint/8 bg-carbon">
        <ul className="shell grid grid-cols-2 gap-px bg-tint/8 px-0 lg:grid-cols-4">
          {[
            { icon: "spark" as const, t: "Sell more cars", b: "Buyers who came for a build, and stayed to buy the car." },
            { icon: "wrench" as const, t: "Workshop rates", b: "Partner pricing on PPF, audio, detailing and modification." },
            { icon: "shield" as const, t: "You keep the customer", b: "Enquiries come to you. We are not competing for your buyer." },
            { icon: "check" as const, t: "No cost to start", b: "Free tier, unlimited listings, no card." },
          ].map((f, i) => (
            <li key={f.t} className="bg-carbon">
              <Reveal delay={i * 60} className="h-full">
                <div className="flex h-full flex-col gap-3 p-5">
                  <Icon name={f.icon} size={22} className="text-accent" />
                  <p className="font-display text-sm font-extrabold uppercase">{f.t}</p>
                  <p className="text-xs leading-snug text-ash">{f.b}</p>
                </div>
              </Reveal>
            </li>
          ))}
        </ul>
      </section>

      {/* upload ----------------------------------------------------- */}
      <section className="section scroll-mt-24" id="upload">
        <div className="shell">
          <SectionHead
            eyebrow="Bulk upload"
            title="TRY IT WITH YOUR REAL STOCK LIST."
            blurb="Drop your export in and see what we make of it. Nothing is published — this is a dry run, and you do not need an account to try it."
          />
          <InventoryUploader />
        </div>
      </section>

      {/* fields ----------------------------------------------------- */}
      <section className="section border-y border-tint/8 bg-carbon">
        <div className="shell grid gap-8 lg:grid-cols-[1fr_1.1fr] lg:items-start">
          <div>
            <SectionHead
              eyebrow="What we need"
              title="TEN FIELDS. THAT'S IT."
              blurb="We match your column names automatically — 'KM Driven', 'Odometer' and 'Run' all land in the same place. If a column is missing we tell you which one."
            />
            <ul className="grid gap-2 sm:grid-cols-2">
              {FIELD_REQUIREMENTS.map((f) => (
                <li key={f.field} className="flex items-center gap-2 border border-tint/8 bg-tint/2 p-2.5 text-xs">
                  <Icon
                    name={f.required ? "check" : "plus"}
                    size={13}
                    className={f.required ? "text-accent" : "text-dim"}
                  />
                  <span className={f.required ? "" : "text-ash"}>{f.field}</span>
                  {!f.required && <span className="ml-auto text-[10px] text-dim">optional</span>}
                </li>
              ))}
            </ul>
          </div>

          <div className="card p-5">
            <p className="label">Example header row</p>
            <div className="overflow-x-auto">
              <code className="block whitespace-pre text-[11px] leading-relaxed text-ash">
                {UPLOAD_TEMPLATE_HEADERS.join(",")}
              </code>
            </div>
            <p className="mt-4 text-xs leading-relaxed text-dim">
              You do not have to use these names. This is what a clean export looks like — but if your
              DMS calls it &ldquo;Sale Price&rdquo; and &ldquo;Regn Year&rdquo;, we handle that.
            </p>
            <div className="mt-4 border-t border-tint/8 pt-4">
              <p className="label">Photographs</p>
              <p className="text-xs leading-relaxed text-ash">
                Put your image URLs in one cell, separated by <code className="text-accent">|</code>. They
                must be your own photographs on your own hosting, over HTTPS. We reject links to other
                marketplaces&apos; CDNs — those pictures are not yours to give us, and republishing them
                would put both of us in the wrong.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* channels --------------------------------------------------- */}
      <section className="section">
        <div className="shell">
          <SectionHead
            eyebrow="Six ways in"
            title="HOWEVER YOU KEEP YOUR STOCK."
            blurb="Every DMS on the market exports CSV or XML for syndication. We take the file you already produce rather than asking you to build an integration."
          />
          <ul className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            {SUPPLY_CHANNELS.filter((c) => c.id !== "riderzpro-owned").map((channel, i) => (
              <li key={channel.id}>
                <Reveal delay={(i % 3) * 55} className="h-full">
                  <div className="card flex h-full flex-col p-5">
                    <div className="flex items-start justify-between gap-3">
                      <p className="font-display text-base font-extrabold uppercase">{channel.name}</p>
                      <span
                        className={`chip shrink-0 ${
                          channel.status === "LIVE"
                            ? "border-accent/35 bg-accent/12 text-accent"
                            : channel.status === "READY_TO_ONBOARD"
                              ? "border-tint/20"
                              : "border-gold/35 text-gold"
                        }`}
                      >
                        {channel.status === "LIVE" ? "Live" : channel.status === "READY_TO_ONBOARD" ? "Ready" : "Needs agreement"}
                      </span>
                    </div>
                    <p className="mt-2 flex-1 text-xs leading-relaxed text-ash">{channel.blurb}</p>
                    <p className="mt-3 flex flex-wrap gap-1.5">
                      {channel.intake.map((f) => (
                        <span key={f} className="chip text-[10px]">
                          {f}
                        </span>
                      ))}
                    </p>
                    <p className="mt-3 border-t border-tint/8 pt-3 text-[11px] text-dim">{channel.requirement}</p>
                  </div>
                </Reveal>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* API -------------------------------------------------------- */}
      <section className="section border-y border-tint/8 bg-carbon">
        <div className="shell grid gap-8 lg:grid-cols-2 lg:items-start">
          <div>
            <SectionHead
              eyebrow="Dealer API"
              title="PUSH IT STRAIGHT FROM YOUR SYSTEM."
              blurb="If you have a website or a DMS that can call an endpoint, you never touch a spreadsheet again."
            />
            <ul className="space-y-2.5">
              {[
                "Create and update vehicles in batches of up to 5,000",
                "Price updates — we record the previous price so a genuine drop shows as one",
                "Mark sold, and the car leaves the marketplace immediately",
                "Update photos and availability independently",
                "60 requests a minute, keys issued and rotated from the portal",
              ].map((t) => (
                <li key={t} className="flex items-start gap-2.5 text-sm text-ash">
                  <Icon name="check" size={15} className="mt-0.5 shrink-0 text-accent" />
                  {t}
                </li>
              ))}
            </ul>
          </div>

          <div className="card overflow-x-auto p-5">
            <p className="label">POST /api/dealer/inventory</p>
            <pre className="whitespace-pre text-[11px] leading-relaxed text-ash">{`curl -X POST https://riderzpro.com/api/dealer/inventory \\
  -H "Authorization: Bearer <your key>" \\
  -H "Content-Type: application/json" \\
  -d '{
    "action": "create",
    "vehicles": [{
      "stockId": "RP-1042",
      "make": "Hyundai",
      "model": "Creta",
      "variant": "SX(O) 1.5 Turbo DCT",
      "year": 2023,
      "fuel": "Petrol",
      "transmission": "Automatic",
      "km": 21400,
      "price": 1725000,
      "city": "Gurugram",
      "images": ["https://yourdealership.in/1042-front.jpg"]
    }]
  }'`}</pre>
            <p className="mt-4 text-[11px] text-dim">
              Full contract at <code className="text-accent">GET /api/dealer/inventory</code>.
            </p>
          </div>
        </div>
      </section>

      {/* trust tiers ------------------------------------------------ */}
      <section className="section">
        <div className="shell">
          <SectionHead
            eyebrow="Trust system"
            title="FOUR BADGES. FOUR DIFFERENT MEANINGS."
            blurb="Buyers can tell them apart, which is what makes any of them worth having. Two are earned by you; two are awarded by us after we have physically seen the car."
          />
          <ul className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
            {tiers.map(([key, tier]) => (
              <li key={key} className="card p-5">
                <span
                  className={`chip ${
                    tier.tone === "accent"
                      ? "border-accent/35 bg-accent/12 text-accent"
                      : tier.tone === "gold"
                        ? "border-gold/35 bg-gold/10 text-gold"
                        : "border-tint/20"
                  }`}
                >
                  {tier.label}
                </span>
                <p className="mt-3 text-xs leading-relaxed text-ash">{tier.means}</p>
                <p className="mt-3 text-[10px] uppercase tracking-[0.12em] text-dim">
                  {tier.rank <= 1 ? "Set by dealer verification" : "Awarded by Riderzpro inspection"}
                </p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* packages --------------------------------------------------- */}
      <section className="section border-y border-tint/8 bg-carbon">
        <div className="shell">
          <SectionHead eyebrow="Packages" title="SELL MORE CARS. BUILD MORE CUSTOMERS." blurb="Start free. Nothing to pay while we are both proving this works." />
          <ul className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {DEALER_PACKAGES.map((pkg, i) => (
              <li key={pkg.id}>
                <div className={`card flex h-full flex-col p-5 ${i === 0 ? "border-accent/40 bg-accent/6" : ""}`}>
                  {i === 0 && <span className="verified mb-3 self-start">Start here</span>}
                  <p className="font-display text-lg font-extrabold uppercase">{pkg.name}</p>
                  <p className="mt-1 text-xs text-accent">{pkg.price}</p>
                  <p className="mt-3 text-xs leading-relaxed text-ash">{pkg.blurb}</p>
                  <ul className="mt-4 flex-1 space-y-1.5">
                    {pkg.features.map((f) => (
                      <li key={f} className="flex items-start gap-2 text-xs text-ash">
                        <Icon name="check" size={12} className="mt-0.5 shrink-0 text-accent" />
                        {f}
                      </li>
                    ))}
                  </ul>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* process + freshness ---------------------------------------- */}
      <section className="section">
        <div className="shell">
          <SectionHead eyebrow="How onboarding works" title="LIVE IN A DAY." />
          <ol className="grid gap-px overflow-hidden border border-tint/8 bg-tint/8 sm:grid-cols-2 lg:grid-cols-3">
            {STEPS.map((s) => (
              <li key={s.n} className="bg-void p-5">
                <p className="font-display text-2xl font-extrabold text-accent/40 tnum">{s.n}</p>
                <p className="mt-2 font-display text-sm font-extrabold uppercase">{s.t}</p>
                <p className="mt-1.5 text-xs leading-relaxed text-ash">{s.b}</p>
              </li>
            ))}
          </ol>

          <div className="card mt-6 p-5">
            <p className="font-display text-sm font-extrabold uppercase">Keeping inventory honest</p>
            <p className="mt-2 max-w-2xl text-sm text-ash">
              Nothing damages a marketplace faster than cars that sold last month. If you stop
              updating, we act on it rather than leaving your stock up.
            </p>
            <ul className="mt-4 grid gap-2 sm:grid-cols-3">
              <li className="border border-tint/8 bg-tint/2 p-3 text-xs">
                <span className="font-display text-lg font-extrabold text-ash tnum">{FRESHNESS_THRESHOLDS.needsVerification} days</span>
                <span className="mt-1 block text-dim">Marked &ldquo;needs verification&rdquo;</span>
              </li>
              <li className="border border-tint/8 bg-tint/2 p-3 text-xs">
                <span className="font-display text-lg font-extrabold text-gold tnum">{FRESHNESS_THRESHOLDS.stale} days</span>
                <span className="mt-1 block text-dim">Marked stale, ranked down</span>
              </li>
              <li className="border border-tint/8 bg-tint/2 p-3 text-xs">
                <span className="font-display text-lg font-extrabold text-danger tnum">{FRESHNESS_THRESHOLDS.hide} days</span>
                <span className="mt-1 block text-dim">Temporarily hidden from the site</span>
              </li>
            </ul>
          </div>
        </div>
      </section>

      {/* register + regions ----------------------------------------- */}
      <section className="section border-t border-tint/8 bg-carbon">
        <div className="shell grid gap-8 lg:grid-cols-[1.1fr_1fr] lg:items-start">
          <PartnerSignup />

          <div>
            <SectionHead eyebrow="Where we are recruiting" title="DELHI NCR FIRST." />
            <ul className="space-y-4">
              {DEALER_TARGET_REGIONS.map((region) => (
                <li key={region.region} className="card p-4">
                  <p className="flex items-center gap-2 font-display text-sm font-extrabold uppercase">
                    <span className="font-display text-xs text-accent tnum">{region.priority}</span>
                    {region.region}
                  </p>
                  <p className="mt-2 flex flex-wrap gap-1.5">
                    {region.cities.map((c) => (
                      <span key={c} className="chip text-[10px]">
                        {c}
                      </span>
                    ))}
                  </p>
                </li>
              ))}
            </ul>

            <div className="card mt-4 p-5">
              <p className="font-display text-sm font-extrabold uppercase">Selling one car, not forty?</p>
              <p className="mt-2 text-xs text-ash">
                Private owners go through Sell Your Car. We value it, inspect it, and either buy it,
                take it on consignment or place it with a partner dealer.
              </p>
              <Link href="/sell" className="btn btn-outline btn-sm btn-block mt-4">
                Sell your car
              </Link>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
