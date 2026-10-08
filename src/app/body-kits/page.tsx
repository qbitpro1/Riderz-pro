import type { Metadata } from "next";
import { PageHero } from "@/components/layout/PageHero";
import { SectionHead } from "@/components/ui/Section";
import { Icon } from "@/components/ui/Icon";
import { Photo } from "@/components/ui/Photo";
import { Reveal } from "@/components/ui/Reveal";
import { Accordion } from "@/components/ui/Accordion";
import { BODY_KIT_SERVICES, FACELIFT_CONVERSIONS } from "@/lib/data/services";
import { rupees } from "@/lib/format";
import { whatsapp } from "@/lib/data/site";

export const metadata: Metadata = {
  title: "Body Kits & Facelift Conversions",
  description:
    "Turn a 2020 Creta into a 2024 Creta, a 2016 Fortuner into a Legender. Bumper, grille, headlamp, DRL and tail lamp conversions, body kits and custom paint at Motorbotz.",
  alternates: { canonical: "/body-kits" },
};

const FAQ = [
  {
    q: "Will the panel gaps look factory?",
    a: "That is the whole job. We test-fit every panel before paint, shim the brackets, and check gaps with a feeler gauge against the untouched side of the car. If a kit cannot be made to fit properly, we tell you before you pay for it.",
  },
  {
    q: "How do you match the paint?",
    a: "We spray to your VIN colour code and then blend into the adjacent panels rather than hard-edging at the joint. Two-pack clear, oven cured. Metallics and pearls get a spray-out card checked against your car in daylight first.",
  },
  {
    q: "Do I need to inform the RTO?",
    a: "Cosmetic conversions that do not change the vehicle's structure, dimensions or lighting compliance generally do not require endorsement. Lighting changes must remain compliant — we fit lamps with correct beam patterns and aim them on a beam setter. We advise on your specific case in writing.",
  },
  {
    q: "What happens to my original parts?",
    a: "They come back to you, boxed. Most owners keep them for resale — putting a car back to standard is often worth more than the kit at exit.",
  },
];

export default function BodyKitsPage() {
  return (
    <>
      <PageHero
        eyebrow="Body kits & facelifts"
        title="MAKE YOUR CAR LOOK NEW AGAIN."
        blurb="A facelift conversion costs a fraction of changing cars, and there is no depreciation hit, no loan, no paperwork. Same car, current face."
        media="chromeGrille"
        actions={[
          { href: "#conversions", label: "See conversions", variant: "primary" },
          { href: whatsapp("Hi Motorbotz, I want a facelift quote. My car is: "), label: "Get facelift quote", variant: "outline", external: true },
        ]}
      />

      {/* picker ---------------------------------------------------- */}
      <section className="section" id="conversions">
        <div className="shell">
          <SectionHead
            eyebrow="Car → current model → desired look"
            title="POPULAR CONVERSIONS."
            blurb="Pick where you are and where you want to be. Prices below are complete — parts, paint to your colour code, fitting and alignment."
          />
          <ul className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {FACELIFT_CONVERSIONS.map((f, i) => (
              <li key={f.slug} id={f.slug} className="scroll-mt-24">
                <Reveal delay={i * 60} className="h-full">
                  <article className="card flex h-full flex-col">
                    <div className="relative aspect-[16/10] overflow-hidden bg-graphite">
                      <Photo media={f.image} sizes="(min-width:1024px) 33vw, (min-width:640px) 50vw, 92vw" className="opacity-85" />
                      <div className="absolute inset-0 scrim-soft" />
                      {f.popular && <span className="absolute right-3 top-3 chip border-gold/40 bg-gold/12 text-gold">Popular</span>}
                    </div>
                    <div className="flex flex-1 flex-col p-5">
                      <p className="text-xs text-dim">{f.from}</p>
                      <p className="mt-1 flex items-center gap-2 font-display text-lg font-extrabold uppercase leading-tight">
                        <Icon name="arrow" size={14} className="shrink-0 text-accent" />
                        {f.to}
                      </p>
                      <p className="mt-4 font-display text-2xl font-extrabold text-accent tnum">
                        {rupees(f.price)}
                      </p>
                      <p className="text-[11px] text-dim">Estimated starting price · {f.duration}</p>

                      <ul className="mt-4 flex-1 space-y-1.5">
                        {f.includes.map((inc) => (
                          <li key={inc} className="flex items-start gap-2 text-xs text-ash">
                            <Icon name="check" size={12} className="mt-0.5 shrink-0 text-accent" />
                            {inc}
                          </li>
                        ))}
                      </ul>

                      <a
                        href={whatsapp(`Hi Motorbotz, I want a quote for: ${f.from} → ${f.to}.`)}
                        target="_blank"
                        rel="noreferrer noopener"
                        className="btn btn-outline btn-sm btn-block mt-5"
                      >
                        Get facelift quote
                      </a>
                    </div>
                  </article>
                </Reveal>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="section border-y border-white/8 bg-carbon">
        <div className="shell grid gap-8 lg:grid-cols-2 lg:items-center">
          <Reveal>
            <figure className="card overflow-hidden">
              <div className="relative aspect-[4/3] bg-graphite md:aspect-[16/10]">
                <Photo media="frontGrilleRed" sizes="(min-width:1024px) 50vw, 100vw" />
                <div className="absolute inset-0 bg-gradient-to-t from-void/80 via-transparent to-transparent" />
                <span className="absolute bottom-3 left-3 chip bg-void/75">Front-end conversion</span>
              </div>
              <figcaption className="p-4 text-xs leading-relaxed text-ash">
                A front-end conversion replaces the bumper, grille, headlamps and DRL bar as one
                assembly, painted to your VIN colour code. Ask us for the before-and-after set from
                any conversion we've completed on your model — we photograph every one.
              </figcaption>
            </figure>
          </Reveal>
          <Reveal delay={80}>
            <p className="eyebrow mb-3">Everything we convert</p>
            <h2 className="display-2">NOT JUST BUMPERS.</h2>
            <p className="mt-4 max-w-lg text-sm leading-relaxed text-ash">
              We do full front and rear conversions, but also single-item work — a grille swap, a DRL
              upgrade, a set of exhaust tips. Small changes, done properly, often read better than a
              full kit.
            </p>
            <ul className="mt-6 flex flex-wrap gap-2">
              {BODY_KIT_SERVICES.map((s) => (
                <li key={s} className="chip">
                  {s}
                </li>
              ))}
            </ul>
          </Reveal>
        </div>
      </section>

      <section className="section">
        <div className="shell grid gap-8 lg:grid-cols-2 lg:items-start">
          <div>
            <SectionHead eyebrow="Questions" title="FACELIFT FAQs." />
            <Accordion items={FAQ} />
          </div>
          <div className="card p-6">
            <p className="font-display text-lg font-extrabold uppercase">Your car isn't listed?</p>
            <p className="mt-2 text-sm text-ash">
              We convert far more models than we list here — and we build custom kits in fibreglass
              and carbon when nothing exists off the shelf. Send us the car and the look you want.
            </p>
            <a
              href={whatsapp("Hi Motorbotz, I want a facelift / body kit quote. My car is:  and the look I want is: ")}
              target="_blank"
              rel="noreferrer noopener"
              className="btn btn-whatsapp btn-block mt-5"
            >
              <Icon name="whatsapp" size={16} />
              Get facelift quote
            </a>
          </div>
        </div>
      </section>
    </>
  );
}
