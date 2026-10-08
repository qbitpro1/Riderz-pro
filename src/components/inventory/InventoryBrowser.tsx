"use client";

import { useMemo, useState } from "react";
import { ListingCard } from "./ListingCard";
import { Icon } from "@/components/ui/Icon";
import type { CardData } from "@/lib/inventory/card-data";

type Sort = "newest-listed" | "price-asc" | "price-desc" | "km-asc" | "year-desc" | "best-value";

const SORTS: { key: Sort; label: string }[] = [
  { key: "newest-listed", label: "Newest listed" },
  { key: "price-asc", label: "Lowest price" },
  { key: "price-desc", label: "Highest price" },
  { key: "km-asc", label: "Lowest KM" },
  { key: "year-desc", label: "Newest model year" },
  { key: "best-value", label: "Best value" },
];

export type Facets = {
  makes: string[];
  bodyTypes: string[];
  fuels: string[];
  transmissions: string[];
  cities: string[];
  drivetrains: string[];
  years: number[];
};

export type Bands = { priceBands: { label: string; min: number; max: number }[]; kmBands: { label: string; max: number }[] };

/** Parsed server-side from the natural-language box and passed back for display. */
export type ParsedHint = { label: string; value: string }[];

export function InventoryBrowser({
  listings,
  facets,
  bands,
  specialFilters,
  examples,
  initialQuery = "",
}: {
  listings: CardData[];
  facets: Facets;
  bands: Bands;
  specialFilters: { key: string; label: string; tags: string[]; matches: string[] }[];
  examples: string[];
  initialQuery?: string;
}) {
  const [query, setQuery] = useState(initialQuery);
  const [open, setOpen] = useState(false);
  const [sort, setSort] = useState<Sort>("newest-listed");
  const [sel, setSel] = useState<Record<string, string[]>>({});
  const [priceBand, setPriceBand] = useState<number | null>(null);
  const [kmBand, setKmBand] = useState<number | null>(null);
  const [special, setSpecial] = useState<string | null>(null);

  function toggle(group: string, value: string) {
    setSel((prev) => {
      const list = prev[group] ?? [];
      return { ...prev, [group]: list.includes(value) ? list.filter((v) => v !== value) : [...list, value] };
    });
  }

  function clearAll() {
    setSel({});
    setPriceBand(null);
    setKmBand(null);
    setSpecial(null);
    setQuery("");
  }

  const activeCount =
    Object.values(sel).flat().length +
    (priceBand !== null ? 1 : 0) +
    (kmBand !== null ? 1 : 0) +
    (special ? 1 : 0);

  const results = useMemo(() => {
    const inGroup = (group: string, value: string | null) => {
      const list = sel[group];
      if (!list || list.length === 0) return true;
      return value != null && list.includes(value);
    };

    const specialSet = special ? new Set(specialFilters.find((s) => s.key === special)?.matches ?? []) : null;
    const q = query.trim().toLowerCase();

    let out = listings.filter((l) => {
      if (!inGroup("make", l.make)) return false;
      if (!inGroup("bodyType", l.bodyType)) return false;
      if (!inGroup("fuel", l.fuel)) return false;
      if (!inGroup("transmission", l.transmission)) return false;
      if (!inGroup("city", l.city)) return false;
      if (!inGroup("drivetrain", l.drivetrain)) return false;
      if (!inGroup("year", String(l.year))) return false;
      if (!inGroup("owners", l.owners != null ? String(Math.min(l.owners, 3)) : null)) return false;

      if (priceBand !== null) {
        const b = bands.priceBands[priceBand];
        if (l.price == null || l.price < b.min || l.price >= b.max) return false;
      }
      if (kmBand !== null) {
        const b = bands.kmBands[kmBand];
        if (l.km == null || l.km > b.max) return false;
      }
      if (specialSet && !specialSet.has(l.id)) return false;

      if (q) {
        const hay = `${l.title} ${l.haystack}`;
        if (!q.split(/\s+/).every((t) => hay.includes(t))) return false;
      }
      return true;
    });

    out = [...out];
    switch (sort) {
      case "price-asc":
        out.sort((a, b) => (a.price ?? Infinity) - (b.price ?? Infinity));
        break;
      case "price-desc":
        out.sort((a, b) => (b.price ?? 0) - (a.price ?? 0));
        break;
      case "km-asc":
        out.sort((a, b) => (a.km ?? Infinity) - (b.km ?? Infinity));
        break;
      case "year-desc":
        out.sort((a, b) => b.year - a.year);
        break;
      case "best-value":
        // Lowest price per remaining year of age, with odometer as a tiebreak.
        out.sort((a, b) => valueScore(a) - valueScore(b));
        break;
      default:
        out.sort((a, b) => new Date(b.discoveredAt).getTime() - new Date(a.discoveredAt).getTime());
    }
    return out;
  }, [listings, sel, priceBand, kmBand, special, query, sort, bands, specialFilters]);

  return (
    <div>
      {/* natural-language search ---------------------------------- */}
      <div className="card mb-5 p-4">
        <div className="flex items-center gap-3">
          <Icon name="search" size={18} className="shrink-0 text-dim" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Try “Thar under 15 lakh” or “1st owner SUV Delhi”"
            aria-label="Search inventory"
            className="h-10 flex-1 bg-transparent text-sm outline-none placeholder:text-dim"
          />
          {query && (
            <button type="button" onClick={() => setQuery("")} aria-label="Clear search" className="text-dim hover:text-chalk">
              <Icon name="close" size={16} />
            </button>
          )}
        </div>
        {!query && (
          <div className="mt-3 flex flex-wrap gap-2">
            {examples.map((e) => (
              <button key={e} type="button" onClick={() => setQuery(e)} className="chip hover:border-accent hover:text-accent">
                {e}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* toolbar --------------------------------------------------- */}
      <div className="sticky top-14 z-30 -mx-4 mb-6 border-y border-white/8 bg-void/92 px-4 py-3 backdrop-blur-xl md:top-[68px] md:mx-0 md:px-0 md:pl-4 md:pr-3">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            className={`btn btn-sm ${activeCount ? "btn-accent" : "btn-outline"}`}
            aria-expanded={open}
          >
            <Icon name="filter" size={14} />
            Filters
            {activeCount > 0 && <span className="tnum">({activeCount})</span>}
          </button>
          <p className="text-xs text-ash tnum">
            {results.length} car{results.length === 1 ? "" : "s"}
          </p>
          <select
            aria-label="Sort cars"
            className="field ml-auto h-9 w-auto max-w-[52%] text-xs"
            value={sort}
            onChange={(e) => setSort(e.target.value as Sort)}
          >
            {SORTS.map((s) => (
              <option key={s.key} value={s.key}>
                {s.label}
              </option>
            ))}
          </select>
        </div>

        {open && (
          <div className="mt-4 space-y-4 border-t border-white/8 pt-4">
            <div>
              <p className="label">Motorbotz picks</p>
              <div className="flex flex-wrap gap-2">
                {specialFilters.map((s) => (
                  <button
                    key={s.key}
                    type="button"
                    onClick={() => setSpecial(special === s.key ? null : s.key)}
                    title={s.tags.join(" · ")}
                    className={`chip ${special === s.key ? "chip-active" : "hover:border-accent hover:text-accent"}`}
                  >
                    {s.label}
                    <span className="tnum opacity-60">{s.matches.length}</span>
                  </button>
                ))}
              </div>
            </div>

            <Band label="Price" options={bands.priceBands.map((b) => b.label)} value={priceBand} onChange={setPriceBand} />
            <Group label="Brand" values={facets.makes} group="make" sel={sel} onToggle={toggle} />
            <Group label="Body type" values={facets.bodyTypes} group="bodyType" sel={sel} onToggle={toggle} />
            <Group label="Fuel" values={facets.fuels} group="fuel" sel={sel} onToggle={toggle} />
            <Group label="Transmission" values={facets.transmissions} group="transmission" sel={sel} onToggle={toggle} />
            <Group label="Year" values={facets.years.map(String)} group="year" sel={sel} onToggle={toggle} />
            <Band label="Kilometres" options={bands.kmBands.map((b) => b.label)} value={kmBand} onChange={setKmBand} />
            <Group label="Owners" values={["1", "2", "3"]} labels={["1st owner", "2nd owner", "3rd owner+"]} group="owners" sel={sel} onToggle={toggle} />
            <Group label="Drivetrain" values={facets.drivetrains} group="drivetrain" sel={sel} onToggle={toggle} />
            <Group label="Location" values={facets.cities} group="city" sel={sel} onToggle={toggle} />

            <div className="flex gap-3 pt-1">
              <button type="button" onClick={clearAll} className="btn btn-outline btn-sm">
                Clear all
              </button>
              <button type="button" onClick={() => setOpen(false)} className="btn btn-primary btn-sm">
                Show {results.length} cars
              </button>
            </div>
          </div>
        )}
      </div>

      {results.length === 0 ? (
        <div className="card p-10 text-center">
          <p className="font-display text-xl uppercase">Nothing matches that yet</p>
          <p className="mx-auto mt-2 max-w-md text-sm text-ash">
            Inventory changes daily. Tell us the spec and budget on WhatsApp and we will source it, or
            loosen a filter to see what is here now.
          </p>
          <button type="button" onClick={clearAll} className="btn btn-outline btn-sm mt-5">
            Clear filters
          </button>
        </div>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {results.map((l) => (
            <li key={l.id}>
              <ListingCard listing={l} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

/** Cheap value proxy: rupees per year of remaining life, penalised by odometer. */
function valueScore(l: CardData): number {
  if (l.price == null) return Infinity;
  const age = Math.max(new Date().getFullYear() - l.year, 1);
  const kmPenalty = (l.km ?? 60_000) / 10_000;
  return l.price / (15 - Math.min(age, 12)) + kmPenalty * 5000;
}

function Group({
  label,
  values,
  labels,
  group,
  sel,
  onToggle,
}: {
  label: string;
  values: string[];
  labels?: string[];
  group: string;
  sel: Record<string, string[]>;
  onToggle: (g: string, v: string) => void;
}) {
  if (values.length === 0) return null;
  return (
    <div>
      <p className="label">{label}</p>
      <div className="flex flex-wrap gap-2">
        {values.map((v, i) => {
          const on = (sel[group] ?? []).includes(v);
          return (
            <button
              key={v}
              type="button"
              onClick={() => onToggle(group, v)}
              aria-pressed={on}
              className={`chip ${on ? "chip-active" : "hover:border-accent hover:text-accent"}`}
            >
              {labels?.[i] ?? v}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function Band({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: string[];
  value: number | null;
  onChange: (v: number | null) => void;
}) {
  return (
    <div>
      <p className="label">{label}</p>
      <div className="flex flex-wrap gap-2">
        {options.map((o, i) => (
          <button
            key={o}
            type="button"
            onClick={() => onChange(value === i ? null : i)}
            aria-pressed={value === i}
            className={`chip ${value === i ? "chip-active" : "hover:border-accent hover:text-accent"}`}
          >
            {o}
          </button>
        ))}
      </div>
    </div>
  );
}
