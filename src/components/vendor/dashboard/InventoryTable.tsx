"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { api, ApiFailure } from "@/lib/vendor/client";
import type { VendorProduct } from "@/lib/vendor/types";
import { EmptyState, Pill, PRODUCT_STATUS_META, ReadOnlyNotice, Thumb, failureMessage, toInt, useFlash } from "./ui";

type Row = { p: VendorProduct; stock: string; low: string };

export function InventoryTable({ initial, readOnly }: { initial: VendorProduct[]; readOnly: boolean }) {
  const [rows, setRows] = useState<Row[]>(() => initial.map((p) => ({ p, stock: String(p.stock), low: String(p.lowStockAt) })));
  const [q, setQ] = useState("");
  const [lowOnly, setLowOnly] = useState(false);
  const [saving, setSaving] = useState(false);
  const [rowErrors, setRowErrors] = useState<Record<string, string>>({});
  const { show, node } = useFlash();

  const health = (r: Row) => {
    const stock = toInt(r.stock);
    const low = toInt(r.low);
    if (stock === null || low === null) return null;
    return stock === 0 ? "out" : stock <= low ? "low" : "ok";
  };
  const dirty = (r: Row) => r.stock !== String(r.p.stock) || r.low !== String(r.p.lowStockAt);
  const changed = rows.filter(dirty);

  const shown = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return rows.filter((r) => {
      if (needle && !(r.p.title.toLowerCase().includes(needle) || r.p.sku.toLowerCase().includes(needle))) return false;
      if (lowOnly) {
        const h = health(r);
        return h === "low" || h === "out";
      }
      return true;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rows, q, lowOnly]);

  const patch = (id: string, change: Partial<Pick<Row, "stock" | "low">>) => {
    setRows((list) => list.map((r) => (r.p.id === id ? { ...r, ...change } : r)));
    setRowErrors((e) => ({ ...e, [id]: "" }));
  };
  const bump = (r: Row, by: number) => patch(r.p.id, { stock: String(Math.min(100_000, (toInt(r.stock) ?? 0) + by)) });

  async function save() {
    const items: { id: string; stock: number; lowStockAt: number }[] = [];
    const errs: Record<string, string> = {};
    for (const r of changed) {
      const stock = toInt(r.stock);
      const low = toInt(r.low);
      if (stock === null || stock < 0 || stock > 100_000) errs[r.p.id] = "Stock must be a whole number from 0 to 100,000.";
      else if (low === null || low < 0 || low > 10_000) errs[r.p.id] = "Low-stock alert must be a whole number from 0 to 10,000.";
      else items.push({ id: r.p.id, stock, lowStockAt: low });
    }
    if (Object.keys(errs).length) {
      setRowErrors(errs);
      show("error", "Fix the highlighted rows, then save again.");
      return;
    }
    if (items.length === 0) return;
    setSaving(true);
    try {
      const res = await api<{ products: VendorProduct[] }>("/api/vendor/products/commercial", { method: "PATCH", body: { items: items.slice(0, 200) } });
      const byId = new Map(res.products.map((p) => [p.id, p]));
      setRows((list) => list.map((r) => (byId.has(r.p.id) ? { p: byId.get(r.p.id)!, stock: String(byId.get(r.p.id)!.stock), low: String(byId.get(r.p.id)!.lowStockAt) } : r)));
      setRowErrors({});
      show("ok", `Saved ${items.length} product${items.length === 1 ? "" : "s"}.`);
    } catch (err) {
      if (err instanceof ApiFailure && Object.keys(err.fields).length) setRowErrors(err.fields);
      show("error", failureMessage(err));
    } finally {
      setSaving(false);
    }
  }

  const stockInput = (r: Row) => (
    <input
      aria-label={`Stock for ${r.p.title || r.p.sku}`}
      aria-invalid={rowErrors[r.p.id] ? true : undefined}
      className="field !min-h-10 w-24 tnum"
      inputMode="numeric"
      disabled={readOnly}
      value={r.stock}
      onChange={(e) => patch(r.p.id, { stock: e.target.value.replace(/\D/g, "").slice(0, 6) })}
    />
  );
  const lowInput = (r: Row) => (
    <input
      aria-label={`Low-stock alert for ${r.p.title || r.p.sku}`}
      className="field !min-h-10 w-20 tnum"
      inputMode="numeric"
      disabled={readOnly}
      value={r.low}
      onChange={(e) => patch(r.p.id, { low: e.target.value.replace(/\D/g, "").slice(0, 5) })}
    />
  );
  const quick = (r: Row) => (
    <span className="flex gap-1">
      {[5, 20].map((n) => (
        <button key={n} type="button" disabled={readOnly} onClick={() => bump(r, n)} aria-label={`Add ${n} to ${r.p.title || r.p.sku}`} className="chip min-h-10 min-w-11 justify-center hover:border-accent hover:text-accent disabled:opacity-40">
          +{n}
        </button>
      ))}
    </span>
  );
  const pill = (r: Row) => {
    const h = health(r);
    return h === "out" ? <Pill tone="bad">Out of stock</Pill> : h === "low" ? <Pill tone="warn">Low</Pill> : h === "ok" ? <Pill tone="ok">OK</Pill> : <Pill tone="mute">—</Pill>;
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="eyebrow">Catalogue</p>
          <h1 className="display-3 mt-1">Inventory</h1>
        </div>
        <button type="button" onClick={save} disabled={readOnly || saving || changed.length === 0} className="btn btn-primary disabled:opacity-50">
          {saving ? "Saving…" : changed.length ? `Save ${changed.length} change${changed.length === 1 ? "" : "s"}` : "No changes"}
        </button>
      </div>
      {readOnly && <ReadOnlyNotice />}

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative sm:w-72">
          <label htmlFor="inv-search" className="sr-only">
            Search by title or SKU
          </label>
          <Search size={16} aria-hidden className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-dim" />
          <input id="inv-search" type="search" className="field pl-9" placeholder="Search title or SKU" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
        <label className="flex min-h-11 cursor-pointer items-center gap-2 text-sm text-ash">
          <input type="checkbox" className="h-5 w-5 accent-[var(--accent)]" checked={lowOnly} onChange={(e) => setLowOnly(e.target.checked)} />
          Low or out of stock only
        </label>
      </div>

      {rows.length === 0 ? (
        <EmptyState title="No products to stock yet">
          Add a product first.{" "}
          <Link href="/vendor/dashboard/products/new" className="text-accent underline">
            Add product
          </Link>
        </EmptyState>
      ) : shown.length === 0 ? (
        <EmptyState title="Nothing matches">Try clearing the search or the low-stock filter.</EmptyState>
      ) : (
        <>
          <div className="card hidden overflow-x-auto md:block">
            <table className="w-full text-left text-sm">
              <caption className="sr-only">Stock levels</caption>
              <thead>
                <tr className="border-b border-tint/10 text-[11px] uppercase tracking-[0.1em] text-dim">
                  <th scope="col" className="px-4 py-3 font-bold">Product</th>
                  <th scope="col" className="px-3 py-3 font-bold">Health</th>
                  <th scope="col" className="px-3 py-3 font-bold">Stock</th>
                  <th scope="col" className="px-3 py-3 font-bold">Quick add</th>
                  <th scope="col" className="px-3 py-3 font-bold">Alert at</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-tint/10">
                {shown.map((r) => (
                  <tr key={r.p.id} className={dirty(r) ? "bg-accent/5" : undefined}>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <Thumb id={r.p.images[0]} alt="" size={40} />
                        <div className="min-w-0">
                          <Link href={`/vendor/dashboard/products/${r.p.id}`} className="block max-w-[22rem] truncate font-semibold text-chalk hover:text-accent">
                            {r.p.title || "Untitled draft"}
                          </Link>
                          <p className="text-xs text-dim">
                            {r.p.sku} · {PRODUCT_STATUS_META[r.p.status].label}
                          </p>
                          {rowErrors[r.p.id] && <p role="alert" className="text-xs text-danger">{rowErrors[r.p.id]}</p>}
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-3">{pill(r)}</td>
                    <td className="px-3 py-3">{stockInput(r)}</td>
                    <td className="px-3 py-3">{quick(r)}</td>
                    <td className="px-3 py-3">{lowInput(r)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <ul className="space-y-3 md:hidden">
            {shown.map((r) => (
              <li key={r.p.id} className={`card p-3 ${dirty(r) ? "!border-accent/50" : ""}`}>
                <div className="flex items-start gap-3">
                  <Thumb id={r.p.images[0]} alt="" size={44} />
                  <div className="min-w-0 flex-1">
                    <Link href={`/vendor/dashboard/products/${r.p.id}`} className="line-clamp-2 font-semibold text-chalk">
                      {r.p.title || "Untitled draft"}
                    </Link>
                    <p className="text-xs text-dim">{r.p.sku}</p>
                  </div>
                  {pill(r)}
                </div>
                <div className="mt-3 flex flex-wrap items-end gap-3">
                  <div>
                    <p className="label !mb-1">Stock</p>
                    {stockInput(r)}
                  </div>
                  <div>
                    <p className="label !mb-1">Alert at</p>
                    {lowInput(r)}
                  </div>
                  <div className="ml-auto">{quick(r)}</div>
                </div>
                {rowErrors[r.p.id] && <p role="alert" className="mt-2 text-xs text-danger">{rowErrors[r.p.id]}</p>}
              </li>
            ))}
          </ul>
        </>
      )}
      {node}
    </div>
  );
}
