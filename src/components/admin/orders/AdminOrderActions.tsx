"use client";

import { useRouter } from "next/navigation";
import { useId, useState } from "react";
import { api, ApiFailure } from "@/lib/vendor/client";
import type { VendorOrderStatus } from "@/lib/vendor/types";
import type { OrderStatus } from "./types";

type PartMove = "cancelled" | "return_requested" | "returned";
const PART_MOVES: Partial<Record<VendorOrderStatus, PartMove[]>> = {
  new: ["cancelled"],
  accepted: ["cancelled"],
  packed: ["cancelled"],
  shipped: ["cancelled"],
  delivered: ["return_requested", "returned"],
  return_requested: ["returned"],
};
const MOVE_LABEL: Record<PartMove, string> = {
  cancelled: "Cancel this part",
  return_requested: "Mark return requested",
  returned: "Record return received",
};

/** Cancel / return buttons for one seller's part of an order. A written reason is required. */
export function PartActions({ partId, status }: { partId: string; status: VendorOrderStatus }) {
  const router = useRouter();
  const uid = useId();
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState<PartMove | null>(null);
  const [error, setError] = useState<string | null>(null);
  const moves = PART_MOVES[status];
  if (!moves) return null;

  async function go(to: PartMove) {
    if (to === "returned" && !window.confirm("Record this as returned? The stock goes back on sale and the order is excluded from payouts.")) return;
    if (to === "cancelled" && !window.confirm("Cancel this seller's part of the order? The stock goes back on sale.")) return;
    setBusy(to);
    setError(null);
    try {
      await api(`/api/admin/orders/${encodeURIComponent(partId)}/status`, { body: { to, reason } });
      setReason("");
      router.refresh();
    } catch (err) {
      setError(err instanceof ApiFailure ? err.fields.reason ?? err.message : "Something went wrong. Please try again.");
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="mt-3 space-y-2 border-t border-tint/8 pt-3">
      <label className="label" htmlFor={`${uid}-r`}>Reason (recorded and shown to the seller)</label>
      <input id={`${uid}-r`} className="field" value={reason} onChange={(e) => setReason(e.target.value)} maxLength={300} autoComplete="off" />
      <div className="flex flex-wrap gap-2">
        {moves.map((m) => (
          <button key={m} type="button" className="btn btn-outline btn-sm" disabled={busy !== null || reason.trim().length < 3} onClick={() => go(m)}>
            {busy === m ? "Saving…" : MOVE_LABEL[m]}
          </button>
        ))}
      </div>
      {error && <p role="alert" className="text-xs text-danger">{error}</p>}
    </div>
  );
}

const NEXT: Record<OrderStatus, ("confirmed" | "completed" | "cancelled")[]> = {
  placed: ["confirmed", "cancelled"],
  confirmed: ["completed", "cancelled"],
  completed: [],
  cancelled: [],
};
const LABEL = { confirmed: "Confirm order", completed: "Mark completed", cancelled: "Cancel order" } as const;

/** Order-level status buttons. */
export function OrderStatusButtons({ orderId, status }: { orderId: string; status: OrderStatus }) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  if (NEXT[status].length === 0) return null;

  async function go(to: "confirmed" | "completed" | "cancelled") {
    if (to === "cancelled" && !window.confirm("Cancel this order?")) return;
    setBusy(to);
    setError(null);
    try {
      await api(`/api/admin/orders/${encodeURIComponent(orderId)}/order-status`, { body: { to } });
      router.refresh();
    } catch (err) {
      setError(err instanceof ApiFailure ? err.message : "Something went wrong. Please try again.");
    } finally {
      setBusy(null);
    }
  }

  return (
    <div>
      <div className="flex flex-wrap gap-2">
        {NEXT[status].map((to) => (
          <button key={to} type="button" className={`btn btn-sm ${to === "cancelled" ? "btn-outline" : "btn-primary"}`} disabled={busy !== null} onClick={() => go(to)}>
            {busy === to ? "Saving…" : LABEL[to]}
          </button>
        ))}
      </div>
      {error && <p role="alert" className="mt-2 text-xs text-danger">{error}</p>}
    </div>
  );
}
