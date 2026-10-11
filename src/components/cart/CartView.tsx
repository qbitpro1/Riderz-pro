"use client";

import Link from "next/link";
import { Icon } from "@/components/ui/Icon";
import { useCart } from "./CartContext";
import { rupees } from "@/lib/format";
import { whatsapp } from "@/lib/data/site";
import { FREE_SHIPPING_OVER, shippingFor } from "@/lib/store/shipping";
import { CartThumb } from "./CartThumb";
import { orderMessage } from "./cartMessage";
import { CheckoutButton } from "./CheckoutButton";

export function CartView() {
  const { lines, subtotal, installTotal, setQty, remove, clear, ready, count } = useCart();

  if (!ready) {
    return <div className="card p-10 text-center text-sm text-dim">Loading your cart…</div>;
  }

  if (lines.length === 0) {
    return (
      <div className="card p-10 text-center">
        <Icon name="bag" size={32} className="mx-auto text-dim" />
        <p className="mt-4 font-display text-xl uppercase">Nothing in here yet</p>
        <p className="mx-auto mt-2 max-w-sm text-sm text-ash">
          Start with the accessories store, or tell us what you drive and we'll only show parts that
          fit.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Link href="/shop" className="btn btn-primary btn-sm">
            Shop accessories
          </Link>
          <Link href="/build" className="btn btn-outline btn-sm">
            Configure a build
          </Link>
        </div>
      </div>
    );
  }

  const shipping = shippingFor(subtotal);
  const total = subtotal + installTotal + shipping;
  const message = orderMessage(lines, { subtotal, installTotal, shipping, total });

  return (
    <div className="grid gap-6 lg:grid-cols-[1.6fr_1fr] lg:items-start">
      <ul className="divide-y divide-tint/8 border-y border-tint/8">
        {lines.map((l) => (
          <li key={l.id} className="flex flex-wrap items-center gap-4 py-4">
            <CartThumb image={l.image} size={80} />
            <div className="min-w-0 flex-1">
              <Link href={l.href} className="text-sm font-semibold transition-colors hover:text-accent">
                {l.name}
              </Link>
              {l.variant && <p className="mt-0.5 text-xs text-ash">{l.variant}</p>}
              <p className="mt-0.5 text-xs text-dim tnum">
                {rupees(l.price)} each
                {l.install ? ` · installation ${rupees(l.install)}` : ""}
              </p>
            </div>

            <div className="flex items-center border border-tint/12">
              <button
                type="button"
                aria-label={`Decrease ${l.name}`}
                onClick={() => setQty(l.id, l.qty - 1)}
                className="grid h-10 w-9 place-items-center text-ash hover:text-accent"
              >
                <Icon name="minus" size={14} />
              </button>
              <span className="w-8 text-center font-display text-sm font-bold tnum">{l.qty}</span>
              <button
                type="button"
                aria-label={`Increase ${l.name}`}
                onClick={() => setQty(l.id, l.qty + 1)}
                className="grid h-10 w-9 place-items-center text-ash hover:text-accent"
              >
                <Icon name="plus" size={14} />
              </button>
            </div>

            <p className="w-24 shrink-0 text-right font-display text-base font-bold tnum">
              {rupees((l.price + (l.install ?? 0)) * l.qty)}
            </p>

            <button
              type="button"
              onClick={() => remove(l.id)}
              aria-label={`Remove ${l.name}`}
              className="text-dim transition-colors hover:text-danger"
            >
              <Icon name="close" size={16} />
            </button>
          </li>
        ))}
      </ul>

      <aside className="card p-5 lg:sticky lg:top-24">
        <p className="eyebrow mb-4">Order summary</p>
        <dl className="space-y-2 text-sm">
          <Row label={`Subtotal (${count} item${count === 1 ? "" : "s"})`} value={rupees(subtotal)} />
          {installTotal > 0 && <Row label="Installation" value={rupees(installTotal)} />}
          <Row label="Shipping" value={shipping === 0 ? "Free" : rupees(shipping)} />
        </dl>
        <div className="mt-4 flex items-baseline justify-between border-t border-tint/8 pt-4">
          <span className="font-display text-sm font-bold uppercase tracking-[0.14em]">Total</span>
          <span className="font-display text-2xl font-extrabold tnum">{rupees(total)}</span>
        </div>
        <p className="mt-1 text-[11px] text-dim">Inclusive of GST</p>

        {shipping > 0 && (
          <p className="mt-3 text-xs text-accent tnum">
            Add {rupees(FREE_SHIPPING_OVER - subtotal)} more for free shipping.
          </p>
        )}

        <CheckoutButton lines={lines} whatsappHref={whatsapp(message)} className="mt-5" />
        <p className="mt-3 text-[11px] leading-relaxed text-dim">
          We confirm fitment against your variant, then send a payment link. Card, UPI, net banking
          and no-cost EMI on orders above ₹10,000.
        </p>

        <div className="mt-5 flex justify-between border-t border-tint/8 pt-4">
          <Link href="/shop" className="text-xs text-ash underline underline-offset-4 hover:text-accent">
            Continue shopping
          </Link>
          <button type="button" onClick={clear} className="text-xs text-dim underline underline-offset-4 hover:text-danger">
            Empty cart
          </button>
        </div>
      </aside>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <dt className="text-ash">{label}</dt>
      <dd className="tnum">{value}</dd>
    </div>
  );
}
