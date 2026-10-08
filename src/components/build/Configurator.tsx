"use client";

import { useEffect, useMemo, useState } from "react";
import { Icon } from "@/components/ui/Icon";
import { rupees } from "@/lib/format";
import { whatsapp } from "@/lib/data/site";
import { BRANDS } from "@/lib/data/vehicles";
import {
  BUILD_PRESETS,
  BUILD_STAGES,
  GST_RATE,
  INSTALLATION_RATE,
  type BuildOption,
} from "@/lib/data/configurator";
import { readGarage } from "@/components/fitment/FitmentPicker";

export function Configurator() {
  const [brandSlug, setBrandSlug] = useState("");
  const [modelSlug, setModelSlug] = useState("");
  const [year, setYear] = useState("");
  const [stage, setStage] = useState(BUILD_STAGES[0].slug);
  const [picked, setPicked] = useState<Set<string>>(new Set());

  useEffect(() => {
    const g = readGarage();
    if (g) {
      setBrandSlug(g.brandSlug);
      setModelSlug(g.modelSlug);
      setYear(String(g.year));
    }
  }, []);

  const brand = BRANDS.find((b) => b.slug === brandSlug);
  const model = brand?.models.find((m) => m.slug === modelSlug);
  const isOffroad = Boolean(model?.offroad);

  const allOptions = useMemo(() => {
    const map = new Map<string, BuildOption & { stage: string }>();
    for (const s of BUILD_STAGES) {
      for (const o of s.options) map.set(o.slug, { ...o, stage: s.name });
    }
    return map;
  }, []);

  const selected = useMemo(
    () => [...picked].map((slug) => allOptions.get(slug)).filter(Boolean) as (BuildOption & { stage: string })[],
    [picked, allOptions],
  );

  const parts = selected.reduce((n, o) => n + o.price, 0);
  const labour = Math.round(parts * INSTALLATION_RATE);
  const gst = Math.round((parts + labour) * GST_RATE);
  const total = parts + labour + gst;

  function toggle(slug: string) {
    setPicked((prev) => {
      const next = new Set(prev);
      if (next.has(slug)) next.delete(slug);
      else next.add(slug);
      return next;
    });
  }

  function applyPreset(slugs: string[]) {
    setPicked(new Set(slugs.filter((s) => {
      const opt = allOptions.get(s);
      return opt && (!opt.only?.includes("off-road") || isOffroad);
    })));
  }

  const vehicleLabel = model && brand ? `${year || model.years[0]} ${brand.name} ${model.name}` : "my car";

  const quoteMessage = [
    `Hi Motorbotz, I've configured a build on the website.`,
    `Vehicle: ${vehicleLabel}`,
    "",
    ...selected.map((o) => `• ${o.stage} — ${o.name} (${rupees(o.price)})`),
    "",
    `Estimated total including labour and GST: ${rupees(total)}`,
    "Please confirm fitment and send me a firm quote.",
  ].join("\n");

  const activeStage = BUILD_STAGES.find((s) => s.slug === stage) ?? BUILD_STAGES[0];

  return (
    <div className="grid gap-6 lg:grid-cols-[1.65fr_1fr] lg:items-start">
      <div className="space-y-6">
        {/* 1 — vehicle -------------------------------------------------- */}
        <div className="card p-5">
          <p className="eyebrow mb-3">Step 1 · Select your car</p>
          <div className="grid gap-3 sm:grid-cols-3">
            <select
              className="field"
              aria-label="Brand"
              value={brandSlug}
              onChange={(e) => {
                setBrandSlug(e.target.value);
                setModelSlug("");
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
                setYear("");
              }}
            >
              <option value="">Model</option>
              {brand?.models.map((m) => (
                <option key={m.slug} value={m.slug}>
                  {m.name}
                </option>
              ))}
            </select>
            <select
              className="field"
              aria-label="Year"
              value={year}
              disabled={!model}
              onChange={(e) => setYear(e.target.value)}
            >
              <option value="">Year</option>
              {model?.years.map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
          </div>

          {model && (
            <p className="mt-3 flex items-center gap-2 text-xs text-ash">
              <Icon name="check" size={13} className="text-accent" />
              {isOffroad
                ? "4x4 platform detected — lift kits, off-road wheels and expedition hardware unlocked."
                : "Street platform — off-road-only hardware is hidden to keep the quote honest."}
            </p>
          )}
        </div>

        {/* 2 — presets -------------------------------------------------- */}
        <div>
          <p className="eyebrow mb-3">Start from a pack, or build from scratch</p>
          <div className="rail -mx-4 px-4 md:mx-0 md:grid md:grid-cols-4 md:gap-3 md:px-0">
            {BUILD_PRESETS.map((p) => (
              <button
                key={p.slug}
                type="button"
                onClick={() => applyPreset(p.selections)}
                className="card card-hover w-56 p-4 text-left md:w-auto"
              >
                <p className="font-display text-base font-extrabold uppercase tracking-[-0.02em]">
                  {p.name}
                </p>
                <p className="mt-1.5 text-xs leading-snug text-ash">{p.blurb}</p>
              </button>
            ))}
          </div>
        </div>

        {/* 3 — stages --------------------------------------------------- */}
        <div className="card">
          <div className="rail border-b border-white/8 px-2">
            {BUILD_STAGES.map((s) => {
              const count = s.options.filter((o) => picked.has(o.slug)).length;
              return (
                <button
                  key={s.slug}
                  type="button"
                  onClick={() => setStage(s.slug)}
                  className={`relative shrink-0 px-3 py-3.5 font-display text-[11px] font-bold uppercase tracking-[0.14em] transition-colors ${
                    stage === s.slug ? "text-accent" : "text-ash hover:text-chalk"
                  }`}
                >
                  {s.name}
                  {count > 0 && (
                    <span className="ml-1.5 inline-grid h-4 min-w-4 place-items-center rounded-full bg-accent px-1 text-[10px] text-[#04161d] tnum">
                      {count}
                    </span>
                  )}
                  {stage === s.slug && <span className="absolute inset-x-2 bottom-0 h-0.5 bg-accent" />}
                </button>
              );
            })}
          </div>

          <div className="p-5">
            <p className="mb-4 text-sm text-ash">{activeStage.caption}</p>
            <ul className="grid gap-2 sm:grid-cols-2">
              {activeStage.options
                .filter((o) => !o.only?.includes("off-road") || isOffroad)
                .map((o) => {
                  const on = picked.has(o.slug);
                  return (
                    <li key={o.slug}>
                      <button
                        type="button"
                        onClick={() => toggle(o.slug)}
                        aria-pressed={on}
                        className={`flex w-full items-center justify-between gap-3 border p-3 text-left transition-colors ${
                          on
                            ? "border-accent/60 bg-accent/10"
                            : "border-white/8 bg-white/2 hover:border-white/25"
                        }`}
                      >
                        <span className="min-w-0">
                          <span className="block truncate text-sm font-medium">{o.name}</span>
                          <span className="block text-xs text-dim tnum">
                            {o.price === 0 ? "Included" : `+ ${rupees(o.price)}`}
                          </span>
                        </span>
                        <span
                          className={`grid h-6 w-6 shrink-0 place-items-center border ${
                            on ? "border-accent bg-accent text-[#04161d]" : "border-white/25 text-transparent"
                          }`}
                        >
                          <Icon name="check" size={13} />
                        </span>
                      </button>
                    </li>
                  );
                })}
            </ul>
          </div>
        </div>
      </div>

      {/* summary ------------------------------------------------------- */}
      <aside className="lg:sticky lg:top-24">
        <div className="card p-5">
          <p className="eyebrow mb-1">Estimated build cost</p>
          <p className="font-display text-4xl font-extrabold tracking-[-0.045em] tnum">
            {rupees(total)}
          </p>
          <p className="mt-1 text-xs text-dim">
            {selected.length === 0
              ? "Nothing selected yet"
              : `${selected.length} item${selected.length === 1 ? "" : "s"} on ${vehicleLabel}`}
          </p>

          {selected.length > 0 && (
            <ul className="mt-5 max-h-72 space-y-2 overflow-y-auto pr-1 text-sm">
              {selected.map((o) => (
                <li key={o.slug} className="flex items-start justify-between gap-3">
                  <button
                    type="button"
                    onClick={() => toggle(o.slug)}
                    aria-label={`Remove ${o.name}`}
                    className="mt-0.5 shrink-0 text-dim transition-colors hover:text-danger"
                  >
                    <Icon name="close" size={13} />
                  </button>
                  <span className="min-w-0 flex-1 text-ash">{o.name}</span>
                  <span className="shrink-0 tnum">{rupees(o.price)}</span>
                </li>
              ))}
            </ul>
          )}

          <dl className="mt-5 space-y-2 border-t border-white/8 pt-4 text-sm">
            <SummaryRow label="Parts" value={rupees(parts)} />
            <SummaryRow label="Workshop labour" value={rupees(labour)} />
            <SummaryRow label="GST (18%)" value={rupees(gst)} />
          </dl>

          <a
            href={whatsapp(quoteMessage)}
            target="_blank"
            rel="noreferrer noopener"
            className={`btn btn-block mt-5 ${selected.length ? "btn-accent" : "btn-outline pointer-events-none opacity-40"}`}
          >
            Request my build
            <Icon name="arrow" size={15} />
          </a>
          <button
            type="button"
            onClick={() => setPicked(new Set())}
            className="mt-3 w-full text-xs text-dim underline underline-offset-4 hover:text-ash"
          >
            Clear everything
          </button>

          <p className="mt-4 text-[11px] leading-relaxed text-dim">
            Estimate only. Final pricing depends on your variant, paint code and fitment check. We
            confirm every line before any work starts, and we will tell you when something is not
            road-legal in your state.
          </p>
        </div>
      </aside>
    </div>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <dt className="text-ash">{label}</dt>
      <dd className="tnum">{value}</dd>
    </div>
  );
}
