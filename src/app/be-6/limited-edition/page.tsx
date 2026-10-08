import Link from "next/link";
import type { Metadata } from "next";
import { Reveal } from "@/components/ui/Reveal";
import { SectionHead } from "@/components/ui/Section";
import { Icon } from "@/components/ui/Icon";
import { VehicleImage, ImageCredit } from "@/components/be6/VehicleImage";
import { ConceptNotice, ProvenanceTag, StageTag, ValidationNotice } from "@/components/be6/Label";
import { ComparisonTable, ConceptModuleBlock, Pipeline, PrintedPartCard } from "@/components/be6/Blocks";
import { Waitlist } from "@/components/be6/Waitlist";
import { rupees } from "@/lib/format";
import {
  AI_MODES,
  AI_SEPARATION,
  ARMOR,
  DISCLAIMER,
  DISCLAIMER_LONG,
  DRIVE_MODES,
  DRIVE_MODES_NOTICE,
  EXPECTED_LAUNCH,
  LE_HEADLINE,
  NUMBERING,
  PIPELINE,
  QUANTUM_AREAS,
  QUANTUM_SHIELD,
  SECURITY_GLASS,
  UPGRADES,
  VOICE,
  colour,
  partsIn,
} from "@/lib/data/be6";

export const metadata: Metadata = {
  title: "MOTORBOTZ BE 6 Limited Edition — Independent Custom Concept",
  description:
    "The MOTORBOTZ BE 6 Limited Edition: an independent customization concept by MOTORBOTZ, not a factory Mahindra variant. Exterior, interior, 3D-printed parts, audio, security and AI concepts — each shown with its real development stage.",
  alternates: { canonical: "/be-6/limited-edition" },
  robots: { index: true, follow: true },
  openGraph: {
    title: "MOTORBOTZ BE 6 LIMITED EDITION — COMING SOON",
    description: "The BE 6, rebuilt without limits. An independent MOTORBOTZ concept.",
    url: "/be-6/limited-edition",
  },
};

/**
 * The Limited Edition concept page.
 *
 * Everything here is a concept. The disclaimer is not a footnote — it appears
 * above the fold, again at the foot, and beside every claim that could be read
 * as a product. Nothing on this page can be bought.
 */
