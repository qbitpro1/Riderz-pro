"use client";

import { Check, ImageOff } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import type { ProductListItem } from "@/lib/server/admin-vendors";
import { rupees } from "@/lib/format";
import { api, ApiFailure } from "@/lib/vendor/client";
import { fmtDate, Notice, StatusBadge } from "@/components/admin/vendors/ui";

export default function ProductQueue({ items, canBulk }: { items: ProductListItem[]; canBulk: boolean }) {
  const router = useRouter();
  const [picked, setPicked] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ tone: "ok" | "error"; text: string } | null>(null);

  const selectable = items.filter((i) => canBulk && i.vendorStatus === "approved" && (i.status === "pending_review" || i.hasRevision));

  async function approveSelected() {
    setBusy(true);
    setMsg(null);
    try {
      const res = await api<{ results: { id: string; ok: boolean; message?: string }[] }>("/api/admin/vendor-products/bulk", { body: { ids: picked } });
      const failed = res.results.filter((r) => !r.ok);
      setMsg(
        failed.length === 0
          ? { tone: "ok", text: `Approved ${res.results.length} product(s).` }
          : { tone: "error", text: `Approved ${res.results.length - failed.length}; ${failed.length} skipped: ${failed[0].message}` },
      );
      setPicked([]);
      router.refresh();
    } catch (e) {
      setMsg({ tone: "error", text: e instanceof ApiFailure ? e.message : "Something went wrong." });
    } finally {
      setBusy(false);
    }
  }

  if (items.length === 0) return <div className="card mt-8 p-8 text-center text-sm text-ash">Nothing in this view.</div>;

  return (
    <div className="mt-6">
      {canBulk && selectable.length > 0 ? (
        <div className="mb-3 flex flex-wrap items-center gap-3">
          <label className="flex items-center gap-2 text-sm text-ash">
            <input
              type="checkbox"
              className="h-4 w-4 accent-[var(--accent)]"
              checked={picked.length === selectable.length}
              onChange={(e) => setPicked(e.target.checked ? selectable.slice(0, 50).map((i) => i.id) : [])}
            />
            Select all ({selectable.length})
          </label>
          <button type="button" className="btn btn-primary btn-sm" disabled={busy || picked.length === 0} onClick={approveSelected}>
            <Check size={14} aria-hidden /> Approve {picked.length || ""} selected
          </button>
          <span className="text-xs text-dim">Open a product to check price, duplicates and details before approving in bulk.</span>
        </div>
      ) : null}
      {msg ? <div className="mb-3"><Notice tone={msg.tone}>{msg.text}</Notice></div> : null}

      <ul className="space-y-3">
        {items.map((p) => {
          const can = selectable.some((s) => s.id === p.id);
          return (
            <li key={p.id} className="card flex items-stretch gap-3 p-3">
              {canBulk ? (
                <div className="flex items-center pl-1">
                  <input
                    type="checkbox"
                    aria-label={`Select ${p.title}`}
                    className="h-4 w-4 accent-[var(--accent)] disabled:opacity-30"
                    disabled={!can}
                    checked={picked.includes(p.id)}
                    onChange={(e) => setPicked((cur) => (e.target.checked ? [...cur, p.id].slice(0, 50) : cur.filter((x) => x !== p.id)))}
                  />
                </div>
              ) : null}
              <Link href={`/admin/vendor-products/${p.id}`} className="flex min-w-0 flex-1 items-center gap-3">
                <span className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-[2px] border border-tint/10 bg-steel">
                  {p.imageId ? (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img src={`/api/admin/files/${p.imageId}`} alt="" className="h-full w-full object-cover" loading="lazy" />
                  ) : (
                    <ImageOff size={18} className="text-dim" aria-hidden />
                  )}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-semibold text-chalk">{p.title}</span>
                  <span className="block truncate text-xs text-ash">{p.brand} · SKU {p.sku} · {p.storeName ?? "Unknown store"}</span>
                  <span className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-dim">
                    <span className="tnum">{rupees(p.price)} <span className="line-through opacity-70">{rupees(p.mrp)}</span></span>
                    <span>{p.submittedAt ? `Submitted ${fmtDate(p.submittedAt)}` : ""}</span>
                    {p.vendorStatus !== "approved" ? <span className="text-danger">seller {p.vendorStatus.replace(/_/g, " ")}</span> : null}
                  </span>
                </span>
                <span className="flex shrink-0 flex-col items-end gap-1">
                  <StatusBadge status={p.status} />
                  {p.hasRevision ? <StatusBadge status="pending" label="edit pending" /> : null}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
