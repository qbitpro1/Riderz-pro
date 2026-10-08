"use client";

import { useState } from "react";
import { VehicleImage, ImageCredit } from "./VehicleImage";
import { ProvenanceTag } from "./Label";
import { HOTSPOTS, MANUAL_STATUS } from "@/lib/data/be6/specs";
import { colour as findColour } from "@/lib/data/be6/factory";

/**
 * EXPLORE THE BE 6.
 *
 * A rotatable 3D model would need vehicle geometry we do not have a licence
 * to. What we can do honestly is an annotated elevation: tap a point, get the
 * fact that belongs to it. Every hotspot carries only sourced information, and
 * the one whose answer properly belongs to the owner's manual says so instead
 * of guessing.
 */

export function Explorer() {
  const [view, setView] = useState<"exterior" | "interior">("exterior");
  const [active, setActive] = useState<string | null>("charge-port");

  const spots = HOTSPOTS.filter((h) => h.view === view);
  const shown = spots.find((h) => h.slug === active) ?? spots[0];
  const shell = findColour("stealth-black");

  return (
    <div className="card overflow-hidden">
      <div className="flex items-center justify-between gap-3 border-b border-white/[0.07] p-3">
        <div className="flex gap-1">
          {(["exterior", "interior"] as const).map((v) => (
            <button
              key={v}
              type="button"
              onClick={() => {
                setView(v);
                setActive(null);
              }}
              aria-pressed={view === v}
              className={`chip ${view === v ? "chip-active" : ""}`}
            >
              {v}
            </button>
          ))}
        </div>
        <ProvenanceTag provenance="MAHINDRA FACTORY" />
      </div>

      <div className="relative bg-[radial-gradient(110%_80%_at_50%_20%,rgba(92,225,255,0.06),transparent_65%)]">
        <VehicleImage colour={shell} sizes="(min-width: 768px) 60rem, 100vw" className={view === "interior" ? "opacity-40" : ""} />

        {/* Hotspots sit over the drawing in percentage space, so they track it
            at every width without a second set of breakpoints. */}
        {spots.map((h) => {
          const on = shown?.slug === h.slug;
          return (
            <button
              key={h.slug}
              type="button"
              onClick={() => setActive(h.slug)}
              aria-pressed={on}
              aria-label={h.label}
              className="absolute -translate-x-1/2 -translate-y-1/2"
              style={{ left: `${h.x}%`, top: `${h.y}%` }}
            >
              <span
                className={`flex h-6 w-6 items-center justify-center rounded-full border transition-all ${
                  on
                    ? "scale-125 border-accent bg-accent text-[#04161d]"
                    : "border-accent/60 bg-void/80 text-accent hover:scale-110"
                }`}
              >
                <span className={`h-1.5 w-1.5 rounded-full bg-current ${on ? "" : "pulse-dot"}`} />
              </span>
            </button>
          );
        })}

      </div>

      <ImageCredit className="px-3 pb-2" />

      {shown && (
        <div className="border-t border-white/[0.07] p-4 md:p-5">
          <h3 className="font-display text-sm font-extrabold uppercase tracking-[0.1em] text-chalk">
            {shown.label}
          </h3>
          {shown.needsManual ? (
            <p className="mt-2 border-l-2 border-gold/50 bg-gold/[0.05] px-3 py-2 text-xs leading-relaxed text-ash">
              <strong className="text-gold">Awaiting the owner&apos;s manual.</strong> {MANUAL_STATUS.body}
            </p>
          ) : (
            <p className="mt-1.5 text-xs leading-relaxed text-ash">{shown.body}</p>
          )}
        </div>
      )}

      <div className="flex flex-wrap gap-1.5 border-t border-white/[0.07] p-3">
        {spots.map((h) => (
          <button
            key={h.slug}
            type="button"
            onClick={() => setActive(h.slug)}
            className={`chip ${shown?.slug === h.slug ? "chip-active" : ""}`}
          >
            {h.label}
          </button>
        ))}
      </div>
    </div>
  );
}
