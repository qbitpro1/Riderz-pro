"use client";

import { useState } from "react";
import { useBe6Build } from "./BuildState";
import { ProvenanceTag } from "./Label";
import { Icon } from "@/components/ui/Icon";
import { lakh } from "@/lib/format";
import { LADDER } from "@/lib/data/be6/factory";
import { STEPS, cardStats, entryBattery, entryPrice } from "@/lib/data/be6/ladder";
import type { ChangeKind } from "@/lib/data/be6/ladder";

/**
 * BASE → MID → HIGH → TOP, and the difference view.
 *
 * Horizontal comparison on desktop, a swipe rail on mobile. The "everything in
 * X plus" framing the brief asks for is built from the price and powertrain
 * deltas, which are exact. Where the equipment list is not verified, the card
 * says so — the alternative is inventing a feature list, which is the one
 * thing a comparison table must never do.
 */

const CHANGE_STYLE: Record<ChangeKind, { label: string; className: string }> = {
  added: { label: "ADDED", className: "border-accent/45 bg-accent/10 text-accent" },
  upgraded: { label: "UPGRADED", className: "border-accent/45 bg-accent/10 text-accent" },
  optional: { label: "OPTIONAL", className: "border-gold/45 bg-gold/10 text-gold" },
  unavailable: { label: "NOT AVAILABLE", className: "border-danger/40 bg-danger/10 text-danger" },
  unchanged: { label: "UNCHANGED", className: "border-tint/20 bg-tint/5 text-dim" },
};

