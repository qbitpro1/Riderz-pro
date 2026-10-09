import type { Metadata } from "next";
import { PageHero } from "@/components/layout/PageHero";
import { AudioBuilder } from "@/components/audio/AudioBuilder";
import { SectionHead } from "@/components/ui/Section";
import { Icon } from "@/components/ui/Icon";
import { Photo } from "@/components/ui/Photo";
import { Reveal } from "@/components/ui/Reveal";
import { ProductCard } from "@/components/shop/ProductCard";
import { ReviewCard } from "@/components/community/Cards";
import { Accordion } from "@/components/ui/Accordion";
import { AUDIO_PACKAGES } from "@/lib/data/services";
import { productsIn } from "@/lib/data/products";
import { REVIEWS } from "@/lib/data/community";
import { rupees } from "@/lib/format";
import { whatsapp } from "@/lib/data/site";

export const metadata: Metadata = {
  title: "Premium Car Audio — Component, DSP & Signature Builds",
  description:
    "Car audio done properly: component front stages, DSP tuning, subwoofers, sound deadening and fully custom builds. Four packages from ₹24,900. Measured, tuned and re-tuned free.",
  alternates: { canonical: "/audio" },
};

const FAQ = [
  {
    q: "Do I have to change my head unit?",
    a: "Usually not. Modern factory head units sound fine as a source — the weak links are the speakers, the amplification and the door acoustics. We take a high-level signal, de-equalise it in the DSP and leave your dashboard exactly as it was.",
  },
  {
    q: "Why does deadening cost so much?",
    a: "Because it takes six hours and eight square metres of butyl to do properly. A door skin is a resonating steel panel; until you damp it, every speaker you fit is fighting the car. It is the single highest-value part of any audio build.",
  },
  {
    q: "Will this drain my battery?",
    a: "Systems up to the Premium package run on the standard electrical system with a fused distribution block. Signature builds get a big-three upgrade and usually a second battery, sized to your listening habits.",
  },
  {
    q: "Can I upgrade in stages?",
    a: "Yes, and most people should. Start with the front stage and deadening, add amplification, then a subwoofer, then processing. We plan the wiring for the final system on day one so nothing gets thrown away.",
  },
];

