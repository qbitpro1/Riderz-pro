import type { Metadata } from "next";
import { PageHero } from "@/components/layout/PageHero";
import { SectionHead } from "@/components/ui/Section";
import { Icon } from "@/components/ui/Icon";
import { Photo } from "@/components/ui/Photo";
import { Reveal } from "@/components/ui/Reveal";
import { Accordion } from "@/components/ui/Accordion";
import { ReviewCard } from "@/components/community/Cards";
import { INTERIOR_SERVICES } from "@/lib/data/services";
import { REVIEWS } from "@/lib/data/community";
import { rupees } from "@/lib/format";
import { whatsapp } from "@/lib/data/site";

export const metadata: Metadata = {
  title: "Custom Car Interiors — Leather, Alcantara, Captain Seats & Ambient Lighting",
  description:
    "Custom leather and alcantara interiors, diamond stitching, ventilated and heated seats, captain seat conversions, electric recliners, ambient lighting and luxury SUV conversions.",
  alternates: { canonical: "/interiors" },
};

const FAQ = [
  {
    q: "Is it safe to retrim seats with side airbags?",
    a: "Only if the cover is built for it. We use tear seams on the bolster of any seat with a side airbag, stitched with breakaway thread to the original specification. We will not retrim a seat in a way that blocks an airbag, whatever the customer asks for.",
  },
  {
    q: "Leather or alcantara?",
    a: "Leather for seats you get in and out of daily — it wears better under abrasion. Alcantara for the roof lining, pillars and door inserts where it looks and feels far more expensive and never sees a jeans rivet.",
  },
  {
    q: "Will captain seats fit my car?",
    a: "On most 7-seat SUVs and MUVs, yes, using OE-pattern floor mounts. We check the floor pan, seat belt anchorages and third-row access before quoting, and we never cut a structural member to make seats fit.",
  },
  {
    q: "How long is the car with you?",
    a: "A steering wheel or ambient lighting job is a day. A full leather interior is seven to ten days because everything is pattern-cut, stitched and fitted in our own trim shop rather than sent out.",
  },
];

export default function InteriorsPage() {
  const interiorReviews = REVIEWS.filter((r) => r.service.toLowerCase().includes("interior"));

  return (
    <>
      <PageHero
        eyebrow="Custom interiors studio"
        title="THE BEST SEAT IN THE CAR."
        blurb="Leather, alcantara, diamond stitching, ventilation, captain conversions and lighting — pattern-cut and trimmed in our own workshop, not outsourced to a market shop."
        media="cockpitScreen"
        actions={[
          { href: "#services", label: "Design my interior", variant: "primary" },
          { href: "/audio", label: "Add audio", variant: "outline" },
        ]}
      />

      <section className="section" id="services">
        <div className="shell">
          <SectionHead
            eyebrow="What we build"
            title="EVERY SURFACE YOU TOUCH."
            blurb="Prices are starting points for a mid-size SUV. The final quote depends on hide count, stitch pattern and how much of the cabin comes apart."
          />
          <ul className="grid gap-px overflow-hidden border border-white/8 bg-white/8 sm:grid-cols-2 lg:grid-cols-3">
            {INTERIOR_SERVICES.map((s, i) => (
              <li key={s.name} className="bg-void p-5">
                <Reveal delay={(i % 3) * 50}>
                  <p className="font-display text-sm font-extrabold uppercase">{s.name}</p>
                  <p className="mt-1.5 text-xs text-ash">{s.note}</p>
                  <p className="mt-3 font-display text-lg font-extrabold text-accent tnum">
                    from {rupees(s.from)}
                  </p>
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
              <Photo media="steeringNight" sizes="(min-width:1024px) 50vw, 100vw" />
              <div className="absolute inset-0 bg-gradient-to-t from-void/70 to-transparent" />
            </div>
          </Reveal>
          <Reveal delay={80}>
            <p className="eyebrow mb-3">Luxury SUV conversion</p>
            <h2 className="display-2">TURN ROW TWO INTO FIRST CLASS.</h2>
            <p className="mt-4 text-sm leading-relaxed text-ash">
              Electric recliners with memory, automatic footrests, a partition console with a fridge,
              roof-mounted or headrest screens, alcantara headliner and concealed ambient runs. Built
              on Fortuner, Innova, Carnival, Gloster, XUV700 and every luxury SUV we've been asked for.
            </p>
            <ul className="mt-6 grid gap-2.5 sm:grid-cols-2">
              {[
                "Electric recliners with memory and lumbar",
                "Automatic deployable footrests",
                "Centre console with fridge and charging",
                "Roof or headrest entertainment screens",
                "Alcantara headliner and pillars",
                "Full acoustic treatment for a quiet cabin",
              ].map((p) => (
                <li key={p} className="flex items-start gap-2.5 text-sm text-chalk/85">
                  <Icon name="check" size={15} className="mt-0.5 shrink-0 text-accent" />
                  {p}
                </li>
              ))}
            </ul>
            <a
              href={whatsapp("Hi Motorbotz, I want a luxury interior conversion. My car is: ")}
              target="_blank"
              rel="noreferrer noopener"
              className="btn btn-accent mt-7"
            >
              <Icon name="whatsapp" size={16} />
              Design my interior
            </a>
          </Reveal>
        </div>
      </section>

      <section className="section">
        <div className="shell grid gap-10 lg:grid-cols-2 lg:items-start">
          <div>
            <SectionHead eyebrow="Questions" title="INTERIOR FAQs." />
            <Accordion items={FAQ} />
          </div>
          <div>
            <SectionHead eyebrow="Owners" title="AFTER THE REBUILD." />
            <ul className="grid gap-4">
              {interiorReviews.map((r) => (
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