export function Ladder() {
  const { build, setVariant } = useBe6Build();
  const [showDiff, setShowDiff] = useState(false);

  return (
    <div>
      {/* --- The four rungs -------------------------------------------- */}
      <div className="rail -mx-[1.125rem] px-[1.125rem] pb-2 md:mx-0 md:grid md:grid-cols-5 md:gap-3 md:overflow-visible md:px-0">
        {LADDER.map((v, i) => {
          const on = v.slug === build.variantSlug;
          const stats = cardStats(v.slug);
          const prev = i > 0 ? LADDER[i - 1] : null;
          const isTop = i === LADDER.length - 1;

          return (
            <article
              key={v.slug}
              className={`flex w-[16rem] shrink-0 flex-col border md:w-auto ${
                on ? "border-accent bg-accent/[0.06]" : "border-tint/10 bg-tint/[0.02]"
              }`}
            >
              <header className="border-b border-tint/[0.07] p-4">
                <p className="font-display text-[0.5625rem] uppercase tracking-[0.2em] text-dim">
                  BE 6 SPORTEQ
                </p>
                <h3 className={`display-3 mt-1 ${on ? "text-accent" : "text-chalk"}`}>{v.name}</h3>
                <p className="mt-1 font-display text-[0.625rem] uppercase tracking-[0.16em] text-ash">
                  {v.ladderLabel}
                </p>
                <p className="tnum mt-3 font-display text-xl font-extrabold text-chalk">
                  {lakh(entryPrice(v.slug))}
                </p>
                <p className="text-[0.625rem] text-dim">ex-showroom, from</p>
              </header>

              <div className="flex-1 p-4">
                {prev ? (
                  <p className="mb-3 font-display text-[0.625rem] font-bold uppercase tracking-[0.14em] text-accent">
                    {isTop ? "The full BE 6 experience" : `Everything in ${prev.name} +`}
                  </p>
                ) : (
                  <p className="mb-3 font-display text-[0.625rem] font-bold uppercase tracking-[0.14em] text-ash">
                    Starting configuration
                  </p>
                )}

                <dl className="space-y-1.5">
                  {stats.map((s) => (
                    <div key={s.label} className="flex items-baseline justify-between gap-3">
                      <dt className="text-[0.6875rem] text-dim">{s.label}</dt>
                      <dd className="tnum text-right text-[0.6875rem] font-semibold text-chalk">{s.value}</dd>
                    </div>
                  ))}
                </dl>

                <p className="mt-3 border-t border-tint/[0.07] pt-3 text-[0.6875rem] leading-relaxed text-ash">
                  {v.blurb}
                </p>
              </div>

              <button
                type="button"
                onClick={() => setVariant(v.slug)}
                className={`btn btn-sm m-4 mt-0 ${on ? "btn-accent" : "btn-outline"}`}
              >
                {on ? "SELECTED" : `SELECT ${v.name}`}
              </button>
            </article>
          );
        })}
      </div>

      {/* --- The difference view ---------------------------------------- */}
      <div className="mt-6">
        <button
          type="button"
          onClick={() => setShowDiff((s) => !s)}
          aria-expanded={showDiff}
          className="btn btn-outline btn-block md:w-auto"
        >
          {showDiff ? "HIDE THE DIFFERENCES" : "SHOW ME WHAT I GET FOR THE EXTRA MONEY"}
          <Icon name="arrow" size={15} className={showDiff ? "-rotate-90" : "rotate-90"} />
        </button>

        {showDiff && (
          <div className="mt-4 space-y-3">
            {STEPS.map((s) => (
              <div key={s.slug} className="card p-4 md:p-5">
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <h4 className="font-display text-base font-extrabold uppercase tracking-[0.06em] text-chalk">
                    {s.from.name} <span className="text-dim">→</span> {s.to.name}
                  </h4>
                  <p className="tnum font-display text-sm font-bold text-accent">
                    + {lakh(s.priceDelta)}
                  </p>
                </div>
                <p className="tnum mt-0.5 text-[0.6875rem] text-dim">
                  {lakh(s.fromPrice)} → {lakh(s.toPrice)}, cheapest to cheapest
                </p>

                <ul className="mt-3 space-y-2">
                  {s.changes.map((c, i) => {
                    const style = CHANGE_STYLE[c.kind];
                    return (
                      <li key={i} className="flex flex-wrap items-start gap-2">
                        <span
                          className={`shrink-0 border px-1.5 py-0.5 font-display text-[0.5rem] font-bold uppercase tracking-[0.14em] ${style.className}`}
                        >
                          {style.label}
                        </span>
                        <span className="min-w-0 flex-1 text-xs leading-relaxed">
                          <span className="font-semibold text-chalk">{c.label}</span>
                          <span className="text-ash"> — {c.detail}</span>
                        </span>
                      </li>
                    );
                  })}
                </ul>

                {s.unverified && (
                  <p className="mt-3 border-l-2 border-tint/15 pl-3 text-[0.6875rem] leading-relaxed text-dim">
                    {s.unverified}
                  </p>
                )}
              </div>
            ))}

            <p className="text-[0.6875rem] leading-relaxed text-dim">
              Powertrain, range, charging and price differences are computed from Mahindra&apos;s published figures.
              Equipment differences are not published here until we have verified them line by line against the
              official variant chart.
            </p>
          </div>
        )}
      </div>

      <div className="mt-6 flex flex-wrap items-center gap-3">
        <ProvenanceTag provenance="MAHINDRA FACTORY" />
        <p className="text-[0.6875rem] text-dim">
          Every figure in this comparison is Mahindra&apos;s. Nothing Riderzpro sells appears in it.
        </p>
      </div>

      {/* Editions are deliberately outside the ladder. */}
      <EditionNote />
    </div>
  );
}

function EditionNote() {
  const b = entryBattery("fe");
  return (
    <div className="mt-4 border border-tint/10 bg-tint/[0.02] p-4">
      <h4 className="font-display text-xs font-bold uppercase tracking-[0.16em] text-chalk">
        Editions sit outside this ladder
      </h4>
      <p className="mt-1.5 text-[0.6875rem] leading-relaxed text-ash">
        Mahindra also sells the SPORTEQ Launch Edition, the Formula E Edition and the Formula E Freedom Edition. They
        are not a further rung — they are the top of the range in edition-specific paint and trim, all on the{" "}
        {b?.label} pack. They are shown in the variant selector above rather than in this ladder, so the four-step
        comparison stays a like-for-like one.
      </p>
    </div>
  );
}
