"use client";

import { useId, useState } from "react";
import { CheckCircle2, CreditCard, Store } from "lucide-react";
import { rupees } from "@/lib/format";
import { api, ApiFailure } from "@/lib/vendor/client";
import { openCheckout, type RazorpaySuccess } from "@/lib/payments/checkout";
import type { OnlinePaymentStart } from "@/lib/payments/types";
import { CloseButton, Layer } from "./Layer";
import { ReceiptChoice } from "./ReceiptChoice";
import { ui } from "./lib";
import type { OrderLine } from "./hooks";
import type { ScreenOffer } from "./StoreAssistant";
import type { ScreenStore } from "./types";

export type PayOptions = { onScreen: boolean; atCounter: boolean };
type Placed = { number: string; total: number; discount: number; pay: "screen" | "counter"; paid: boolean };

/**
 * CHECKOUT ON THE SHOP SCREEN. The customer gives a name and mobile (for the order and the
 * receipt SMS), then pays on the screen (Razorpay: UPI or card) or chooses to pay at the counter.
 * Prices, stock and the special price are all checked again on the server.
 */
export function CheckoutSheet({
  store,
  lines,
  total,
  offer,
  pay,
  conversationId,
  onClose,
  onDone,
}: {
  store: ScreenStore;
  lines: OrderLine[];
  total: number;
  /** The special price in force (already checked by the screen). */
  offer: ScreenOffer | null;
  pay: PayOptions;
  /** The Salesman AI chat that led to this order, if the customer used it. */
  conversationId: string | null;
  onClose: () => void;
  onDone: () => void;
}) {
  const uid = useId();
  const [name, setName] = useState("");
  const [mobile, setMobile] = useState("");
  const [method, setMethod] = useState<"screen" | "counter">(pay.onScreen ? "screen" : "counter");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fields, setFields] = useState<Record<string, string>>({});
  const [placed, setPlaced] = useState<Placed | null>(null);
  const [pending, setPending] = useState<{ number: string; total: number; discount: number; payment: OnlinePaymentStart } | null>(null);

  const liveOffer = offer;
  const itemCount = lines.reduce((n, l) => n + l.qty, 0);
  const shownDiscount = liveOffer ? Math.min(liveOffer.discount, Math.floor((total * liveOffer.percent) / 100)) : 0;

  async function payOnScreen(p: { number: string; total: number; discount: number; payment: OnlinePaymentStart }) {
    setError(null);
    await openCheckout({
      keyId: p.payment.keyId,
      razorpayOrderId: p.payment.razorpayOrderId,
      amountPaise: p.payment.amountPaise,
      currency: p.payment.currency,
      timeoutSeconds: p.payment.timeoutSeconds,
      orderNumber: p.number,
      prefill: { name, email: null, mobile },
      onSuccess: async (res: RazorpaySuccess) => {
        setBusy(true);
        try {
          await api("/api/payments/razorpay/verify", { body: res });
          setPlaced({ number: p.number, total: p.total, discount: p.discount, pay: "screen", paid: true });
        } catch {
          // The webhook settles it; staff can see it in the dashboard.
          setPlaced({ number: p.number, total: p.total, discount: p.discount, pay: "screen", paid: false });
        } finally {
          setBusy(false);
        }
      },
      onFailure: (msg) => setError(msg || "The payment didn't go through. Try again, or ask the staff."),
      onDismiss: () => setError("Payment not finished. Tap Pay again, or ask the staff for help."),
    }).catch(() => setError("The payment window couldn't open. Please ask the staff."));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (busy) return;
    if (pending) return payOnScreen(pending);
    setBusy(true);
    setError(null);
    setFields({});
    try {
      const r = await api<{ order: { number: string; total: number; discount: number }; payment?: OnlinePaymentStart }>("/api/vendor/store-screen/checkout", {
        body: {
          lines: lines.map((l) => ({ id: l.product.id, qty: l.qty })),
          customer: { name, mobile },
          offerId: liveOffer?.id ?? null,
          pay: method,
          ...(conversationId ? { conversationId } : {}),
        },
      });
      if (method === "counter" || !r.payment) {
        setPlaced({ number: r.order.number, total: r.order.total, discount: r.order.discount, pay: "counter", paid: false });
      } else {
        const p = { ...r.order, payment: r.payment };
        setPending(p);
        await payOnScreen(p);
      }
    } catch (err) {
      if (err instanceof ApiFailure) {
        const f: Record<string, string> = {};
        for (const [k, v] of Object.entries(err.fields)) f[k.replace(/^customer\./, "")] = v;
        setFields(f);
        setError(err.message);
      } else setError("Something went wrong. Please ask the staff.");
    } finally {
      setBusy(false);
    }
  }

  if (placed) {
    return (
      <Layer label="Order placed" onClose={onDone} kind="full">
        <div className="ss-scroll flex min-h-0 flex-1 flex-col overflow-y-auto px-6 py-10 short:py-4">
          {/* On a short landscape screen (a shop TV) the number sits beside the receipt choice. */}
          <div className="m-auto flex flex-col items-center gap-6 text-center wide:short:w-full wide:short:max-w-5xl wide:short:flex-row wide:short:gap-10">
            <div className="flex w-full flex-col items-center gap-6 short:gap-3 wide:short:min-w-0 wide:short:flex-1">
              <CheckCircle2 size={72} className="text-accent short:h-12 short:w-12" aria-hidden />
              <p className="font-display text-3xl font-extrabold text-chalk md:text-4xl short:text-2xl">
                {placed.pay === "counter" ? "Order placed. Please pay at the counter." : placed.paid ? "Paid. Thank you!" : "Payment received. Confirming…"}
              </p>
              <div className="rounded-3xl border-2 border-dashed border-accent px-10 py-6 short:py-3">
                <p className="text-base font-semibold uppercase tracking-[0.14em] text-dim">Order number</p>
                <p className="tnum font-display text-5xl font-extrabold tracking-[0.06em] text-chalk md:text-6xl">{placed.number}</p>
                <p className="mt-2 tnum text-2xl font-bold text-chalk short:mt-1 short:text-xl">{rupees(placed.total)}</p>
                {placed.discount > 0 && <p className="text-base text-accent">Special price: you saved {rupees(placed.discount)}</p>}
              </div>
            </div>
            <div className="flex w-full flex-col items-center gap-6 short:gap-3 wide:short:min-w-0 wide:short:flex-1">
              <p className="max-w-xl text-lg text-ash short:text-base">
                {placed.pay === "counter"
                  ? `Show this number at the ${store.name} counter. Pay there and collect your items.`
                  : "Show this number at the counter to collect your items."}
              </p>
              <ReceiptChoice number={placed.number} mobile={mobile} />
              <button type="button" onClick={onDone} className={`${ui.primary} min-h-16 px-10 text-lg short:min-h-12`}>
                Done
              </button>
            </div>
          </div>
        </div>
      </Layer>
    );
  }

  return (
    <Layer label="Checkout" onClose={onClose} kind="drawer" size="lg">
      <div className="flex items-center justify-between border-b border-tint/10 px-5 py-4 md:px-6 short:py-2.5">
        <p className="font-display text-2xl font-extrabold text-chalk short:text-xl">Checkout</p>
        <CloseButton onClick={onClose} />
      </div>
      <form onSubmit={submit} noValidate className="ss-scroll flex min-h-0 flex-1 flex-col gap-5 overflow-y-auto px-5 py-5 md:px-6 short:gap-3 short:py-3">
        <div className="rounded-2xl bg-carbon p-4 text-base short:px-4 short:py-2.5">
          <div className="flex justify-between"><span className="text-ash">{itemCount} {itemCount === 1 ? "item" : "items"}</span><span className="tnum text-chalk">{rupees(total)}</span></div>
          {shownDiscount > 0 && (
            <div className="flex justify-between font-semibold text-accent"><span>Special price ({liveOffer?.percent}% off)</span><span className="tnum">−{rupees(shownDiscount)}</span></div>
          )}
          <div className="mt-1 flex items-baseline justify-between border-t border-tint/10 pt-2 short:pt-1">
            <span className="font-semibold text-chalk">To pay</span>
            <span className="tnum font-display text-3xl font-extrabold text-chalk short:text-2xl">{rupees(total - shownDiscount)}</span>
          </div>
          <p className="text-right text-sm text-dim short:text-xs">Includes GST. Final amount checked when you place the order.</p>
        </div>

        {/* Short screens (a shop TV): name and mobile side by side, so the whole form fits. */}
        <div className="flex flex-col gap-5 short:grid short:grid-cols-2 short:gap-3">
        <div>
          <label className="mb-1.5 block text-base font-semibold text-chalk short:mb-1" htmlFor={`${uid}-n`}>Your name</label>
          <input id={`${uid}-n`} data-autofocus value={name} onChange={(e) => setName(e.target.value)} maxLength={80} autoComplete="off" disabled={Boolean(pending)}
            className="h-14 w-full rounded-xl border border-tint/15 bg-void px-4 text-lg short:h-12 text-chalk outline-none focus:border-accent" aria-invalid={Boolean(fields.name)} />
          {fields.name && <p className="mt-1 text-sm text-danger">{fields.name}</p>}
        </div>
        <div>
          <label className="mb-1.5 block text-base font-semibold text-chalk short:mb-1" htmlFor={`${uid}-m`}>Mobile number</label>
          <input id={`${uid}-m`} value={mobile} onChange={(e) => setMobile(e.target.value)} inputMode="tel" maxLength={14} autoComplete="off" placeholder="10-digit number" disabled={Boolean(pending)}
            className="h-14 w-full rounded-xl border border-tint/15 bg-void px-4 text-lg short:h-12 text-chalk outline-none focus:border-accent" aria-invalid={Boolean(fields.mobile)} />
          {fields.mobile && <p className="mt-1 text-sm text-danger">{fields.mobile}</p>}
          <p className="mt-1 text-sm text-dim short:text-xs">Only for this order. It isn&apos;t shown on the screen again.</p>
        </div>
        </div>

        <fieldset className="space-y-2" disabled={Boolean(pending)}>
          <legend className="mb-1.5 text-base font-semibold text-chalk short:mb-1">How would you like to pay?</legend>
          {pay.onScreen && (
            <label className={`flex min-h-16 cursor-pointer items-center gap-3 rounded-2xl border-2 px-4 short:min-h-12 short:py-1.5 ${method === "screen" ? "border-accent" : "border-tint/15"}`}>
              <input type="radio" name={`${uid}-pay`} checked={method === "screen"} onChange={() => setMethod("screen")} className="h-5 w-5 accent-[var(--accent)]" />
              <CreditCard size={22} aria-hidden className="text-chalk" />
              <span><span className="block text-base font-semibold text-chalk">Pay here now</span><span className="block text-sm text-dim">UPI (scan with your phone) or card</span></span>
            </label>
          )}
          {pay.atCounter && (
            <label className={`flex min-h-16 cursor-pointer items-center gap-3 rounded-2xl border-2 px-4 short:min-h-12 short:py-1.5 ${method === "counter" ? "border-accent" : "border-tint/15"}`}>
              <input type="radio" name={`${uid}-pay`} checked={method === "counter"} onChange={() => setMethod("counter")} className="h-5 w-5 accent-[var(--accent)]" />
              <Store size={22} aria-hidden className="text-chalk" />
              <span><span className="block text-base font-semibold text-chalk">Pay at the counter</span><span className="block text-sm text-dim">Cash, UPI or card with the staff</span></span>
            </label>
          )}
        </fieldset>

        {error && <p role="alert" className="text-base text-danger">{error}</p>}
        <button type="submit" disabled={busy || (!pending && (name.trim().length < 2 || mobile.replace(/\D/g, "").length < 10))} className={`${ui.primary} mt-auto min-h-16 w-full text-lg short:min-h-12`}>
          {busy ? "Please wait…" : pending ? `Pay ${rupees(pending.total)} again` : method === "screen" ? "Place order and pay" : "Place order"}
        </button>
      </form>
    </Layer>
  );
}
