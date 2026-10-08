import type { Metadata } from "next";
import { PageHero } from "@/components/layout/PageHero";
import { SectionHead } from "@/components/ui/Section";
import { Icon } from "@/components/ui/Icon";
import { Photo } from "@/components/ui/Photo";
import { Reveal } from "@/components/ui/Reveal";
import { Accordion } from "@/components/ui/Accordion";
import { ProductCard } from "@/components/shop/ProductCard";
import { PERFORMANCE_DISCLAIMER, PERFORMANCE_SERVICES } from "@/lib/data/services";
import { productsIn } from "@/lib/data/products";
import { rupees } from "@/lib/format";
import { whatsapp } from "@/lib/data/site";

export const metadata: Metadata = {
  title: "Performance Tuning — ECU Remap, Exhaust, Intake & Brakes",
  description:
    "Stage 1 and Stage 2 ECU remapping on our dyno, performance exhaust and intake, intercoolers, cooling, big brake kits and coilovers. All work within Central Motor Vehicles Rules.",
  alternates: { canonical: "/performance" },
};

const FAQ = [
  {
    q: "Is remapping safe for my engine?",
    a: "A custom map written on a dyno, with torque limiters respected and exhaust gas temperatures monitored, is safe. A generic file bought online for ₹5,000 is not. We log the run, keep peak pressures and temperatures inside the manufacturer's own limits, and hand you the data.",
  },
  {
    q: "Will it void my warranty?",
    a: "A manufacturer can decline a powertrain claim if they detect a modified map. We archive your original map and can restore it, but we will not pretend that removes the risk. If your car is under warranty, we will tell you honestly whether it is worth waiting.",
  },
  {
    q: "Do you remove DPFs or catalytic converters?",
    a: "No. Ever. Removing emissions hardware is illegal, fails PUC and is a road-safety and public-health issue. If that is what you are after, we are not the workshop for you.",
  },
  {
    q: "How loud will the exhaust be?",
    a: "Within CMVR limits, measured. We build resonated systems that are civil at cruise and only get vocal on throttle. If you want something louder than the law allows, we will build it for track use only and say so on the invoice.",
  },
];

export default function PerformancePage() {
  const perfProducts = productsIn("performance");

  return (
    <>
      <PageHero
        eyebrow="Performance garage"
        title="MORE POWER. MORE CONTROL."
        blurb="Custom maps written on our dyno with your fuel. Intake, exhaust, cooling, braking and suspension set up as a package — because power without the rest is just noise."
        media="engineBay"
        actions={[
          { href: "#services", label: "See what we do", variant: "primary" },
          { href: whatsapp("Hi Motorbotz, I want more power from my "), label: "Talk to the tuner", variant: "outline", external: true },
        ]}
      />

      <section className="section" id="services">
        <div className="shell">
          <SectionHead
            eyebrow="Services"
            title="WHAT WE ACTUALLY DO."
            blurb="Every job ends with a road test and a printed dyno sheet. If a modification does not measure, we do not charge for it."
          />
          <ul className="divide-y divide-white/8 border-y border-white/8">
            {PERFORMANCE_SERVICES.map((s, i) => (
              <li key={s.name}>
                <Reveal delay={Math.min(i * 30, 200)}>
                  <div className="flex flex-wrap items-center justify-between gap-3 py-4">
                    <div className="min-w-0">
                      <p className="font-display text-base font-extrabold uppercase tracking-[-0.01em]">
                        {s.name}
                      </p>
                      <p className="mt-0.5 text-xs text-ash">{s.gain}</p>
                    </div>
                    <p className="shrink-0 font-display text-lg font-extrabold text-accent tnum">
                      from {rupees(s.from)}
                    </p>
                  </div>
                </Reveal>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="section border-y border-white/8 bg-carbon">
        <div className="shell grid items-center gap-10 lg:grid-cols-2">
          <Reveal>
            <div className="relative aspect-[4/3] overflow-hidden bg-graphite">
              <Photo media="exhaustSpray" sizes="(min-width:1024px) 50vw, 100vw" />
              <div className="absolute inset-0 bg-gradient-to-t from-void/70 to-transparent" />
            </div>
          </Reveal>
          <Reveal delay={80}>
            <p className="eyebrow mb-3">Our approach</p>
            <h2 className="display-2">HONEST POWER.</h2>
            <ol className="mt-6 space-y-4">
              {[
                { t: "Health check first", b: "Compression, boost, fuelling and clutch condition. We refuse maps on tired engines." },
                { t: "Baseline run", b: "Three dyno pulls on your fuel, in your ambient temperature. That is your real starting number." },
                { t: "Custom map", b: "Written live on the car, respecting torque limiters and EGT. Never a generic file." },
                { t: "Supporting hardware", b: "Cooling, brakes and rubber sized to the new output before we hand it back." },
                { t: "Documentation", b: "Before and after sheets, the map archive, and a written note of anything requiring RTO endorsement." },
              ].map((s, i) => (
                <li key={s.t} className="flex gap-4">
                  <span className="font-display text-sm font-extrabold text-accent/50 tnum">0{i + 1}</span>
                  <span>
                    <span className="block font-display text-sm font-extrabold uppercase">{s.t}</span>
                    <span className="mt-1 block text-sm text-ash">{s.b}</span>
                  </span>
                </li>
              ))}
            </ol>
          </Reveal>
        </div>
      </section>

      <section className="section">
        <div className="shell">
          <SectionHead eyebrow="Performance store" title="PARTS WE FIT." href="/shop/performance" hrefLabel="All performance" />
          <ul className="grid grid-cols-2 gap-3 md:grid-cols-3 md:gap-4 lg:grid-cols-6">
            {perfProducts.map((p) => (
              <li key={p.slug}>
                <ProductCard product={p} sizes="(min-width:1024px) 16vw, (min-width:768px) 33vw, 46vw" />
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* compliance ------------------------------------------------ */}
      <section className="section border-y border-white/8 bg-carbon">
        <div className="shell">
          <div className="card border-gold/30 bg-gold/6 p-6">
            <p className="flex items-center gap-2 font-display text-base font-extrabold uppercase text-gold">
              <Icon name="shield" size={18} />
              Legal compliance
            </p>
            <p className="mt-3 max-w-3xl text-sm leading-relaxed text-chalk/85">{PERFORMANCE_DISCLAIMER}</p>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="shell grid gap-8 lg:grid-cols-2 lg:items-start">
          <div>
            <SectionHead eyebrow="Questions" title="TUNING FAQs." />
            <Accordion items={FAQ} />
          </div>
          <div className="card p-6">
            <p className="font-display text-lg font-extrabold uppercase">Book a dyno session</p>
            <p className="mt-2 text-sm text-ash">
              Come in for a baseline run before you decide anything. You leave with a printed sheet and
              an honest opinion about whether your car is worth tuning at all.
            </p>
            <a
              href={whatsapp("Hi Motorbotz, I'd like to book a dyno session. My car is: ")}
              target="_blank"
              rel="noreferrer noopener"
              className="btn btn-whatsapp btn-block mt-5"
            >
              <Icon name="whatsapp" size={16} />
              Book the dyno
            </a>
          </div>
        </div>
      </section>
    </>
  );
}
