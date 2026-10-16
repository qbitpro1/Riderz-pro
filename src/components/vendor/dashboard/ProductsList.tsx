"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Archive, ArchiveRestore, Copy, Pencil, Plus, Search, Trash2 } from "lucide-react";
import { api } from "@/lib/vendor/client";
import { PRODUCT_STATUSES, type VendorProduct, type VendorProductStatus } from "@/lib/vendor/types";
import { rupees } from "@/lib/format";
import { EmptyState, PRODUCT_STATUS_META, Pill, ReadOnlyNotice, StatusBadge, Thumb, failureMessage, useFlash } from "./ui";

type Props = { initial: VendorProduct[]; readOnly: boolean; initialStatus: VendorProductStatus | "all" };

const base = "/vendor/dashboard/products";

export function ProductsList({ initial, readOnly, initialStatus }: Props) {
  const [products, setProducts] = useState(initial);
  const [status, setStatus] = useState<VendorProductStatus | "all">(initialStatus);
  const [q, setQ] = useState("");
  const [busy, setBusy] = useState<string | null>(null);
  const { show, node } = useFlash();

  const counts = useMemo(() => {
    const c: Record<string, number> = { all: products.length };
    for (const p of products) c[p.status] = (c[p.status] ?? 0) + 1;
    return c;
  }, [products]);

  const shown = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return products.filter(
      (p) =>
        (status === "all" || p.status === status) &&
        (!needle || p.title.toLowerCase().includes(needle) || p.sku.toLowerCase().includes(needle) || p.brand.toLowerCase().includes(needle)),
    );
  }, [products, status, q]);

  async function act(p: VendorProduct, action: "archive" | "unarchive" | "duplicate" | "delete") {
    if (action === "delete" && !window.confirm(`Delete the draft “${p.title || p.sku}”? This cannot be undone.`)) return;
    if (action === "archive" && !window.confirm(`Archive “${p.title}”? It will leave the shop and you can restore it later.`)) return;
    setBusy(p.id);
    try {
      if (action === "delete") {
        await api(`/api/vendor/products/${p.id}`, { method: "DELETE" });
        setProducts((list) => list.filter((x) => x.id !== p.id));
        show("ok", "Draft deleted.");
      } else {
        const res = await api<{ product: VendorProduct }>(`/api/vendor/products/${p.id}/${action}`, { method: "POST", body: {} });
        setProducts((list) => (action === "duplicate" ? [res.product, ...list] : list.map((x) => (x.id === p.id ? res.product : x))));
        show("ok", { archive: "Product archived.", unarchive: "Restored as a draft.", duplicate: `Copied as a draft (${res.product.sku}).` }[action]);
      }
    } catch (err) {
      show("error", failureMessage(err));
    } finally {
      setBusy(null);
    }
  }

  const actions = (p: VendorProduct) => {
    const dis = readOnly || busy === p.id;
    const btn = "grid h-10 w-10 place-items-center rounded-[2px] border border-tint/10 text-ash hover:border-accent hover:text-accent disabled:pointer-events-none disabled:opacity-40";
    const canDelete = p.status === "draft" && !p.approvedAt;
    const canArchive = ["live", "draft", "rejected", "changes_requested"].includes(p.status);
    return (
      <div className="flex items-center gap-1.5">
        <Link href={`${base}/${p.id}`} className={btn} aria-label={`Edit ${p.title || p.sku}`} title="Edit">
          <Pencil size={16} aria-hidden />
        </Link>
        <button type="button" className={btn} disabled={dis} onClick={() => act(p, "duplicate")} aria-label={`Duplicate ${p.title || p.sku}`} title="Duplicate">
          <Copy size={16} aria-hidden />
        </button>
        {p.status === "archived" ? (
          <button type="button" className={btn} disabled={dis} onClick={() => act(p, "unarchive")} aria-label={`Restore ${p.title}`} title="Restore as draft">
            <ArchiveRestore size={16} aria-hidden />
          </button>
        ) : (
          canArchive && (
            <button type="button" className={btn} disabled={dis} onClick={() => act(p, "archive")} aria-label={`Archive ${p.title || p.sku}`} title="Archive">
              <Archive size={16} aria-hidden />
            </button>
          )
        )}
        {canDelete && (
          <button type="button" className={`${btn} hover:!border-danger hover:!text-danger`} disabled={dis} onClick={() => act(p, "delete")} aria-label={`Delete draft ${p.title || p.sku}`} title="Delete draft">
            <Trash2 size={16} aria-hidden />
          </button>
        )}
      </div>
    );
  };

  const notes = (p: VendorProduct) => (
    <>
      {p.status === "changes_requested" && p.reviewNotes && (
        <p className="mt-1.5 rounded-[2px] border border-gold/30 bg-gold/10 p-2 text-xs text-chalk">
          <strong className="text-gold">Reviewer note:</strong> {p.reviewNotes.note}
        </p>
      )}
      {p.status === "rejected" && p.rejectionReason && (
        <p className="mt-1.5 rounded-[2px] border border-danger/30 bg-danger/10 p-2 text-xs text-chalk">
          <strong className="text-danger">Rejected:</strong> {p.rejectionReason}
        </p>
      )}
    </>
  );

  const stockPill = (p: VendorProduct) =>
    p.stock === 0 ? <Pill tone="bad">Out</Pill> : p.stock <= p.lowStockAt ? <Pill tone="warn">Low · {p.stock}</Pill> : <span className="tnum">{p.stock}</span>;

  const priceCell = (p: VendorProduct) => (
    <span className="tnum">
      <span className="font-semibold text-chalk">{rupees(p.price)}</span>
      {p.mrp > p.price && <span className="ml-1.5 text-xs text-dim line-through">{rupees(p.mrp)}</span>}
    </span>
  );

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="eyebrow">Catalogue</p>
          <h1 className="display-3 mt-1">Products</h1>
        </div>
        {readOnly ? (
          <span className="btn btn-primary pointer-events-none opacity-40" aria-disabled>
            <Plus size={16} aria-hidden /> Add product
          </span>
        ) : (
          <Link href={`${base}/new`} className="btn btn-primary">
            <Plus size={16} aria-hidden /> Add product
          </Link>
        )}
      </div>

      {readOnly && <ReadOnlyNotice />}

      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="rail -mx-4 flex gap-2 overflow-x-auto px-4 md:mx-0 md:px-0" role="group" aria-label="Filter by status">
          {(["all", ...PRODUCT_STATUSES] as const).map((s) => {
            const on = status === s;
            return (
              <button
                key={s}
                type="button"
                onClick={() => setStatus(s)}
                aria-pressed={on}
                className={`chip min-h-9 ${on ? "chip-active" : "hover:border-accent hover:text-accent"}`}
              >
                {s === "all" ? "All" : PRODUCT_STATUS_META[s].label} · {counts[s] ?? 0}
              </button>
            );
          })}
        </div>
        <div className="relative md:w-72">
          <label htmlFor="product-search" className="sr-only">
            Search products
          </label>
          <Search size={16} aria-hidden className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-dim" />
          <input id="product-search" type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search title, SKU or brand" className="field pl-9" />
        </div>
      </div>

      {shown.length === 0 ? (
        products.length === 0 ? (
          <EmptyState title="No products yet">
            Add your first product. It appears on your Offline Store screen after a quick review by the Riderzpro team.
            {!readOnly && (
              <div className="mt-4">
                <Link href={`${base}/new`} className="btn btn-primary btn-sm">
                  <Plus size={14} aria-hidden /> Add product
                </Link>
              </div>
            )}
          </EmptyState>
        ) : (
          <EmptyState title="No products match">Try another status or clear the search.</EmptyState>
        )
      ) : (
        <>
          {/* Desktop table */}
          <div className="card hidden overflow-x-auto md:block">
            <table className="w-full text-left text-sm">
              <caption className="sr-only">Your products</caption>
              <thead>
                <tr className="border-b border-tint/10 text-[11px] uppercase tracking-[0.1em] text-dim">
                  <th scope="col" className="px-4 py-3 font-bold">Product</th>
                  <th scope="col" className="px-3 py-3 font-bold">Status</th>
                  <th scope="col" className="px-3 py-3 font-bold">Price</th>
                  <th scope="col" className="px-3 py-3 font-bold">Stock</th>
                  <th scope="col" className="px-4 py-3 text-right font-bold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-tint/10">
                {shown.map((p) => (
                  <tr key={p.id} className="align-top">
                    <td className="px-4 py-3">
                      <div className="flex gap-3">
                        <Thumb id={p.images[0]} alt="" />
                        <div className="min-w-0">
                          <Link href={`${base}/${p.id}`} className="block max-w-[26rem] truncate font-semibold text-chalk hover:text-accent">
                            {p.title || "Untitled draft"}
                          </Link>
                          <p className="text-xs text-dim">
                            {p.sku}
                            {p.brand ? ` · ${p.brand}` : ""}
                          </p>
                          {notes(p)}
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-3"><StatusBadge product={p} /></td>
                    <td className="px-3 py-3">{priceCell(p)}</td>
                    <td className="px-3 py-3 text-ash">{stockPill(p)}</td>
                    <td className="px-4 py-3"><div className="flex justify-end">{actions(p)}</div></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <ul className="space-y-3 md:hidden">
            {shown.map((p) => (
              <li key={p.id} className="card p-3">
                <div className="flex gap-3">
                  <Thumb id={p.images[0]} alt="" size={56} />
                  <div className="min-w-0 flex-1">
                    <Link href={`${base}/${p.id}`} className="line-clamp-2 font-semibold text-chalk">
                      {p.title || "Untitled draft"}
                    </Link>
                    <p className="truncate text-xs text-dim">
                      {p.sku}
                      {p.brand ? ` · ${p.brand}` : ""}
                    </p>
                    <div className="mt-1.5"><StatusBadge product={p} /></div>
                  </div>
                </div>
                {notes(p)}
                <div className="mt-3 flex items-center justify-between gap-2 text-sm">
                  <div className="flex items-center gap-3 text-ash">
                    {priceCell(p)}
                    <span className="flex items-center gap-1 text-xs">Stock {stockPill(p)}</span>
                  </div>
                  {actions(p)}
                </div>
              </li>
            ))}
          </ul>
        </>
      )}
      {node}
    </div>
  );
}
