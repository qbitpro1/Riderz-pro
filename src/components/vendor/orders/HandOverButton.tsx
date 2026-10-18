"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { api, ApiFailure } from "@/lib/vendor/client";
import { rupees } from "@/lib/format";

/** A shop screen order: the customer collected their items (and, at the counter, paid). */
export function HandOverButton({ id, pay, total }: { id: string; pay: "counter" | "online"; total: number }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const label = pay === "counter" ? `Paid ${rupees(total)} and handed over` : "Handed over to the customer";
  return (
    <div className="space-y-2">
      <button
        type="button"
        className="btn btn-primary"
        disabled={busy}
        onClick={async () => {
          if (pay === "counter" && !window.confirm(`Confirm you received ${rupees(total)} and gave the items to the customer?`)) return;
          setBusy(true);
          setError(null);
          try {
            await api(`/api/vendor/orders/${encodeURIComponent(id)}/hand-over`, { body: {} });
            router.refresh();
          } catch (err) {
            setError(err instanceof ApiFailure ? err.message : "Something went wrong. Please try again.");
          } finally {
            setBusy(false);
          }
        }}
      >
        {busy ? "Saving…" : label}
      </button>
      {error && <p role="alert" className="text-xs text-danger">{error}</p>}
    </div>
  );
}
