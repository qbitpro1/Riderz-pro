"use client";

import { useRouter } from "next/navigation";
import { useId, useState } from "react";
import { api, ApiFailure } from "@/lib/vendor/client";
import { rupees } from "@/lib/format";
import { fmtDate } from "@/components/vendor/orders/format";
import type { DueVendor } from "@/components/vendor/payments/types";

/** One vendor's due orders and the "I have sent this money" form. Amounts are recomputed on the server. */
export function RecordPayoutForm({ vendor }: { vendor: DueVendor }) {
  const router = useRouter();
  const uid = useId();
  const [picked, setPicked] = useState<Set<string>>(() => new Set(vendor.orders.map((o) => o.id)));
  const [reference, setReference] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<string | null>(null);

  const total = vendor.orders.filter((o) => picked.has(o.id)).reduce((n, o) => n + o.net, 0);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (picked.size === 0) return;
    if (!window.confirm(`Record a payout of ${rupees(total)} to ${vendor.storeName}? Only do this after the bank transfer has been made.`)) return;
    setBusy(true);
    setError(null);
    try {
      await api("/api/admin/payouts", { body: { vendorId: vendor.vendorId, vendorOrderIds: [...picked], reference } });
      setDone(`Recorded ${rupees(total)}.`);
      router.refresh();
    } catch (err) {
      setError(err instanceof ApiFailure ? err.fields.reference ?? err.message : "Something went wrong. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="card p-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="font-display text-xl font-extrabold uppercase">{vendor.storeName}</h2>
          {vendor.bank ? (
            <p className="mt-1 text-sm text-ash">
              {vendor.bank.holder} · account <span className="tnum">XXXXXX{vendor.bank.last4}</span> · IFSC <span className="tnum">{vendor.bank.ifsc}</span>
            </p>
          ) : (
            <p className="mt-1 text-sm text-danger">No bank details on file.</p>
          )}
        </div>
        <div className="text-right">
          <p className="text-[11px] uppercase tracking-[0.12em] text-dim">Net due</p>
          <p className="font-display text-2xl font-extrabold tnum">{rupees(vendor.net)}</p>
          <p className="text-xs text-dim">{vendor.orders.length} order{vendor.orders.length === 1 ? "" : "s"}</p>
        </div>
      </div>

      <fieldset className="mt-4">
        <legend className="label">Orders to include</legend>
        <ul className="divide-y divide-tint/8 border-y border-tint/8">
          {vendor.orders.map((o) => (
            <li key={o.id}>
              <label className="flex cursor-pointer items-center gap-3 py-2.5 text-sm">
                <input
                  type="checkbox"
                  className="h-4 w-4 accent-[var(--accent)]"
                  checked={picked.has(o.id)}
                  onChange={(e) =>
                    setPicked((prev) => {
                      const next = new Set(prev);
                      if (e.target.checked) next.add(o.id);
                      else next.delete(o.id);
                      return next;
                    })
                  }
                />
                <span className="min-w-0 flex-1">
                  <span className="font-display font-bold">{o.number}</span>
                  <span className="ml-2 text-xs text-dim">delivered {fmtDate(o.deliveredAt)}</span>
                </span>
                <span className="text-xs text-dim tnum">gross {rupees(o.gross)}</span>
                <span className="w-20 text-right font-bold tnum">{rupees(o.net)}</span>
              </label>
            </li>
          ))}
        </ul>
      </fieldset>

      <div className="mt-4 flex flex-wrap items-end gap-3">
        <div className="min-w-0 flex-1 basis-56">
          <label className="label" htmlFor={`${uid}-ref`}>UTR / bank reference</label>
          <input id={`${uid}-ref`} className="field" value={reference} onChange={(e) => setReference(e.target.value)} required minLength={4} maxLength={60} autoComplete="off" />
        </div>
        <button type="submit" className="btn btn-primary btn-sm" disabled={busy || picked.size === 0 || reference.trim().length < 4}>
          {busy ? "Recording…" : `Record payout ${rupees(total)}`}
        </button>
      </div>
      {error && <p role="alert" className="mt-2 text-xs text-danger">{error}</p>}
      {done && <p role="status" className="mt-2 text-xs text-accent">{done}</p>}
    </form>
  );
}
