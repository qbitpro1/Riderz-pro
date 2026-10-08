"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { Icon } from "@/components/ui/Icon";
import { BRANDS } from "@/lib/data/vehicles";
import { BUDGETS, GOALS } from "@/lib/data/recoil/system-options";

/**
 * Drives the system builder through the query string, so the recommendation
 * itself is produced on the server and the catalogue never ships to the browser.
 */
export function SystemForm() {
  const router = useRouter();
  const params = useSearchParams();

  const [budget, setBudget] = useState(params.get("budget") ?? "");
  const [goal, setGoal] = useState(params.get("goal") ?? "");
  const [brandSlug, setBrandSlug] = useState(params.get("brand") ?? "");
  const [modelSlug, setModelSlug] = useState(params.get("model") ?? "");
  const [year, setYear] = useState(params.get("year") ?? "");

  const brand = BRANDS.find((b) => b.slug === brandSlug);
  const model = brand?.models.find((m) => m.slug === modelSlug);
  const ready = Boolean(budget && goal);

  function submit() {
    const q = new URLSearchParams();
    if (budget) q.set("budget", budget);
    if (goal) q.set("goal", goal);
    if (brandSlug) q.set("brand", brandSlug);
    if (modelSlug) q.set("model", modelSlug);
    if (year) q.set("year", year);
    router.push(`/build-audio?${q.toString()}#system`, { scroll: true });
  }

  return (
    <div className="card p-5 md:p-6">
      <ol className="space-y-6">
        <li>
          <p className="eyebrow mb-3">Step 1 · Budget</p>
          <div className="flex flex-wrap gap-2">
            {BUDGETS.map((b) => (
              <button
                key={b.value}
                type="button"
                onClick={() => setBudget(String(b.value))}
                aria-pressed={budget === String(b.value)}
                className={`chip ${budget === String(b.value) ? "chip-active" : "hover:border-accent hover:text-accent"}`}
              >
                {b.label}
              </button>
            ))}
          </div>
        </li>

        <li>
          <p className="eyebrow mb-3">Step 2 · Your car</p>
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
            <select className="field" aria-label="Year" value={year} disabled={!model} onChange={(e) => setYear(e.target.value)}>
              <option value="">Year</option>
              {model?.years.map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
          </div>
          <p className="mt-2 text-xs text-dim">
            Optional. It does not change the electronics, but it tells us which adapter rings,
            harnesses and pods your build needs.
          </p>
        </li>

        <li>
          <p className="eyebrow mb-3">Step 3 · What do you want from it?</p>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {GOALS.map((g) => (
              <button
                key={g.value}
                type="button"
                onClick={() => setGoal(g.value)}
                aria-pressed={goal === g.value}
                className={`border p-3 text-left transition-colors ${
                  goal === g.value ? "border-accent/60 bg-accent/10" : "border-white/8 bg-white/2 hover:border-white/25"
                }`}
              >
                <span className="block text-sm font-semibold">{g.label}</span>
                <span className="mt-0.5 block text-xs leading-snug text-dim">{g.blurb}</span>
              </button>
            ))}
          </div>
        </li>
      </ol>

      <button
        type="button"
        onClick={submit}
        disabled={!ready}
        className={`btn btn-block mt-6 ${ready ? "btn-accent" : "btn-outline cursor-not-allowed opacity-40"}`}
      >
        Show my system
        <Icon name="arrow" size={15} />
      </button>
    </div>
  );
}
