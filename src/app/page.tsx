import Link from "next/link";
import type { Metadata } from "next";
import { Photo } from "@/components/ui/Photo";
import { VehicleImage } from "@/components/be6/VehicleImage";
import { Icon } from "@/components/ui/Icon";
import { Reveal } from "@/components/ui/Reveal";
import { SectionHead, SectionFootLink } from "@/components/ui/Section";
import { Studio } from "@/components/home/Studio";
import { CarCard } from "@/components/cars/CarCard";
import { ProductCard } from "@/components/shop/ProductCard";
import { BuildCard, ReviewCard } from "@/components/community/Cards";
import { FitmentPicker } from "@/components/fitment/FitmentPicker";
import { ListingCard } from "@/components/inventory/ListingCard";
import { toCardData } from "@/lib/inventory/card-data";
import { justLanded } from "@/lib/inventory/store";
import { formatIST } from "@/lib/inventory/freshness";
import { FEATURED_CARS } from "@/lib/data/cars";
import { BESTSELLERS, CATEGORIES, PRICE_BANDS } from "@/lib/data/products";
import { BUILDS, REVIEWS, STATS } from "@/lib/data/community";
import { lakh } from "@/lib/format";
import { SITE, TRUST_POINTS, whatsapp } from "@/lib/data/site";
import { PRICE_FROM as BE6_PRICE_FROM, colour as be6Colour } from "@/lib/data/be6/factory";

export const metadata: Metadata = {
  title: "Riderzpro — Buy. Build. Drive. | Cars, Accessories & Modification in India",
  description:
    "Buy and sell verified cars, build your own with our configurator, and shop accessories, audio, PPF, off-road and performance upgrades. Riderzpro garages in Bengaluru, Hyderabad and Pune.",
  alternates: { canonical: "/" },
};

const QUICK_ACTIONS = [
  {
    href: "/cars",
    title: "BUY A CAR",
    blurb: "Verified, inspected, warranted cars ready to drive home.",
    icon: "car" as const,
  },
  {
    href: "/sell",
    title: "SELL YOUR CAR",
    blurb: "Free valuation, free inspection, payment before transfer.",
    icon: "shield" as const,
  },
  {
    href: "/build",
    title: "MODIFY YOUR CAR",
    blurb: "Configure a build and get a costed quote in minutes.",
    icon: "build" as const,
  },
  {
    href: "/shop",
    title: "SHOP ACCESSORIES",
    blurb: "From ₹499 mats to ₹2 lakh audio. Fitment guaranteed.",
    icon: "bag" as const,
  },
];

