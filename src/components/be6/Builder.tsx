"use client";

import Link from "next/link";
import { useState } from "react";
import { useBe6Build } from "./BuildState";
import { ProvenanceTag, StageTag, ValidationNotice } from "./Label";
import { Icon } from "@/components/ui/Icon";
import { lakh, rupees } from "@/lib/format";
import { whatsapp } from "@/lib/data/site";
import {
  STAGE_COPY,
  UPGRADE_GROUPS,
  UPGRADES,
  type Upgrade,
  type UpgradeGroupSlug,
} from "@/lib/data/be6/motorbotz";

/**
 * BUILD YOUR MOTORBOTZ BE 6.
 *
 * Layer 2: the factory car plus what we fit to it. The factory price and the
 * Motorbotz total are added together but never merged into one line — the
 * customer has to be able to see which half of the number is Mahindra's.
 *
 * Anything that is not yet sellable appears with its stage and no price, and
 * cannot be ticked. A concept in a shopping list is how a customer ends up
 * expecting something we cannot deliver.
 */

export function Builder() {
  const { build, selected, toggleUpgrade, clearUpgrades } = useBe6Build();
  // Collapsed on arrival. Eleven groups of open accordions is most of why the
  // first version of this page felt like a wall — the summary panel beside it
  // is the thing worth seeing first.
  const [open, setOpen] = useState<UpgradeGroupSlug | null>(null);

  const factory = selected.factoryPrice ?? 0;
  const total = factory + selected.upgradeTotal;

  const conceptCount = UPGRADES.filter((u) => !STAGE_COPY[u.stage].sellable).length;

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_22rem] lg:items-start">
      {/* --- The catalogue ---------------------------------------------- */}
      <div className="space-y-2">
        {UPGRADE_GROUPS.map((g) => {
          const items = UPGRADES.filter((u) => u.group === g.slug);
          const chosen = items.filter((u) => build.upgrades.includes(u.slug)).length;
          const isOpen = open === g.slug;

          return (
            <section key={g.slug} className="card">
              <button
                type="button"
                onClick={() => setOpen(isOpen ? null : g.slug)}
                aria-expanded={isOpen}
                className="flex w-full items-center justify-between gap-3 p-4 text-left"
              >
                <span className="min-w-0">
                  <span className="block font-display text-sm font-extrabold uppercase tracking-[0.08em] text-chalk">
                    {g.banner}
                  </span>
                  <span className="mt-0.5 block text-[0.6875rem] leading-relaxed text-dim">{g.caption}</span>
                </span>
                <span className="flex shrink-0 items-center gap-2">
                  {chosen > 0 && (
                    <span className="flex h-5 min-w-5 items-center justify-center bg-accent px-1 font-display text-[0.625rem] font-bold text-[#04161d]">
                      {chosen}
                    </span>
                  )}
                  <Icon name="chevron" size={16} className={isOpen ? "rotate-180 text-accent" : "text-dim"} />
                </span>
              </button>

              {isOpen && (
                <div className="border-t border-white/[0.07] p-4 pt-3">
                  {g.href && (
                    <Link
                      href={g.href}
                      className="mb-3 inline-flex items-center gap-1.5 border-b border-white/20 pb-0.5 font-display text-[0.625rem] font-bold uppercase tracking-[0.14em] text-ash transition-colors hover:border-accent hover:text-accent"
                    >
                      Full {g.title.toLowerCase()} catalogue
                      <Icon name="arrow" size={12} />
                    </Link>
                  )}
                  <ul className="space-y-2">
                    {items.map((u) => (
                      <UpgradeRow
                        key={u.slug}
                        upgrade={u}
                        checked={build.upgrades.includes(u.slug)}
                        onToggle={() => toggleUpgrade(u.slug)}
                      />
                    ))}
                  </ul>
                </div>
              )}
            </section>
          );
        })}

        <p className="pt-2 text-[0.6875rem] leading-relaxed text-dim">
          {conceptCount} of the {UPGRADES.length} items above are not yet on sale. They are shown with their
          development stage and no price, and cannot be added to a build.
        </p>
      </div>

      {/* --- The running total ------------------------------------------ */}
      <aside className="lg:sticky lg:top-24">
        <div className="card p-4 md:p-5">
          <h3 className="font-display text-xs font-bold uppercase tracking-[0.18em] text-chalk">Your BE 6</h3>

          <div className="mt-4 border-b border-white/[0.07] pb-3">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <ProvenanceTag provenance="MAHINDRA FACTORY" className="mb-1.5" />
                <p className="font-display text-sm font-bold text-chalk">
                  BE 6 SPORTEQ {selected.variant.name}
                </p>
                <p className="text-[0.6875rem] text-dim">
                  {selected.battery.label} · {selected.battery.certifiedRangeKm} km certified
                </p>
              </div>
              <p className="tnum shrink-0 font-display text-sm font-bold text-chalk">{lakh(factory)}</p>
            </div>
          </div>

          <div className="border-b border-white/[0.07] py-3">
            <div className="mb-2 flex items-center justify-between">
              <ProvenanceTag provenance="MOTORBOTZ CUSTOM" />
              {selected.upgrades.length > 0 && (
                <button
                  type="button"
                  onClick={clearUpgrades}
                  className="font-display text-[0.5625rem] uppercase tracking-[0.14em] text-dim transition-colors hover:text-danger"
                >
                  Clear
                </button>
              )}
            </div>

            {selected.upgrades.length === 0 ? (
              <p className="text-[0.6875rem] text-dim">Nothing added yet.</p>
            ) : (
              <ul className="space-y-1.5">
                {selected.upgrades.map((u) => (
                  <li key={u.slug} className="flex items-baseline justify-between gap-3">
                    <span className="min-w-0 text-[0.6875rem] text-ash">{u.name}</span>
                    <span className="tnum shrink-0 text-[0.6875rem] text-chalk">{rupees(u.price ?? 0)}</span>
                  </li>
                ))}
              </ul>
            )}

            <div className="mt-2.5 flex items-baseline justify-between border-t border-white/[0.07] pt-2.5">
              <span className="font-display text-[0.625rem] uppercase tracking-[0.14em] text-ash">
                Motorbotz upgrades
              </span>
              <span className="tnum font-display text-sm font-bold text-accent">
                {rupees(selected.upgradeTotal)}
              </span>
            </div>
          </div>

          {/* Concepts are listed, not priced. */}
          <div className="border-b border-white/[0.07] py-3">
            <ProvenanceTag provenance="MOTORBOTZ CONCEPT" className="mb-2" />
            <ul className="space-y-1">
              {["Armor security", "Security glass", "Quantum Shield", "AI Drive"].map((n) => (
                <li key={n} className="flex items-baseline justify-between gap-3">
                  <span className="text-[0.6875rem] text-ash">{n}</span>
                  <span className="font-display text-[0.5625rem] uppercase tracking-[0.14em] text-gold">
                    Coming soon
                  </span>
                </li>
              ))}
            </ul>
            <p className="mt-2 text-[0.625rem] leading-relaxed text-dim">
              Concepts carry no price and are not part of the total.
            </p>
          </div>

          <div className="pt-4">
            <p className="font-display text-[0.625rem] uppercase tracking-[0.18em] text-dim">
              Estimated build value
            </p>
            <p className="tnum mt-1 font-display text-3xl font-extrabold text-chalk">{lakh(total)}</p>
            <p className="mt-1.5 text-[0.625rem] leading-relaxed text-dim">
              Factory price is ex-showroom and excludes registration, insurance, road tax and the wall charger.
              Motorbotz prices are installed estimates and are confirmed after the car is in front of us.
            </p>
          </div>

          <div className="mt-4 space-y-2">
            <button type="button" className="btn btn-accent btn-block" onClick={() => saveBuild(build)}>
              SAVE MY BUILD
            </button>
            <a
              href={whatsapp(
                `Hi Motorbotz — I'd like a quote on a BE 6 SPORTEQ ${selected.variant.name} (${selected.battery.label}) with ${selected.upgrades.length} Motorbotz upgrade(s). Estimated build value ${lakh(total)}.`,
              )}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-whatsapp btn-block"
            >
              <Icon name="whatsapp" size={16} />
              REQUEST QUOTE
            </a>
            <Link href="/contact" className="btn btn-outline btn-block">
              BOOK CONSULTATION
            </Link>
          </div>
        </div>
      </aside>
    </div>
  );
}

