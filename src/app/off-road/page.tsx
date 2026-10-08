import type { Metadata } from "next";
import Link from "next/link";
import { PageHero } from "@/components/layout/PageHero";
import { SectionHead } from "@/components/ui/Section";
import { Icon } from "@/components/ui/Icon";
import { Photo } from "@/components/ui/Photo";
import { Reveal } from "@/components/ui/Reveal";
import { ProductCard } from "@/components/shop/ProductCard";
import { BuildCard } from "@/components/community/Cards";
import { Accordion } from "@/components/ui/Accordion";
import { OFFROAD_GROUPS } from "@/lib/data/services";
import { productsIn } from "@/lib/data/products";
import { BUILDS } from "@/lib/data/community";
import { rupees } from "@/lib/format";
import { whatsapp } from "@/lib/data/site";

export const metadata: Metadata = {
  title: "Off-Road Accessories & 4x4 Builds — Lift Kits, Recovery, Expedition",
  description:
    "Off-road builds for Thar, Gurkha, Fortuner, Jimny, Scorpio N, Wrangler, Hilux, V-Cross and Defender. Lift kits, skid plates, rock sliders, winches, roof racks and expedition gear.",
  alternates: { canonical: "/off-road" },
};

const PLATFORMS = [
  { name: "Mahindra Thar", slug: "thar" },
  { name: "Force Gurkha", slug: "gurkha" },
  { name: "Toyota Fortuner", slug: "fortuner" },
  { name: "Jeep Wrangler", slug: "wrangler" },
  { name: "Isuzu V-Cross", slug: "d-max-v-cross" },
  { name: "Scorpio N", slug: "scorpio-n" },
  { name: "Maruti Jimny", slug: "jimny" },
  { name: "Toyota Hilux", slug: "hilux" },
  { name: "Land Rover Defender", slug: "defender" },
];

const FAQ = [
  {
    q: "Is a lift kit legal in India?",
    a: "Suspension changes that alter the vehicle's specification can require RTO endorsement, and rules vary by state. We use kits that keep the geometry, braking and lighting within spec, correct the headlamp aim afterwards, and tell you in writing what your state requires before we start. We do not fit anything we cannot make road-legal.",
  },
  {
    q: "Will a lift ruin the ride and the driveline?",
    a: "A spacer kit will. A proper kit with progressive springs, matched dampers, corrected bump stops, extended brake lines and a repositioned panhard rod usually rides better than stock, especially loaded. That is the difference in the price.",
  },
  {
    q: "Do I need a winch if I only do light trails?",
    a: "Honestly, no. Recovery boards, a kinetic rope, rated recovery points and a compressor will get you out of ninety percent of situations for a tenth of the cost. We would rather sell you the right gear than the expensive gear.",
  },
  {
    q: "How long does a full expedition build take?",
    a: "Four to six weeks for a complete rig — suspension, protection, recovery, rack, tent, drawers and electrical. We schedule it so the car is only off the road for the fabrication and wiring phases.",
  },
];

export default function OffRoadPage() {
  const offroadProducts = productsIn("off-road");
  const offroadBuilds = BUILDS.filter((b) => b.tag === "Off-Road");

  return (
    <>
      <PageHero
        eyebrow="Off-road garage"
        title="BUILT FOR THE UNPAVED."
        blurb="Suspension, protection, recovery and expedition hardware — rated, mounted to the chassis, and proven on cars that have actually been to Ladakh and back."
        media="defenderSaltFlat"
        size="lg"
        actions={[
          { href: "#gear", label: "Build my off-road SUV", variant: "primary" },
          { href: "/shop/off-road", label: "Shop off-road", variant: "outline" },
        ]}
      >
        <ul className="mt-8 flex flex-wrap gap-2">
          {PLATFORMS.map((p) => (
            <li key={p.slug}>
              <Link href={`/accessories/${p.slug}`} className="chip hover:border-accent hover:text-accent">
                {p.name}
              </Link>
            </li>
          ))}
        </ul>
      </PageHero>

      {/* four pillars ---------------------------------------------- */}
      <section className="section" id="gear">
        <div className="shell space-y-10">
          {OFFROAD_GROUPS.map((g, i) => (
            <Reveal key={g.slug} delay={i * 50}>
              <div className="grid items-center gap-6 lg:grid-cols-[1fr_1.2fr] lg:gap-10">
                <div className={`relative aspect-[16/10] overflow-hidden bg-graphite ${i % 2 ? "lg:order-2" : ""}`}>
                  <Photo media={g.image} sizes="(min-width:1024px) 45vw, 100vw" />
                  <div className="absolute inset-0 bg-gradient-to-t from-void/75 to-transparent" />
                  <p className="absolute bottom-4 left-4 font-display text-3xl font-extrabold uppercase leading-none tracking-[-0.03em]">
                    {g.name}
                  </p>
                </div>
                <div className={i % 2 ? "lg:order-1" : ""}>
                  <p className="text-sm leading-relaxed text-ash">{g.blurb}</p>
                  <ul className="mt-5 divide-y divide-white/8 border-y border-white/8">
                    {g.items.map((item) => (
                      <li key={item.name} className="flex items-center justify-between gap-4 py-3">
                        <span className="text-sm">{item.name}</span>
                        <span className="shrink-0 font-display text-sm font-bold text-accent tnum">
                          from {rupees(item.from)}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* gear store ------------------------------------------------ */}
      <section className="section border-y border-white/8 bg-carbon">
        <div className="shell">
          <SectionHead
            eyebrow="Off-road store"
            title="RATED GEAR ONLY."
            href="/shop/off-road"
            hrefLabel="All off-road"
            blurb="Everything here carries a working load rating and a warranty. Nothing decorative, nothing untested."
          />
          <ul className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4">
            {offroadProducts.slice(0, 8).map((p) => (
              <li key={p.slug}>
                <ProductCard product={p} />
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* builds ---------------------------------------------------- */}
      <section className="section">
        <div className="shell">
          <SectionHead eyebrow="Finished rigs" title="BUILT AND PROVEN." href="/builds" hrefLabel="All builds" />
          <ul className="grid gap-4 md:grid-cols-2">
            {offroadBuilds.map((b) => (
              <li key={b.slug}>
                <BuildCard build={b} sizes="(min-width:768px) 50vw, 92vw" />
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="section border-t border-white/8 bg-carbon">
        <div className="shell grid gap-8 lg:grid-cols-2 lg:items-start">
          <div>
            <SectionHead eyebrow="Questions" title="BEFORE YOU LIFT IT." />
            <Accordion items={FAQ} />
          </div>
          <div className="card p-6">
            <p className="font-display text-lg font-extrabold uppercase">Tell us where you're going</p>
            <p className="mt-2 text-sm text-ash">
              Spiti in June is a different build from Rann in December, and both are different from
              weekend trails outside the city. Tell us the trip and we'll spec the truck for it.
            </p>
            <a
              href={whatsapp("Hi Motorbotz, I want to build my off-road SUV. My vehicle is:  and I mostly drive: ")}
              target="_blank"
              rel="noreferrer noopener"
              className="btn btn-whatsapp btn-block mt-5"
            >
              <Icon name="whatsapp" size={16} />
              Build my off-road SUV
            </a>
            <Link href="/build" className="btn btn-outline btn-block mt-3">
              Configure it yourself
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