export default function HomePage() {
  const landed = justLanded(8).map(toCardData);

  return (
    <>
      {/* 1 — CINEMATIC HERO — the BE 6 is the flagship ------------------ */}
      <section data-theme="dark" className="relative flex min-h-[94svh] flex-col justify-end overflow-hidden bg-void">
        <div className="absolute inset-0">
          <div className="absolute inset-0 grid-lines opacity-30" />
          <div className="absolute inset-0 bg-[radial-gradient(120%_80%_at_50%_18%,rgba(92,225,255,0.12),transparent_62%)]" />
          <div className="absolute inset-x-0 top-[30%] mx-auto max-w-5xl px-4 md:top-[26%]">
            <VehicleImage colour={be6Colour("stealth-black")} sizes="100vw" priority />
          </div>
          <div className="absolute inset-0 scrim" />
        </div>

        <div className="shell relative pb-14 pt-28 md:pb-20">
          <p className="rise eyebrow mb-4 flex items-center gap-2" style={{ animationDelay: "80ms" }}>
            <span className="h-1.5 w-1.5 bg-accent pulse-dot" />
            Riderzpro flagship · Mahindra BE 6 SPORTEQ
          </p>

          <h1 className="rise display-1 max-w-4xl" style={{ animationDelay: "160ms" }}>
            THE BE 6.
            <br />
            REIMAGINED.
          </h1>

          <p
            className="rise mt-5 max-w-md text-base text-ash md:text-lg"
            style={{ animationDelay: "260ms" }}
          >
            Meet the first RIDERZPRO Limited Edition concept. Every factory variant explained, every
            upgrade priced, and a clear line between what Mahindra builds and what we do to it.
          </p>

          <div className="rise mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap" style={{ animationDelay: "340ms" }}>
            <Link href="/be-6" className="btn btn-primary">
              Explore BE 6
              <Icon name="arrow" size={15} />
            </Link>
            <Link href="/be-6#build" className="btn btn-outline">
              Build your BE 6
            </Link>
            <Link href="/be-6/limited-edition" className="btn btn-outline !border-gold/45 !text-gold">
              Riderzpro Edition — coming soon
            </Link>
          </div>

          <p className="rise mt-6 text-[0.6875rem] text-dim" style={{ animationDelay: "380ms" }}>
            {SITE.tagline} · Cars, accessories, audio, PPF and modification —{" "}
            <Link href="/cars" className="underline underline-offset-2 transition-colors hover:text-accent">
              browse everything
            </Link>
          </p>

          <dl className="rise mt-12 grid max-w-2xl grid-cols-2 gap-x-6 gap-y-5 border-t border-tint/12 pt-6 md:grid-cols-4" style={{ animationDelay: "420ms" }}>
            {STATS.map((s) => (
              <div key={s.label}>
                <dd className="font-display text-2xl font-extrabold tracking-[-0.03em] tnum md:text-3xl">
                  {s.value}
                </dd>
                <dt className="mt-1 text-[11px] uppercase tracking-[0.14em] text-dim">{s.label}</dt>
              </div>
            ))}
          </dl>
        </div>
      </section>

      {/* 2 — QUICK ACTIONS -------------------------------------------- */}
      <section className="border-y border-tint/8 bg-carbon">
        <ul className="shell grid grid-cols-2 gap-px bg-tint/8 px-0 lg:grid-cols-4">
          {QUICK_ACTIONS.map((a, i) => (
            <li key={a.href} className="bg-carbon">
              <Reveal delay={i * 60}>
                <Link href={a.href} className="group flex h-full flex-col justify-between gap-8 p-5 transition-colors hover:bg-tint/4 md:p-7">
                  <Icon name={a.icon} size={26} className="text-accent" />
                  <div>
                    <p className="font-display text-base font-extrabold uppercase tracking-[-0.01em] md:text-lg">
                      {a.title}
                    </p>
                    <p className="mt-1.5 text-xs leading-snug text-ash md:text-sm">{a.blurb}</p>
                    <span className="mt-3 inline-flex items-center gap-1.5 font-display text-[10px] font-bold uppercase tracking-[0.16em] text-dim transition-colors group-hover:text-accent">
                      Go
                      <Icon name="arrow" size={13} />
                    </span>
                  </div>
                </Link>
              </Reveal>
            </li>
          ))}
        </ul>
      </section>

      {/* 2a — FLAGSHIP: THE BE 6 --------------------------------------- */}
      <section className="section border-b border-tint/[0.06] bg-void">
        <div className="shell grid gap-8 lg:grid-cols-[1.1fr_1fr] lg:items-center">
          <Reveal>
            <p className="eyebrow mb-3">The first car we build different</p>
            <h2 className="display-2">
              RIDERZPRO
              <br />
              BE 6.
            </h2>
            <p className="mt-4 max-w-lg text-sm leading-relaxed text-ash md:text-base">
              Every Mahindra BE 6 SPORTEQ variant, battery, colour and specification — verified against
              official sources and dated. Then a configurator that turns it into your car, and a
              concept that shows where we would take it next.
            </p>

            <dl className="mt-6 grid max-w-lg grid-cols-2 gap-x-6 gap-y-4 sm:grid-cols-4">
              {[
                ["From", lakh(BE6_PRICE_FROM)],
                ["Variants", "8"],
                ["Colours", "12"],
                ["Range to", "683 km"],
              ].map(([k, v]) => (
                <div key={k}>
                  <dt className="font-display text-[0.5625rem] uppercase tracking-[0.16em] text-dim">{k}</dt>
                  <dd className="tnum mt-0.5 font-display text-base font-extrabold text-chalk">{v}</dd>
                </div>
              ))}
            </dl>

            <div className="mt-7 flex flex-col gap-2.5 sm:flex-row sm:flex-wrap">
              <Link href="/be-6" className="btn btn-accent">
                Explore the BE 6
                <Icon name="arrow" size={15} />
              </Link>
              <Link href="/be-6/limited-edition" className="btn btn-outline !border-gold/45 !text-gold">
                Limited Edition — coming soon
              </Link>
            </div>
          </Reveal>

          <Reveal delay={80} className="relative">
            <div className="absolute inset-0 bg-[radial-gradient(90%_70%_at_50%_50%,rgba(92,225,255,0.1),transparent_65%)]" />
            <VehicleImage colour={be6Colour("firestorm-orange")} sizes="(min-width: 1024px) 40rem, 100vw" className="relative" />
            <p className="relative mt-1 text-center text-[0.5625rem] text-dim">
              Official Mahindra render
            </p>
          </Reveal>
        </div>
      </section>

      {/* 2b — JUST LANDED --------------------------------------------- */}
      {landed.length > 0 && (
        <section className="section">
          <div className="shell">
            <SectionHead
              eyebrow="Just landed"
              title="NEWEST IN THE MARKETPLACE."
              blurb={`Ordered by most recently verified. Inventory snapshot ${formatIST(new Date().toISOString())}.`}
              href="/cars/latest"
              hrefLabel="All latest cars"
            />
            <ul className="rail -mx-4 px-4 md:mx-0 md:grid md:grid-cols-2 md:gap-4 md:px-0 lg:grid-cols-4">
              {landed.map((l, i) => (
                <li key={l.id} className="w-[78vw] max-w-[340px] md:w-auto md:max-w-none">
                  <Reveal delay={(i % 4) * 70} className="h-full">
                    <ListingCard listing={l} sizes="(min-width:1024px) 25vw, (min-width:768px) 50vw, 78vw" />
                  </Reveal>
                </li>
              ))}
            </ul>
            <SectionFootLink href="/cars/latest" label="All latest cars" />
          </div>
        </section>
      )}

      {/* 3 — FEATURED CARS -------------------------------------------- */}
      <section className="section">
        <div className="shell">
          <SectionHead
            eyebrow="Riderzpro Certified"
            title="CARS WORTH BUYING."
            blurb="Every car is inspected on 200 points, its paperwork verified against VAHAN, and its price published without negotiation games."
            href="/cars"
            hrefLabel="All cars"
          />
          <ul className="rail -mx-4 px-4 md:mx-0 md:grid md:grid-cols-2 md:gap-4 md:px-0 lg:grid-cols-4">
            {FEATURED_CARS.map((car, i) => (
              <li key={car.slug} className="w-[78vw] max-w-[340px] md:w-auto md:max-w-none">
                <Reveal delay={i * 70} className="h-full">
                  <CarCard car={car} sizes="(min-width:1024px) 25vw, (min-width:768px) 50vw, 78vw" />
                </Reveal>
              </li>
            ))}
          </ul>
          <div className="shell px-0">
            <SectionFootLink href="/cars" label="All cars" />
          </div>
        </div>
      </section>

      {/* 4 — SHOP BY CAR ---------------------------------------------- */}
      <section className="section border-y border-tint/8 bg-carbon">
        <div className="shell">
          <Reveal>
            <FitmentPicker />
          </Reveal>

          <ul className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
            {[
              { slug: "thar", name: "Thar", brand: "Mahindra" },
              { slug: "fortuner", name: "Fortuner", brand: "Toyota" },
              { slug: "creta", name: "Creta", brand: "Hyundai" },
              { slug: "scorpio-n", name: "Scorpio N", brand: "Mahindra" },
              { slug: "xuv700", name: "XUV700", brand: "Mahindra" },
              { slug: "seltos", name: "Seltos", brand: "Kia" },
            ].map((m, i) => (
              <li key={m.slug}>
                <Reveal delay={i * 45}>
                  <Link
                    href={`/accessories/${m.slug}`}
                    className="card card-hover flex flex-col gap-1 p-4 text-center"
                  >
                    <span className="font-display text-sm font-extrabold uppercase tracking-[-0.01em]">
                      {m.name}
                    </span>
                    <span className="text-[10px] uppercase tracking-[0.12em] text-dim">{m.brand}</span>
                  </Link>
                </Reveal>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* 5 — POPULAR ACCESSORIES -------------------------------------- */}
      <section className="section">
        <div className="shell">
          <SectionHead
            eyebrow="Accessories store"
            title="WHAT EVERYONE'S FITTING."
            blurb="Six categories, one fitment engine. If it shows up for your car, it fits your car."
            href="/shop"
            hrefLabel="Shop all"
          />

          <div className="rail -mx-4 mb-6 px-4 md:mx-0 md:flex-wrap md:px-0">
            {CATEGORIES.map((c) => (
              <Link key={c.slug} href={`/shop/${c.slug}`} className="chip hover:border-accent hover:text-accent">
                {c.name}
              </Link>
            ))}
          </div>

          <ul className="grid grid-cols-2 gap-3 md:grid-cols-3 md:gap-4 lg:grid-cols-6">
            {BESTSELLERS.map((p, i) => (
              <li key={p.slug}>
                <Reveal delay={i * 50} className="h-full">
                  <ProductCard product={p} sizes="(min-width:1024px) 16vw, (min-width:768px) 33vw, 46vw" />
                </Reveal>
              </li>
            ))}
          </ul>

          <ul className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {PRICE_BANDS.map((b, i) => (
              <li key={b.slug}>
                <Reveal delay={i * 50} className="h-full">
                  <div className="card h-full p-4">
                    <p className="font-display text-xs font-bold uppercase tracking-[0.16em] text-accent">
                      {b.label}
                    </p>
                    <p className="mt-1.5 font-display text-lg font-extrabold tnum">{b.range}</p>
                    <p className="mt-2 text-xs leading-snug text-ash">{b.blurb}</p>
                  </div>
                </Reveal>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* 6 — BUILD YOUR CAR ------------------------------------------- */}
      <section className="relative overflow-hidden border-y border-tint/8">
        <div className="absolute inset-0">
          <Photo media="garageSpotlit" sizes="100vw" className="opacity-45" position="center 60%" />
          <div className="absolute inset-0 bg-gradient-to-r from-void via-void/85 to-void/40" />
        </div>
        <div className="shell relative py-16 md:py-24">
          <Reveal className="max-w-2xl">
            <p className="eyebrow mb-3">Build your car</p>
            <h2 className="display-2">NOT STOCK.</h2>
            <p className="mt-4 max-w-lg text-sm leading-relaxed text-ash md:text-base">
              Pick your car, then walk through exterior, wheels, interior, audio and performance. Every
              option is a real part we stock, at a real installed price. You leave with a costed build
              sheet, not a vague enquiry form.
            </p>

            <ul className="mt-7 grid gap-2.5 sm:grid-cols-2">
              {[
                "Live estimated build cost as you select",
                "Parts filtered to your platform",
                "Labour and GST included in the estimate",
                "One tap to send the sheet to our team",
              ].map((p) => (
                <li key={p} className="flex items-start gap-2.5 text-sm text-chalk/85">
                  <Icon name="check" size={15} className="mt-0.5 shrink-0 text-accent" />
                  {p}
                </li>
              ))}
            </ul>

            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/build" className="btn btn-accent">
                Start building
                <Icon name="arrow" size={15} />
              </Link>
              <Link href="/builds" className="btn btn-outline">
                See finished builds
              </Link>
            </div>
          </Reveal>
        </div>
      </section>

      {/* 7 — RIDERZPRO GARAGE ----------------------------------------- */}
      <Studio
        eyebrow="Riderzpro Garage"
        title="26 BAYS. ONE STANDARD."
        blurb="Installation, modification, detailing, PPF, audio, performance, off-road and interiors — all under one roof, by people who own modified cars themselves."
        points={[
          "Dust-controlled PPF and paint rooms",
          "Dedicated audio bay with an RTA rig",
          "In-house trim shop and welding bay",
          "Photo updates on WhatsApp through your build",
        ]}
        media="mechanicEngine"
        href="/garage"
        cta="Book an appointment"
        secondary={{ href: "/locations", label: "Find a garage" }}
        priceNote="Bengaluru · Hyderabad · Pune"
      />

      {/* 8 — PREMIUM AUDIO -------------------------------------------- */}
      <Studio
        eyebrow="Premium audio"
        title="HEAR EVERY DETAIL."
        blurb="From an honest first upgrade to an audiophile-grade custom build. Every system is measured, tuned and re-tuned free within the first month."
        points={[
          "Component, DSP and fully active builds",
          "Sound deadening done properly, in butyl",
          "Fibreglass pods trimmed to your interior",
          "Four packages from ₹24,900 to ₹4,50,000",
        ]}
        media="studioMonitors"
        href="/audio"
        cta="Build your audio system"
        flip
      />

      {/* 9 — PPF & DETAILING ------------------------------------------ */}
      <Studio
        eyebrow="PPF & detailing"
        title="PROTECT THE PAINT."
        blurb="Plotter-cut paint protection film with wrapped edges, real ceramic and graphene chemistry, and correction work you can see under inspection lighting."
        points={[
          "10-year PPF with self-healing top coat",
          "9H ceramic and 7-year graphene options",
          "Before-and-after paint depth readings",
          "Colour change wraps and chrome delete",
        ]}
        media="wrapHeatGun"
        href="/ppf"
        cta="Book detailing"
      />

      {/* 10 — OFF-ROAD ------------------------------------------------ */}
      <Studio
        eyebrow="Off-road garage"
        title="BUILT FOR THE UNPAVED."
        blurb="Thar, Gurkha, Fortuner, Wrangler, V-Cross, Scorpio N, Jimny, Hilux, Defender. Lift, protection, recovery and expedition hardware that has actually been to Ladakh."
        points={[
          "Lift kits with corrected geometry",
          "Chassis-mounted sliders and skid plates",
          "Rated recovery points and winch cradles",
          "Roof racks, tents, drawers, dual battery",
        ]}
        media="defenderSaltFlat"
        href="/off-road"
        cta="Build my off-road SUV"
        flip
      />

      {/* 11 — BODY KITS & FACELIFTS ----------------------------------- */}
      <Studio
        eyebrow="Body kits & facelifts"
        title="MAKE YOUR CAR LOOK NEW AGAIN."
        blurb="Turn a 2020 Creta into a 2024 Creta. A 2016 Fortuner into a Legender. Panel gaps checked with a feeler gauge, everything painted to your VIN colour code."
        points={[
          "Bumper, grille, lamp and DRL conversions",
          "Wide-arch and street body kits",
          "Painted to your factory colour code",
          "Original parts returned to you",
        ]}
        media="chromeGrille"
        href="/body-kits"
        cta="Get a facelift quote"
        priceNote="Popular conversions from ₹68,000"
      />

      {/* 12 — CUSTOM INTERIORS ---------------------------------------- */}
      <Studio
        eyebrow="Custom interiors"
        title="THE BEST SEAT IN THE CAR."
        blurb="Leather, alcantara, diamond stitching, ventilated and heated seats, captain conversions, electric recliners and ambient lighting — trimmed in our own workshop."
        points={[
          "Airbag-safe seams on every seat rebuild",
          "Concealed fibre-optic ambient runs",
          "Captain seats and automatic footrests",
          "Full luxury SUV lounge conversions",
        ]}
        media="cockpitScreen"
        href="/interiors"
        cta="Design my interior"
        flip
      />

      {/* 13 — PERFORMANCE --------------------------------------------- */}
      <Studio
        eyebrow="Performance garage"
        title="MORE POWER. MORE CONTROL."
        blurb="Custom maps written on our dyno with your fuel, not generic files. Intake, exhaust, cooling, brakes and suspension — set up as a package, not a parts list."
        points={[
          "Stage 1 and Stage 2 custom remapping",
          "Original ECU map archived and restorable",
          "Dyno sheet before and after, every time",
          "Emissions hardware retained and functional",
        ]}
        media="engineBay"
        href="/performance"
        cta="Talk to the tuner"
        priceNote="All work carried out within Central Motor Vehicles Rules."
      />

      {/* 14 — RIDERZPRO BUILDS ---------------------------------------- */}
      <section className="section border-y border-tint/8 bg-carbon">
        <div className="shell">
          <SectionHead
            eyebrow="Riderzpro builds"
            title="BUILT BY US. DRIVEN BY THEM."
            blurb="Real cars, real invoices, real owners. Every build lists what went into it and what it cost."
            href="/builds"
            hrefLabel="All builds"
          />
          <ul className="rail -mx-4 px-4 md:mx-0 md:grid md:grid-cols-3 md:gap-4 md:px-0">
            {BUILDS.slice(0, 3).map((b, i) => (
              <li key={b.slug} className="w-[74vw] max-w-[330px] md:w-auto md:max-w-none">
                <Reveal delay={i * 80} className="h-full">
                  <BuildCard build={b} sizes="(min-width:768px) 33vw, 74vw" />
                </Reveal>
              </li>
            ))}
          </ul>
          <SectionFootLink href="/builds" label="All builds" />
        </div>
      </section>

      {/* 15 — REVIEWS -------------------------------------------------- */}
      <section className="section">
        <div className="shell">
          <SectionHead
            eyebrow="4.8 / 5 from 3,184 customers"
            title="WHAT THEY SAY AFTER."
            blurb="Not testimonials we wrote. Reviews left after the car went home."
          />
          <ul className="rail -mx-4 px-4 md:mx-0 md:grid md:grid-cols-3 md:gap-4 md:px-0">
            {REVIEWS.slice(0, 6).map((r, i) => (
              <li key={r.name} className="w-[82vw] max-w-[380px] md:w-auto md:max-w-none">
                <Reveal delay={(i % 3) * 70} className="h-full">
                  <ReviewCard review={r} />
                </Reveal>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* 16 — WHY RIDERZPRO ------------------------------------------- */}
      <section className="section border-t border-tint/8 bg-carbon">
        <div className="shell">
          <SectionHead
            eyebrow="Trust system"
            title="BUY WITH CONFIDENCE."
            blurb="Selling cars means earning trust before anything else. This is what we do on every single listing."
          />
          <ul className="grid gap-px overflow-hidden border border-tint/8 bg-tint/8 sm:grid-cols-2 lg:grid-cols-3">
            {TRUST_POINTS.map((t, i) => (
              <li key={t.title} className="bg-carbon p-5">
                <Reveal delay={(i % 3) * 60}>
                  <p className="flex items-center gap-2 font-display text-sm font-extrabold uppercase tracking-[0.02em]">
                    <Icon name="check" size={16} className="text-accent" />
                    {t.title}
                  </p>
                  <p className="mt-2 text-xs leading-relaxed text-ash">{t.body}</p>
                </Reveal>
              </li>
            ))}
          </ul>

          <div className="mt-8 flex flex-wrap items-center gap-4">
            <span className="verified text-sm">
              <Icon name="shield" size={14} />
              Riderzpro Verified
            </span>
            <p className="text-sm text-ash">
              The badge only goes on a car once all nine checks are cleared and signed off.
            </p>
          </div>
        </div>
      </section>

      {/* 17 — WHATSAPP CTA -------------------------------------------- */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0">
          <Photo media="cityNightRain" sizes="100vw" className="opacity-35" />
          <div className="absolute inset-0 bg-gradient-to-b from-void via-void/80 to-void" />
        </div>
        <div className="shell relative py-16 text-center md:py-24">
          <Reveal>
            <p className="eyebrow mb-4">One message. Any question.</p>
            <h2 className="display-2 mx-auto max-w-3xl">YOUR CAR. YOUR RULES.</h2>
            <p className="mx-auto mt-4 max-w-lg text-sm text-ash md:text-base">
              Fitment doubts, build budgets, a car you want us to source, a quote you want matched —
              message us and a human replies. Usually inside twenty minutes.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <a
                href={whatsapp("Hi Riderzpro, I'd like to talk about my car.")}
                target="_blank"
                rel="noreferrer noopener"
                className="btn btn-whatsapp"
              >
                <Icon name="whatsapp" size={17} />
                Ask on WhatsApp
              </a>
              <a href={SITE.phoneHref} className="btn btn-outline">
                <Icon name="phone" size={15} />
                {SITE.phone}
              </a>
            </div>
            <p className="mt-6 text-xs text-dim">{SITE.hours}</p>
          </Reveal>
        </div>
      </section>
    </>
  );
}
