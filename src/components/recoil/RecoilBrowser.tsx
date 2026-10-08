"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { RecoilCard } from "./RecoilCard";
import { Icon } from "@/components/ui/Icon";
import type { PublicProduct } from "@/lib/data/recoil";

type Sort = "relevance" | "price-asc" | "price-desc" | "sku";

const BANDS = [
  { label: "Under ₹2,000", min: 0, max: 2000 },
  { label: "₹2,000 – ₹10,000", min: 2000, max: 10000 },
  { label: "₹10,000 – ₹30,000", min: 10000, max: 30000 },
  { label: "₹30,000 – ₹75,000", min: 30000, max: 75000 },
  { label: "₹75,000 +", min: 75000, max: Number.MAX_SAFE_INTEGER },
];

export function RecoilBrowser({ products }: { products: PublicProduct[] }) {
  const [query, setQuery] = useState("");
  const [sub, setSub] = useState<string | null>(null);
  const [series, setSeries] = useState<string | null>(null);
  const [band, setBand] = useState<number | null>(null);
  const [hideComingSoon, setHideComingSoon] = useState(false);
  const [sort, setSort] = useState<Sort>("relevance");

  const subs = useMemo(() => tally(products.map((p) => p.subcategory)), [products]);
  const allSeries = useMemo(() => tally(products.map((p) => p.series).filter(Boolean) as string[]), [products]);

  const results = useMemo(() => {
    const q = query.toLowerCase().trim();
    let out = products.filter((p) => {
      if (sub && p.subcategory !== sub) return false;
      if (series && p.series !== series) return false;
      if (hideComingSoon && p.status === "COMING_SOON") return false;
      if (band !== null) {
        const b = BANDS[band];
        const price = p.sellingPrice ?? 0;
        if (price < b.min || price >= b.max) return false;
      }
      if (q) {
        const hay = `${p.sku} ${p.priceListName} ${p.searchTokens.join(" ")}`.toLowerCase();
        if (!q.split(/\s+/).every((t) => hay.includes(t))) return false;
      }
      return true;
    });

    out = [...out];
    switch (sort) {
      case "price-asc":
        out.sort((a, b) => (a.sellingPrice ?? 0) - (b.sellingPrice ?? 0));
        break;
      case "price-desc":
        out.sort((a, b) => (b.sellingPrice ?? 0) - (a.sellingPrice ?? 0));
        break;
      case "sku":
        out.sort((a, b) => a.sku.localeCompare(b.sku));
        break;
      default:
        out.sort(
          (a, b) =>
            Number(a.status === "COMING_SOON") - Number(b.status === "COMING_SOON") ||
            (b.sellingPrice ?? 0) - (a.sellingPrice ?? 0),
        );
    }
    return out;
  }, [products, query, sub, series, band, hideComingSoon, sort]);

  const activeFilters = [sub, series, band !== null ? BANDS[band].label : null].filter(Boolean).length;

  return (
    <div>
      <div className="card mb-5 p-4">
        <div className="flex items-center gap-3">
          <Icon name="search" size={18} className="shrink-0 text-dim" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by model number, e.g. SPL4200 or 6.5 midrange"
            aria-label="Search the RECOIL catalogue"
            className="h-10 flex-1 bg-transparent text-sm outline-none placeholder:text-dim"
          />
          {query && (
            <button type="button" onClick={() => setQuery("")} aria-label="Clear search" className="text-dim hover:text-chalk">
              <Icon name="close" size={16} />
            </button>
          )}
        </div>
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <p className="text-xs text-ash tnum">
          {results.length} product{results.length === 1 ? "" : "s"}
          {activeFilters > 0 && ` · ${activeFilters} filter${activeFilters === 1 ? "" : "s"}`}
        </p>
        <label className="flex cursor-pointer items-center gap-2 text-xs text-ash">
          <input
            type="checkbox"
            checked={hideComingSoon}
            onChange={(e) => setHideComingSoon(e.target.checked)}
            className="h-3.5 w-3.5 accent-[var(--color-accent)]"
          />
          In stock only
        </label>
        <select
          aria-label="Sort products"
          className="field ml-auto h-9 w-auto text-xs"
          value={sort}
          onChange={(e) => setSort(e.target.value as Sort)}
        >
          <option value="relevance">Recommended</option>
          <option value="price-asc">Price: low to high</option>
          <option value="price-desc">Price: high to low</option>
          <option value="sku">Model number</option>
        </select>
      </div>

      {subs.length > 1 && (
        <FilterRow label="Type" items={subs} value={sub} onChange={setSub} />
      )}
      {allSeries.length > 1 && (
        <FilterRow label="Series" items={allSeries} value={series} onChange={setSeries} />
      )}

      <div className="mb-6">
        <p className="label">Price</p>
        <div className="flex flex-wrap gap-2">
          {BANDS.map((b, i) => (
            <button
              key={b.label}
              type="button"
              onClick={() => setBand(band === i ? null : i)}
              className={`chip ${band === i ? "chip-active" : "hover:border-accent hover:text-accent"}`}
            >
              {b.label}
            </button>
          ))}
        </div>
      </div>

      {results.length === 0 ? (
        <div className="card p-10 text-center">
          <p className="font-display text-xl uppercase">No match in the May 2026 price list</p>
          <p className="mx-auto mt-2 max-w-md text-sm text-ash">
            We stock the full RECOIL range. If a model number isn't here, ask us — it may be a
            newer release or a special order.
          </p>
          <button
            type="button"
            onClick={() => {
              setQuery("");
              setSub(null);
              setSeries(null);
              setBand(null);
            }}
            className="btn btn-outline btn-sm mt-5"
          >
            Clear filters
          </button>
        </div>
      ) : (
        <ul className="grid grid-cols-2 gap-3 md:grid-cols-3 md:gap-4 lg:grid-cols-4">
          {results.map((p) => (
            <li key={p.slug}>
              <RecoilCard product={p} />
            </li>
          ))}
        </ul>
      )}

      <div className="card mt-8 flex flex-col items-start justify-between gap-4 p-5 md:flex-row md:items-center">
        <p className="text-sm text-ash">
          Comparing two models? Put any of them side by side on the spec table.
        </p>
        <Link href="/compare" className="btn btn-outline btn-sm">
          Compare products
          <Icon name="arrow" size={14} />
        </Link>
      </div>
    </div>
  );
}

function FilterRow({
  label,
  items,
  value,
  onChange,
}: {
  label: string;
  items: { name: string; count: number }[];
  value: string | null;
  onChange: (v: string | null) => void;
}) {
  return (
    <div className="mb-4">
      <p className="label">{label}</p>
      <div className="rail -mx-4 px-4 md:mx-0 md:flex-wrap md:px-0">
        {items.map((item) => (
          <button
            key={item.name}
            type="button"
            onClick={() => onChange(value === item.name ? null : item.name)}
            className={`chip ${value === item.name ? "chip-active" : "hover:border-accent hover:text-accent"}`}
          >
            {item.name}
            <span className="tnum opacity-60">{item.count}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

function tally(values: string[]) {
  const map = new Map<string, number>();
  for (const v of values) map.set(v, (map.get(v) ?? 0) + 1);
  return [...map.entries()]
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count);
}
