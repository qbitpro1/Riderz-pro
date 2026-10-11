"use client";

import { useState } from "react";
import { Icon } from "@/components/ui/Icon";
import type { CartLine } from "@/lib/store/types";

/**
 * The cart's order actions. With NEXT_PUBLIC_SHOPIFY_CHECKOUT=1 the primary
 * action is Shopify checkout and WhatsApp becomes the secondary one; without
 * it, only the WhatsApp action renders — exactly the cart as it always was.
 * Only line ids and quantities are sent: Shopify owns the price.
 */
const SHOPIFY_CHECKOUT = process.env.NEXT_PUBLIC_SHOPIFY_CHECKOUT === "1";

export function CheckoutButton({
  lines,
  whatsappHref,
  className = "mt-4",
}: {
  lines: CartLine[];
  whatsappHref: string;
  /** Margin utility for the first button, matching the surrounding layout. */
  className?: string;
}) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
        setError("Some items can't be checked out online right now. Please confirm your order on WhatsApp.");
      } else {
        setError("Online checkout isn't available right now. Please confirm your order on WhatsApp.");
      }
    } catch {
      setError("Online checkout isn't available right now. Please confirm your order on WhatsApp.");
    }
    setPending(false);
  }

  const whatsappButton = (extra: string) => (
    <a
      href={whatsappHref}
      target="_blank"
      rel="noreferrer noopener"
      className={`btn btn-whatsapp btn-block ${extra}`}
    >
      <Icon name="whatsapp" size={16} />
      Confirm order on WhatsApp
    </a>
  );

  if (!SHOPIFY_CHECKOUT) return whatsappButton(className);

  return (
    <>
      <button
        type="button"
        onClick={checkout}
        disabled={pending}
        aria-busy={pending}
        className={`btn btn-primary btn-block ${className}`}
      >
        {pending ? "Opening checkout…" : "Checkout securely"}
      </button>
      {error && (
        <p role="alert" className="mt-2 text-xs text-danger">
          {error}
        </p>
      )}
      {whatsappButton("mt-2")}
    </>
  );
}
