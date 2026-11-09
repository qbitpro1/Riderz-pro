"use client";

import { useId, useState, type ReactNode } from "react";
import { Icon } from "@/components/ui/Icon";
import { Slider } from "@/components/ui/slider";
import type { CatalogFacets, CatalogFilters } from "@/lib/catalog/filters";
import type { SpeakerSize } from "@/lib/catalog/speaker-size";

export type LockedDimension = "brands" | "categories";

export type ToggleKey = "brands" | "categories" | "groups" | "subs" | "tiers" | "availability" | "sizes";
export type ToggleFn = <K extends ToggleKey>(key: K, value: CatalogFilters[K][number]) => void;

/** Asks the floating AI assistant (components/layout/AssistantFab) to open. */
export const OPEN_ASSISTANT_EVENT = "riderzpro:open-assistant";

/** Lowest and highest price in the listing, for the price slider's ends. */
export type PriceBounds = { min: number; max: number } | null;

/** A long checkbox list shows this many, then "Show all". */
const SHORT_LIST = 6;
/** The brand list gets a search box from this many brands. */
const BRAND_SEARCH_FROM = 5;

/**
 * The filter list: collapsible sections used in the desktop sidebar and in the phone filter sheet.
 * Sections only appear when they offer a real choice; every section with a selection has its own
 * "Clear". Filters apply as soon as they are changed (the phone sheet's button just closes it).
 */
export function FilterSections({
  filters,
  facets,
  locked,
  priceBounds,
  onToggle,
  onPatch,
}: {
  filters: CatalogFilters;
  facets: CatalogFacets;
  locked: LockedDimension[];
  priceBounds: PriceBounds;
  onToggle: ToggleFn;
  onPatch: (next: Partial<CatalogFilters>) => void;
}) {
  const moreActive = (filters.oe ? 1 : 0) + (filters.installation ? 1 : 0) + filters.tiers.length;
  return (
    <div className="divide-y divide-cl-ink/[0.07]">
      {!locked.includes("categories") && facets.categories.length > 1 && (
        <Section title="Category" active={filters.categories.length} onClear={() => onPatch({ categories: [] })}>
          <CheckList facets={facets.categories} selected={filters.categories} onToggle={(v) => onToggle("categories", v)} />
        </Section>
      )}

      {!locked.includes("brands") && facets.brands.length > 1 && (
        <Section title="Brand" active={filters.brands.length} onClear={() => onPatch({ brands: [] })}>
          <CheckList
            facets={facets.brands}
            selected={filters.brands}
            onToggle={(v) => onToggle("brands", v)}
            searchLabel={facets.brands.length >= BRAND_SEARCH_FROM ? "Search brands" : undefined}
          />
        </Section>
      )}

      {(facets.sizes.length > 1 || filters.sizes.length > 0) && (
        <Section title="Speaker size" active={filters.sizes.length} onClear={() => onPatch({ sizes: [] })}>
          <div className="flex flex-wrap gap-2">
            {facets.sizes.map((f) => {
              const on = filters.sizes.includes(f.value as SpeakerSize);
              return (
                <button
                  key={f.value}
                  type="button"
                  aria-pressed={on}
                  onClick={() => onToggle("sizes", f.value)}
                  className={`min-h-[40px] min-w-[3.75rem] rounded-full px-3.5 text-[14px] font-semibold transition-all active:scale-95 ${
                    on ? "bg-cl-ink text-cl-on-ink shadow-[0_4px_12px_-4px_rgba(0,0,0,0.35)]" : "fs-well text-cl-ink hover:bg-cl-ink/[0.06]"
                  }`}
                >
                  {f.label}
                  <span className="sr-only">, {f.count} products</span>
                </button>
              );
            })}
          </div>
        </Section>
      )}

      <Section
        title="Price"
        active={(filters.minPrice !== null ? 1 : 0) + (filters.maxPrice !== null ? 1 : 0)}
        onClear={() => onPatch({ minPrice: null, maxPrice: null })}
      >
        <PriceRange bounds={priceBounds} min={filters.minPrice} max={filters.maxPrice} onChange={(minPrice, maxPrice) => onPatch({ minPrice, maxPrice })} />
      </Section>

      {facets.availability.length > 1 && (
        <Section title="Availability" active={filters.availability.length} onClear={() => onPatch({ availability: [] })}>
          <CheckList facets={facets.availability} selected={filters.availability} onToggle={(v) => onToggle("availability", v)} />
        </Section>
      )}

      {facets.groups.length > 1 && (
        <Section title="Group" active={filters.groups.length} defaultOpen={false} onClear={() => onPatch({ groups: [] })}>
          <CheckList facets={facets.groups} selected={filters.groups} onToggle={(v) => onToggle("groups", v)} />
        </Section>
      )}

      {facets.subs.length > 1 && (
        <Section title="Type" active={filters.subs.length} defaultOpen={false} onClear={() => onPatch({ subs: [] })}>
          <CheckList facets={facets.subs} selected={filters.subs} onToggle={(v) => onToggle("subs", v)} />
        </Section>
      )}

      <Section title="More" active={moreActive} defaultOpen={false} onClear={() => onPatch({ oe: false, installation: false, tiers: [] })}>
        {facets.tiers.length > 1 && (
          <>
            <p className="cl-label mb-1 mt-1">Price range</p>
            <CheckList facets={facets.tiers} selected={filters.tiers} onToggle={(v) => onToggle("tiers", v)} />
            <p className="cl-label mb-1 mt-3">Product</p>
          </>
        )}
        <Check label="Installation available" count={facets.installation} checked={filters.installation} onChange={(on) => onPatch({ installation: on })} />
        <Check label="Original Equipment (OE) only" count={facets.oe} checked={filters.oe} onChange={(on) => onPatch({ oe: on })} />
      </Section>
    </div>
  );
}

