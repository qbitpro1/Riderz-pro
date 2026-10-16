"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useId, useState } from "react";
import { Check, PackageCheck, Truck, X } from "lucide-react";
import { api, ApiFailure } from "@/lib/vendor/client";
import { VENDOR_ORDER_MOVES, type VendorOrderStatus } from "@/lib/vendor/types";

const NEXT_LABEL: Partial<Record<VendorOrderStatus, string>> = {
  accepted: "Accept order",
  packed: "Mark packed",
  shipped: "Mark shipped",
  delivered: "Mark delivered",
};

const NEXT_ICON: Partial<Record<VendorOrderStatus, typeof Check>> = {
  accepted: Check,
  packed: PackageCheck,
  shipped: Truck,
  delivered: Check,
};

/**
 * Stage actions for one vendor order. `compact` (lists) only offers the one-tap
 * moves and links to the order page for shipping details or a cancellation;
 * the full version asks for courier + tracking and a cancel reason inline.
 */
export function OrderActions({ id, status, compact = false }: { id: string; status: VendorOrderStatus; compact?: boolean }) {
  const router = useRouter();
  const uid = useId();
  const [busy, setBusy] = useState(false);
  const [mode, setMode] = useState<null | "ship" | "cancel">(null);
  const [courier, setCourier] = useState("");
  const [tracking, setTracking] = useState("");
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [fields, setFields] = useState<Record<string, string>>({});

  const moves = VENDOR_ORDER_MOVES[status] ?? [];
  const next = moves.find((m) => m !== "cancelled");
  const canCancel = moves.includes("cancelled");
  if (!next && !canCancel) return null;

  async function send(body: Record<string, unknown>) {
    setBusy(true);
    setError(null);
    setFields({});
    try {
      await api(`/api/vendor/orders/${encodeURIComponent(id)}/status`, { body });
      setMode(null);
      router.refresh();
    } catch (err) {
      if (err instanceof ApiFailure) {
        setError(err.message);
        setFields(err.fields);
      } else setError("Something went wrong. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  const NextIcon = next ? NEXT_ICON[next] : undefined;

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        {next &&
          (next === "shipped" ? (
            compact ? (
              <Link href={`/vendor/dashboard/orders/${id}`} className="btn btn-primary btn-sm">
                <Truck size={14} aria-hidden /> Add tracking
              </Link>
            ) : (
              <button type="button" className="btn btn-primary btn-sm" onClick={() => setMode(mode === "ship" ? null : "ship")} aria-expanded={mode === "ship"}>
                <Truck size={14} aria-hidden /> {NEXT_LABEL.shipped}
              </button>
            )
          ) : (
            <button type="button" className="btn btn-primary btn-sm" disabled={busy} onClick={() => send({ to: next })}>
              {NextIcon && <NextIcon size={14} aria-hidden />} {busy ? "Saving…" : NEXT_LABEL[next]}
            </button>
          ))}
        {canCancel && !compact && (
          <button type="button" className="btn btn-outline btn-sm" onClick={() => setMode(mode === "cancel" ? null : "cancel")} aria-expanded={mode === "cancel"}>
            <X size={14} aria-hidden /> Cancel order
          </button>
        )}
      </div>

      {mode === "ship" && (
        <form
          className="grid gap-3 sm:grid-cols-2"
          onSubmit={(e) => {
            e.preventDefault();
            send({ to: "shipped", courier, trackingNumber: tracking });
          }}
        >
          <div>
            <label className="label" htmlFor={`${uid}-courier`}>Courier</label>
            <input id={`${uid}-courier`} className="field" value={courier} onChange={(e) => setCourier(e.target.value)} placeholder="Delhivery, Blue Dart…" maxLength={60} required autoComplete="off" />
            {fields.courier && <p className="mt-1 text-xs text-danger">{fields.courier}</p>}
          </div>
          <div>
            <label className="label" htmlFor={`${uid}-track`}>Tracking number</label>
            <input id={`${uid}-track`} className="field" value={tracking} onChange={(e) => setTracking(e.target.value)} maxLength={60} required autoComplete="off" />
            {fields.trackingNumber && <p className="mt-1 text-xs text-danger">{fields.trackingNumber}</p>}
          </div>
          <div className="sm:col-span-2">
            <button type="submit" className="btn btn-primary btn-sm" disabled={busy}>
              {busy ? "Saving…" : "Confirm shipment"}
            </button>
          </div>
        </form>
      )}

      {mode === "cancel" && (
        <form
          className="space-y-3"
          onSubmit={(e) => {
            e.preventDefault();
            send({ to: "cancelled", reason });
          }}
        >
          <div>
            <label className="label" htmlFor={`${uid}-reason`}>Why are you cancelling?</label>
            <textarea id={`${uid}-reason`} className="field py-3" rows={2} value={reason} onChange={(e) => setReason(e.target.value)} maxLength={300} required />
            {fields.reason && <p className="mt-1 text-xs text-danger">{fields.reason}</p>}
            <p className="mt-1 text-xs text-dim">The stock goes back on sale.</p>
          </div>
          <button type="submit" className="btn btn-outline btn-sm text-danger" disabled={busy}>
            {busy ? "Cancelling…" : "Confirm cancellation"}
          </button>
        </form>
      )}

      {error && (
        <p role="alert" className="text-xs text-danger">
          {error}
        </p>
      )}
    </div>
  );
}
