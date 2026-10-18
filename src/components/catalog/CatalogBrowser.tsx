"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { CatalogCard } from "./CatalogCard";
import { Icon } from "@/components/ui/Icon";
import { whatsapp } from "@/lib/data/site";
import { DEPARTMENT_BY_SLUG } from "@/lib/data/taxonomy";
import { useGarage } from "@/lib/client/garage";
import {
  activeFilterCount,
  AVAILABILITY_LABELS,
  brandLabel,
  categoryName,
  facetsFor,
  filterCatalog,
  priceCeilingLabel,
  queryFromFilters,
  SORTS,
  TIER_LABELS,
  type CatalogFilters,
  type SortKey,
} from "@/lib/catalog/filters";
import type { ShopItem } from "@/lib/catalog/types";

const PAGE = 24;

/** Dimensions the page itself owns — a brand page locks `brands`, and so on. */
export type LockedDimension = "brands" | "categories";

export function CatalogBrowser({
  items,
  initial,
  locked = [],
  showBrandOnCards = true,
}: {
  items: ShopItem[];
  initial: CatalogFilters;
  locked?: LockedDimension[];
  showBrandOnCards?: boolean;
}) {
  const [filters, setFilters] = useState<CatalogFilters>(initial);
  const [visible, setVisible] = useState(PAGE);
  const [panelOpen, setPanelOpen] = useState(false);
  const countRef = useRef<HTMLParagraphElement>(null);
  const garage = useGarage();

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

  /* The filtered view is a real URL, so it can be shared, bookmarked and linked
     to from the brand pages and search. Replace rather than push — filtering is
     not a navigation step you want to walk back through one tick at a time. */
  useEffect(() => {
    const qs = queryFromFilters(filters);
    const url = qs ? `${window.location.pathname}?${qs}` : window.location.pathname;
    window.history.replaceState(null, "", url);
  }, [filters]);

  const labelOf = useMemo(() => brandLabel(items), [items]);
  const results = useMemo(() => filterCatalog(items, filters), [items, filters]);
  const facets = useMemo(() => facetsFor(items, filters), [items, filters]);

  // New filters start from the first page again (adjusting state while rendering, not in an effect).
  const [pagedFor, setPagedFor] = useState(filters);
  if (pagedFor !== filters) {
    setPagedFor(filters);
    setVisible(PAGE);
  }

  const patch = useCallback((next: Partial<CatalogFilters>) => setFilters((f) => ({ ...f, ...next })), []);

  const toggle = useCallback(
    <K extends "brands" | "categories" | "groups" | "subs" | "tiers" | "availability">(key: K, value: CatalogFilters[K][number]) =>
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
        groups: [],
        oe: false,
        subs: [],
        tiers: [],
        maxPrice: null,
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
  const oeDepartment =
    filters.categories.length === 1 ? categoryName(filters.categories[0]) : "these departments";
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
            aria-label={active > 0 ? `Open filters, ${active} active` : "Open filters"}
            aria-haspopup="dialog"
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

        <ActiveChips
          filters={filters}
          locked={locked}
          onToggle={toggle}
          onPatch={patch}
          brandOf={labelOf}
          onClear={clearAll}
          onEmpty={() => countRef.current?.focus()}
        />

        <p ref={countRef} tabIndex={-1} className="mb-4 text-xs text-ash tnum outline-none">
          {results.length} product{results.length === 1 ? "" : "s"}
          {results.length !== items.length && <span className="text-dim"> of {items.length}</span>}
        </p>

        {results.length === 0 && filters.oe && items.every((i) => !i.oe) ? (
          <div className="card p-10 text-center">
            <p className="font-display text-xl uppercase">Original Equipment</p>
            <p className="mt-2 text-sm text-ash">
              Original Equipment parts for {oeDepartment} are being added. Ask us on WhatsApp for OE availability.
            </p>
            <a
              href={whatsapp(`Hi Riderzpro, do you have Original Equipment (OE) parts for ${oeDepartment}?`)}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-primary btn-sm mt-5"
            >
              Ask on WhatsApp
            </a>
          </div>
        ) : results.length === 0 ? (
          <div className="card p-10 text-center">
            <p className="font-display text-xl uppercase">Nothing matches those filters</p>
            <p className="mt-2 text-sm text-ash">
              We stock far more than we list. Ask on WhatsApp and we&apos;ll check availability and fitment.
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

      {/* mobile bottom sheet ------------------------------------------ */}
      {panelOpen && (
        <FilterSheet count={results.length} onClear={clearAll} onClose={() => setPanelOpen(false)}>
          {panel}
        </FilterSheet>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ panel */

const PRICE_CEILINGS = [999, 2499, 4999];

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

/**
 * The filter panel below lg, as a bottom sheet. Same behaviour as the menu
 * drawer: Escape and the backdrop close it, body scroll is locked, Tab stays
 * inside, and focus returns to the button that opened it.
 */
function FilterSheet({
  count,
  onClear,
  onClose,
  children,
}: {
  count: number;
  onClear: () => void;
  onClose: () => void;
  children: React.ReactNode;
}) {
  const [shown, setShown] = useState(false);
  const sheet = useRef<HTMLDivElement>(null);
  const closeBtn = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const opener = document.activeElement as HTMLElement | null;
    const raf = requestAnimationFrame(() => {
      setShown(true);
      closeBtn.current?.focus();
    });
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
        return;
      }
      if (e.key !== "Tab" || !sheet.current) return;
      const els = Array.from(sheet.current.querySelectorAll<HTMLElement>(FOCUSABLE));
      if (els.length === 0) return;
      const first = els[0];
      const last = els[els.length - 1];
      const cur = document.activeElement;
      if (!sheet.current.contains(cur)) {
        e.preventDefault();
        first.focus();
      } else if (e.shiftKey && cur === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && cur === last) {
        e.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", onKey);

    // The sheet is `lg:hidden`; close it if the viewport crosses that breakpoint
    // while open so the scroll lock and focus trap don't outlive it.
    const mq = window.matchMedia("(min-width: 64rem)");
    const onBreakpoint = (e: MediaQueryListEvent) => e.matches && onClose();
    mq.addEventListener("change", onBreakpoint);

    return () => {
      cancelAnimationFrame(raf);
      document.removeEventListener("keydown", onKey);
      mq.removeEventListener("change", onBreakpoint);
      document.body.style.overflow = prevOverflow;
      opener?.focus?.();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="fixed inset-0 z-[80] lg:hidden" role="dialog" aria-modal="true" aria-label="Filters">
      <button
        type="button"
        tabIndex={-1}
        aria-label="Close filters"
        onClick={onClose}
        className={`absolute inset-0 bg-void/70 transition-opacity duration-200 ${shown ? "opacity-100" : "opacity-0"}`}
      />
      <div
        ref={sheet}
        className={`absolute inset-x-0 bottom-0 flex max-h-[88dvh] flex-col rounded-t-2xl border-t border-tint/10 bg-void shadow-2xl shadow-tint/10 transition-transform duration-300 md:mx-auto md:max-w-xl ${
          shown ? "translate-y-0" : "translate-y-full"
        }`}
      >
        <div className="flex shrink-0 items-center justify-between border-b border-tint/10 px-4 py-3">
          <p className="font-display text-lg font-extrabold uppercase">Filters</p>
          <button
            ref={closeBtn}
            type="button"
            onClick={onClose}
            aria-label="Close filters"
            className="grid h-10 w-10 place-items-center text-ash transition-colors hover:text-accent"
          >
            <Icon name="close" size={22} />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto overscroll-contain px-4 py-5">{children}</div>
        <div className="flex shrink-0 gap-3 border-t border-tint/10 bg-void px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
          <button type="button" onClick={onClear} className="btn btn-outline flex-1">
            Clear all
          </button>
          <button type="button" onClick={onClose} className="btn btn-primary flex-1">
            Show {count} product{count === 1 ? "" : "s"}
          </button>
        </div>
      </div>
    </div>
  );
}

type ToggleFn = <K extends "brands" | "categories" | "groups" | "subs" | "tiers" | "availability">(
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
            Open my car&apos;s page
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

      {facets.groups.length > 1 && (
        <Group title="Group">
          {facets.groups.map((f) => (
            <Check
              key={f.value}
              label={f.label}
              count={f.count}
              checked={filters.groups.includes(f.value)}
              onChange={() => onToggle("groups", f.value)}
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

      <Group title="Price">
        <div className="mb-2 flex flex-wrap gap-2" role="group" aria-label="Price ceiling">
          {PRICE_CEILINGS.map((n) => {
            const on = filters.maxPrice === n;
            return (
              <button
                key={n}
                type="button"
                aria-pressed={on}
                onClick={() => onPatch({ maxPrice: on ? null : n })}
                className={`chip min-h-[36px] ${on ? "chip-active" : "hover:border-accent hover:text-accent"}`}
              >
                {priceCeilingLabel(n)}
              </button>
            );
          })}
        </div>
        {facets.tiers.length > 1 &&
          facets.tiers.map((f) => (
            <Check
              key={f.value}
              label={f.label}
              count={f.count}
              checked={filters.tiers.includes(f.value)}
              onChange={() => onToggle("tiers", f.value)}
            />
          ))}
      </Group>

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

      <Group title="Original Equipment">
        <Check
          label="OE (Original Equipment) only"
          count={facets.oe}
          checked={filters.oe}
          onChange={(on) => onPatch({ oe: on })}
        />
      </Group>

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
  brandOf,
  onClear,
  onEmpty,
}: {
  filters: CatalogFilters;
  locked: LockedDimension[];
  onToggle: ToggleFn;
  onPatch: (next: Partial<CatalogFilters>) => void;
  brandOf: ReturnType<typeof brandLabel>;
  onClear: () => void;
  /** Called when removing the last chip leaves nothing to focus. */
  onEmpty: () => void;
}) {
  /* Removing a chip unmounts the button that had focus. Remember its position and,
     after the list re-renders, focus the chip that took its place (or the previous one). */
  const wrap = useRef<HTMLDivElement>(null);
  const refocus = useRef<number | null>(null);
  useEffect(() => {
    if (refocus.current === null) return;
    const i = refocus.current;
    refocus.current = null;
    const btns = wrap.current?.querySelectorAll<HTMLElement>("[data-chip]");
    const target = btns?.[i] ?? btns?.[i - 1];
    if (target) target.focus();
    else onEmpty();
  });

  const chips: { key: string; label: string; remove: () => void }[] = [];

  if (!locked.includes("brands"))
    for (const b of filters.brands)
      chips.push({ key: `b-${b}`, label: brandOf(b), remove: () => onToggle("brands", b) });
  if (!locked.includes("categories"))
    for (const c of filters.categories)
      chips.push({ key: `c-${c}`, label: categoryName(c), remove: () => onToggle("categories", c) });
  const groupNames = new Map(
    (filters.categories.length === 1 ? (DEPARTMENT_BY_SLUG[filters.categories[0]]?.groups ?? []) : []).map((g) => [g.slug, g.name]),
  );
  for (const g of filters.groups)
    chips.push({ key: `g-${g}`, label: groupNames.get(g) ?? g, remove: () => onToggle("groups", g) });
  if (filters.oe) chips.push({ key: "oe", label: "Original Equipment", remove: () => onPatch({ oe: false }) });
  for (const s of filters.subs) chips.push({ key: `s-${s}`, label: s, remove: () => onToggle("subs", s) });
  for (const t of filters.tiers)
    chips.push({ key: `t-${t}`, label: TIER_LABELS[t], remove: () => onToggle("tiers", t) });
  if (filters.maxPrice !== null)
    chips.push({ key: "max", label: priceCeilingLabel(filters.maxPrice), remove: () => onPatch({ maxPrice: null }) });
  for (const a of filters.availability)
    chips.push({ key: `a-${a}`, label: AVAILABILITY_LABELS[a], remove: () => onToggle("availability", a) });
  if (filters.fits) chips.push({ key: "fits", label: "Fits my car", remove: () => onPatch({ fits: null }) });
  if (filters.installation)
    chips.push({ key: "install", label: "Installation available", remove: () => onPatch({ installation: false }) });
  if (filters.q.trim()) chips.push({ key: "q", label: `“${filters.q.trim()}”`, remove: () => onPatch({ q: "" }) });

  if (chips.length === 0) return null;

  return (
    <div ref={wrap} className="mb-4 flex flex-wrap items-center gap-2">
      {chips.map((c, i) => (
        <button
          key={c.key}
          type="button"
          data-chip=""
          onClick={() => {
            refocus.current = i;
            c.remove();
          }}
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
