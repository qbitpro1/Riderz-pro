import Link from "next/link";
import type { Metadata } from "next";
import { SectionHead } from "@/components/ui/Section";
import { Icon } from "@/components/ui/Icon";
import { Be6BuildProvider } from "@/components/be6/BuildState";
import { Configurator } from "@/components/be6/Configurator";
import { Ladder } from "@/components/be6/Ladder";
import { Builder } from "@/components/be6/Builder";
import { Waitlist } from "@/components/be6/Waitlist";
import { StickyBar } from "@/components/be6/StickyBar";
import { VehicleImage, ImageCredit } from "@/components/be6/VehicleImage";
import { lakh } from "@/lib/format";
import { BAAS_FROM, BE6, PRICE_FROM, colour } from "@/lib/data/be6";

export const metadata: Metadata = {
  title: "Mahindra BE 6 — Every Variant, Configured, Then Built Your Way",
  description:
    "Configure any Mahindra BE 6 SPORTEQ — variant, battery, colour, price — verified against Mahindra's official brochure, then build it your way with Riderzpro PPF, audio, interior and 3D-printed parts.",
  alternates: { canonical: "/be-6" },
  openGraph: {
    title: "THE BE 6. REIMAGINED.",
    description: "Every factory variant, a build configurator, and the first RIDERZPRO Limited Edition concept.",
    url: "/be-6",
  },
};

/**
 * The BE 6 flagship page.
 *
 * Deliberately short. It does five things — show the car, configure it,
 * compare the range, build it your way, take an enquiry — and hands everything
 * else to a page of its own. The detail was not thrown away; it moved to
 * /be-6/specifications and /be-6/limited-edition.
 */
