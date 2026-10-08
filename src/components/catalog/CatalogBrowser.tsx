"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { CatalogCard } from "./CatalogCard";
import { Icon } from "@/components/ui/Icon";
import { readGarage } from "@/components/fitment/FitmentPicker";
import {
  activeFilterCount,
  AVAILABILITY_LABELS,
  brandName,
  categoryName,
  facetsFor,
  filterCatalog,
  queryFromFilters,
  SORTS,
  TIER_LABELS,
  type CatalogFilters,
  type Facet,
  type SortKey,
} from "@/lib/catalog/filters";
import type { CatalogItem } from "@/lib/catalog/types";

const PAGE = 24;

/** Dimensions the page itself owns — a brand page locks `brands`, and so on. */
export type LockedDimension = "brands" | "categories";

export function CatalogBrowser({
  items,
  initial,
  locked = [],
  showBrandOnCards = true,
}: {
  items: CatalogItem[];
  initial: CatalogFilters;
  locked?: LockedDimension[];
  showBrandOnCards?: boolean;
}) {
  const [filters, setFilters] = useState<CatalogFilters>(initial);
  const [visible, setVisible] = useState(PAGE);
  const [panelOpen, setPanelOpen] = useState(false);
  const [garage, setGarage] = useState<{ modelSlug: string; label: string } | null>(null);

  /* A client-side navigation to the same route with different query params —
     "Autoform" from the category page's brand rail, say — re-renders this
     component rather than remounting it, so the incoming filters have to be
     adopted explicitly. Our own in-page filtering only ever calls
     replaceState, which leaves `initial` untouched, so this can't loop. */
  const incoming = queryFromFilters(initial);
  const [adopted, setAdopted] = useState(incoming);
  if (incoming !== adopted) {
    setAdopted(incoming);
    setFilters(initial);
  }

  useEffect(() => {
    const g = readGarage();
    if (g) setGarage({ modelSlug: g.modelSlug, label: g.label });
  }, []);

  /* The filtered view is a real URL, so it can be shared, bookmarked and linked
     to from the brand pages and search. Replace rather than push — filtering is
     not a navigation step you want to walk back through one tick at a time. */
  useEffect(() => {
    const qs = queryFromFilters(filters);
    const url = qs ? `${window.location.pathname}?${qs}` : window.location.pathname;
    window.history.replaceState(null, "", url);
  }, [filters]);

  const results = useMemo(() => filterCatalog(items, filters), [items, filters]);
  const facets = useMemo(() => facetsFor(items, filters), [items, filters]);

  useEffect(() => setVisible(PAGE), [filters]);

  const patch = useCallback((next: Partial<CatalogFilters>) => setFilters((f) => ({ ...f, ...next })), []);

  const toggle = useCallback(
    <K extends "brands" | "categories" | "subs" | "tiers" | "availability">(key: K, value: CatalogFilters[K][number]) =>
      setFilters((f) => {
        const current = f[key] as CatalogFilters[K][number][];
        const has = current.includes(value);
        return { ...f, [key]: has ? current.filter((v) => v !== value) : [...current, value] } as CatalogFilters;
      }),
    [],
  );

  const clearAll = useCallback(
    () =>
      setFilters((f) => ({
        ...f,
        // Locked dimensions belong to the page, not the user's filter set.
        brands: locked.includes("brands") ? f.brands : [],
        categories: locked.includes("categories") ? f.categories : [],
        subs: [],
        tiers: [],
        availability: [],
        fits: null,
        installation: false,
        q: "",
      })),
    [locked],
  );

  const lockedCount =
    (locked.includes("brands") ? filters.brands.length : 0) +
    (locked.includes("categories") ? filters.categories.length : 0);
  const active = activeFilterCount(filters) - lockedCount;

  const panel = (
    <FilterPanel
      filters={filters}
      facets={facets}
      locked={locked}
      garage={garage}
      onToggle={toggle}
      onPatch={patch}
    />
  );

  return (
    <div className="lg:flex lg:gap-8">
      {/* desktop rail ------------------------------------------------- */}
      <aside className="hidden w-64 shrink-0 lg:block">
        <div className="sticky top-24 max-h-[calc(100vh-8rem)] overflow-y-auto pr-1">
          <div className="mb-4 flex items-center justify-between">
            <p className="eyebrow">Filters</p>
            {active > 0 && (
              <button type="button" onClick={clearAll} className="text-[11px] text-accent underline underline-offset-4">
                Clear all
              </button>
            )}
          </div>
          {panel}
        </div>
      </aside>

      <div className="min-w-0 flex-1">
        {/* toolbar ---------------------------------------------------- */}
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <label className="relative flex h-9 min-w-0 flex-1 items-center sm:max-w-xs">
            <Icon name="search" size={14} className="pointer-events-none absolute left-3 text-dim" />
            <input
              value={filters.q}
              onChange={(e) => patch({ q: e.target.value })}
              placeholder="Search this catalogue"
              aria-label="Search the catalogue"
              className="field h-9 w-full pl-8 text-xs"
            />
          </label>

          <button
            type="button"
            onClick={() => setPanelOpen(true)}
            className="btn btn-outline btn-sm lg:hidden"
            aria-label="Open filters"
          >
            <Icon name="filter" size={14} />
            Filters{active > 0 ? ` (${active})` : ""}
          </button>

          <select
            aria-label="Sort products"
            className="field ml-auto h-9 w-auto text-xs"
            value={filters.sort}
            onChange={(e) => patch({ sort: e.target.value as SortKey })}
          >
            {SORTS.map((s) => (
              <option key={s.key} value={s.key}>
                {s.label}
              </option>
            ))}
          </select>
        </div>

        <ActiveChips filters={filters} locked={locked} onToggle={toggle} onPatch={patch} onClear={clearAll} />

        <p className="mb-4 text-xs text-ash tnum">
          {results.length} product{results.length === 1 ? "" : "s"}
          {results.length !== items.length && <span className="text-dim"> of {items.length}</span>}
        </p>

        {results.length === 0 ? (
          <div className="card p-10 text-center">
            <p className="font-display text-xl uppercase">Nothing matches those filters</p>
            <p className="mt-2 text-sm text-ash">
              We stock far more than we list. Ask on WhatsApp and we'll check availability and fitment.
            </p>
            <button type="button" onClick={clearAll} className="btn btn-outline btn-sm mt-5">
              Reset filters
            </button>
          </div>
        ) : (
          <>
            <ul className="grid grid-cols-2 gap-3 md:grid-cols-3 md:gap-4 xl:grid-cols-4">
              {results.slice(0, visible).map((item) => (
                <li key={item.id}>
                  <CatalogCard item={item} showBrand={showBrandOnCards} />
                </li>
              ))}
            </ul>
            {visible < results.length && (
              <div className="mt-8 text-center">
                <button type="button" onClick={() => setVisible((v) => v + PAGE)} className="btn btn-outline">
                  Show more
                  <span className="text-dim tnum">({results.length - visible} left)</span>
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* mobile drawer ------------------------------------------------ */}
      {panelOpen && (
        <div className="fixed inset-0 z-[80] flex flex-col bg-void/97 backdrop-blur-xl lg:hidden">
          <div className="shell flex items-center justify-between py-4">
            <p className="font-display text-lg font-extrabold uppercase">Filters</p>
            <button
              type="button"
              onClick={() => setPanelOpen(false)}
              aria-label="Close filters"
              className="grid h-10 w-10 place-items-center text-ash"
            >
              <Icon name="close" size={22} />
            </button>
          </div>
          <div className="hairline" />
          <div className="shell flex-1 overflow-y-auto py-5">{panel}</div>
          <div className="hairline" />
          <div className="shell flex gap-3 py-4">
            <button type="button" onClick={clearAll} className="btn btn-outline flex-1">
              Clear all
            </button>
            <button type="button" onClick={() => setPanelOpen(false)} className="btn btn-primary flex-1">
              Show {results.length}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ panel */

type ToggleFn = <K extends "brands" | "categories" | "subs" | "tiers" | "availability">(
  key: K,
  value: CatalogFilters[K][number],
) => void;

function FilterPanel({
  filters,
  facets,
  locked,
  garage,
  onToggle,
  onPatch,
}: {
  filters: CatalogFilters;
  facets: ReturnType<typeof facetsFor>;
  locked: LockedDimension[];
  garage: { modelSlug: string; label: string } | null;
  onToggle: ToggleFn;
  onPatch: (next: Partial<CatalogFilters>) => void;
}) {
  return (
    <div className="space-y-6">
      {garage && (
        <section>
          <p className="eyebrow mb-3">My car</p>
          <Check
            label={`Fits my ${garage.label}`}
            count={facets.fits || undefined}
            checked={filters.fits === garage.modelSlug}
            onChange={(on) => onPatch({ fits: on ? garage.modelSlug : null })}
          />
          <Link
            href={`/accessories/${garage.modelSlug}`}
            className="mt-2 inline-block text-[11px] text-accent underline underline-offset-4"
          >
            Open my car's page
          </Link>
        </section>
      )}

      {!locked.includes("brands") && facets.brands.length > 1 && (
        <Group title="Brand">
          {facets.brands.map((f) => (
            <Check
              key={f.value}
              label={f.label}
              count={f.count}
              checked={filters.brands.includes(f.value)}
              onChange={() => onToggle("brands", f.value)}
            />
          ))}
        </Group>
      )}

      {!locked.includes("categories") && facets.categories.length > 1 && (
        <Group title="Category">
          {facets.categories.map((f) => (
            <Check
              key={f.value}
              label={f.label}
              count={f.count}
              checked={filters.categories.includes(f.value)}
              onChange={() => onToggle("categories", f.value)}
            />
          ))}
        </Group>
      )}

      {facets.subs.length > 1 && (
        <Group title="Type" scroll>
          {facets.subs.map((f) => (
            <Check
              key={f.value}
              label={f.label}
              count={f.count}
              checked={filters.subs.includes(f.value)}
              onChange={() => onToggle("subs", f.value)}
            />
          ))}
        </Group>
      )}

      {facets.tiers.length > 1 && (
        <Group title="Price">
          {facets.tiers.map((f) => (
            <Check
              key={f.value}
              label={f.label}
              count={f.count}
              checked={filters.tiers.includes(f.value)}
              onChange={() => onToggle("tiers", f.value)}
            />
          ))}
        </Group>
      )}

      {facets.availability.length > 1 && (
        <Group title="Availability">
          {facets.availability.map((f) => (
            <Check
              key={f.value}
              label={f.label}
              count={f.count}
              checked={filters.availability.includes(f.value)}
              onChange={() => onToggle("availability", f.value)}
            />
          ))}
        </Group>
      )}

      <Group title="Service">
        <Check
          label="Installation available"
          count={facets.installation}
          checked={filters.installation}
          onChange={(on) => onPatch({ installation: on })}
        />
      </Group>
    </div>
  );
}

function Group({ title, children, scroll = false }: { title: string; children: React.ReactNode; scroll?: boolean }) {
  return (
    <section>
      <p className="eyebrow mb-3">{title}</p>
      <div className={scroll ? "max-h-64 space-y-0.5 overflow-y-auto pr-1" : "space-y-0.5"}>{children}</div>
    </section>
  );
}

function Check({
  label,
  count,
  checked,
  onChange,
}: {
  label: string;
  count?: number;
  checked: boolean;
  onChange: (on: boolean) => void;
}) {
  const empty = count === 0 && !checked;
  return (
    <label
      className={`flex cursor-pointer items-center gap-2.5 py-1 text-[13px] transition-colors ${
        empty ? "text-dim" : "text-ash hover:text-chalk"
      }`}
    >
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="h-3.5 w-3.5 shrink-0 accent-[var(--color-accent)]"
      />
      <span className="min-w-0 flex-1 truncate">{label}</span>
      {count !== undefined && <span className="shrink-0 text-[11px] text-dim tnum">{count}</span>}
    </label>
  );
}

/* ------------------------------------------------------------ active chips */

function ActiveChips({
  filters,
  locked,
  onToggle,
  onPatch,
  onClear,
}: {
  filters: CatalogFilters;
  locked: LockedDimension[];
  onToggle: ToggleFn;
  onPatch: (next: Partial<CatalogFilters>) => void;
  onClear: () => void;
}) {
  const chips: { key: string; label: string; remove: () => void }[] = [];

  if (!locked.includes("brands"))
    for (const b of filters.brands)
      chips.push({ key: `b-${b}`, label: brandName(b), remove: () => onToggle("brands", b) });
  if (!locked.includes("categories"))
    for (const c of filters.categories)
      chips.push({ key: `c-${c}`, label: categoryName(c), remove: () => onToggle("categories", c) });
  for (const s of filters.subs) chips.push({ key: `s-${s}`, label: s, remove: () => onToggle("subs", s) });
  for (const t of filters.tiers)
    chips.push({ key: `t-${t}`, label: TIER_LABELS[t], remove: () => onToggle("tiers", t) });
  for (const a of filters.availability)
    chips.push({ key: `a-${a}`, label: AVAILABILITY_LABELS[a], remove: () => onToggle("availability", a) });
  if (filters.fits) chips.push({ key: "fits", label: "Fits my car", remove: () => onPatch({ fits: null }) });
  if (filters.installation)
    chips.push({ key: "install", label: "Installation available", remove: () => onPatch({ installation: false }) });
  if (filters.q.trim()) chips.push({ key: "q", label: `“${filters.q.trim()}”`, remove: () => onPatch({ q: "" }) });

  if (chips.length === 0) return null;

  return (
    <div className="mb-4 flex flex-wrap items-center gap-2">
      {chips.map((c) => (
        <button
          key={c.key}
          type="button"
          onClick={c.remove}
          className="chip chip-active hover:opacity-80"
          aria-label={`Remove filter ${c.label}`}
        >
          {c.label}
          <Icon name="close" size={11} />
        </button>
      ))}
      <button type="button" onClick={onClear} className="text-[11px] text-accent underline underline-offset-4">
        Clear all
      </button>
    </div>
  );
}
