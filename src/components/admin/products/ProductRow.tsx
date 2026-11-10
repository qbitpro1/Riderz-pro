"use client";

import Link from "next/link";
import { useState } from "react";
import { api, ApiFailure } from "@/lib/vendor/client";
import { rupees } from "@/lib/format";
import { productHref } from "@/lib/store/types";

export type ProductRowData = {
  slug: string;
  brand: string;
  title: string;
  code: string | null;
  department: string;
  status: "live" | "hidden";
  listed: boolean;
  price: number | null;
  mrp: number | null;
  stock: number | null;
  updatedBy: string | null;
};

const num = (v: string) => (v.trim() === "" ? null : Number(v));

/** One catalogue product with inline editing of price, MRP, stock and live/hidden. */
export function ProductRow({ p }: { p: ProductRowData }) {
  const [row, setRow] = useState(p);
  const [editing, setEditing] = useState(false);
  const [price, setPrice] = useState(String(p.price ?? ""));
  const [mrp, setMrp] = useState(String(p.mrp ?? ""));
  const [stock, setStock] = useState(String(p.stock ?? ""));
  const [status, setStatus] = useState(p.status);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const save = async () => {
    setBusy(true);
    setError(null);
    const body = { price: num(price), mrp: num(mrp), stock: num(stock), status };
    try {
      await api(`/api/admin/products/${encodeURIComponent(row.slug)}`, { method: "PUT", body });
      setRow({ ...row, ...body });
      setEditing(false);
    } catch (e) {
      setError(e instanceof ApiFailure ? Object.values(e.fields)[0] ?? e.message : "Something went wrong.");
    } finally {
      setBusy(false);
    }
  };

  const stockText = row.stock === null ? <span className="text-dim">not counted</span> : row.stock === 0 ? <span className="text-danger">0 · out of stock</span> : row.stock;

  return (
    <tr className={row.status === "hidden" ? "opacity-60" : undefined}>
      <td className="px-4 py-2.5 align-top">
        <Link href={productHref(row.slug)} className="font-semibold text-chalk hover:text-accent" target="_blank">{row.title}</Link>
        <p className="text-[11px] text-dim">
          {row.brand}{row.code ? ` · ${row.code}` : ""} · {row.department}{!row.listed ? " · page only" : ""}
          {row.status === "hidden" ? <span className="ml-1 font-bold uppercase text-danger">hidden</span> : null}
        </p>
        {error && <p role="alert" className="mt-1 text-xs text-danger">{error}</p>}
      </td>
      {editing ? (
        <>
          <td className="px-2 py-2 align-top"><input aria-label="Price" className="field h-9 w-24 text-right" inputMode="numeric" value={price} onChange={(e) => setPrice(e.target.value)} placeholder="on request" /></td>
          <td className="px-2 py-2 align-top"><input aria-label="MRP" className="field h-9 w-24 text-right" inputMode="numeric" value={mrp} onChange={(e) => setMrp(e.target.value)} /></td>
          <td className="px-2 py-2 align-top"><input aria-label="Stock" className="field h-9 w-24 text-right" inputMode="numeric" value={stock} onChange={(e) => setStock(e.target.value)} placeholder="not counted" /></td>
          <td className="px-2 py-2 align-top">
            <select aria-label="Visibility" className="field h-9" value={status} onChange={(e) => setStatus(e.target.value as "live" | "hidden")}>
              <option value="live">Live</option>
              <option value="hidden">Hidden</option>
            </select>
          </td>
          <td className="px-4 py-2 text-right align-top whitespace-nowrap">
            <button type="button" className="btn btn-primary btn-sm" disabled={busy} onClick={save}>{busy ? "Saving…" : "Save"}</button>{" "}
            <button type="button" className="btn btn-outline btn-sm" disabled={busy} onClick={() => setEditing(false)}>Cancel</button>
          </td>
        </>
      ) : (
        <>
          <td className="px-2 py-2.5 text-right tnum align-top">{row.price === null ? <span className="text-dim">on request</span> : rupees(row.price)}</td>
          <td className="px-2 py-2.5 text-right tnum align-top">{row.mrp === null ? "—" : rupees(row.mrp)}</td>
          <td className="px-2 py-2.5 text-right tnum align-top">{stockText}</td>
          <td className="px-2 py-2.5 align-top">{row.status === "live" ? "Live" : "Hidden"}</td>
          <td className="px-4 py-2.5 text-right align-top">
            <button type="button" className="btn btn-outline btn-sm" onClick={() => setEditing(true)}>Edit</button>
          </td>
        </>
      )}
    </tr>
  );
}