function UpgradeRow({
  upgrade: u,
  checked,
  onToggle,
}: {
  upgrade: Upgrade;
  checked: boolean;
  onToggle: () => void;
}) {
  const sellable = STAGE_COPY[u.stage].sellable && u.price !== null;

  return (
    <li>
      <label
        className={`flex gap-3 border p-3 transition-colors ${
          !sellable
            ? "cursor-not-allowed border-white/[0.06] bg-transparent"
            : checked
              ? "cursor-pointer border-accent/50 bg-accent/[0.07]"
              : "cursor-pointer border-white/10 bg-white/[0.02] hover:border-white/25"
        }`}
      >
        <input
          type="checkbox"
          checked={checked}
          disabled={!sellable}
          onChange={onToggle}
          className="mt-0.5 h-4 w-4 shrink-0 accent-[#5ce1ff]"
        />
        <span className="min-w-0 flex-1">
          <span className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
            <span className={`font-display text-xs font-bold ${sellable ? "text-chalk" : "text-dim"}`}>
              {u.name}
            </span>
            <span className="tnum shrink-0 text-xs font-semibold text-chalk">
              {sellable ? rupees(u.price!) : <span className="text-gold">{u.priceNote}</span>}
            </span>
          </span>

          <span className="mt-1.5 flex flex-wrap items-center gap-1.5">
            <ProvenanceTag provenance={u.provenance} />
            <StageTag stage={u.stage} />
          </span>

          <span className="mt-1.5 block text-[0.6875rem] leading-relaxed text-ash">{u.blurb}</span>

          {u.sourcedFrom && (
            <span className="mt-1 block text-[0.625rem] text-dim">From our {u.sourcedFrom.label}.</span>
          )}

          {u.validation && u.validation.length > 0 && (
            <ValidationNotice domains={u.validation} className="mt-2" />
          )}
        </span>
      </label>
    </li>
  );
}

/**
 * Saving is local for now — there is no build endpoint on this site yet, and a
 * button that pretends to reach a server it cannot reach is worse than one
 * that says where the build went.
 */
function saveBuild(build: unknown) {
  try {
    window.localStorage.setItem("mb:be6-saved", JSON.stringify({ build, at: new Date().toISOString() }));
    window.alert(
      "Build saved to this browser. It will be here when you come back. To have us price it properly, use Request Quote.",
    );
  } catch {
    window.alert("Could not save the build in this browser. Use Request Quote and we will keep it on our side.");
  }
}