export default function LimitedEditionPage() {
  const shell = colour("graphite-storm");
  const exterior = partsIn("exterior");
  const interior = partsIn("interior");

  return (
    <>
      {/* HERO ------------------------------------------------------------ */}
      <section className="relative flex min-h-[92svh] flex-col justify-end overflow-hidden bg-void">
        <div className="absolute inset-0">
          <div className="absolute inset-0 grid-lines opacity-25" />
          <div className="absolute inset-0 bg-[radial-gradient(120%_85%_at_50%_15%,rgba(217,167,96,0.16),transparent_60%)]" />
          <div className="absolute inset-x-0 top-[28%] mx-auto max-w-5xl px-4">
            <VehicleImage colour={shell} sizes="100vw" priority />
          </div>
          <div className="absolute inset-0 scrim" />
        </div>

        <div className="shell relative pb-12 pt-28 md:pb-20">
          <Link
            href="/be-6"
            className="rise mb-6 inline-flex items-center gap-2 font-display text-[0.625rem] uppercase tracking-[0.16em] text-ash transition-colors hover:text-accent"
          >
            <Icon name="arrow" size={13} className="rotate-180" />
            Back to the factory BE 6
          </Link>

          <p className="rise eyebrow !text-gold mb-4 flex items-center gap-2" style={{ animationDelay: "80ms" }}>
            <span className="h-1.5 w-1.5 bg-gold pulse-dot" />
            Independent concept · not a Mahindra variant
          </p>

          <h1 className="rise display-1 max-w-4xl" style={{ animationDelay: "160ms" }}>
            {LE_HEADLINE.name}
            <br />
            <span className="text-gold">{LE_HEADLINE.line}</span>
          </h1>

          <p
            className="rise mt-6 inline-flex items-center gap-2 border border-gold/45 bg-gold/10 px-5 py-2.5 font-display text-sm font-bold uppercase tracking-[0.22em] text-gold"
            style={{ animationDelay: "260ms" }}
          >
            {LE_HEADLINE.status}
          </p>

          <p className="rise mt-5 max-w-md text-base text-ash md:text-lg" style={{ animationDelay: "340ms" }}>
            {LE_HEADLINE.sub}
          </p>

          <div className="rise mt-7 max-w-2xl" style={{ animationDelay: "420ms" }}>
            <ConceptNotice long />
          </div>

          <div className="rise mt-6 flex flex-col gap-2.5 sm:flex-row" style={{ animationDelay: "500ms" }}>
            <a href="#waitlist" className="btn btn-accent !bg-gold !text-[#1a1204]">
              JOIN THE WAITLIST
            </a>
            <a href="#build-process" className="btn btn-outline">
              SEE THE BUILD PROCESS
            </a>
          </div>

          <ImageCredit className="mt-6 max-w-md" />
        </div>
      </section>

      {/* CONTENTS -------------------------------------------------------- */}
      <nav aria-label="Sections" className="border-y border-white/[0.06] bg-carbon">
        <div className="shell rail py-3">
          {[
            ["#exterior", "Exterior"],
            ["#interior", "Interior"],
            ["#technology", "Technology"],
            ["#security", "Security"],
            ["#audio", "Audio"],
            ["#ai", "AI"],
            ["#ppf", "PPF"],
            ["#wheels", "Wheels"],
            ["#lighting", "Lighting"],
            ["#build-process", "Build process"],
            ["#launch", "Expected launch"],
            ["#waitlist", "Waitlist"],
          ].map(([href, label]) => (
            <a key={href} href={href} className="chip shrink-0">
              {label}
            </a>
          ))}
        </div>
      </nav>

      {/* DESIGN PHILOSOPHY ------------------------------------------------ */}
      <section className="section">
        <div className="shell">
          <SectionHead
            eyebrow="Design philosophy"
            title="IT HAS TO LOOK MANUFACTURABLE."
            blurb="Futuristic, tactical, premium — but still a car you could get an insurance quote on. Anything we cannot imagine building, we do not draw."
          />
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {[
              ["MANUFACTURABLE", "Every part is drawn to be printed, finished and fitted — not rendered for a poster."],
              ["ROAD-USABLE", "Ground clearance, approach angles, sensor lines and door apertures all still have to work."],
              ["RESTRAINED", "One idea per surface. Visual clutter is how a concept stops looking expensive."],
              ["HONEST", "Every element carries its development stage. Nothing is presented as finished that is not."],
            ].map(([t, b], i) => (
              <Reveal key={t} delay={i * 50} className="card p-4">
                <h3 className="font-display text-xs font-extrabold uppercase tracking-[0.12em] text-gold">{t}</h3>
                <p className="mt-2 text-[0.6875rem] leading-relaxed text-ash">{b}</p>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* EXTERIOR --------------------------------------------------------- */}
      <Section id="exterior" eyebrow="01" title="EXTERIOR" blurb="MOTORBOTZ AERO — printed aero, trim and fender work, each with its version, material and stage.">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {exterior.map((p) => (
            <PrintedPartCard key={p.slug} part={p} />
          ))}
        </div>
      </Section>

      {/* INTERIOR --------------------------------------------------------- */}
      <Section
        id="interior"
        eyebrow="02"
        title="INTERIOR"
        blurb="MOTORBOTZ INTERIOR — storage, docks, trim and the Autoform upholstery catalogue."
        alt
      >
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {interior.map((p) => (
            <PrintedPartCard key={p.slug} part={p} />
          ))}
        </div>
        <UpgradeStrip group="interior" />
      </Section>

      {/* TECHNOLOGY ------------------------------------------------------- */}
      <Section
        id="technology"
        eyebrow="03"
        title="TECHNOLOGY"
        blurb="MOTORBOTZ QUANTUM SHIELD — a security architecture concept, not a claim about the car."
      >
        <ConceptModuleBlock module={QUANTUM_SHIELD} />

        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {QUANTUM_AREAS.map((a, i) => (
            <Reveal key={a.name} delay={i * 40} className="card p-4">
              <h3 className="font-display text-[0.6875rem] font-extrabold uppercase tracking-[0.1em] text-chalk">
                {a.name}
              </h3>
              <p className="mt-1.5 text-[0.6875rem] leading-relaxed text-ash">{a.body}</p>
            </Reveal>
          ))}
        </div>

        <p className="mt-4 max-w-3xl border-l-2 border-accent/40 pl-4 text-xs leading-relaxed text-ash">
          The phrase we use is <strong className="text-accent">&ldquo;designed around modern and
          post-quantum-ready security principles&rdquo;</strong>. We do not say unhackable, and we do not say
          impossible to breach, because no honest engineer would say either about anything.
        </p>
      </Section>

      {/* SECURITY --------------------------------------------------------- */}
      <Section
        id="security"
        eyebrow="04"
        title="SECURITY"
        blurb="MOTORBOTZ ARMOR and MOTORBOTZ SECURITY GLASS. The two concepts where careless wording would be dangerous."
        alt
      >
        <div className="space-y-4">
          <ConceptModuleBlock module={ARMOR} />
          <ConceptModuleBlock module={SECURITY_GLASS} />
        </div>
        <UpgradeStrip group="security" />
      </Section>

      {/* AUDIO ------------------------------------------------------------ */}
      <Section
        id="audio"
        eyebrow="05"
        title="AUDIO"
        blurb="MOTORBOTZ AUDIO 01 — built over the factory 16-speaker Harman Kardon, not ripped out of the car."
      >
        <div className="card mb-4 p-4">
          <div className="flex flex-wrap items-center gap-2">
            <ProvenanceTag provenance="MAHINDRA FACTORY" />
            <span className="text-xs text-ash">
              The BE 6 leaves the factory with a 16-speaker Harman Kardon system, Dolby Atmos and Dolby Vision
              through TEQ_Play. That is the baseline we measure against.
            </span>
          </div>
        </div>
        <UpgradeStrip group="audio" />
        <div className="mt-4 flex flex-wrap gap-1.5">
          {["Balanced", "Bass", "Audiophile", "Cinema", "Performance"].map((p) => (
            <span key={p} className="chip">
              {p}
            </span>
          ))}
        </div>
        <p className="mt-2 text-[0.6875rem] leading-relaxed text-dim">
          Tell us which of these you are, and we specify around it. The full configurator lives on our{" "}
          <Link href="/build-audio" className="text-accent underline underline-offset-2">
            audio builder
          </Link>
          .
        </p>
      </Section>

      {/* AI ---------------------------------------------------------------- */}
      <Section
        id="ai"
        eyebrow="06"
        title="AI"
        blurb="MOTORBOTZ AI DRIVE and MOTORBOTZ AI — concepts, and separate from Mahindra's factory AI."
        alt
      >
        <div className="card mb-4 border-accent/25 p-4 md:p-5">
          <p className="text-xs leading-relaxed text-ash">{AI_SEPARATION}</p>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {AI_MODES.map((m, i) => (
            <Reveal key={m.slug} delay={i * 30} className="card flex flex-col p-4">
              <div className="mb-2 flex items-start justify-between gap-2">
                <h3 className="font-display text-sm font-extrabold text-chalk">{m.name}</h3>
                <StageTag stage="CONCEPT" className="shrink-0" />
              </div>
              <p className="text-[0.6875rem] leading-relaxed text-ash">{m.blurb}</p>
              <ul className="mt-2.5 flex flex-wrap gap-1">
                {m.does.map((d) => (
                  <li key={d} className="chip !text-[0.5625rem]">
                    {d}
                  </li>
                ))}
              </ul>
              {m.factoryOverlap && (
                <p className="mt-auto border-t border-white/[0.07] pt-2.5 text-[0.625rem] leading-relaxed text-dim">
                  <strong className="text-chalk">Already in the factory car:</strong> {m.factoryOverlap}
                </p>
              )}
            </Reveal>
          ))}
        </div>

        {/* Voice */}
        <div className="card mt-4 p-4 md:p-5">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="font-display text-sm font-extrabold uppercase tracking-[0.1em] text-chalk">
              {VOICE.name}
            </h3>
            <StageTag stage={VOICE.status} />
          </div>
          <p className="mt-2 max-w-2xl text-xs leading-relaxed text-ash">{VOICE.intro}</p>
          <ul className="mt-3 space-y-1.5">
            {VOICE.examples.map((e) => (
              <li key={e} className="flex gap-2 text-xs text-ash">
                <span className="text-accent">&ldquo;</span>
                {e}
                <span className="text-accent">&rdquo;</span>
              </li>
            ))}
          </ul>
          <p className="mt-3 border-l-2 border-white/15 pl-3 text-[0.6875rem] leading-relaxed text-dim">
            {VOICE.caveat}
          </p>
        </div>

        {/* Drive modes */}
        <div className="mt-4">
          <h3 className="font-display text-sm font-extrabold uppercase tracking-[0.1em] text-chalk">
            MOTORBOTZ DRIVE MODES
          </h3>
          <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {DRIVE_MODES.map((d) => (
              <div key={d.slug} className="card p-4">
                <div className="flex items-center justify-between gap-2">
                  <h4 className="font-display text-xs font-extrabold tracking-[0.1em] text-gold">{d.name}</h4>
                  <StageTag stage="CONCEPT" />
                </div>
                <p className="mt-1.5 text-[0.6875rem] leading-relaxed text-ash">{d.blurb}</p>
              </div>
            ))}
          </div>
          <p className="mt-3 max-w-2xl text-[0.6875rem] leading-relaxed text-dim">{DRIVE_MODES_NOTICE}</p>
        </div>
      </Section>

      {/* PPF ---------------------------------------------------------------- */}
      <Section id="ppf" eyebrow="07" title="PPF" blurb="MOTORBOTZ SHIELD — the one part of this page that is entirely real today." alt>
        <UpgradeStrip group="shield" />
      </Section>

      {/* WHEELS -------------------------------------------------------------- */}
      <Section id="wheels" eyebrow="08" title="WHEELS" blurb="MOTORBOTZ WHEELS — with fitment validation, and a wheel we are refusing to sell yet.">
        <UpgradeStrip group="wheels" />
        <div className="mt-4 border border-white/10 bg-white/[0.02] p-4">
          <h3 className="font-display text-xs font-bold uppercase tracking-[0.16em] text-chalk">
            Why one of these has no price
          </h3>
          <p className="mt-2 max-w-2xl text-[0.6875rem] leading-relaxed text-ash">
            Mahindra has not published the SPORTEQ tyre sizes in the material we hold. Going up an inch without the
            factory size in writing means guessing at rolling circumference, load rating and clearance — on a heavy,
            fast, rear-wheel-drive car. We would rather lose the sale than validate a fitment we cannot check.
          </p>
        </div>
      </Section>

      {/* LIGHTING ------------------------------------------------------------- */}
      <Section id="lighting" eyebrow="09" title="CUSTOM LIGHTING" blurb="MOTORBOTZ LIGHT LAB — cabin, welcome and cargo light only." alt>
        <UpgradeStrip group="light-lab" />
        <ValidationNotice domains={["lighting", "road-legality"]} className="mt-4 max-w-2xl" />
      </Section>

      {/* BUILD PROCESS --------------------------------------------------------- */}
      <Section
        id="build-process"
        eyebrow="10"
        title="THE BUILD PROCESS"
        blurb="Seven stages from a sketch to a numbered part. This is the same board we work from internally."
      >
        <Pipeline />
        <div className="mt-6 grid gap-3 md:grid-cols-2">
          <div className="card p-4">
            <h3 className="font-display text-xs font-bold uppercase tracking-[0.16em] text-chalk">
              Where the concept actually is
            </h3>
            <dl className="mt-3 space-y-2">
              {PIPELINE.map((p) => {
                const n = [...exterior, ...interior].filter((x) => p.stages.includes(x.stage)).length;
                return (
                  <div key={p.slug} className="flex items-center justify-between gap-3">
                    <dt className="text-[0.6875rem] text-ash">{p.name}</dt>
                    <dd className="tnum text-[0.6875rem] font-semibold text-chalk">{n}</dd>
                  </div>
                );
              })}
            </dl>
          </div>
          <div className="card p-4">
            <h3 className="font-display text-xs font-bold uppercase tracking-[0.16em] text-chalk">
              Limited edition numbering
            </h3>
            <p className="tnum mt-3 font-display text-2xl font-extrabold text-gold">{NUMBERING.badgeFormat}</p>
            <p className="mt-2 text-[0.6875rem] leading-relaxed text-ash">{NUMBERING.note}</p>
          </div>
        </div>
      </Section>

      {/* COMPARISON -------------------------------------------------------------- */}
      <Section id="compare" eyebrow="11" title="FACTORY vs MOTORBOTZ" blurb="What is Mahindra's, what is ours, and what is still only an idea." alt>
        <ComparisonTable />
      </Section>

      {/* LAUNCH ------------------------------------------------------------------- */}
      <Section id="launch" eyebrow="12" title={EXPECTED_LAUNCH.headline.toUpperCase()} blurb={EXPECTED_LAUNCH.body}>
        <div className="card p-5 md:p-7">
          <p className="max-w-2xl text-sm leading-relaxed text-ash">
            We are not going to invent a launch quarter to make this page feel more finished. When the parts clear
            safety check and the security work has been reviewed by someone independent, there will be a date here.
          </p>
        </div>
      </Section>

      {/* WAITLIST ------------------------------------------------------------------ */}
      <section id="waitlist" className="section border-t border-gold/20 bg-[radial-gradient(110%_80%_at_50%_0%,rgba(217,167,96,0.1),transparent_60%)]">
        <div className="shell">
          <SectionHead
            eyebrow="Be first"
            title="JOIN THE MOTORBOTZ BE 6 WAITLIST"
            blurb="No deposit, no commitment, no vehicle held. You will hear from us when there is something real."
          />
          <Waitlist />

          <div className="mt-8 border-t border-white/[0.07] pt-6">
            <h3 className="font-display text-xs font-bold uppercase tracking-[0.16em] text-gold">
              Important — please read
            </h3>
            <p className="mt-2 max-w-3xl text-[0.6875rem] leading-relaxed text-ash">{DISCLAIMER_LONG}</p>
            <p className="mt-3 font-display text-[0.625rem] uppercase tracking-[0.14em] text-gold">{DISCLAIMER}</p>
          </div>
        </div>
      </section>
    </>
  );
}

/* ------------------------------------------------------------------ */

function Section({
  id,
  eyebrow,
  title,
  blurb,
  alt,
  children,
}: {
  id: string;
  eyebrow: string;
  title: string;
  blurb: string;
  alt?: boolean;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className={`section border-t border-white/[0.06] ${alt ? "bg-carbon" : ""}`}>
      <div className="shell">
        <SectionHead eyebrow={eyebrow} title={title} blurb={blurb} />
        {children}
      </div>
    </section>
  );
}

/** A compact read-only view of one upgrade group — the buyable half. */
function UpgradeStrip({ group }: { group: string }) {
  const items = UPGRADES.filter((u) => u.group === group);
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {items.map((u) => (
        <div key={u.slug} className="card flex flex-col p-4">
          <div className="mb-2 flex items-start justify-between gap-2">
            <h3 className="font-display text-xs font-extrabold uppercase tracking-[0.08em] text-chalk">{u.name}</h3>
            <span className="tnum shrink-0 text-xs font-semibold text-chalk">
              {u.price !== null ? rupees(u.price) : <span className="text-gold">{u.priceNote}</span>}
            </span>
          </div>
          <div className="mb-2 flex flex-wrap gap-1.5">
            <ProvenanceTag provenance={u.provenance} />
            <StageTag stage={u.stage} />
          </div>
          <p className="text-[0.6875rem] leading-relaxed text-ash">{u.blurb}</p>
          {u.validation && u.validation.length > 0 && (
            <ValidationNotice domains={u.validation} className="mt-auto pt-0 [&]:mt-3" />
          )}
        </div>
      ))}
    </div>
  );
}
