"use client";

import { useMemo, useState } from "react";
import { CarCard } from "./CarCard";
import { Icon } from "@/components/ui/Icon";
import { CAR_BRANDS, CAR_CITIES, CAR_FILTERS, type Car } from "@/lib/data/cars";

type Sort = "relevance" | "price-asc" | "price-desc" | "km-asc" | "year-desc";

const SORTS: { key: Sort; label: string }[] = [
  { key: "relevance", label: "Recommended" },
  { key: "price-asc", label: "Price: low to high" },
  { key: "price-desc", label: "Price: high to low" },
  { key: "km-asc", label: "Lowest kilometres" },
  { key: "year-desc", label: "Newest first" },
];

type Multi = Record<string, string[]>;

export function CarBrowser({ cars }: { cars: Car[] }) {
  const [open, setOpen] = useState(false);
  const [sort, setSort] = useState<Sort>("relevance");
  const [sel, setSel] = useState<Multi>({});
  const [priceBand, setPriceBand] = useState<number | null>(null);
  const [yearBand, setYearBand] = useState<number | null>(null);
  const [kmBand, setKmBand] = useState<number | null>(null);

  function toggle(group: string, value: string) {
    setSel((prev) => {
      const list = prev[group] ?? [];
      return {
        ...prev,
        [group]: list.includes(value) ? list.filter((v) => v !== value) : [...list, value],
      };
    });
  }

  function clearAll() {
    setSel({});
    setPriceBand(null);
    setYearBand(null);
    setKmBand(null);
  }

  const activeCount =
    Object.values(sel).flat().length +
    (priceBand !== null ? 1 : 0) +
    (yearBand !== null ? 1 : 0) +
    (kmBand !== null ? 1 : 0);

  const results = useMemo(() => {
    const inGroup = (group: string, value: string) => {
      const list = sel[group];
      return !list || list.length === 0 || list.includes(value);
    };

    let out = cars.filter(
      (c) =>
        inGroup("brand", c.brand) &&
        inGroup("condition", c.condition) &&
        inGroup("body", c.body) &&
        inGroup("fuel", c.fuel) &&
        inGroup("transmission", c.transmission) &&
        inGroup("drivetrain", c.drivetrain) &&
        inGroup("owner", c.owner) &&
        inGroup("tier", c.tier) &&
        inGroup("city", c.city),
    );

    if (priceBand !== null) {
      const b = CAR_FILTERS.price[priceBand];
      out = out.filter((c) => c.price >= b.min && c.price < b.max);
    }
    if (yearBand !== null) {
      const b = CAR_FILTERS.year[yearBand];
      out = out.filter((c) => c.year >= b.min && c.year <= b.max);
    }
    if (kmBand !== null) {
      const b = CAR_FILTERS.km[kmBand];
      out = out.filter((c) => c.km >= b.min && c.km < b.max);
    }

    const sorted = [...out];
    switch (sort) {
      case "price-asc":
        sorted.sort((a, b) => a.price - b.price);
        break;
      case "price-desc":
        sorted.sort((a, b) => b.price - a.price);
        break;
      case "km-asc":
        sorted.sort((a, b) => a.km - b.km);
        break;
      case "year-desc":
        sorted.sort((a, b) => b.year - a.year);
        break;
      default:
        sorted.sort((a, b) => Number(Boolean(b.featured)) - Number(Boolean(a.featured)) || b.inspectionScore - a.inspectionScore);
    }
    return sorted;
  }, [cars, sel, priceBand, yearBand, kmBand, sort]);

  return (
    <div>
      {/* toolbar ------------------------------------------------------ */}
      <div className="sticky top-14 z-30 -mx-4 mb-6 border-y border-tint/8 bg-void/92 px-4 py-3 backdrop-blur-xl md:top-[68px] md:mx-0 md:px-0 md:pl-4 md:pr-3">
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
          <div className="mt-4 space-y-4 border-t border-tint/8 pt-4">
            <Group label="Brand" values={CAR_BRANDS} group="brand" sel={sel} onToggle={toggle} />
            <Group label="Condition" values={[...CAR_FILTERS.condition]} group="condition" sel={sel} onToggle={toggle} />
            <Group label="Body type" values={[...CAR_FILTERS.body]} group="body" sel={sel} onToggle={toggle} />
            <Band
              label="Price"
              options={CAR_FILTERS.price.map((p) => p.label)}
              value={priceBand}
              onChange={setPriceBand}
            />
            <Band label="Year" options={CAR_FILTERS.year.map((p) => p.label)} value={yearBand} onChange={setYearBand} />
            <Band label="Kilometres" options={CAR_FILTERS.km.map((p) => p.label)} value={kmBand} onChange={setKmBand} />
            <Group label="Fuel" values={[...CAR_FILTERS.fuel]} group="fuel" sel={sel} onToggle={toggle} />
            <Group label="Transmission" values={[...CAR_FILTERS.transmission]} group="transmission" sel={sel} onToggle={toggle} />
            <Group label="Drivetrain" values={[...CAR_FILTERS.drivetrain]} group="drivetrain" sel={sel} onToggle={toggle} />
            <Group label="Ownership" values={[...CAR_FILTERS.owner]} group="owner" sel={sel} onToggle={toggle} />
            <Group label="Segment" values={[...CAR_FILTERS.tier]} group="tier" sel={sel} onToggle={toggle} />
            <Group label="Location" values={CAR_CITIES} group="city" sel={sel} onToggle={toggle} />

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
          <p className="font-display text-xl uppercase">No cars match that combination</p>
          <p className="mt-2 text-sm text-ash">
            Loosen a filter, or tell us what you want on WhatsApp — we source cars to order every week.
          </p>
          <button type="button" onClick={clearAll} className="btn btn-outline btn-sm mt-5">
            Clear filters
          </button>
        </div>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {results.map((car) => (
            <li key={car.slug}>
              <CarCard car={car} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function Group({
  label,
  values,
  group,
  sel,
  onToggle,
}: {
  label: string;
  values: string[];
  group: string;
  sel: Multi;
  onToggle: (g: string, v: string) => void;
}) {
  return (
    <div>
      <p className="label">{label}</p>
      <div className="flex flex-wrap gap-2">
        {values.map((v) => {
          const on = (sel[group] ?? []).includes(v);
          return (
            <button
              key={v}
              type="button"
              onClick={() => onToggle(group, v)}
              aria-pressed={on}
              className={`chip ${on ? "chip-active" : "hover:border-accent hover:text-accent"}`}
            >
              {v}
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
