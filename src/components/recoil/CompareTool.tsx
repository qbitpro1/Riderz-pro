"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Icon } from "@/components/ui/Icon";

export type CompareRow = {
  sku: string;
  slug: string;
  name: string;
  category: string;
  image: string | null;
  /** Field label → value, precomputed server-side from the price list. */
  fields: Record<string, string | null>;
};

const COMPARE_KEY = "motorbotz.compare.v1";
const MAX = 4;

export function CompareTool({ rows, fieldOrder }: { rows: CompareRow[]; fieldOrder: string[] }) {
  const [selected, setSelected] = useState<string[]>([]);
  const [query, setQuery] = useState("");
  const bySku = useMemo(() => new Map(rows.map((r) => [r.sku, r])), [rows]);

  useEffect(() => {
    const fromUrl = new URLSearchParams(window.location.search).get("skus");
    const initial = fromUrl
      ? fromUrl.split(",").map((s) => s.trim()).filter(Boolean)
      : safeRead();
    setSelected(initial.filter((s) => bySku.has(s)).slice(0, MAX));
  }, [bySku]);

  useEffect(() => {
    try {
      localStorage.setItem(COMPARE_KEY, JSON.stringify(selected));
    } catch {
      /* storage blocked — the URL still carries the selection */
    }
  }, [selected]);

  const chosen = selected.map((s) => bySku.get(s)).filter(Boolean) as CompareRow[];

  const suggestions = useMemo(() => {
    const q = query.toLowerCase().trim();
    if (q.length < 2) return [];
    return rows
      .filter((r) => !selected.includes(r.sku))
      .filter((r) => `${r.sku} ${r.name}`.toLowerCase().includes(q))
      .slice(0, 8);
  }, [query, rows, selected]);

  /** Only show rows where at least one product has something to say. */
  const activeFields = fieldOrder.filter((f) => chosen.some((c) => c.fields[f]));

  return (
    <div>
      <div className="card mb-6 p-4">
        <label className="label" htmlFor="cmp-search">
          Add a product ({chosen.length}/{MAX})
        </label>
        <div className="flex items-center gap-3">
          <Icon name="search" size={18} className="shrink-0 text-dim" />
          <input
            id="cmp-search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Model number or name, e.g. RLX65 or SPL4200"
            className="h-10 flex-1 bg-transparent text-sm outline-none placeholder:text-dim"
            disabled={chosen.length >= MAX}
          />
        </div>
        {suggestions.length > 0 && (
          <ul className="mt-3 divide-y divide-white/8 border-t border-white/8">
            {suggestions.map((s) => (
              <li key={s.sku}>
                <button
                  type="button"
                  onClick={() => {
                    setSelected((prev) => [...prev, s.sku].slice(0, MAX));
                    setQuery("");
                  }}
                  className="flex w-full items-center justify-between gap-4 py-2.5 text-left transition-colors hover:text-accent"
                >
                  <span className="min-w-0">
                    <span className="block font-display text-xs font-bold tracking-[0.08em] text-accent">{s.sku}</span>
                    <span className="block truncate text-sm">{s.name}</span>
                  </span>
                  <Icon name="plus" size={15} className="shrink-0 text-dim" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {chosen.length === 0 ? (
        <div className="card p-10 text-center">
          <p className="font-display text-xl uppercase">Pick two products to start</p>
          <p className="mx-auto mt-2 max-w-md text-sm text-ash">
            Search above, or hit “Add to comparison” on any product page. We only compare
            specifications RECOIL actually publishes — no invented numbers to fill the table.
          </p>
          <div className="mt-5 flex flex-wrap justify-center gap-2">
            {["SPL4200.4,DII1400.5", "RLX65,RX65,RM65-4P", "SXS10D2,PW10D4,RW10D4"].map((preset) => (
              <button
                key={preset}
                type="button"
                onClick={() => setSelected(preset.split(",").filter((s) => bySku.has(s)))}
                className="chip hover:border-accent hover:text-accent"
              >
                {preset.replace(/,/g, " vs ")}
              </button>
            ))}
          </div>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] border-collapse text-sm">
            <thead>
              <tr>
                <th className="w-36 border-b border-white/10 p-3 text-left align-bottom text-[10px] uppercase tracking-[0.14em] text-dim">
                  Specification
                </th>
                {chosen.map((c) => (
                  <th key={c.sku} className="border-b border-white/10 p-3 align-bottom">
                    <div className="relative mx-auto mb-3 aspect-square w-full max-w-[140px] overflow-hidden bg-[#f3f4f5]">
                      {c.image ? (
                        <Image src={c.image} alt={`RECOIL ${c.sku}`} fill sizes="140px" className="object-contain p-2" />
                      ) : (
                        <span className="grid h-full place-items-center bg-graphite text-[9px] uppercase tracking-[0.12em] text-dim">
                          No verified image
                        </span>
                      )}
                    </div>
                    <Link href={`/products/${c.slug}`} className="block font-display text-xs font-bold tracking-[0.08em] text-accent">
                      {c.sku}
                    </Link>
                    <span className="mt-1 block text-left text-xs font-normal leading-snug text-ash">{c.name}</span>
                    <button
                      type="button"
                      onClick={() => setSelected((prev) => prev.filter((s) => s !== c.sku))}
                      className="mt-2 text-[10px] uppercase tracking-[0.12em] text-dim underline underline-offset-4 hover:text-danger"
                    >
                      Remove
                    </button>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {activeFields.map((field) => (
                <tr key={field} className="border-b border-white/8">
                  <th className="p-3 text-left align-top text-xs font-medium text-dim">{field}</th>
                  {chosen.map((c) => (
                    <td key={c.sku} className="p-3 align-top">
                      {c.fields[field] ?? <span className="text-dim">Not specified</span>}
                    </td>
                  ))}
                </tr>
              ))}
              <tr>
                <th className="p-3" />
                {chosen.map((c) => (
                  <td key={c.sku} className="p-3">
                    <Link href={`/products/${c.slug}`} className="btn btn-outline btn-sm btn-block">
                      View
                    </Link>
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      )}

      {chosen.length > 0 && (
        <button
          type="button"
          onClick={() => setSelected([])}
          className="mt-6 text-xs text-dim underline underline-offset-4 hover:text-ash"
        >
          Clear comparison
        </button>
      )}
    </div>
  );
}

function safeRead(): string[] {
  try {
    const raw = localStorage.getItem(COMPARE_KEY);
    return raw ? (JSON.parse(raw) as string[]) : [];
  } catch {
    return [];
  }
}
