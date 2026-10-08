"use client";

import Link from "next/link";
import { useBe6Build } from "./BuildState";
import { VehicleImage, ImageCredit } from "./VehicleImage";
import { ProvenanceTag } from "./Label";
import { lakh, rupees } from "@/lib/format";
import {
  BAAS,
  BATTERIES,
  COLOUR_NOTE,
  VARIANTS,
  baasMonthly,
  colour as findColour,
  coloursFor,
} from "@/lib/data/be6/factory";

/**
 * CHOOSE YOUR BE 6 — the factory configurator.
 *
 * Walks the sequence the brief asks for: variant, then battery, then wheel,
 * then colour, then what it costs. Only combinations Mahindra actually sells
 * are reachable — picking a variant that does not offer your pack moves you to
 * one it does, rather than quoting a car that cannot be ordered.
 */

export function Configurator() {
  const { build, selected, setVariant, setBattery, setColour } = useBe6Build();
  const activeColour = findColour(build.colourSlug);

  const packsForVariant = selected.variant.prices.map((p) => p.batteryId);
  const availableColours = coloursFor(selected.variant.slug);

  return (
    <div className="card">
      {/* --- The vehicle ------------------------------------------------ */}
      <div className="relative border-b border-white/[0.07] bg-[radial-gradient(120%_90%_at_50%_0%,rgba(92,225,255,0.07),transparent_60%)] px-4 pb-4 pt-6 md:px-8 md:pt-10">
        <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
          <ProvenanceTag provenance="MAHINDRA FACTORY" />
          <span className="font-display text-[0.5625rem] uppercase tracking-[0.18em] text-dim">
            {activeColour.name} · {activeColour.finish}
          </span>
        </div>

        <VehicleImage colour={activeColour} sizes="(min-width: 768px) 60rem, 100vw" />
        <ImageCredit className="mt-1" />
      </div>

      <div className="divide-y divide-white/[0.07]">
        {/* --- 1. Variant ---------------------------------------------- */}
        <Step n={1} title="VARIANT">
          <div className="rail -mx-4 px-4 pb-1 md:mx-0 md:grid md:grid-cols-4 md:gap-2 md:overflow-visible md:px-0">
            {VARIANTS.map((v) => {
              const on = v.slug === build.variantSlug;
              const from = Math.min(...v.prices.map((p) => p.exShowroom));
              return (
                <button
                  key={v.slug}
                  type="button"
                  onClick={() => setVariant(v.slug)}
                  aria-pressed={on}
                  className={`w-[8.5rem] shrink-0 border p-3 text-left transition-colors md:w-auto ${
                    on ? "border-accent bg-accent/10" : "border-white/10 bg-white/[0.02] hover:border-white/25"
                  }`}
                >
                  <span className={`block font-display text-sm font-bold ${on ? "text-accent" : "text-chalk"}`}>
                    {v.name}
                  </span>
                  <span className="mt-0.5 block text-[0.625rem] uppercase tracking-[0.12em] text-dim">
                    {v.edition ? "Edition" : v.ladderLabel}
                  </span>
                  <span className="mt-1.5 block tnum text-xs text-ash">{lakh(from)}</span>
                </button>
              );
            })}
          </div>
          <p className="mt-3 text-xs leading-relaxed text-ash">{selected.variant.blurb}</p>
        </Step>

        {/* --- 2. Battery ---------------------------------------------- */}
        <Step n={2} title="BATTERY">
          <div className="grid gap-2 sm:grid-cols-3">
            {BATTERIES.map((b) => {
              const offered = packsForVariant.includes(b.id);
              const on = offered && b.id === build.batteryId;
              const price = selected.variant.prices.find((p) => p.batteryId === b.id);
              return (
                <button
                  key={b.id}
                  type="button"
                  disabled={!offered}
                  onClick={() => setBattery(b.id)}
                  aria-pressed={on}
                  className={`border p-3 text-left transition-colors ${
                    on
                      ? "border-accent bg-accent/10"
                      : offered
                        ? "border-white/10 bg-white/[0.02] hover:border-white/25"
                        : "cursor-not-allowed border-white/[0.06] bg-transparent opacity-35"
                  }`}
                >
                  <span className={`block font-display text-sm font-bold ${on ? "text-accent" : "text-chalk"}`}>
                    {b.label}
                  </span>
                  <span className="mt-1 block tnum text-[0.6875rem] text-ash">
                    {b.certifiedRangeKm} km certified · {b.powerKw} kW
                  </span>
                  <span className="mt-1 block tnum text-[0.6875rem] text-dim">
                    {offered ? (price ? lakh(price.exShowroom) : "") : `Not offered on ${selected.variant.name}`}
                  </span>
                </button>
              );
            })}
          </div>
          <p className="mt-3 text-[0.6875rem] text-dim">
            Certified {selected.battery.rangeCycle}. Good for comparing cars, not for planning a journey.
          </p>
        </Step>

        {/* --- 3. Wheels ------------------------------------------------ */}
        <Step n={3} title="WHEELS">
          <div className="flex flex-wrap items-center gap-2">
            <span className="chip chip-active">{selected.variant.wheel}</span>
            <ProvenanceTag provenance="MAHINDRA FACTORY" />
          </div>
          <p className="mt-3 text-[0.6875rem] leading-relaxed text-dim">
Wheel size is fixed by variant — ONE runs R18 aero covers, TWO R19 with aero covers, THREE upward R19
            alloys, and the Formula E editions R20. There is no factory wheel choice within a variant. Motorbotz
            alternatives are a separate section and are never mixed into the factory specification.
          </p>
        </Step>

        {/* --- 3b. Screens ---------------------------------------------- */}
        <Step n={4} title="SCREENS">
          <div className="flex flex-wrap items-center gap-2">
            <span className="chip chip-active">{selected.variant.screens}</span>
            <ProvenanceTag provenance="MAHINDRA FACTORY" />
          </div>
          <p className="mt-3 text-[0.6875rem] text-dim">
            Two screens on ONE, three from TWO up. The Formula E editions keep two — the one place in the range where
            paying more gets you fewer.
          </p>
        </Step>

        {/* --- 5. Colour ------------------------------------------------- */}
        <Step n={5} title="COLOUR">
          <div className="flex flex-wrap gap-2">
            {availableColours.map((c) => {
              const on = c.slug === build.colourSlug;
              return (
                <button
                  key={c.slug}
                  type="button"
                  onClick={() => setColour(c.slug)}
                  aria-pressed={on}
                  title={`${c.name} — ${c.finish}`}
                  className={`group relative h-11 w-11 border-2 transition-transform ${
                    on ? "border-accent scale-110" : "border-white/20 hover:border-white/50"
                  }`}
                  style={{ background: c.hex }}
                >
                  <span className="sr-only">
                    {c.name}, {c.finish}
                  </span>
                  {c.finish === "Satin" && (
                    <span className="absolute inset-0 bg-[repeating-linear-gradient(45deg,rgba(255,255,255,0.09)_0_2px,transparent_2px_4px)]" />
                  )}
                </button>
              );
            })}
          </div>

          <p className="mt-3 font-display text-sm font-bold text-chalk">
            {activeColour.name}
            <span className="ml-2 font-sans text-[0.6875rem] font-normal uppercase tracking-[0.12em] text-dim">
              {activeColour.finish}
            </span>
          </p>
          {activeColour.exclusiveTo && (
            <p className="mt-1 text-[0.6875rem] text-gold">Exclusive to the {activeColour.exclusiveTo}.</p>
          )}
          <p className="mt-2 text-[0.625rem] leading-relaxed text-dim">{COLOUR_NOTE}</p>
        </Step>

        {/* --- 5. Price -------------------------------------------------- */}
        <Step n={6} title="PRICE">
          {selected.factoryPrice !== null ? (
            <>
              <p className="tnum font-display text-3xl font-extrabold text-chalk md:text-4xl">
                {lakh(selected.factoryPrice)}
              </p>
              <p className="mt-1 text-[0.6875rem] text-dim">
                Ex-showroom, pan-India. Excludes the wall charger and its installation.
              </p>

              {selected.baasPrice !== null && (
                <div className="mt-4 border border-accent/25 bg-accent/[0.05] p-3">
                  <p className="font-display text-[0.5625rem] font-bold uppercase tracking-[0.16em] text-accent">
                    Or with Battery-as-a-Service
                  </p>
                  <p className="tnum mt-1.5 font-display text-2xl font-extrabold text-chalk">
                    {lakh(selected.baasPrice)}
                    <span className="ml-2 font-sans text-xs font-normal text-ash">
                      + {rupees(baasMonthly())}/mo battery
                    </span>
                  </p>
                  <p className="mt-1.5 text-[0.625rem] leading-relaxed text-ash">
                    ₹{BAAS.perKm}/km at Mahindra&apos;s stated {BAAS.basisKmPerDay} km-a-day basis, on top of the
                    price above, for as long as you keep the car. Drive further and it rises.
                  </p>
                </div>
              )}
            </>
          ) : (
            <p className="text-sm text-dim">This combination is not offered.</p>
          )}
        </Step>
      </div>

      {/* --- Hand off to layer 2 ---------------------------------------- */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-white/[0.07] bg-white/[0.02] p-4">
        <p className="text-xs text-ash">
          That is the BE 6 as Mahindra sells it. Everything past here is ours.
        </p>
        <Link href="#build" className="btn btn-accent btn-sm shrink-0">
          BUILD YOUR MOTORBOTZ BE 6
        </Link>
      </div>
    </div>
  );
}

function Step({ n, title, children }: { n: number; title: string; children: React.ReactNode }) {
  return (
    <div className="p-4 md:p-6">
      <div className="mb-3 flex items-center gap-2.5">
        <span className="flex h-6 w-6 shrink-0 items-center justify-center border border-white/20 font-display text-[0.625rem] font-bold text-ash">
          {n}
        </span>
        <h3 className="font-display text-xs font-bold uppercase tracking-[0.18em] text-chalk">{title}</h3>
      </div>
      {children}
    </div>
  );
}