/* ---------------------------------------------------------------- pieces */

function Section({
  title,
  active = 0,
  defaultOpen = true,
  onClear,
  children,
}: {
  title: string;
  active?: number;
  defaultOpen?: boolean;
  onClear?: () => void;
  children: ReactNode;
}) {
  // A section with a selection in it starts open, so a shared filtered link shows what is applied.
  const [open, setOpen] = useState(defaultOpen || active > 0);
  const id = useId();
  return (
    <fieldset className="py-3">
      <legend className="flex w-full items-center gap-2">
        <button
          type="button"
          aria-expanded={open}
          aria-controls={id}
          onClick={() => setOpen((o) => !o)}
          className="group flex min-h-[44px] flex-1 items-center justify-between gap-2 text-left text-[15px] font-semibold tracking-[-0.01em]"
        >
          <span>
            {title}
            {active > 0 && (
              <span className="ml-2 inline-grid h-5 min-w-5 place-items-center rounded-full bg-cl-ink px-1.5 text-[11px] font-bold text-cl-on-ink tnum">
                {active}
              </span>
            )}
          </span>
          <span className="fs-well grid h-7 w-7 shrink-0 place-items-center rounded-full transition-colors group-hover:bg-cl-ink/[0.06]" aria-hidden="true">
            <Icon name="chevron" size={14} className={`text-cl-muted transition-transform duration-200 ${open ? "-rotate-90" : "rotate-90"}`} />
          </span>
        </button>
        {active > 0 && onClear && (
          <button
            type="button"
            onClick={onClear}
            className="group/clear grid min-h-[44px] place-items-center"
            aria-label={`Clear ${title.toLowerCase()} filter`}
          >
            <span className="fs-well rounded-full px-2.5 py-1 text-[12px] font-semibold text-cl-muted transition-colors group-hover/clear:text-cl-ink">Clear</span>
          </button>
        )}
      </legend>
      <div id={id} hidden={!open} className="pb-1 pt-1">
        {children}
      </div>
    </fieldset>
  );
}

type FacetRow<T extends string> = { value: T; label: string; count: number };

/** Checkboxes with counts; long lists collapse to SHORT_LIST with "Show all", optional search. */
function CheckList<T extends string>({
  facets,
  selected,
  onToggle,
  searchLabel,
}: {
  facets: FacetRow<T>[];
  selected: readonly T[];
  onToggle: (value: T) => void;
  searchLabel?: string;
}) {
  const id = useId();
  const [q, setQ] = useState("");
  const [all, setAll] = useState(false);
  const needle = q.trim().toLowerCase();
  const matching = needle ? facets.filter((f) => f.label.toLowerCase().includes(needle)) : facets;
  // Selected rows always stay visible, even when the list is collapsed.
  const shown = all || needle ? matching : matching.filter((f, i) => i < SHORT_LIST || selected.includes(f.value));
  const hidden = matching.length - shown.length;

  return (
    <div>
      {searchLabel && (
        <div className="relative mb-2">
          <label htmlFor={`${id}-q`} className="sr-only">
            {searchLabel}
          </label>
          <Icon name="search" size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-cl-muted" />
          <input
            id={`${id}-q`}
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder={searchLabel}
            className="fs-well fs-field min-h-[40px] rounded-full pl-9 text-[14px]"
          />
        </div>
      )}
      {shown.map((f) => (
        <Check key={f.value} label={f.label} count={f.count} checked={selected.includes(f.value)} onChange={() => onToggle(f.value)} />
      ))}
      {needle && matching.length === 0 && <p className="py-2 text-[13px] text-cl-muted">No match for “{q.trim()}”.</p>}
      {!needle && (hidden > 0 || all) && facets.length > SHORT_LIST && (
        <button type="button" onClick={() => setAll((a) => !a)} className="mt-1 min-h-[40px] text-[13px] font-semibold text-cl-ink underline underline-offset-4">
          {all ? "Show fewer" : `Show all ${facets.length}`}
        </button>
      )}
    </div>
  );
}

