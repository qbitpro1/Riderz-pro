"use client";

import { useMemo, useState } from "react";
import { X } from "lucide-react";
import { BRANDS } from "@/lib/data/vehicles";

const MAX = 60;
const MODEL_NAME = new Map(BRANDS.flatMap((b) => b.models.map((m) => [m.slug, `${b.name} ${m.name}`] as const)));

type Props = {
  value: string[];
  onChange: (next: string[]) => void;
  disabled?: boolean;
  invalid?: boolean;
  describedBy?: string;
};

/** Universal, or a set of car/bike models grouped by brand. Values are model slugs or ["universal"]. */
export function FitmentPicker({ value, onChange, disabled, invalid, describedBy }: Props) {
  const [query, setQuery] = useState("");
  const universal = value.includes("universal");
  const selected = useMemo(() => new Set(value), [value]);
  const needle = query.trim().toLowerCase();

  const groups = useMemo(
    () =>
      BRANDS.map((b) => ({
        brand: b,
        models: b.models.filter((m) => !needle || `${b.name} ${m.name}`.toLowerCase().includes(needle)),
      })).filter((g) => g.models.length > 0),
    [needle],
  );

  const toggle = (slug: string) => {
    if (disabled) return;
    if (selected.has(slug)) onChange(value.filter((v) => v !== slug));
    else if (value.length < MAX) onChange([...value, slug]);
  };

  return (
    <div
      id="f-fitment"
      tabIndex={-1}
      aria-invalid={invalid || undefined}
      aria-describedby={describedBy}
      className={`space-y-3 rounded-[2px] border p-3 outline-none focus-visible:border-accent ${invalid ? "border-danger" : "border-tint/10"}`}
    >
      <label className="flex min-h-11 cursor-pointer items-center gap-3 text-sm text-chalk">
        <input
          type="checkbox"
          checked={universal}
          disabled={disabled}
          onChange={(e) => onChange(e.target.checked ? ["universal"] : [])}
          className="h-5 w-5 accent-[var(--accent)]"
        />
        <span>
          <strong>Universal</strong> <span className="text-ash">— fits any car or bike</span>
        </span>
      </label>

      {!universal && (
        <>
          {value.length > 0 && (
            <ul className="flex flex-wrap gap-1.5" aria-label="Selected vehicles">
              {value.map((slug) => (
                <li key={slug}>
                  <button
                    type="button"
                    disabled={disabled}
                    onClick={() => toggle(slug)}
                    className="chip chip-active min-h-8 gap-1.5 normal-case tracking-normal"
                    aria-label={`Remove ${MODEL_NAME.get(slug) ?? slug}`}
                  >
                    {MODEL_NAME.get(slug) ?? slug}
                    <X size={12} aria-hidden />
                  </button>
                </li>
              ))}
            </ul>
          )}
          <div>
            <label htmlFor="fitment-search" className="sr-only">
              Search vehicle models
            </label>
            <input
              id="fitment-search"
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              disabled={disabled}
              placeholder="Search a make or model, e.g. Thar"
              className="field"
            />
          </div>
          <div className="max-h-72 space-y-2 overflow-y-auto pr-1">
            {groups.length === 0 && <p className="text-sm text-ash">No models match “{query}”.</p>}
            {groups.map(({ brand, models }) => {
              const count = brand.models.filter((m) => selected.has(m.slug)).length;
              return (
                <details key={brand.slug} open={!!needle || count > 0} className="rounded-[2px] border border-tint/10 bg-carbon">
                  <summary className="flex min-h-11 cursor-pointer items-center justify-between gap-2 px-3 text-sm font-semibold text-chalk">
                    {brand.name}
                    {count > 0 && <span className="text-xs font-bold text-accent tnum">{count} selected</span>}
                  </summary>
                  <div className="flex flex-wrap gap-1.5 border-t border-tint/10 p-3">
                    {models.map((m) => {
                      const on = selected.has(m.slug);
                      return (
                        <button
                          key={m.slug}
                          type="button"
                          aria-pressed={on}
                          disabled={disabled || (!on && value.length >= MAX)}
                          onClick={() => toggle(m.slug)}
                          className={`chip min-h-9 normal-case tracking-normal disabled:opacity-40 ${on ? "chip-active" : "hover:border-accent hover:text-accent"}`}
                        >
                          {m.name}
                        </button>
                      );
                    })}
                  </div>
                </details>
              );
            })}
          </div>
          <p className="text-xs text-dim">
            {value.length} of {MAX} models selected.
          </p>
        </>
      )}
    </div>
  );
}
