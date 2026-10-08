"use client";

import { useMemo, useState } from "react";
import { Icon } from "@/components/ui/Icon";
import { rupees } from "@/lib/format";
import { whatsapp } from "@/lib/data/site";
import { BRANDS } from "@/lib/data/vehicles";
import {
  AREA_GROUP_LABEL,
  COVERAGE_AREAS,
  PAINT_CONDITIONS,
  PPF_PACKAGES,
  PRICE_DISCLAIMER,
  TIER_RATES,
  VEHICLE_CLASSES,
  areasIn,
  classForBody,
  quote,
  type AreaGroup,
  type PaintCondition,
  type SizeClass,
} from "@/lib/ppf/coverage";
import type { FilmFinish, FilmTier } from "@/lib/ppf/films";

type PublishedFilm = {
  slug: string;
  name: string;
  brandName: string;
  tier: FilmTier;
  finish: FilmFinish;
  warrantyYears: number | null;
};

const GROUPS: AreaGroup[] = ["front", "side", "rear", "high-impact"];

/**
 * BUILD YOUR PPF PACKAGE
 *
 * Car → coverage → film → finish → paint condition → indicative range.
 * Every number on screen is a range, and the disclaimer travels with it: the
 * real price comes off the car.
 */
export function PpfConfigurator({ films }: { films: PublishedFilm[] }) {
  const [brandSlug, setBrandSlug] = useState("");
  const [modelSlug, setModelSlug] = useState("");
  const [variant, setVariant] = useState("");
  const [year, setYear] = useState("");
  const [colour, setColour] = useState("");
  const [manualClass, setManualClass] = useState<SizeClass | "">("");

  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [fullBody, setFullBody] = useState(false);
  const [tier, setTier] = useState<FilmTier>("premium");
  const [finish, setFinish] = useState<FilmFinish>("Gloss");
  const [filmSlug, setFilmSlug] = useState("");
  const [paint, setPaint] = useState<PaintCondition>("unknown");

  const brand = BRANDS.find((b) => b.slug === brandSlug);
  const model = brand?.models.find((m) => m.slug === modelSlug);

  const sizeClass: SizeClass = useMemo(() => {
    if (manualClass) return manualClass;
    if (model && brand) return classForBody(model.body, brand.segment);
    return "mid-suv";
  }, [manualClass, model, brand]);

  const vehicleLabel = brand && model ? `${year || ""} ${brand.name} ${model.name} ${variant}`.trim() : "";

  const availableFilms = films.filter((f) => f.tier === tier && f.finish === finish);
  const chosenFilm = availableFilms.find((f) => f.slug === filmSlug) ?? availableFilms[0];

  const result = useMemo(
    () => quote({ sizeClass, tier, areaIds: [...selected], fullBody, paintCondition: paint }),
    [sizeClass, tier, selected, fullBody, paint],
  );

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function applyPackage(pkgId: string) {
    const pkg = PPF_PACKAGES.find((p) => p.id === pkgId);
    if (!pkg) return;
    setSelected(new Set(pkg.areaIds));
    setFullBody(Boolean(pkg.fullBody));
    if (pkg.audience === "luxury") setTier("signature");
    if (pkg.audience === "entry") setTier("essential");
  }

  const nothingSelected = selected.size === 0 && !fullBody;

  const message = [
    "Hi Motorbotz, I want a PPF quote.",
    vehicleLabel ? `Car: ${vehicleLabel}${colour ? ` (${colour})` : ""}` : "Car: ",
    `Coverage: ${fullBody ? "Full body" : `${selected.size} areas`}${
      selected.size ? ` — ${[...selected].map((id) => COVERAGE_AREAS.find((a) => a.id === id)?.label).join(", ")}` : ""
    }`,
    `Film: ${TIER_RATES[tier].label} · ${finish}${chosenFilm ? ` (${chosenFilm.brandName} ${chosenFilm.name})` : ""}`,
    `Paint condition: ${PAINT_CONDITIONS.find((c) => c.id === paint)?.label}`,
    `Website estimate: ${rupees(result.low)} – ${rupees(result.high)}`,
    "Please confirm after inspection.",
  ].join("\n");

  return (
    <div className="grid gap-6 lg:grid-cols-[1.6fr_1fr] lg:items-start">
      <div className="space-y-6">
        {/* 1 — car ---------------------------------------------------- */}
        <section className="card p-5">
          <p className="eyebrow mb-3">Step 1 · What do you drive?</p>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
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
            <select className="field" aria-label="Variant" value={variant} disabled={!model} onChange={(e) => setVariant(e.target.value)}>
              <option value="">Variant</option>
              {model?.variants.map((v) => (
                <option key={v}>{v}</option>
              ))}
            </select>
            <select className="field" aria-label="Year" value={year} disabled={!model} onChange={(e) => setYear(e.target.value)}>
              <option value="">Year</option>
              {model?.years.map((y) => (
                <option key={y}>{y}</option>
              ))}
            </select>
            <input
              className="field"
              aria-label="Colour"
              placeholder="Colour"
              value={colour}
              onChange={(e) => setColour(e.target.value)}
            />
            <select
              className="field"
              aria-label="Vehicle size class"
              value={manualClass}
              onChange={(e) => setManualClass(e.target.value as SizeClass | "")}
            >
              <option value="">
                Size class {model ? `(auto: ${VEHICLE_CLASSES.find((c) => c.id === sizeClass)?.label})` : ""}
              </option>
              {VEHICLE_CLASSES.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.label}
                </option>
              ))}
            </select>
          </div>
          <p className="mt-3 text-xs text-dim">
            Size class drives the film area and the labour. We set it from your model — override it if
            we have guessed wrong.
          </p>
        </section>

        {/* 2 — packages ---------------------------------------------- */}
        <section>
          <p className="eyebrow mb-3">Step 2 · Start from a package, or pick panels yourself</p>
          <div className="rail -mx-4 px-4 md:mx-0 md:grid md:grid-cols-3 md:gap-3 md:px-0">
            {PPF_PACKAGES.map((pkg) => (
              <button
                key={pkg.id}
                type="button"
                onClick={() => applyPackage(pkg.id)}
                className="card card-hover w-60 p-4 text-left md:w-auto"
              >
                <p className="font-display text-sm font-extrabold uppercase tracking-[-0.01em]">{pkg.name}</p>
                <p className="mt-1 text-xs text-accent">{pkg.headline}</p>
                <p className="mt-2 line-clamp-3 text-[11px] leading-snug text-ash">{pkg.blurb}</p>
              </button>
            ))}
          </div>
        </section>

        {/* 3 — coverage ---------------------------------------------- */}
        <section className="card p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="eyebrow">Step 3 · Coverage</p>
            <label className="flex cursor-pointer items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={fullBody}
                onChange={(e) => setFullBody(e.target.checked)}
                className="h-4 w-4 accent-[var(--color-accent)]"
              />
              Full body
            </label>
          </div>

          {fullBody && (
            <p className="mt-3 border border-accent/30 bg-accent/6 p-3 text-xs text-chalk/85">
              Full body covers every painted panel. Tick anything below that you also want done —
              lamps, piano-black trim and door cups sit outside the painted body.
            </p>
          )}

          <div className="mt-4 space-y-5">
            {GROUPS.map((group) => (
              <div key={group}>
                <p className="label">{AREA_GROUP_LABEL[group]}</p>
                <ul className="grid gap-2 sm:grid-cols-2">
                  {areasIn(group).map((area) => {
                    const on = selected.has(area.id);
                    const impliedByFullBody = fullBody && group !== "high-impact";
                    return (
                      <li key={area.id}>
                        <button
                          type="button"
                          onClick={() => toggle(area.id)}
                          aria-pressed={on}
                          disabled={impliedByFullBody}
                          className={`flex w-full items-start justify-between gap-3 border p-3 text-left transition-colors ${
                            impliedByFullBody
                              ? "cursor-not-allowed border-white/6 bg-white/2 opacity-45"
                              : on
                                ? "border-accent/60 bg-accent/10"
                                : "border-white/8 bg-white/2 hover:border-white/25"
                          }`}
                        >
                          <span className="min-w-0">
                            <span className="block text-sm font-medium">{area.label}</span>
                            {area.note && <span className="mt-0.5 block text-[11px] leading-snug text-dim">{area.note}</span>}
                          </span>
                          <span
                            className={`mt-0.5 grid h-5 w-5 shrink-0 place-items-center border ${
                              on || impliedByFullBody ? "border-accent bg-accent text-[#04161d]" : "border-white/25"
                            }`}
                          >
                            {(on || impliedByFullBody) && <Icon name="check" size={12} />}
                          </span>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
          </div>
        </section>

        {/* 4 — film --------------------------------------------------- */}
        <section className="card p-5">
          <p className="eyebrow mb-3">Step 4 · Film and finish</p>

          <p className="label">Film tier</p>
          <div className="grid gap-2 sm:grid-cols-3">
            {(Object.keys(TIER_RATES) as FilmTier[]).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setTier(t)}
                aria-pressed={tier === t}
                className={`border p-3 text-left transition-colors ${
                  tier === t ? "border-accent/60 bg-accent/10" : "border-white/8 bg-white/2 hover:border-white/25"
                }`}
              >
                <span className="block text-sm font-semibold">{TIER_RATES[t].label}</span>
                <span className="mt-0.5 block text-[11px] leading-snug text-dim">{TIER_RATES[t].blurb}</span>
                <span className="mt-1.5 block text-xs text-accent tnum">
                  ₹{TIER_RATES[t].min}–{TIER_RATES[t].max}/sq ft
                </span>
              </button>
            ))}
          </div>

          <p className="label mt-5">Finish</p>
          <div className="flex flex-wrap gap-2">
            {(["Gloss", "Satin", "Matte", "Coloured"] as FilmFinish[]).map((f) => (
              <button
                key={f}
                type="button"
                onClick={() => setFinish(f)}
                className={`chip ${finish === f ? "chip-active" : "hover:border-accent hover:text-accent"}`}
              >
                {f}
              </button>
            ))}
          </div>

          <p className="label mt-5">Film</p>
          {availableFilms.length === 0 ? (
            <p className="border border-gold/30 bg-gold/6 p-3 text-xs text-chalk/85">
              We do not currently list a {finish.toLowerCase()} film at {TIER_RATES[tier].label} tier.
              Tell us what you want and we will source it — the rate above still applies.
            </p>
          ) : (
            <select className="field" value={chosenFilm?.slug ?? ""} onChange={(e) => setFilmSlug(e.target.value)} aria-label="Film">
              {availableFilms.map((f) => (
                <option key={f.slug} value={f.slug}>
                  {f.brandName} {f.name}
                  {f.warrantyYears ? ` — ${f.warrantyYears}-year warranty` : ""}
                </option>
              ))}
            </select>
          )}
        </section>

        {/* 5 — paint -------------------------------------------------- */}
        <section className="card p-5">
          <p className="eyebrow mb-3">Step 5 · Current paint condition</p>
          <div className="grid gap-2 sm:grid-cols-2">
            {PAINT_CONDITIONS.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => setPaint(c.id)}
                aria-pressed={paint === c.id}
                className={`border p-3 text-left transition-colors ${
                  paint === c.id ? "border-accent/60 bg-accent/10" : "border-white/8 bg-white/2 hover:border-white/25"
                }`}
              >
                <span className="block text-sm font-semibold">{c.label}</span>
                <span className="mt-0.5 block text-[11px] leading-snug text-dim">{c.blurb}</span>
                {c.addOn > 0 && <span className="mt-1 block text-xs text-accent tnum">+ {rupees(c.addOn)} preparation</span>}
              </button>
            ))}
          </div>
          <p className="mt-3 text-xs leading-relaxed text-dim">
            Film locks in whatever is underneath it. If the paint needs correcting, it has to happen
            first — there is no undoing it afterwards without removing the film.
          </p>
        </section>
      </div>

      {/* summary ---------------------------------------------------- */}
      <aside className="lg:sticky lg:top-24">
        <div className="card p-5">
          <p className="eyebrow mb-1">Estimated price</p>
          {nothingSelected ? (
            <p className="font-display text-2xl font-extrabold uppercase text-ash">Pick your coverage</p>
          ) : (
            <>
              <p className="font-display text-3xl font-extrabold tracking-[-0.04em] tnum md:text-4xl">
                {rupees(result.low)} – {rupees(result.high)}
              </p>
              <p className="mt-1 text-xs text-dim">
                {fullBody ? "Full body" : `${selected.size} area${selected.size === 1 ? "" : "s"}`} ·{" "}
                {result.coveragePct}% of the painted body · ≈ {result.sqFt} sq ft
              </p>

              <div className="mt-4 h-1.5 w-full bg-white/8">
                <div className="h-full bg-accent transition-all" style={{ width: `${result.coveragePct}%` }} />
              </div>

              <dl className="mt-5 space-y-2 border-t border-white/8 pt-4 text-sm">
                {result.breakdown.map((row) => (
                  <div key={row.label} className="flex items-center justify-between gap-4">
                    <dt className="text-ash">{row.label}</dt>
                    <dd className="text-right tnum">{row.value}</dd>
                  </div>
                ))}
              </dl>
            </>
          )}

          {vehicleLabel && <p className="mt-4 text-xs text-ash">{vehicleLabel}</p>}

          <a
            href={whatsapp(message)}
            target="_blank"
            rel="noreferrer noopener"
            className={`btn btn-block mt-5 ${nothingSelected ? "btn-outline pointer-events-none opacity-40" : "btn-accent"}`}
          >
            <Icon name="whatsapp" size={16} />
            Get final quote
          </a>
          <a
            href={whatsapp(`${message}\n\nI'd also like to book the installation.`)}
            target="_blank"
            rel="noreferrer noopener"
            className={`btn btn-outline btn-block mt-3 ${nothingSelected ? "pointer-events-none opacity-40" : ""}`}
          >
            Book installation
          </a>

          <button
            type="button"
            onClick={() => {
              setSelected(new Set());
              setFullBody(false);
            }}
            className="mt-3 w-full text-xs text-dim underline underline-offset-4 hover:text-ash"
          >
            Clear coverage
          </button>

          <p className="mt-4 border-t border-white/8 pt-4 text-[11px] leading-relaxed text-dim">
            {PRICE_DISCLAIMER}
          </p>
        </div>
      </aside>
    </div>
  );
}
