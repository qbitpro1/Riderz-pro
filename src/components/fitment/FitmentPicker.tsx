"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Icon } from "@/components/ui/Icon";
import { BRANDS } from "@/lib/data/vehicles";
import { readStored } from "@/lib/storage";

export type Garage = {
  brandSlug: string;
  modelSlug: string;
  variant: string;
  year: number;
  label: string;
};

const KEY = "riderzpro.garage.v1";

export function readGarage(): Garage | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = readStored(KEY);
    return raw ? (JSON.parse(raw) as Garage) : null;
  } catch {
    return null;
  }
}

/**
 * "WHAT DO YOU DRIVE?" — brand → model → variant → year.
 * The choice is remembered so the rest of the site can filter by fitment.
 */
export function FitmentPicker({ compact = false }: { compact?: boolean }) {
  const [brandSlug, setBrandSlug] = useState("");
  const [modelSlug, setModelSlug] = useState("");
  const [variant, setVariant] = useState("");
  const [year, setYear] = useState("");
  const [saved, setSaved] = useState<Garage | null>(null);

  useEffect(() => {
    const g = readGarage();
    if (g) {
      setSaved(g);
      setBrandSlug(g.brandSlug);
      setModelSlug(g.modelSlug);
      setVariant(g.variant);
      setYear(String(g.year));
    }
  }, []);

  const brand = useMemo(() => BRANDS.find((b) => b.slug === brandSlug), [brandSlug]);
  const model = useMemo(() => brand?.models.find((m) => m.slug === modelSlug), [brand, modelSlug]);

  const complete = Boolean(brand && model && variant && year);

  function save() {
    if (!brand || !model || !variant || !year) return;
    const g: Garage = {
      brandSlug: brand.slug,
      modelSlug: model.slug,
      variant,
      year: Number(year),
      label: `${brand.name} ${model.name} ${variant} ${year}`,
    };
    localStorage.setItem(KEY, JSON.stringify(g));
    setSaved(g);
  }

  function reset() {
    localStorage.removeItem(KEY);
    setSaved(null);
    setBrandSlug("");
    setModelSlug("");
    setVariant("");
    setYear("");
  }

  if (saved && compact) {
    return (
      <div className="card flex flex-wrap items-center gap-3 p-4">
        <span className="chip chip-active">Your car</span>
        <span className="text-sm font-semibold">{saved.label}</span>
        <Link href={`/accessories/${saved.modelSlug}`} className="btn btn-accent btn-sm ml-auto">
          Shop parts that fit
          <Icon name="arrow" size={14} />
        </Link>
        <button type="button" onClick={reset} className="text-xs text-dim underline underline-offset-4">
          Change
        </button>
      </div>
    );
  }

  return (
    <div className="card p-5 md:p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="eyebrow mb-2">Car-specific shopping</p>
          <h3 className="display-3">WHAT DO YOU DRIVE?</h3>
          <p className="mt-2 max-w-md text-sm text-ash">
            Tell us once and we only show you parts that actually fit — no returns, no guessing at
            the checkout.
          </p>
        </div>
        <Icon name="wheel" size={40} className="hidden shrink-0 text-accent/30 sm:block" />
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <label className="label" htmlFor="fit-brand">
            Brand
          </label>
          <select
            id="fit-brand"
            className="field"
            value={brandSlug}
            onChange={(e) => {
              setBrandSlug(e.target.value);
              setModelSlug("");
              setVariant("");
              setYear("");
            }}
          >
            <option value="">Select brand</option>
            {BRANDS.map((b) => (
              <option key={b.slug} value={b.slug}>
                {b.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="label" htmlFor="fit-model">
            Model
          </label>
          <select
            id="fit-model"
            className="field"
            value={modelSlug}
            disabled={!brand}
            onChange={(e) => {
              setModelSlug(e.target.value);
              setVariant("");
              setYear("");
            }}
          >
            <option value="">{brand ? "Select model" : "Pick a brand first"}</option>
            {brand?.models.map((m) => (
              <option key={m.slug} value={m.slug}>
                {m.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="label" htmlFor="fit-variant">
            Variant
          </label>
          <select
            id="fit-variant"
            className="field"
            value={variant}
            disabled={!model}
            onChange={(e) => setVariant(e.target.value)}
          >
            <option value="">{model ? "Select variant" : "Pick a model first"}</option>
            {model?.variants.map((v) => (
              <option key={v} value={v}>
                {v}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="label" htmlFor="fit-year">
            Year
          </label>
          <select
            id="fit-year"
            className="field"
            value={year}
            disabled={!model}
            onChange={(e) => setYear(e.target.value)}
          >
            <option value="">{model ? "Select year" : "Pick a model first"}</option>
            {model?.years.map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center">
        {complete ? (
          <Link href={`/accessories/${modelSlug}`} onClick={save} className="btn btn-primary btn-block sm:w-auto">
            Show what fits
            <Icon name="arrow" size={15} />
          </Link>
        ) : (
          <button type="button" disabled className="btn btn-outline btn-block cursor-not-allowed opacity-40 sm:w-auto">
            Show what fits
          </button>
        )}
        {saved && (
          <p className="text-xs text-dim">
            Saved: <span className="text-ash">{saved.label}</span> ·{" "}
            <button type="button" onClick={reset} className="underline underline-offset-4">
              clear
            </button>
          </p>
        )}
      </div>
    </div>
  );
}