export default function AudioPage() {
  const audioProducts = productsIn("audio");
  const audioReviews = REVIEWS.filter((r) => r.service.toLowerCase().includes("audio"));

  return (
    <>
      <PageHero
        eyebrow="Premium audio studio"
        title="HEAR EVERY DETAIL."
        blurb="Sound. Power. Control. From an honest first upgrade to an audiophile-grade custom build — measured on an RTA rig, tuned by ear, and re-tuned free within the first month."
        media="studioMonitors"
        actions={[
          { href: "#packages", label: "See packages", variant: "primary" },
          { href: "#builder", label: "Build your system", variant: "outline" },
        ]}
      />

      {/* packages ------------------------------------------------- */}
      <section className="section" id="packages">
        <div className="shell">
          <SectionHead
            eyebrow="Four packages"
            title="PICK YOUR LEVEL."
            blurb="Every package is a complete, installed system — parts, labour, deadening and tuning included."
          />
          <ul className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {AUDIO_PACKAGES.map((p, i) => (
              <li key={p.slug} id={p.slug} className="scroll-mt-24">
                <Reveal delay={i * 70} className="h-full">
                  <div
                    className={`card flex h-full flex-col p-5 ${
                      p.highlight ? "border-accent/45 bg-accent/6" : ""
                    }`}
                  >
                    {p.highlight && (
                      <span className="verified mb-3 self-start">Most popular</span>
                    )}
                    <p className="font-display text-xl font-extrabold uppercase tracking-[-0.02em]">
                      {p.name}
                    </p>
                    <p className="mt-1 text-xs text-accent">{p.tagline}</p>

                    <p className="mt-4 font-display text-2xl font-extrabold tnum">{rupees(p.price)}</p>
                    <p className="text-[11px] text-dim">{p.priceNote} · {p.duration}</p>

                    <ul className="mt-4 flex-1 space-y-2">
                      {p.includes.map((inc) => (
                        <li key={inc} className="flex items-start gap-2 text-xs leading-relaxed text-ash">
                          <Icon name="check" size={12} className="mt-0.5 shrink-0 text-accent" />
                          {inc}
                        </li>
                      ))}
                    </ul>

                    <p className="mt-4 border-t border-tint/8 pt-3 text-[11px] leading-relaxed text-dim">
                      Best for: {p.bestFor}
                    </p>

                    <a
                      href={whatsapp(`Hi Riderzpro, I'm interested in the ${p.name} audio package (${rupees(p.price)}). My car is: `)}
                      target="_blank"
                      rel="noreferrer noopener"
                      className={`btn btn-sm btn-block mt-4 ${p.highlight ? "btn-accent" : "btn-outline"}`}
                    >
                      Book this package
                    </a>
                  </div>
                </Reveal>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* builder -------------------------------------------------- */}
      <section className="section border-y border-tint/8 bg-carbon" id="builder">
        <div className="shell">
          <SectionHead
            eyebrow="Custom"
            title="BUILD YOUR AUDIO SYSTEM."
            blurb="Mix and match source, front stage, amplification, bass and acoustics. The total updates as you go."
          />
          <AudioBuilder />
        </div>
      </section>

      {/* method --------------------------------------------------- */}
      <section className="section">
        <div className="shell grid items-center gap-10 lg:grid-cols-2">
          <Reveal>
            <div className="relative aspect-[4/3] overflow-hidden bg-graphite">
              <Photo media="speakerCone" sizes="(min-width:1024px) 50vw, 100vw" />
              <div className="absolute inset-0 bg-gradient-to-t from-void/70 to-transparent" />
            </div>
          </Reveal>
          <Reveal delay={80}>
            <p className="eyebrow mb-3">How we tune</p>
            <h2 className="display-2">MEASURED, NOT GUESSED.</h2>
            <ol className="mt-6 space-y-4">
              {[
                { t: "Baseline sweep", b: "We measure the car as it is, with a calibrated mic at the driver's headrest." },
                { t: "Physical fixes first", b: "Deadening, sealing and driver placement — acoustics before electronics, always." },
                { t: "Time alignment", b: "Each driver is delayed to arrive at your ears together. This is what puts the stage on the dash." },
                { t: "EQ and levels", b: "Parametric correction to a target curve, then a final pass by ear on music you brought." },
                { t: "Re-tune at 30 days", b: "Drivers loosen up as they run in. We re-measure and re-tune free of charge." },
              ].map((s, i) => (
                <li key={s.t} className="flex gap-4">
                  <span className="font-display text-sm font-extrabold text-accent/50 tnum">
                    0{i + 1}
                  </span>
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

      {/* parts ---------------------------------------------------- */}
      <section className="section border-y border-tint/8 bg-carbon">
        <div className="shell">
          <SectionHead
            eyebrow="Audio store"
            title="BUY THE PARTS."
            href="/shop/audio"
            hrefLabel="All audio"
            blurb="Prefer to fit it yourself, or upgrade one piece at a time? Everything we install is on the shelf."
          />
          <ul className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4">
            {audioProducts.slice(0, 8).map((p) => (
              <li key={p.slug}>
                <ProductCard product={p} />
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="section">
        <div className="shell grid gap-10 lg:grid-cols-2 lg:items-start">
          <div>
            <SectionHead eyebrow="Questions" title="AUDIO FAQs." />
            <Accordion items={FAQ} />
          </div>
          <div>
            <SectionHead eyebrow="Owners" title="AFTER THE BUILD." />
            <ul className="grid gap-4">
              {audioReviews.map((r) => (
                <li key={r.name}>
                  <ReviewCard review={r} />
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>
    </>
  );
}
