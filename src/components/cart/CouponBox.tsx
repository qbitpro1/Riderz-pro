"use client";

import { useId, useState } from "react";
import { api, ApiFailure } from "@/lib/vendor/client";
import { normaliseCode, type CouponQuote } from "@/lib/coupons/types";
import type { CartLine } from "@/lib/store/types";
import { rupees } from "@/lib/format";

export const cartLinesForServer = (lines: CartLine[]) => lines.map((l) => ({ id: l.id, qty: l.qty, install: Boolean(l.install) }));

/** Asks the server what a code takes off this cart (prices are the server's). */
export async function fetchQuote(code: string, lines: CartLine[]): Promise<CouponQuote> {
  const r = await api<{ quote: CouponQuote }>("/api/coupons/check", { body: { code, lines: cartLinesForServer(lines) } });
  return r.quote;
}

/**
 * "Have a coupon?" in the order summary. Coupons lower Riderzpro's own products, installation or
 * delivery charge; the order checks the code again when it is placed.
 */
export function CouponBox({ lines, quote, onChange, disabled }: { lines: CartLine[]; quote: CouponQuote | null; onChange: (q: CouponQuote | null) => void; disabled?: boolean }) {
  const uid = useId();
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function apply(e: React.FormEvent) {
    e.preventDefault();
    const c = normaliseCode(code);
    if (!c || busy) return;
    setBusy(true);
    setError(null);
    try {
      onChange(await fetchQuote(c, lines));
      setCode("");
    } catch (err) {
      setError(err instanceof ApiFailure ? err.fields.couponCode ?? err.fields.code ?? err.message : "Couldn't check that code. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  if (quote) {
    return (
      <div className="mt-4 flex items-start justify-between gap-3 rounded-sm border border-accent/40 p-3 text-xs">
        <p className="min-w-0 text-ash">
          <span className="font-mono font-semibold text-chalk">{quote.code}</span> applied · {quote.title}
          <br />
          {quote.freeShipping ? "Free delivery" : `You save ${rupees(quote.discount)} on Riderzpro items`}
        </p>
        <button type="button" className="shrink-0 font-semibold text-accent underline underline-offset-4" onClick={() => onChange(null)} disabled={disabled}>
          Remove
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={apply} className="mt-4" aria-label="Coupon">
      <label className="label" htmlFor={`${uid}-c`}>Coupon code</label>
      <div className="flex gap-2">
        <input
          id={`${uid}-c`}
          className="field min-w-0 flex-1 uppercase"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          maxLength={24}
          autoComplete="off"
          autoCapitalize="characters"
          aria-invalid={Boolean(error)}
          aria-describedby={error ? `${uid}-c-err` : undefined}
        />
        <button type="submit" className="btn btn-outline btn-sm shrink-0" disabled={busy || disabled || normaliseCode(code).length < 3}>
          {busy ? "Checking…" : "Apply"}
        </button>
      </div>
      {error && <p id={`${uid}-c-err`} role="alert" className="mt-1 text-xs text-danger">{error}</p>}
    </form>
  );
}
