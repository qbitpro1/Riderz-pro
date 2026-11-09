"use client";

import { useCallback, useEffect, useId, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { ListingCard } from "./ListingCard";
import { FilterSections, type LockedDimension, type PriceBounds, type ToggleFn, type ToggleKey } from "./FilterSidebar";
import { Sheet, SortSheet } from "./MobileSheets";
import { VehicleBar } from "./VehicleBar";
import { carTitle } from "./vehicleBarState";
import { Icon } from "@/components/ui/Icon";
import { DEPARTMENT_BY_SLUG } from "@/lib/data/taxonomy";
import { BRANDS as VEHICLE_BRANDS } from "@/lib/data/vehicles";
import { useGarage } from "@/lib/client/garage";
import {
  activeFilterCount,
  AVAILABILITY_LABELS,
  brandLabel,
  categoryName,
  facetsFor,
  filterCatalog,
  itemFits,
  queryFromFilters,
  SORTS,
  TIER_LABELS,
  type CatalogFilters,
  type SortKey,
} from "@/lib/catalog/filters";
import { SPEAKER_SIZE_LABELS } from "@/lib/catalog/speaker-size";
import type { ShopItem } from "@/lib/catalog/types";
import { EnquiryButton } from "@/components/enquiry/Enquiry";

export type { LockedDimension } from "./FilterSidebar";

const PAGE = 24;
const LISTING_ATTR = "data-listing";

/** The page header a listing can carry: breadcrumb and title, plus the brand pills. */
export type ListingHeader = {
  crumbs: { label: string; href?: string }[];
  /** Fallback title; a department page shows its one active group's name instead. */
  title: string;
};

/**
 * THE PRODUCT LISTING. Used by every catalogue page (shop, departments, brands, collections, seller
 * stores, car pages). Filtering, facets and the URL are the filter engine's (lib/catalog/filters);
 * this is the layout around them.
 *
 *   header       the page header (breadcrumb, H1, brand pills) — department pages
 *   vehicleBar   "What do you drive?" — with a saved car, results are filtered to parts that fit
 */
export function CatalogBrowser({
  items,
  initial,
  locked = [],
  showBrandOnCards = true,
  header,
  vehicleBar = false,
}: {
  items: ShopItem[];
  initial: CatalogFilters;
  locked?: LockedDimension[];
  showBrandOnCards?: boolean;
  header?: ListingHeader;
  vehicleBar?: boolean;
}) {
  const [filters, setFilters] = useState<CatalogFilters>(initial);
  const [visible, setVisible] = useState(PAGE);
  const [sheet, setSheet] = useState<"filters" | "sort" | null>(null);
  const countRef = useRef<HTMLParagraphElement>(null);
  const garage = useGarage();
  const searchId = useId();
  const sortId = useId();

  /* A client-side navigation to the same route with different query params re-renders this
     component rather than remounting it, so the incoming filters are adopted explicitly. Our own
     filtering only calls replaceState, which leaves `initial` untouched, so this can't loop. */
  const incoming = queryFromFilters(initial);
  const [adopted, setAdopted] = useState(incoming);
  if (incoming !== adopted) {
    setAdopted(incoming);
    setFilters(initial);
  }

  /* The filtered view is a real URL (shareable, bookmarkable). Replace rather than push. */
  useEffect(() => {
    const qs = queryFromFilters(filters);
    window.history.replaceState(null, "", qs ? `${window.location.pathname}?${qs}` : window.location.pathname);
  }, [filters]);

  /* Tells the floating AI button to step aside on listing pages (see AssistantFab / globals.css). */
  useEffect(() => {
    document.documentElement.setAttribute(LISTING_ATTR, "");
    return () => document.documentElement.removeAttribute(LISTING_ATTR);
  }, []);

  /* With the vehicle bar, the saved car filters the results (it is not written into the URL: it is
     the shopper's own setting, kept in this browser). */
  const autoFit = vehicleBar && garage ? garage.modelSlug : null;
  const effective = useMemo(() => (autoFit ? { ...filters, fits: autoFit } : filters), [filters, autoFit]);
  const fitsModel = garage ? carTitle(VEHICLE_BRANDS, garage).model : null;

  const labelOf = useMemo(() => brandLabel(items), [items]);
  const results = useMemo(() => filterCatalog(items, effective), [items, effective]);
  const facets = useMemo(() => facetsFor(items, effective), [items, effective]);

  // New filters start from the first page again (adjusting state while rendering, not in an effect).
  const [pagedFor, setPagedFor] = useState(effective);
  if (pagedFor !== effective) {
    setPagedFor(effective);
    setVisible(PAGE);
  }

  const patch = useCallback((next: Partial<CatalogFilters>) => setFilters((f) => ({ ...f, ...next })), []);
  const toggle: ToggleFn = useCallback(
    <K extends ToggleKey>(key: K, value: CatalogFilters[K][number]) =>
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
        brands: locked.includes("brands") ? f.brands : [],
        categories: locked.includes("categories") ? f.categories : [],
        groups: [],
        oe: false,
        subs: [],
        tiers: [],
        minPrice: null,
        maxPrice: null,
        sizes: [],
        availability: [],
        fits: null,
        installation: false,
        q: "",
      })),
    [locked],
  );

  const lockedCount =
    (locked.includes("brands") ? filters.brands.length : 0) + (locked.includes("categories") ? filters.categories.length : 0);
  const active = activeFilterCount(filters) - lockedCount;
  const oeDepartment = filters.categories.length === 1 ? categoryName(filters.categories[0]) : "these departments";

  // A department page titles itself after its one active group (SPEAKERS), else the department.
  const dept = filters.categories.length === 1 ? DEPARTMENT_BY_SLUG[filters.categories[0]] : undefined;
  const group = dept && filters.groups.length === 1 ? dept.groups.find((g) => g.slug === filters.groups[0]) : undefined;
  const title = group?.name ?? header?.title ?? "";
  const crumbs = header ? (group ? [...header.crumbs.map((c, i, a) => (i === a.length - 1 ? { ...c, href: c.href ?? `/shop/${dept!.slug}` } : c)), { label: group.name }] : header.crumbs) : [];

  // The slider's ends: the cheapest and dearest buyable item in this listing, rounded outwards.
  const priceBounds: PriceBounds = useMemo(() => {
    const prices = items.filter((i) => i.buyable && i.price !== null).map((i) => i.price as number);
    if (prices.length < 2) return null;
    return { min: Math.floor(Math.min(...prices) / 100) * 100, max: Math.ceil(Math.max(...prices) / 100) * 100 };
  }, [items]);

  const sections = <FilterSections filters={filters} facets={facets} locked={locked} priceBounds={priceBounds} onToggle={toggle} onPatch={patch} />;
  const applied = (
    <ActiveChips inPanel filters={filters} locked={locked} onToggle={toggle} onPatch={patch} brandOf={labelOf} onClear={clearAll} onEmpty={() => countRef.current?.focus()} />
  );
  const shownCount = results.length;

  const body = (
    <div className="lg:grid lg:grid-cols-[264px_minmax(0,1fr)] lg:items-start lg:gap-8">
      {/* sidebar: one card, no inner scrolling ---------------------------- */}
      {/* Sticks beside the grid as it scrolls, so the column under it never sits empty. Taller than
          the screen (many sections open) it scrolls on its own rather than hiding its foot. */}
      <aside className="fs-backdrop hidden lg:sticky lg:top-24 lg:block" aria-label="Filters">
        <div className="fs-glass max-h-[calc(100vh-7rem)] overflow-y-auto overscroll-contain px-5 pb-3 pt-4">
          <div className="flex min-h-[44px] items-center justify-between border-b border-cl-ink/[0.07] pb-3">
            <h2 className="flex items-center gap-2.5 text-[17px] font-semibold tracking-[-0.02em]">
              <span className="fs-well grid h-8 w-8 place-items-center rounded-full" aria-hidden="true">
                <Icon name="filter" size={15} />
              </span>
              Filters
            </h2>
            {active > 0 && (
              <button type="button" onClick={clearAll} className="group grid min-h-[44px] place-items-center">
                <span className="rounded-full bg-cl-ink px-3 py-1.5 text-[12px] font-semibold text-cl-on-ink shadow-[0_4px_12px_-4px_rgba(0,0,0,0.35)] transition-transform group-active:scale-95">
                  Clear all
                </span>
              </button>
            )}
          </div>
          {applied}
          {sections}
        </div>
      </aside>

      <div className="min-w-0">
        {/* phone: sticky Filter / Sort row ------------------------------------- */}
        <div className="sticky top-14 z-30 mb-3 grid grid-cols-2 gap-2 bg-cl-page/95 py-2 backdrop-blur md:top-[68px] lg:hidden">
          <button type="button" onClick={() => setSheet("filters")} aria-haspopup="dialog" className="cl-btn cl-btn-outline">
            <Icon name="filter" size={16} />
            Filter{active > 0 ? ` (${active})` : ""}
          </button>
          <button type="button" onClick={() => setSheet("sort")} aria-haspopup="dialog" className="cl-btn cl-btn-outline">
            Sort
            <Icon name="chevron" size={14} className="rotate-90" />
          </button>
        </div>

        {/* toolbar ----------------------------------------------------------- */}
        <div className="flex flex-wrap items-end gap-3">
          <div className="relative min-w-0 flex-1 basis-64">
            <label htmlFor={searchId} className="sr-only">
              Search products
            </label>
            <Icon name="search" size={18} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-cl-muted" />
            <input
              id={searchId}
              type="search"
              value={filters.q}
              onChange={(e) => patch({ q: e.target.value })}
              placeholder="Search by name, size or part number"
              className="cl-input min-h-[48px] pl-11"
            />
          </div>
          <div className="hidden items-center gap-2 lg:flex">
            <label htmlFor={sortId} className="text-[14px] font-semibold">
              Sort
            </label>
            <select id={sortId} className="cl-input w-auto min-w-[12rem]" value={filters.sort} onChange={(e) => patch({ sort: e.target.value as SortKey })}>
              {SORTS.filter((s) => s.key !== "rating" || filters.sort === "rating").map((s) => (
                <option key={s.key} value={s.key}>
                  {s.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="mt-3 flex min-h-[44px] flex-wrap items-center gap-x-3 gap-y-2">
          <p ref={countRef} tabIndex={-1} className="text-[14px] text-cl-muted tnum outline-none" aria-live="polite">
            <strong className="font-bold text-cl-ink">{shownCount}</strong> of {items.length} product{items.length === 1 ? "" : "s"}
          </p>
          {/* Desktop shows the applied filters in the sidebar; phones see them here. */}
          <div className="contents lg:hidden">
            <ActiveChips filters={filters} locked={locked} onToggle={toggle} onPatch={patch} brandOf={labelOf} onClear={clearAll} onEmpty={() => countRef.current?.focus()} />
          </div>
        </div>

        <div className="mt-4">
          {results.length === 0 && filters.oe && items.every((i) => !i.oe) ? (
            <Empty title="Original Equipment">
              Original Equipment parts for {oeDepartment} are being added. Ask us about OE availability.
              <EnquiryButton topic="product" message={`Hi Riderzpro, do you have Original Equipment (OE) parts for ${oeDepartment}?`} className="cl-btn cl-btn-primary mt-5">
                Ask
              </EnquiryButton>
            </Empty>
          ) : results.length === 0 ? (
            <Empty title="Nothing matches those filters">
              {autoFit ? "Nothing here is listed for your car yet. Change the car or clear some filters." : "We stock far more than we list. Clear a filter, or ask us and we'll check availability and fitment."}
              <button type="button" onClick={clearAll} className="cl-btn cl-btn-outline mt-5">
                Clear all filters
              </button>
            </Empty>
          ) : (
            <>
              <ul className="grid grid-cols-2 gap-3 md:grid-cols-[repeat(auto-fill,minmax(230px,1fr))] md:gap-5">
                {results.slice(0, visible).map((item) => (
                  <li key={item.id}>
                    <ListingCard item={item} showBrand={showBrandOnCards} fitsModel={garage && fitsModel && itemFits(item, garage.modelSlug) ? fitsModel : null} />
                  </li>
                ))}
              </ul>
              {visible < results.length && (
                <div className="mt-8 text-center">
                  <button type="button" onClick={() => setVisible((v) => v + PAGE)} className="cl-btn cl-btn-outline px-6">
                    Show more · <span className="tnum">{Math.min(visible, results.length)} of {results.length}</span>
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {sheet === "filters" && (
        <Sheet
          title="Filters"
          full
          closeAbove="(min-width: 64rem)"
          onClose={() => setSheet(null)}
          footer={
            <div className="flex gap-3">
              <button type="button" onClick={clearAll} className="cl-btn cl-btn-outline flex-1">
                Clear all
              </button>
              <button type="button" onClick={() => setSheet(null)} className="cl-btn cl-btn-primary flex-[2]">
                Show {shownCount} product{shownCount === 1 ? "" : "s"}
              </button>
            </div>
          }
        >
          {applied}
          {sections}
        </Sheet>
      )}
      {sheet === "sort" && <SortSheet value={filters.sort} onChange={(s) => patch({ sort: s })} onClose={() => setSheet(null)} />}
    </div>
  );

  if (!header) {
    return (
      <div className="cl-scope text-cl-ink">
        {vehicleBar && (
          <div className="fs-backdrop mb-6">
            <VehicleBar />
          </div>
        )}
        {body}
      </div>
    );
  }

  return (
    <div className="cl-scope bg-cl-page text-cl-ink">
      <header className="border-b border-cl-line bg-cl-surface pb-5 pt-[4.75rem] md:pb-6 md:pt-[5.75rem]">
        <div className="cl-shell flex flex-wrap items-end justify-between gap-x-8 gap-y-4">
          <div className="min-w-0">
            <nav aria-label="Breadcrumb">
              <ol className="flex flex-wrap items-center gap-1.5 text-[13px] text-cl-muted">
                {crumbs.map((c, i) => (
                  <li key={`${c.label}-${i}`} className="flex items-center gap-1.5">
                    {c.href && i < crumbs.length - 1 ? (
                      <Link href={c.href} className="hover:text-cl-ink hover:underline">
                        {c.label}
                      </Link>
                    ) : (
                      <span aria-current={i === crumbs.length - 1 ? "page" : undefined} className="text-cl-ink">
                        {c.label}
                      </span>
                    )}
                    {i < crumbs.length - 1 && <span aria-hidden="true">/</span>}
                  </li>
                ))}
              </ol>
            </nav>
            <div className="mt-2 flex items-baseline justify-between gap-4">
              <h1 className="font-display text-[30px] font-black uppercase leading-none tracking-[-0.02em] md:text-[44px]">{title}</h1>
              <p className="shrink-0 text-[14px] text-cl-muted tnum md:hidden">
                {shownCount} product{shownCount === 1 ? "" : "s"}
              </p>
            </div>
          </div>
        </div>
      </header>

      <div className="cl-shell pb-16 pt-5 md:pt-6">
        {vehicleBar && (
          <div className="fs-backdrop mb-4 md:mb-6">
            <VehicleBar />
          </div>
        )}
        {body}
      </div>
    </div>
  );
}

function Empty({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center rounded-[var(--radius-cl)] border border-cl-line bg-cl-surface p-10 text-center text-[14px] text-cl-muted">
      <p className="mb-2 font-display text-[20px] font-extrabold uppercase text-cl-ink">{title}</p>
      {children}
    </div>
  );
}

/* ------------------------------------------------------------ active chips */

function ActiveChips({
  inPanel = false,
  filters,
  locked,
  onToggle,
  onPatch,
  brandOf,
  onClear,
  onEmpty,
}: {
  /** In the filter sidebar / sheet: a labelled block with no divider or "Clear all" (the header has it). */
  inPanel?: boolean;
  filters: CatalogFilters;
  locked: LockedDimension[];
  onToggle: ToggleFn;
  onPatch: (next: Partial<CatalogFilters>) => void;
  brandOf: ReturnType<typeof brandLabel>;
  onClear: () => void;
  /** Called when removing the last chip leaves nothing to focus. */
  onEmpty: () => void;
}) {
  /* Removing a chip unmounts the button that had focus: focus the chip that took its place. */
  const wrap = useRef<HTMLUListElement>(null);
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
  if (!locked.includes("brands")) for (const b of filters.brands) chips.push({ key: `b-${b}`, label: brandOf(b), remove: () => onToggle("brands", b) });
  if (!locked.includes("categories"))
    for (const c of filters.categories) chips.push({ key: `c-${c}`, label: categoryName(c), remove: () => onToggle("categories", c) });
  const groupNames = new Map(
    (filters.categories.length === 1 ? (DEPARTMENT_BY_SLUG[filters.categories[0]]?.groups ?? []) : []).map((g) => [g.slug, g.name]),
  );
  for (const g of filters.groups) chips.push({ key: `g-${g}`, label: groupNames.get(g) ?? g, remove: () => onToggle("groups", g) });
  for (const s of filters.sizes) chips.push({ key: `z-${s}`, label: SPEAKER_SIZE_LABELS[s], remove: () => onToggle("sizes", s) });
  if (filters.oe) chips.push({ key: "oe", label: "Original Equipment", remove: () => onPatch({ oe: false }) });
  for (const s of filters.subs) chips.push({ key: `s-${s}`, label: s, remove: () => onToggle("subs", s) });
  for (const t of filters.tiers) chips.push({ key: `t-${t}`, label: TIER_LABELS[t], remove: () => onToggle("tiers", t) });
  if (filters.minPrice !== null) chips.push({ key: "min", label: `Over ₹${filters.minPrice.toLocaleString("en-IN")}`, remove: () => onPatch({ minPrice: null }) });
  if (filters.maxPrice !== null) chips.push({ key: "max", label: `Under ₹${filters.maxPrice.toLocaleString("en-IN")}`, remove: () => onPatch({ maxPrice: null }) });
  for (const a of filters.availability) chips.push({ key: `a-${a}`, label: AVAILABILITY_LABELS[a], remove: () => onToggle("availability", a) });
  if (filters.fits) chips.push({ key: "fits", label: "Fits my car", remove: () => onPatch({ fits: null }) });
  if (filters.installation) chips.push({ key: "install", label: "Installation available", remove: () => onPatch({ installation: false }) });
  if (filters.q.trim()) chips.push({ key: "q", label: `“${filters.q.trim()}”`, remove: () => onPatch({ q: "" }) });

  if (chips.length === 0) return null;

  if (inPanel) {
    return (
      <div className="border-b border-cl-ink/[0.07] py-3">
        <p className="mb-2 pl-1 text-[11px] font-semibold uppercase tracking-[0.1em] text-cl-muted">Applied</p>
        <ul ref={wrap} className="flex flex-wrap gap-2" aria-label="Applied filters">
          {chips.map((c, i) => (
            <li key={c.key}>
              <button
                type="button"
                data-chip=""
                onClick={() => {
                  refocus.current = i;
                  c.remove();
                }}
                className="fs-well inline-flex min-h-[34px] items-center gap-1.5 rounded-full pl-3 pr-1.5 text-[13px] font-medium transition-colors hover:bg-cl-ink/[0.06] active:scale-[0.97]"
                aria-label={`Remove filter: ${c.label}`}
              >
                {c.label}
                <span className="grid h-5 w-5 place-items-center rounded-full bg-cl-ink/10" aria-hidden="true">
                  <Icon name="close" size={11} />
                </span>
              </button>
            </li>
          ))}
        </ul>
      </div>
    );
  }

  return (
    <>
      <span className="hidden h-5 w-px bg-cl-line sm:block" aria-hidden="true" />
      <ul ref={wrap} className="flex flex-wrap items-center gap-2" aria-label="Active filters">
        {chips.map((c, i) => (
          <li key={c.key}>
            <button
              type="button"
              data-chip=""
              onClick={() => {
                refocus.current = i;
                c.remove();
              }}
              className="cl-chip"
              aria-label={`Remove filter: ${c.label}`}
            >
              {c.label}
              <Icon name="close" size={14} />
            </button>
          </li>
        ))}
        <li>
          <button type="button" onClick={onClear} className="min-h-[44px] px-1 text-[13px] font-semibold text-cl-ink underline underline-offset-4">
            Clear all
          </button>
        </li>
      </ul>
    </>
  );
}