function Check({ label, count, checked, onChange }: { label: string; count?: number; checked: boolean; onChange: (on: boolean) => void }) {
  const empty = count === 0 && !checked;
  return (
    <label
      className={`-mx-2 flex min-h-[40px] cursor-pointer items-center gap-3 rounded-xl px-2 text-[14px] transition-colors hover:bg-cl-ink/[0.04] ${empty ? "text-cl-muted" : "text-cl-ink"}`}
    >
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="fs-check"
      />
      <span className="min-w-0 flex-1">{label}</span>
      {count !== undefined && (
        <span className="shrink-0 rounded-full bg-cl-ink/[0.06] px-2 py-0.5 text-[12px] font-medium text-cl-muted tnum">{count}</span>
      )}
    </label>
  );
}

/* ------------------------------------------------------------------ price */

const rupee = (n: number) => `₹${n.toLocaleString("en-IN")}`;

/**
 * Min / max in rupees: a two-handle slider across the listing's own price range, linked to two
 * number fields. Dragging moves the numbers live; the filter applies when a handle is let go, a
 * field is left, or Enter is pressed — not on every pixel or keystroke.
 */
function PriceRange({
  bounds,
  min,
  max,
  onChange,
}: {
  bounds: PriceBounds;
  min: number | null;
  max: number | null;
  onChange: (min: number | null, max: number | null) => void;
}) {
  const id = useId();
  const floor = bounds?.min ?? 0;
  const ceil = bounds?.max ?? 0;
  const step = ceil - floor > 20000 ? 500 : 100;

  const [lo, setLo] = useState(min === null ? "" : String(min));
  const [hi, setHi] = useState(max === null ? "" : String(max));
  // Keep the fields in step when the filter changes elsewhere (a chip removed, "Clear all").
  const [seen, setSeen] = useState({ min, max });
  if (seen.min !== min || seen.max !== max) {
    setSeen({ min, max });
    setLo(min === null ? "" : String(min));
    setHi(max === null ? "" : String(max));
  }

  const parse = (v: string) => {
    const n = Number(v.replace(/[^\d]/g, ""));
    return v.trim() && Number.isFinite(n) && n > 0 ? n : null;
  };
  /** A value at the slider's end means "no limit" on that side. */
  const commit = (l: string, h: string) => {
    let a = parse(l);
    let b = parse(h);
    if (a !== null && b !== null && a > b) [a, b] = [b, a];
    if (bounds && a !== null && a <= floor) a = null;
    if (bounds && b !== null && b >= ceil) b = null;
    onChange(a, b);
  };

  const loNum = parse(lo) ?? floor;
  const hiNum = parse(hi) ?? ceil;
  const clamp = (n: number) => Math.min(ceil, Math.max(floor, n));

  const field = (label: string, value: string, set: (v: string) => void, key: "min" | "max") => (
    <div className="min-w-0 flex-1">
      <label htmlFor={`${id}-${key}`} className="mb-1.5 block pl-1 text-[11px] font-semibold uppercase tracking-[0.1em] text-cl-muted">
        {label}
      </label>
      <div className="relative">
        <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[14px] text-cl-muted" aria-hidden="true">
          ₹
        </span>
        <input
          id={`${id}-${key}`}
          inputMode="numeric"
          className="fs-well fs-field pl-7"
          value={value}
          onChange={(e) => set(e.target.value)}
          onBlur={() => commit(lo, hi)}
          onKeyDown={(e) => e.key === "Enter" && commit(lo, hi)}
          placeholder={key === "min" ? (bounds ? String(floor) : "0") : bounds ? String(ceil) : "Any"}
        />
      </div>
    </div>
  );

  return (
    <div>
      {bounds && ceil > floor && (
        <Slider
          className="mb-5 mt-3"
          trackClassName="data-[orientation=horizontal]:h-1.5 bg-cl-ink/10"
          rangeClassName="bg-cl-ink"
          thumbClassName="h-7 w-7 cursor-grab border-0 bg-white shadow-[0_3px_10px_rgba(0,0,0,0.18),0_0_0_0.5px_rgba(0,0,0,0.12)] transition-transform active:scale-110 active:cursor-grabbing focus-visible:outline-cl-ink/30"
          min={floor}
          max={ceil}
          step={step}
          minStepsBetweenThumbs={0}
          value={[clamp(Math.min(loNum, hiNum)), clamp(Math.max(loNum, hiNum))]}
          onValueChange={([a, b]) => {
            setLo(String(a));
            setHi(String(b));
          }}
          onValueCommit={([a, b]) => commit(String(a), String(b))}
          thumbLabels={["Minimum price", "Maximum price"]}
          showTooltip
          tooltipContent={rupee}
        />
      )}
      <div className="flex items-end gap-2">
        {field("Min", lo, setLo, "min")}
        <span className="pb-3 text-cl-muted" aria-hidden="true">
          –
        </span>
        {field("Max", hi, setHi, "max")}
      </div>
      {bounds && (
        <p className="mt-2.5 pl-1 text-[12px] text-cl-muted tnum">
          Prices here run from {rupee(floor)} to {rupee(ceil)}.
        </p>
      )}
    </div>
  );
}
