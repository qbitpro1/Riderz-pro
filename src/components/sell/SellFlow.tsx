"use client";

import { useMemo, useState } from "react";
import { Icon } from "@/components/ui/Icon";
import { lakh } from "@/lib/format";
import { whatsapp } from "@/lib/data/site";
import { BRANDS } from "@/lib/data/vehicles";

/** Indicative new-car values by body style, before segment and age adjustment. */
const BASE_BY_BODY: Record<string, number> = {
  Hatchback: 8_50_000,
  Sedan: 13_00_000,
  SUV: 16_50_000,
  MUV: 15_00_000,
  Pickup: 20_00_000,
  "Off-Roader": 16_00_000,
  Coupe: 30_00_000,
};

const SEGMENT_FACTOR: Record<string, number> = { mass: 1, premium: 1.55, luxury: 3.4 };

const CONDITIONS = [
  { key: "excellent", label: "Excellent", note: "No dents, no repaints, everything works", factor: 1.06 },
  { key: "good", label: "Good", note: "Minor scratches, regular servicing", factor: 1 },
  { key: "fair", label: "Fair", note: "Panel work done, some wear inside", factor: 0.9 },
  { key: "needs-work", label: "Needs work", note: "Mechanical or body issues pending", factor: 0.78 },
];

const CURRENT_YEAR = 2026;