export default function Be6Page() {
  const hero = colour("stealth-black");

  return (
    <Be6BuildProvider>
      {/* 1 — HERO ------------------------------------------------------- */}
      <section id="be6-hero" data-theme="dark" className="relative flex min-h-[92svh] flex-col justify-end overflow-hidden bg-void">
        <div className="absolute inset-0">
          <div className="absolute inset-0 grid-lines opacity-25" />
          <div className="absolute inset-0 bg-[radial-gradient(120%_80%_at_50%_20%,rgba(92,225,255,0.13),transparent_62%)]" />
          <div className="absolute inset-x-0 top-1/2 mx-auto max-w-5xl -translate-y-[42%] px-3">
            <VehicleImage colour={hero} sizes="100vw" priority />
          </div>
          <div className="absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-void via-void/85 to-transparent" />
        </div>

        <div className="shell relative pb-10 pt-28 md:pb-16">
          <p className="rise eyebrow mb-3 flex items-center gap-2" style={{ animationDelay: "80ms" }}>
            <span className="h-1.5 w-1.5 bg-accent pulse-dot" />
            Mahindra BE 6 SPORTEQ
          </p>

          <h1 className="rise display-1 max-w-4xl" style={{ animationDelay: "160ms" }}>
            THE BE 6.
            <br />
            REIMAGINED.
          </h1>

          <p className="rise mt-4 max-w-md text-base text-ash" style={{ animationDelay: "260ms" }}>
            Meet the first RIDERZPRO Limited Edition concept.
          </p>

          <div className="rise mt-6 flex flex-col gap-2.5 sm:flex-row sm:flex-wrap" style={{ animationDelay: "340ms" }}>
            <a href="#choose" className="btn btn-primary">
              EXPLORE BE 6
            </a>
            <a href="#build" className="btn btn-outline">
              BUILD YOUR BE 6
            </a>
            <Link href="/be-6/limited-edition" className="btn btn-outline !border-gold/45 !text-gold">
              RIDERZPRO EDITION — COMING SOON
            </Link>
          </div>

          <dl className="rise mt-8 grid max-w-2xl grid-cols-2 gap-x-6 gap-y-4 sm:grid-cols-4" style={{ animationDelay: "440ms" }}>
            {[
              ["From", lakh(PRICE_FROM)],
              ["With BaaS from", lakh(BAAS_FROM)],
              ["Certified range", "up to 683 km"],
              ["Power", "up to 210 kW"],
            ].map(([k, v]) => (
              <div key={k}>
                <dt className="font-display text-[0.5625rem] uppercase tracking-[0.16em] text-dim">{k}</dt>
                <dd className="tnum mt-0.5 font-display text-base font-extrabold text-chalk">{v}</dd>
              </div>
            ))}
          </dl>

          <ImageCredit className="mt-5 max-w-md" />
        </div>
      </section>

      {/* 2 — CHOOSE YOUR BE 6 -------------------------------------------- */}
      <section id="choose" className="section border-t border-tint/[0.06]">
        <div className="shell">
          <SectionHead
            eyebrow="Mahindra factory vehicle"
            title="CHOOSE YOUR BE 6"
            blurb="Variant, battery, wheel, colour, price. Only combinations Mahindra actually sells can be reached."
          />
          <Configurator />

          <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border border-tint/10 bg-tint/[0.02] p-4">
            <p className="max-w-lg text-[0.6875rem] leading-relaxed text-dim">
              Verified against Mahindra&apos;s official BE 6 SPORTEQ brochure on {BE6.dataVerified}. Prices are
              ex-showroom and exclude the wall charger.
            </p>
            <Link href="/be-6/specifications" className="btn btn-outline btn-sm shrink-0">
              FULL SPECIFICATIONS
              <Icon name="arrow" size={14} />
            </Link>
          </div>
        </div>
      </section>

      {/* 3 — COMPARE ------------------------------------------------------ */}
      <section id="compare" className="section border-t border-tint/[0.06] bg-carbon">
        <div className="shell">
          <SectionHead
            eyebrow="Mahindra factory vehicle"
            title="BASE TO TOP"
            blurb="Four rungs from ONE to FOUR — and the question everyone actually has: what does the extra money buy?"
          />
          <Ladder />
        </div>
      </section>

      {/* 4 — BUILD -------------------------------------------------------- */}
      <section id="build" className="section border-t border-tint/[0.06]">
        <div className="shell">
          <SectionHead
            eyebrow="Riderzpro"
            title="NOW BUILD IT YOUR WAY."
            blurb="The factory car stays exactly as Mahindra built it. This is what we add on top."
          />
          <Builder />
        </div>
      </section>

      {/* 5 — LIMITED EDITION ---------------------------------------------- */}
      <section className="relative overflow-hidden border-y border-gold/20 bg-[radial-gradient(110%_90%_at_50%_10%,rgba(217,167,96,0.12),transparent_62%)] py-14 md:py-20">
        <div className="shell text-center">
          <p className="eyebrow !text-gold">Coming soon</p>
          <h2 className="display-2 mt-3">
            RIDERZPRO BE 6
            <br />
            <span className="text-gold">LIMITED EDITION</span>
          </h2>
          <p className="mx-auto mt-4 max-w-lg text-sm text-ash md:text-base">
            The BE 6, rebuilt without limits. Custom aero, 3D-printed parts, audio, security and AI — each shown with
            its real development stage.
          </p>
          <p className="mx-auto mt-4 max-w-xl text-[0.6875rem] leading-relaxed text-dim">
            An independent RIDERZPRO concept. Not a factory Mahindra variant, and not endorsed or certified by
            Mahindra.
          </p>
          <Link href="/be-6/limited-edition" className="btn btn-accent mt-6 !bg-gold !text-on-gold">
            ENTER THE CONCEPT
            <Icon name="arrow" size={15} />
          </Link>
        </div>
      </section>

      {/* 6 — WAITLIST ------------------------------------------------------ */}
      <section id="quote" className="section">
        <div className="shell">
          <SectionHead
            eyebrow="Be first"
            title="BE FIRST."
            blurb="Join the RIDERZPRO BE 6 waitlist. We come back when there is something real to come back with."
          />
          <Waitlist />
        </div>
      </section>

      <StickyBar />
    </Be6BuildProvider>
  );
}
