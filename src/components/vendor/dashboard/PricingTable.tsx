"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Download, Search } from "lucide-react";
import { api, ApiFailure } from "@/lib/vendor/client";
import { DEFAULT_COMMISSION_RATE, settlementFor, type VendorProduct } from "@/lib/vendor/types";
import { rupees } from "@/lib/format";
import { EmptyState, PRODUCT_STATUS_META, ReadOnlyNotice, Thumb, failureMessage, toInt, useFlash } from "./ui";

type Row = { p: VendorProduct; mrp: string; price: string };

/** Stop spreadsheet apps from running a cell that starts with = + - @ as a formula. */
const csvCell = (v: string | number) => {
  let s = String(v);
  if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`;
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

export function PricingTable({ initial, readOnly, commissionRate }: { initial: VendorProduct[]; readOnly: boolean; commissionRate: number | null }) {
  const [rows, setRows] = useState<Row[]>(() => initial.map((p) => ({ p, mrp: String(p.mrp), price: String(p.price) })));
  const [q, setQ] = useState("");
  const [saving, setSaving] = useState(false);
  const [rowErrors, setRowErrors] = useState<Record<string, string>>({});
  const { show, node } = useFlash();
  const rate = commissionRate ?? DEFAULT_COMMISSION_RATE;

  const dirty = (r: Row) => r.mrp !== String(r.p.mrp) || r.price !== String(r.p.price);
  const changed = rows.filter(dirty);

  const shown = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return rows.filter((r) => !needle || r.p.title.toLowerCase().includes(needle) || r.p.sku.toLowerCase().includes(needle));
  }, [rows, q]);

  const patch = (id: string, change: Partial<Pick<Row, "mrp" | "price">>) => {
    setRows((list) => list.map((r) => (r.p.id === id ? { ...r, ...change } : r)));
    setRowErrors((e) => ({ ...e, [id]: "" }));
  };

  async function save() {
    const items: { id: string; mrp: number; price: number }[] = [];
    const errs: Record<string, string> = {};
    for (const r of changed) {
      const mrp = toInt(r.mrp);
      const price = toInt(r.price);
      if (mrp === null || mrp < 1 || mrp > 10_000_000) errs[r.p.id] = "MRP must be a whole number of rupees.";
      else if (price === null || price < 1 || price > 10_000_000) errs[r.p.id] = "Selling price must be a whole number of rupees.";
      else if (price > mrp) errs[r.p.id] = "Selling price cannot be above MRP.";
      else items.push({ id: r.p.id, mrp, price });
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
      setRows((list) => list.map((r) => (byId.has(r.p.id) ? { p: byId.get(r.p.id)!, mrp: String(byId.get(r.p.id)!.mrp), price: String(byId.get(r.p.id)!.price) } : r)));
      setRowErrors({});
      show("ok", `Saved prices for ${items.length} product${items.length === 1 ? "" : "s"}.`);
    } catch (err) {
      if (err instanceof ApiFailure && Object.keys(err.fields).length) setRowErrors(err.fields);
      show("error", failureMessage(err));
    } finally {
      setSaving(false);
    }
  }

  function exportCsv() {
    const lines = [["SKU", "title", "mrp", "price", "stock"].join(",")];
    for (const { p } of rows) lines.push([p.sku, p.title, p.mrp, p.price, p.stock].map(csvCell).join(","));
    const url = URL.createObjectURL(new Blob([lines.join("\r\n")], { type: "text/csv;charset=utf-8" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = "riderzpro-prices.csv";
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  const preview = (r: Row) => {
    const mrp = toInt(r.mrp);
    const price = toInt(r.price);
    const discount = mrp && price && price <= mrp ? Math.round(((mrp - price) / mrp) * 100) : null;
    const s = price && price > 0 ? settlementFor(price, rate) : null;
    return { discount, s };
  };

  const input = (r: Row, key: "mrp" | "price", label: string) => (
    <input
      aria-label={`${label} for ${r.p.title || r.p.sku}`}
      aria-invalid={rowErrors[r.p.id] ? true : undefined}
      className="field !min-h-10 w-28 tnum"
      inputMode="numeric"
      disabled={readOnly}
      value={r[key]}
      onChange={(e) => patch(r.p.id, { [key]: e.target.value.replace(/\D/g, "").slice(0, 8) })}
    />
  );

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="eyebrow">Catalogue</p>
          <h1 className="display-3 mt-1">Pricing</h1>
        </div>
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={exportCsv} disabled={rows.length === 0} className="btn btn-outline disabled:opacity-50">
            <Download size={16} aria-hidden /> Export CSV
          </button>
          <button type="button" onClick={save} disabled={readOnly || saving || changed.length === 0} className="btn btn-primary disabled:opacity-50">
            {saving ? "Saving…" : changed.length ? `Save ${changed.length} change${changed.length === 1 ? "" : "s"}` : "No changes"}
          </button>
        </div>
      </div>
      {readOnly && <ReadOnlyNotice />}
      <p className="text-sm text-ash">
        Prices are in rupees and include GST. “You receive” is the selling price minus your {rate}% commission and 18% GST on that commission.
      </p>

      <div className="relative sm:w-72">
        <label htmlFor="price-search" className="sr-only">
          Search by title or SKU
        </label>
        <Search size={16} aria-hidden className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-dim" />
        <input id="price-search" type="search" className="field pl-9" placeholder="Search title or SKU" value={q} onChange={(e) => setQ(e.target.value)} />
      </div>

      {rows.length === 0 ? (
        <EmptyState title="No products to price yet">
          <Link href="/vendor/dashboard/products/new" className="text-accent underline">
            Add a product
          </Link>
        </EmptyState>
      ) : shown.length === 0 ? (
        <EmptyState title="Nothing matches">Try a different search.</EmptyState>
      ) : (
        <>
          <div className="card hidden overflow-x-auto md:block">
            <table className="w-full text-left text-sm">
              <caption className="sr-only">Prices</caption>
              <thead>
                <tr className="border-b border-tint/10 text-[11px] uppercase tracking-[0.1em] text-dim">
                  <th scope="col" className="px-4 py-3 font-bold">Product</th>
                  <th scope="col" className="px-3 py-3 font-bold">MRP (₹)</th>
                  <th scope="col" className="px-3 py-3 font-bold">Price (₹)</th>
                  <th scope="col" className="px-3 py-3 font-bold">Discount</th>
                  <th scope="col" className="px-3 py-3 font-bold">You receive</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-tint/10">
                {shown.map((r) => {
                  const { discount, s } = preview(r);
                  return (
                    <tr key={r.p.id} className={dirty(r) ? "bg-accent/5" : undefined}>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <Thumb id={r.p.images[0]} alt="" size={40} />
                          <div className="min-w-0">
                            <Link href={`/vendor/dashboard/products/${r.p.id}`} className="block max-w-[20rem] truncate font-semibold text-chalk hover:text-accent">
                              {r.p.title || "Untitled draft"}
                            </Link>
                            <p className="text-xs text-dim">
                              {r.p.sku} · {PRODUCT_STATUS_META[r.p.status].label}
                            </p>
                            {rowErrors[r.p.id] && <p role="alert" className="text-xs text-danger">{rowErrors[r.p.id]}</p>}
                          </div>
                        </div>
                      </td>
                      <td className="px-3 py-3">{input(r, "mrp", "MRP")}</td>
                      <td className="px-3 py-3">{input(r, "price", "Selling price")}</td>
                      <td className="px-3 py-3 tnum text-ash">{discount === null ? "—" : `${discount}%`}</td>
                      <td className="px-3 py-3 tnum">
                        {s ? (
                          <>
                            <span className="font-semibold text-chalk">{rupees(s.net)}</span>
                            <span className="block text-xs text-dim">
                              −{rupees(s.commission)} − {rupees(s.commissionGst)} GST
                            </span>
                          </>
                        ) : (
                          "—"
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <ul className="space-y-3 md:hidden">
            {shown.map((r) => {
              const { discount, s } = preview(r);
              return (
                <li key={r.p.id} className={`card p-3 ${dirty(r) ? "!border-accent/50" : ""}`}>
                  <div className="flex items-start gap-3">
                    <Thumb id={r.p.images[0]} alt="" size={44} />
                    <div className="min-w-0 flex-1">
                      <Link href={`/vendor/dashboard/products/${r.p.id}`} className="line-clamp-2 font-semibold text-chalk">
                        {r.p.title || "Untitled draft"}
                      </Link>
                      <p className="text-xs text-dim">{r.p.sku}</p>
                    </div>
                  </div>
                  <div className="mt-3 grid grid-cols-2 gap-3">
                    <div>
                      <p className="label !mb-1">MRP (₹)</p>
                      {input(r, "mrp", "MRP")}
                    </div>
                    <div>
                      <p className="label !mb-1">Price (₹)</p>
                      {input(r, "price", "Selling price")}
                    </div>
                  </div>
                  <p className="mt-3 text-sm text-ash tnum">
                    {discount === null ? "No discount" : `${discount}% off`} · You receive <strong className="text-chalk">{s ? rupees(s.net) : "—"}</strong>
                  </p>
                  {rowErrors[r.p.id] && <p role="alert" className="mt-1 text-xs text-danger">{rowErrors[r.p.id]}</p>}
                </li>
              );
            })}
          </ul>
        </>
      )}
      {node}
    </div>
  );
}