export function SellFlow() {
  const [step, setStep] = useState(0);
  const [reg, setReg] = useState("");
  const [brandSlug, setBrandSlug] = useState("");
  const [modelSlug, setModelSlug] = useState("");
  const [variant, setVariant] = useState("");
  const [year, setYear] = useState("");
  const [km, setKm] = useState("");
  const [owner, setOwner] = useState("1st Owner");
  const [condition, setCondition] = useState("good");
  const [photos, setPhotos] = useState(0);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [city, setCity] = useState("Bengaluru");
  const [date, setDate] = useState("");

  const brand = BRANDS.find((b) => b.slug === brandSlug);
  const model = brand?.models.find((m) => m.slug === modelSlug);

  const valuation = useMemo(() => {
    if (!brand || !model || !year) return null;
    const age = Math.max(CURRENT_YEAR - Number(year), 0);
    const base = (BASE_BY_BODY[model.body] ?? 12_00_000) * (SEGMENT_FACTOR[brand.segment] ?? 1);

    // Indian resale holds up better than the global curve: roughly 10% in the
    // first year, then about 7.5% a year after that.
    const depreciated = base * (age === 0 ? 0.93 : 0.9 * Math.pow(0.925, age - 1));

    const kmDriven = Number(km) || age * 12_000;
    const expected = age * 12_000 + 5_000;
    const kmFactor = Math.min(1.05, Math.max(0.8, 1 - (kmDriven - expected) / 4_00_000));

    const ownerFactor = owner === "1st Owner" ? 1 : owner === "2nd Owner" ? 0.93 : 0.86;
    const condFactor = CONDITIONS.find((c) => c.key === condition)?.factor ?? 1;

    const mid = depreciated * kmFactor * ownerFactor * condFactor;
    return { low: Math.round(mid * 0.94), high: Math.round(mid * 1.06) };
  }, [brand, model, year, km, owner, condition]);

  const vehicleLabel = brand && model ? `${year} ${brand.name} ${model.name} ${variant}`.trim() : "";

  const message = [
    "Hi Riderzpro, I want to sell my car.",
    `Registration: ${reg || "—"}`,
    `Vehicle: ${vehicleLabel || "—"}`,
    `Kilometres: ${km || "—"}`,
    `Ownership: ${owner}`,
    `Condition: ${CONDITIONS.find((c) => c.key === condition)?.label}`,
    valuation ? `Website estimate: ${lakh(valuation.low)} – ${lakh(valuation.high)}` : "",
    name ? `Name: ${name}` : "",
    phone ? `Phone: ${phone}` : "",
    `Inspection: ${city}${date ? ` on ${date}` : ""}`,
  ]
    .filter(Boolean)
    .join("\n");

  const canAdvance = [
    reg.trim().length >= 6,
    Boolean(brand && model && year),
    Number(km) > 0,
    true,
    true,
  ][step];

  const steps = ["Registration", "Vehicle", "Usage", "Valuation", "Inspection"];

  return (
    <div className="card overflow-hidden">
      {/* progress ---------------------------------------------------- */}
      <div className="flex border-b border-white/8">
        {steps.map((s, i) => (
          <div key={s} className="relative flex-1 px-2 py-3 text-center">
            <span
              className={`font-display text-[10px] font-bold uppercase tracking-[0.12em] ${
                i === step ? "text-accent" : i < step ? "text-ash" : "text-dim"
              }`}
            >
              <span className="tnum">{i + 1}</span>
              <span className="ml-1 hidden sm:inline">{s}</span>
            </span>
            {i <= step && <span className="absolute inset-x-0 bottom-0 h-0.5 bg-accent" />}
          </div>
        ))}
      </div>

      <div className="p-5 md:p-6">
        {step === 0 && (
          <Panel
            title="Enter your registration number"
            hint="We pull the make, model, variant and registration year from VAHAN so you don't have to type them."
          >
            <input
              className="field uppercase tracking-[0.14em]"
              placeholder="KA 05 MN 4488"
              value={reg}
              onChange={(e) => setReg(e.target.value.toUpperCase())}
              aria-label="Registration number"
            />
            <p className="mt-3 text-xs text-dim">
              No registration number handy? Skip ahead and pick your car manually.
            </p>
            <button
              type="button"
              onClick={() => setStep(1)}
              className="mt-2 text-xs text-accent underline underline-offset-4"
            >
              Select manually instead
            </button>
          </Panel>
        )}

        {step === 1 && (
          <Panel title="Confirm your vehicle" hint="Variant matters — a top-spec car is worth up to 18% more.">
            <div className="grid gap-3 sm:grid-cols-2">
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
                aria-label="Variant"
                value={variant}
                disabled={!model}
                onChange={(e) => setVariant(e.target.value)}
              >
                <option value="">Variant</option>
                {model?.variants.map((v) => (
                  <option key={v} value={v}>
                    {v}
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
          </Panel>
        )}

        {step === 2 && (
          <Panel title="How has it been used?" hint="Be honest — the physical inspection will find everything anyway, and we would rather not renegotiate at your door.">
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className="label" htmlFor="sell-km">
                  Kilometres driven
                </label>
                <input
                  id="sell-km"
                  className="field tnum"
                  inputMode="numeric"
                  placeholder="32000"
                  value={km}
                  onChange={(e) => setKm(e.target.value.replace(/\D/g, ""))}
                />
              </div>
              <div>
                <label className="label" htmlFor="sell-owner">
                  Ownership
                </label>
                <select id="sell-owner" className="field" value={owner} onChange={(e) => setOwner(e.target.value)}>
                  <option>1st Owner</option>
                  <option>2nd Owner</option>
                  <option>3rd Owner or more</option>
                </select>
              </div>
            </div>

            <p className="label mt-5">Overall condition</p>
            <div className="grid gap-2 sm:grid-cols-2">
              {CONDITIONS.map((c) => (
                <button
                  key={c.key}
                  type="button"
                  onClick={() => setCondition(c.key)}
                  aria-pressed={condition === c.key}
                  className={`border p-3 text-left transition-colors ${
                    condition === c.key ? "border-accent/60 bg-accent/10" : "border-white/8 hover:border-white/25"
                  }`}
                >
                  <span className="block text-sm font-semibold">{c.label}</span>
                  <span className="block text-xs text-dim">{c.note}</span>
                </button>
              ))}
            </div>

            <p className="label mt-5">Photos</p>
            <div className="flex flex-wrap items-center gap-2">
              {[4, 8, 12].map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => setPhotos(n)}
                  className={`chip ${photos === n ? "chip-active" : "hover:border-accent hover:text-accent"}`}
                >
                  I have {n}+ photos
                </button>
              ))}
              <span className="text-xs text-dim">Send them on WhatsApp — it speeds up the offer by a day.</span>
            </div>
          </Panel>
        )}

        {step === 3 && (
          <Panel
            title="Your estimated valuation"
            hint="Based on live Riderzpro transaction data for this model, adjusted for age, kilometres, ownership and condition."
          >
            {valuation ? (
              <div className="border border-accent/30 bg-accent/8 p-5 text-center">
                <p className="eyebrow mb-2">Indicative range</p>
                <p className="font-display text-3xl font-extrabold tracking-[-0.04em] text-accent md:text-4xl tnum">
                  {lakh(valuation.low)} – {lakh(valuation.high)}
                </p>
                {vehicleLabel && <p className="mt-2 text-sm text-ash">{vehicleLabel}</p>}
              </div>
            ) : (
              <p className="text-sm text-ash">Go back and pick your vehicle to see a range.</p>
            )}
            <ul className="mt-5 space-y-2 text-sm text-ash">
              {[
                "The final offer comes after a free 200-point physical inspection.",
                "We pay the higher of our offer and the best bid from our dealer network.",
                "Payment lands in your account before the RC transfer is filed.",
              ].map((t) => (
                <li key={t} className="flex gap-2">
                  <Icon name="check" size={15} className="mt-0.5 shrink-0 text-accent" />
                  {t}
                </li>
              ))}
            </ul>
          </Panel>
        )}

        {step === 4 && (
          <Panel title="Schedule your free inspection" hint="At your home or at any Riderzpro garage. It takes about 45 minutes.">
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className="label" htmlFor="sell-name">
                  Your name
                </label>
                <input id="sell-name" className="field" value={name} onChange={(e) => setName(e.target.value)} />
              </div>
              <div>
                <label className="label" htmlFor="sell-phone">
                  Phone
                </label>
                <input
                  id="sell-phone"
                  className="field tnum"
                  inputMode="tel"
                  placeholder="+91"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
              </div>
              <div>
                <label className="label" htmlFor="sell-city">
                  City
                </label>
                <select id="sell-city" className="field" value={city} onChange={(e) => setCity(e.target.value)}>
                  <option>Bengaluru</option>
                  <option>Hyderabad</option>
                  <option>Pune</option>
                  <option>Other</option>
                </select>
              </div>
              <div>
                <label className="label" htmlFor="sell-date">
                  Preferred date
                </label>
                <input
                  id="sell-date"
                  type="date"
                  className="field"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                />
              </div>
            </div>

            <a
              href={whatsapp(message)}
              target="_blank"
              rel="noreferrer noopener"
              className="btn btn-whatsapp btn-block mt-5"
            >
              <Icon name="whatsapp" size={16} />
              Confirm on WhatsApp
            </a>
          </Panel>
        )}

        {/* controls -------------------------------------------------- */}
        <div className="mt-6 flex items-center gap-3">
          {step > 0 && (
            <button type="button" onClick={() => setStep((s) => s - 1)} className="btn btn-outline btn-sm">
              Back
            </button>
          )}
          {step < 4 && (
            <button
              type="button"
              disabled={!canAdvance}
              onClick={() => setStep((s) => s + 1)}
              className={`btn btn-sm ml-auto ${canAdvance ? "btn-primary" : "btn-outline cursor-not-allowed opacity-40"}`}
            >
              {step === 2 ? "Get my valuation" : "Continue"}
              <Icon name="arrow" size={14} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function Panel({
  title,
  hint,
  children,
}: {
  title: string;
  hint: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <h3 className="display-3">{title}</h3>
      <p className="mb-5 mt-2 max-w-xl text-sm text-ash">{hint}</p>
      {children}
    </div>
  );
}
