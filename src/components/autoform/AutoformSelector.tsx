"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";
import { Icon } from "@/components/ui/Icon";
import { rupees } from "@/lib/format";
import { whatsapp } from "@/lib/data/site";
import { BRANDS } from "@/lib/data/vehicles";

export type DesignCard = {
  code: string;
  slug: string;
  tagline: string;
  series: string;
  seriesGroup: "ECO" | "PREMIUM";
  image: string;
  price: { two: { mrp: number; selling: number }; three: { mrp: number; selling: number } };
};

const SEAT_OPTIONS = [
  { seats: 5, label: "5-seater", rows: 2 as const },
  { seats: 7, label: "6 / 7-seater", rows: 3 as const },
];

const STYLE_FILTERS = [
  { id: "all", label: "All designs" },
  { id: "ECO", label: "Eco Series" },
  { id: "PREMIUM", label: "Premium Series" },
];

/**
 * WHAT DO YOU DRIVE?
 *
 * The price list only distinguishes 2-row from 3-row, so the vehicle picker
 * resolves to a seat-row count and nothing finer. Per-model fitment is not in
 * either source document, so the page says so rather than implying a match.
 */
export function AutoformSelector({ designs }: { designs: DesignCard[] }) {
  const [brandSlug, setBrandSlug] = useState("");
  const [modelSlug, setModelSlug] = useState("");
  const [variant, setVariant] = useState("");
  const [year, setYear] = useState("");
  const [seats, setSeats] = useState<5 | 7>(5);
  const [style, setStyle] = useState("all");
  const [budget, setBudget] = useState<number | null>(null);

  const brand = BRANDS.find((b) => b.slug === brandSlug);
  const model = brand?.models.find((m) => m.slug === modelSlug);
  const rows = seats >= 6 ? 3 : 2;
  const vehicle = brand && model ? `${year || ""} ${brand.name} ${model.name} ${variant}`.trim() : "";

  const shown = useMemo(() => {
    let out = designs;
    if (style !== "all") out = out.filter((d) => d.seriesGroup === style);
    if (budget) out = out.filter((d) => (rows === 2 ? d.price.two.selling : d.price.three.selling) <= budget);
    return [...out].sort((a, b) => {
      const pa = rows === 2 ? a.price.two.selling : a.price.three.selling;
      const pb = rows === 2 ? b.price.two.selling : b.price.three.selling;
      return pa - pb;
    });
  }, [designs, style, budget, rows]);

  return (
    <div>
      {/* selector ---------------------------------------------------- */}
      <div className="card p-5 md:p-6">
        <p className="eyebrow mb-2">Car-specific</p>
        <h2 className="display-3">WHAT DO YOU DRIVE?</h2>
        <p className="mt-2 max-w-lg text-sm text-ash">
          Autoform covers are made to your car. Tell us the vehicle and the seat layout and we price
          it correctly — a 7-seater needs three rows of covers, not two.
        </p>

        <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <select
            className="field"
            aria-label="Brand"
            value={brandSlug}
            onChange={(e) => {
              setBrandSlug(e.target.value);
              setModelSlug("");
              setVariant("");
              setYear("");
            }}
          >
            <option value="">Brand</option>
            {BRANDS.map((b) => (
              <option key={b.slug} value={b.slug}>
                {b.name}
              </option>
            ))}
          </select>
          <select
            className="field"
            aria-label="Model"
            value={modelSlug}
            disabled={!brand}
            onChange={(e) => {
              setModelSlug(e.target.value);
              setVariant("");
            }}
          >
            <option value="">Model</option>
            {brand?.models.map((m) => (
              <option key={m.slug} value={m.slug}>
                {m.name}
              </option>
            ))}
          </select>
          <select className="field" aria-label="Year" value={year} disabled={!model} onChange={(e) => setYear(e.target.value)}>
            <option value="">Year</option>
            {model?.years.map((y) => (
              <option key={y}>{y}</option>
            ))}
          </select>
          <select className="field" aria-label="Variant" value={variant} disabled={!model} onChange={(e) => setVariant(e.target.value)}>
            <option value="">Variant</option>
            {model?.variants.map((v) => (
              <option key={v}>{v}</option>
            ))}
          </select>
        </div>

        <p className="label mt-5">Seat configuration</p>
        <div className="flex flex-wrap gap-2">
          {SEAT_OPTIONS.map((o) => (
            <button
              key={o.seats}
              type="button"
              onClick={() => setSeats(o.seats as 5 | 7)}
              aria-pressed={seats === o.seats}
              className={`chip ${seats === o.seats ? "chip-active" : "hover:border-accent hover:text-accent"}`}
            >
              {o.label} · {o.rows} rows
            </button>
          ))}
        </div>

        {vehicle && (
          <p className="mt-4 flex items-start gap-2 border border-accent/25 bg-accent/6 p-3 text-xs text-chalk/85">
            <Icon name="check" size={14} className="mt-0.5 shrink-0 text-accent" />
            <span>
              Pricing shown for <span className="font-semibold">{vehicle}</span> as a {rows}-row set.
              Autoform makes each set to the vehicle — we confirm the exact pattern for your variant
              when you book, since per-model fitment is not published in the price list.
            </span>
          </p>
        )}
      </div>

      {/* filters ----------------------------------------------------- */}
      <div className="mt-6 flex flex-wrap items-center gap-3">
        <div className="flex flex-wrap gap-2">
          {STYLE_FILTERS.map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() => setStyle(f.id)}
              className={`chip ${style === f.id ? "chip-active" : "hover:border-accent hover:text-accent"}`}
            >
              {f.label}
            </button>
          ))}
        </div>
        <div className="ml-auto flex flex-wrap gap-2">
          {[15000, 20000, 25000].map((b) => (
            <button
              key={b}
              type="button"
              onClick={() => setBudget(budget === b ? null : b)}
              className={`chip ${budget === b ? "chip-active" : "hover:border-accent hover:text-accent"}`}
            >
              Under {rupees(b)}
            </button>
          ))}
        </div>
      </div>

      <p className="mt-4 text-xs text-ash tnum">
        {shown.length} design{shown.length === 1 ? "" : "s"} · prices shown for a {rows}-row set
      </p>

      {/* grid -------------------------------------------------------- */}
      <ul className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-3 md:gap-4 lg:grid-cols-4">
        {shown.map((d) => {
          const p = rows === 2 ? d.price.two : d.price.three;
          return (
            <li key={d.slug}>
              <article className="card card-hover flex h-full flex-col">
                <Link href={`/autoform/${d.slug}`} className="relative block aspect-[4/3] overflow-hidden bg-[#f3f4f5]">
                  <Image src={d.image} alt={`Autoform ${d.code} seat cover design`} fill sizes="(min-width:1024px) 25vw, 46vw" className="object-cover" />
                </Link>
                <div className="flex flex-1 flex-col p-3.5">
                  <p className="font-display text-[10px] font-bold uppercase tracking-[0.16em] text-accent">{d.series}</p>
                  <h3 className="mt-1 font-display text-base font-extrabold uppercase tracking-[-0.01em]">
                    <Link href={`/autoform/${d.slug}`} className="transition-colors hover:text-accent">
                      {d.code}
                    </Link>
                  </h3>
                  <p className="mt-1 line-clamp-2 text-[11px] leading-snug text-ash">{d.tagline}</p>
                  <div className="mt-auto pt-3">
                    <p className="flex items-baseline gap-2">
                      <span className="font-display text-lg font-extrabold tnum">{rupees(p.selling)}</span>
                      <span className="text-xs text-dim line-through tnum">{rupees(p.mrp)}</span>
                    </p>
                    <p className="mt-1 text-[10px] text-dim">{rows}-row set · installation available</p>
                  </div>
                </div>
              </article>
            </li>
          );
        })}
      </ul>

      {shown.length === 0 && (
        <div className="card mt-4 p-10 text-center">
          <p className="font-display text-xl uppercase">Nothing in that budget</p>
          <p className="mt-2 text-sm text-ash">Clear the filter, or ask us — Autoform runs offers through the year.</p>
        </div>
      )}

      <div className="card mt-6 flex flex-col items-start justify-between gap-4 p-5 md:flex-row md:items-center">
        <p className="text-sm text-ash">
          Not sure which design suits your interior? Send us a photo of your seats.
        </p>
        <a
          href={whatsapp(
            `Hi Riderzpro, I want Autoform seat covers${vehicle ? ` for my ${vehicle}` : ""}. Seat layout: ${rows === 2 ? "5-seater" : "6/7-seater"}.`,
          )}
          target="_blank"
          rel="noreferrer noopener"
          className="btn btn-whatsapp btn-sm"
        >
          <Icon name="whatsapp" size={15} />
          Help me choose
        </a>
      </div>
    </div>
  );
}
