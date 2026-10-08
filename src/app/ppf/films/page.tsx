import type { Metadata } from "next";
import Link from "next/link";
import { PageHero } from "@/components/layout/PageHero";
import { StickyPpfCta } from "@/components/ppf/StickyPpfCta";
import { SectionHead } from "@/components/ui/Section";
import { Icon } from "@/components/ui/Icon";
import { FINISHES, NOT_SPECIFIED, PPF_BRANDS, PPF_FILMS, filmsByBrand, specText } from "@/lib/ppf/films";
import { TIER_RATES } from "@/lib/ppf/coverage";

export const metadata: Metadata = {
  title: "PPF Films & Brands — Specifications, Finishes and Warranties",
  description:
    "The paint protection films Riderzpro installs, with each manufacturer's published warranty period, conditions and exclusions. Specifications we cannot verify are marked as such.",
  alternates: { canonical: "/ppf/films" },
};

export default function PpfFilmsPage() {
  return (
    <>
      <PageHero
        eyebrow="PPF films"
        title="WHICH PPF IS RIGHT FOR YOU?"
        blurb="Films differ in warranty period, finish and how they behave over time. Everything below comes from the manufacturer's own documentation — where we do not hold a figure, it says so."
        media="detailingPolish"
        size="sm"
      />

      {/* honesty note ----------------------------------------------- */}
      <section className="border-b border-white/8 bg-carbon">
        <div className="shell py-6">
          <div className="card border-gold/25 bg-gold/5 p-5">
            <p className="flex items-center gap-2 font-display text-sm font-extrabold uppercase text-gold">
              <Icon name="shield" size={16} />
              Where these numbers come from
            </p>
            <p className="mt-2 max-w-3xl text-xs leading-relaxed text-chalk/85">
              Warranty periods, cover and exclusions below were read from the manufacturer&apos;s own
              warranty documentation. Thickness, gloss level and hydrophobic performance are shown as
              &ldquo;{NOT_SPECIFIED}&rdquo; until we hold each product&apos;s technical data sheet —
              those are the figures people compare on, and we are not filling them in from a review
              site. Ask us and we will get the TDS from the distributor.
            </p>
          </div>
        </div>
      </section>

      {/* comparison table -------------------------------------------- */}
      <section className="section">
        <div className="shell">
          <SectionHead eyebrow="Side by side" title="COMPARE THE RANGE." />
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] border-collapse text-sm">
              <thead>
                <tr className="border-b border-white/12 text-left text-[10px] uppercase tracking-[0.14em] text-dim">
                  <th className="p-2.5">Film</th>
                  <th className="p-2.5">Tier</th>
                  <th className="p-2.5">Finish</th>
                  <th className="p-2.5">Thickness</th>
                  <th className="p-2.5">Self-healing</th>
                  <th className="p-2.5">Hydrophobic</th>
                  <th className="p-2.5">Warranty</th>
                  <th className="p-2.5">Transferable</th>
                </tr>
              </thead>
              <tbody>
                {PPF_FILMS.map((film) => {
                  const brand = PPF_BRANDS.find((b) => b.id === film.brandId);
                  return (
                    <tr key={film.sku} className="border-b border-white/8 align-top">
                      <td className="p-2.5">
                        <Link href={`/ppf/films/${film.slug}`} className="text-accent hover:underline">
                          {brand?.name} {film.name}
                        </Link>
                        <span className="block text-[10px] text-dim">{film.sku}</span>
                      </td>
                      <td className="p-2.5 text-xs text-ash">{TIER_RATES[film.tier].label}</td>
                      <td className="p-2.5 text-xs text-ash">{film.finish}</td>
                      <td className="p-2.5 text-xs">
                        <Cell text={specText(film.thicknessMicron, " µm")} />
                      </td>
                      <td className="p-2.5 text-xs">
                        <Cell text={specText(film.selfHealing)} />
                      </td>
                      <td className="p-2.5 text-xs">
                        <Cell text={specText(film.hydrophobic)} />
                      </td>
                      <td className="p-2.5 text-xs">
                        <Cell text={specText(film.warrantyYears, " years")} />
                      </td>
                      <td className="p-2.5 text-xs">
                        <Cell text={specText(film.warrantyTransferable)} />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <p className="mt-4 text-xs text-dim">
            Riderzpro installed rates: Essential ₹{TIER_RATES.essential.min}–{TIER_RATES.essential.max}/sq ft ·
            Premium ₹{TIER_RATES.premium.min}–{TIER_RATES.premium.max}/sq ft · Signature ₹
            {TIER_RATES.signature.min}–{TIER_RATES.signature.max}/sq ft.
          </p>
        </div>
      </section>

      {/* finishes ---------------------------------------------------- */}
      <section className="section border-y border-white/8 bg-carbon">
        <div className="shell">
          <SectionHead eyebrow="Finishes" title="GLOSS, SATIN, MATTE, COLOUR." />
          <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {FINISHES.map((f) => (
              <li key={f.finish} className="card p-5">
                <p className="font-display text-lg font-extrabold uppercase">{f.finish}</p>
                <p className="mt-2 text-sm leading-relaxed text-ash">{f.blurb}</p>
                <p className="mt-3 text-xs text-dim">{f.forWho}</p>
                <p className="mt-3 text-[11px] text-accent tnum">
                  {PPF_FILMS.filter((film) => film.finish === f.finish).length} film
                  {PPF_FILMS.filter((film) => film.finish === f.finish).length === 1 ? "" : "s"} listed
                </p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* brands ------------------------------------------------------ */}
      <section className="section">
        <div className="shell space-y-6">
          <SectionHead eyebrow="Brands" title="WHO MAKES THE FILM." />
          {PPF_BRANDS.map((brand) => (
            <div key={brand.id} className="card p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="flex flex-wrap items-center gap-2 font-display text-xl font-extrabold uppercase">
                    {brand.name}
                    <span
                      className={`chip ${
                        brand.installerStatus === "AUTHORISED"
                          ? "border-accent/35 bg-accent/12 text-accent"
                          : "border-gold/35 text-gold"
                      }`}
                    >
                      {brand.installerStatus === "AUTHORISED"
                        ? "Authorised installer"
                        : brand.installerStatus === "PENDING"
                          ? "Installer application in progress"
                          : "Under evaluation"}
                    </span>
                  </p>
                  <p className="mt-1 text-xs text-dim">{brand.origin}</p>
                </div>
                <a
                  href={brand.homepage}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="text-xs text-accent underline underline-offset-4"
                >
                  Manufacturer site
                </a>
              </div>
              <p className="mt-3 max-w-3xl text-sm leading-relaxed text-ash">{brand.blurb}</p>
              <ul className="mt-4 flex flex-wrap gap-2">
                {filmsByBrand(brand.id).map((film) => (
                  <li key={film.sku}>
                    <Link href={`/ppf/films/${film.slug}`} className="chip hover:border-accent hover:text-accent">
                      {film.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      <StickyPpfCta />
    </>
  );
}

function Cell({ text }: { text: string }) {
  return text === NOT_SPECIFIED ? <span className="text-dim">{text}</span> : <span>{text}</span>;
}
