"use client";

import { useState } from "react";
import { isVendorLineSlug } from "@/lib/vendor/types";
import type { CartLine } from "@/lib/store/types";

/**
 * The Shopify "Checkout securely" action. It renders only with
 * NEXT_PUBLIC_SHOPIFY_CHECKOUT=1 and only for house-only carts: marketplace
 * products are not in Shopify, so any vendor line hides it. Only line ids and
 * quantities are sent; Shopify owns the price. Everything else orders through
 * the delivery form (see CheckoutForm).
 */
const SHOPIFY_CHECKOUT = process.env.NEXT_PUBLIC_SHOPIFY_CHECKOUT === "1";

export function hasVendorLine(lines: CartLine[]): boolean {
  return lines.some((l) => isVendorLineSlug(l.slug) || isVendorLineSlug(l.id) || Boolean(l.seller));
}

export function CheckoutButton({ lines, className = "mt-4" }: { lines: CartLine[]; className?: string }) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!SHOPIFY_CHECKOUT || hasVendorLine(lines)) return null;

  async function checkout() {
    setPending(true);
    setError(null);
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lines: lines.map((l) => ({ id: l.id, qty: l.qty })) }),
      });
      const data = (await res.json().catch(() => ({}))) as {
        checkoutUrl?: string;
        configured?: boolean;
        failed?: { id: string; reason: string }[];
      };
      if (res.ok && data.checkoutUrl) {
        window.location.assign(data.checkoutUrl);
        return;
      }
      if (res.status === 409 && data.failed?.length) {
        setError("Some items can't be checked out online right now. Please place your order with the form below.");
      } else {
        setError("Online checkout isn't available right now. Please place your order with the form below.");
      }
    } catch {
      setError("Online checkout isn't available right now. Please place your order with the form below.");
    }
    setPending(false);
  }

  return (
    <div className={className}>
      <button type="button" onClick={checkout} disabled={pending} aria-busy={pending} className="btn btn-primary btn-block">
        {pending ? "Opening checkout…" : "Checkout securely"}
      </button>
      {error && (
        <p role="alert" className="mt-2 text-xs text-danger">
          {error}
        </p>
      )}
      <p className="my-4 text-center text-[11px] uppercase tracking-[0.14em] text-dim">or order with delivery details</p>
    </div>
  );
}
