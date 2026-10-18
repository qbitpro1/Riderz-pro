"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { api, ApiFailure } from "@/lib/vendor/client";
import { rupees } from "@/lib/format";

/**
 * A shop screen order on the seller's order page: the customer collected their items (and, at the
 * counter, paid), or, for a counter order, they left without paying (cancel: stock goes back).
 */
export function HandOverButton({ id, pay, total }: { id: string; pay: "counter" | "online"; total: number }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const label = pay === "counter" ? `Paid ${rupees(total)} and handed over` : "Handed over to the customer";

  async function run(fn: () => Promise<unknown>) {
    setBusy(true);
    setError(null);
    try {
      await fn();
      router.refresh();
    } catch (err) {
      setError(err instanceof ApiFailure ? err.message : "Something went wrong. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          className="btn btn-primary"
          disabled={busy}
          onClick={() => {
            if (pay === "counter" && !window.confirm(`Confirm you received ${rupees(total)} and gave the items to the customer?`)) return;
            void run(() => api(`/api/vendor/orders/${encodeURIComponent(id)}/hand-over`, { body: {} }));
          }}
        >
          {busy ? "Saving…" : label}
        </button>
        {pay === "counter" && (
          <button
            type="button"
            className="btn btn-outline"
            disabled={busy}
            onClick={() => {
              if (!window.confirm("Cancel this order? The items go back into stock.")) return;
              void run(() =>
                api(`/api/vendor/orders/${encodeURIComponent(id)}/status`, { body: { to: "cancelled", reason: "Customer left the shop without paying" } }),
              );
            }}
          >
            Customer left: cancel
          </button>
        )}
      </div>
      {error && <p role="alert" className="text-xs text-danger">{error}</p>}
    </div>
  );
}
