import type { Metadata } from "next";
import Link from "next/link";
import { PageHero } from "@/components/layout/PageHero";
import { SectionHead } from "@/components/ui/Section";
import { Icon } from "@/components/ui/Icon";
import { Reveal } from "@/components/ui/Reveal";
import { RecoilCard } from "@/components/recoil/RecoilCard";
import { BrandShopBar } from "@/components/catalog/BrandShopBar";
import {
  CATALOG_SUMMARY,
  CATEGORIES,
  COMING_SOON,
  FEATURED,
  PRODUCTS,
  toPublic,
} from "@/lib/data/recoil";
import { whatsapp } from "@/lib/data/site";

export const metadata: Metadata = {
  title: "RECOIL Car Audio & Installation — Authorised Reseller",
  description:
    "The full RECOIL range at Motorbotz: amplifiers, DSP, component and coaxial speakers, subwoofers, damping, wiring, distribution and installation accessories. Authorised reseller, genuine product.",
  alternates: { canonical: "/recoil" },
};

export default function RecoilPage() {
  const audio = CATEGORIES.filter((c) => c.group === "CAR AUDIO");
  const install = CATEGORIES.filter((c) => c.group === "INSTALLATION");

  return (
    <>
      <PageHero
        eyebrow="Authorised RECOIL reseller"
        title="RECOIL. THE WHOLE RANGE."
        blurb="Amplifiers, processors, speakers, subwoofers, damping, wiring and everything that connects them — imported from the RECOIL May 2026 price list, matched model number by model number to the manufacturer's own catalogue."
        media="studioMonitors"
        size="sm"
        actions={[
          { href: "#catalogue", label: "Browse the catalogue", variant: "primary" },
          { href: "/build-audio", label: "Build my system", variant: "outline" },
        ]}
      >
        <dl className="mt-8 grid max-w-2xl grid-cols-2 gap-x-6 gap-y-5 border-t border-white/12 pt-6 md:grid-cols-4">
          <Stat value={String(CATALOG_SUMMARY.totals.skus)} label="SKUs imported" />
          <Stat value={String(CATALOG_SUMMARY.totals.ready)} label="Live and verified" />
          <Stat value={String(CATALOG_SUMMARY.totals.images)} label="Manufacturer images" />
          <Stat value={String(CATALOG_SUMMARY.totals.comingSoon)} label="Coming soon" />
        </dl>
      </PageHero>

      {/* trust ------------------------------------------------------ */}
      <section className="border-b border-white/8 bg-carbon">
        <ul className="shell grid grid-cols-2 gap-px bg-white/8 px-0 lg:grid-cols-4">
          {[
            { icon: "shield" as const, t: "Genuine products only", b: "Sourced against the official RECOIL price list." },
            { icon: "check" as const, t: "Exact model matching", b: "Every image is matched to its own SKU, never a similar one." },
            { icon: "wrench" as const, t: "Installation available", b: "Fitted and tuned at three Motorbotz workshops." },
            { icon: "spark" as const, t: "Manufacturer-backed data", b: "Specifications published as RECOIL states them." },
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

      <BrandShopBar brand="recoil" />

      {/* categories ------------------------------------------------- */}
      <section className="section" id="catalogue">
        <div className="shell">
          <SectionHead eyebrow="Car audio" title="SOUND. POWER. CONTROL." blurb="Everything that makes noise, and everything that tells it what to do." />
          <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {audio.map((c, i) => (
              <li key={c.slug}>
                <Reveal delay={i * 50} className="h-full">
                  <CategoryTile category={c} />
                </Reveal>
              </li>
            ))}
          </ul>

          <div className="mt-12">
            <SectionHead
              eyebrow="Installation"
              title="THE PARTS NOBODY PHOTOGRAPHS."
              blurb="Damping, wiring, distribution, fusing and tools. The half of the build that decides whether the other half works."
            />
            <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {install.map((c, i) => (
                <li key={c.slug}>
                  <Reveal delay={i * 50} className="h-full">
                    <CategoryTile category={c} />
                  </Reveal>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* featured --------------------------------------------------- */}
      <section className="section border-y border-white/8 bg-carbon">
        <div className="shell">
          <SectionHead eyebrow="Flagships" title="WHERE PEOPLE START." href="/recoil/amplifiers" hrefLabel="All amplifiers" />
          <ul className="grid grid-cols-2 gap-3 md:grid-cols-3 md:gap-4 lg:grid-cols-6">
            {FEATURED.map((p) => (
              <li key={p.slug}>
                <RecoilCard product={toPublic(p)} sizes="(min-width:1024px) 16vw, (min-width:768px) 33vw, 46vw" />
              </li>
            ))}
          </ul>
        </div>
      </section>

      {COMING_SOON.length > 0 && (
        <section className="section">
          <div className="shell">
            <SectionHead
              eyebrow="Not yet shipping"
              title="COMING SOON."
              blurb={`${COMING_SOON.length} model numbers are listed as Coming Soon in the current price list. We show them because you asked what exists — not because you can buy them today.`}
            />
            <ul className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4 lg:grid-cols-6">
              {COMING_SOON.slice(0, 12).map((p) => (
                <li key={p.slug}>
                  <RecoilCard product={toPublic(p)} sizes="(min-width:1024px) 16vw, (min-width:768px) 25vw, 46vw" />
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}

      <section className="section border-t border-white/8 bg-carbon">
        <div className="shell grid gap-6 lg:grid-cols-[1.3fr_1fr] lg:items-center">
          <div>
            <p className="eyebrow mb-3">Can't find a model number?</p>
            <h2 className="display-2">WE STOCK MORE THAN WE LIST.</h2>
            <p className="mt-4 max-w-lg text-sm leading-relaxed text-ash">
              {PRODUCTS.length} products are live here from the May 2026 price list. RECOIL releases
              new models between editions, and some lines are special order. Send us the model number
              and we will confirm availability and price.
            </p>
          </div>
          <div className="flex flex-wrap gap-3 lg:justify-end">
            <a
              href={whatsapp("Hi Motorbotz, do you stock this RECOIL model number: ")}
              target="_blank"
              rel="noreferrer noopener"
              className="btn btn-whatsapp"
            >
              <Icon name="whatsapp" size={16} />
              Ask about a model
            </a>
            <Link href="/build-audio" className="btn btn-outline">
              Build my audio system
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}

function CategoryTile({ category }: { category: (typeof CATEGORIES)[number] }) {
  return (
    <Link href={`/recoil/${category.slug}`} className="card card-hover group flex h-full flex-col justify-between gap-6 p-5">
      <div>
        <p className="font-display text-xl font-extrabold uppercase tracking-[-0.02em] group-hover:text-accent">
          {category.name}
        </p>
        <p className="mt-2 text-xs leading-snug text-ash">
          {category.subcategories
            .slice(0, 4)
            .map((s) => s.name)
            .join(" · ")}
          {category.subcategories.length > 4 ? ` · +${category.subcategories.length - 4}` : ""}
        </p>
      </div>
      <p className="flex items-center justify-between text-[11px] uppercase tracking-[0.14em] text-dim">
        <span className="tnum">{category.count} products</span>
        <Icon name="arrow" size={15} className="group-hover:text-accent" />
      </p>
    </Link>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div>
      <dd className="font-display text-2xl font-extrabold tnum md:text-3xl">{value}</dd>
      <dt className="mt-1 text-[11px] uppercase tracking-[0.14em] text-dim">{label}</dt>
    </div>
  );
}
