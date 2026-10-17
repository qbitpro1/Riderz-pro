"use client";

import { useRouter } from "next/navigation";
import { useId, useState } from "react";
import { api, ApiFailure } from "@/lib/vendor/client";
import { paiseToText } from "@/lib/payments/types";

/**
 * Refund an online payment, full or partial (whole rupees). The server enforces the limit
 * (paid minus every refund not failed) and records who refunded, how much and why.
 */
export function RefundForm({ orderId, refundablePaise, suggestedPaise }: { orderId: string; refundablePaise: number; suggestedPaise: number }) {
  const router = useRouter();
  const uid = useId();
  const maxRupees = Math.floor(refundablePaise / 100);
  // Prefill: the whole remainder for a cancelled order, else the cancelled/returned parts, else nothing.
  const [full, setFull] = useState(suggestedPaise > 0 && suggestedPaise >= refundablePaise);
  const [amount, setAmount] = useState(suggestedPaise > 0 ? String(Math.floor(suggestedPaise / 100)) : "");
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<string | null>(null);

  const rupeesValue = Number(amount);
  const amountOk = full || (Number.isInteger(rupeesValue) && rupeesValue >= 1 && rupeesValue <= maxRupees);
  const showing = full ? paiseToText(refundablePaise) : amountOk ? paiseToText(rupeesValue * 100) : "—";

  async function go() {
    if (!amountOk || reason.trim().length < 3) return;
    if (!window.confirm(`Refund ${showing} to the customer through Razorpay? This can't be undone.`)) return;
    setBusy(true);
    setError(null);
    setDone(null);
    try {
      const res = await api<{ refund: { status: string; amountPaise: number } }>(`/api/admin/orders/${encodeURIComponent(orderId)}/refund`, {
        body: { amount: full ? null : rupeesValue, reason },
      });
      setDone(`Refund of ${paiseToText(res.refund.amountPaise)} ${res.refund.status === "processed" ? "processed" : "sent to Razorpay"}.`);
      setReason("");
      router.refresh();
    } catch (err) {
      setError(err instanceof ApiFailure ? err.fields.amount ?? err.fields.reason ?? err.message : "Something went wrong. Please try again.");
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mt-4 space-y-2 border-t border-tint/8 pt-4">
      <p className="text-xs font-bold uppercase tracking-[0.12em] text-dim">Refund</p>
      <label className="flex items-center gap-2 text-xs text-ash">
        <input type="checkbox" checked={full} onChange={(e) => setFull(e.target.checked)} className="h-4 w-4 accent-[var(--accent)]" />
        Full refund of what&apos;s left ({paiseToText(refundablePaise)})
      </label>
      {!full && (
        <div>
          <label className="label" htmlFor={`${uid}-a`}>Amount in rupees (at most {maxRupees})</label>
          <input
            id={`${uid}-a`}
            className="field"
            inputMode="numeric"
            value={amount}
            onChange={(e) => setAmount(e.target.value.replace(/[^0-9]/g, ""))}
            aria-invalid={!amountOk}
            maxLength={9}
          />
        </div>
      )}
      <div>
        <label className="label" htmlFor={`${uid}-r`}>Reason (recorded in the audit log)</label>
        <input id={`${uid}-r`} className="field" value={reason} onChange={(e) => setReason(e.target.value)} maxLength={300} autoComplete="off" />
      </div>
      <button type="button" className="btn btn-outline btn-sm" disabled={busy || !amountOk || reason.trim().length < 3} onClick={go}>
        {busy ? "Refunding…" : amountOk ? `Refund ${showing}` : "Refund"}
      </button>
      {error && <p role="alert" className="text-xs text-danger">{error}</p>}
      {done && <p role="status" className="text-xs text-accent">{done}</p>}
    </div>
  );
}
