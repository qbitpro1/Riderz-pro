"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Icon } from "@/components/ui/Icon";
import { rupees } from "@/lib/format";
import { whatsapp } from "@/lib/data/site";
import { FREE_SHIPPING_OVER, shippingFor } from "@/lib/store/shipping";
import { useCart } from "./CartContext";
import { CartThumb } from "./CartThumb";
import { orderMessage } from "./cartMessage";

const FOCUSABLE = 'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])';

/**
 * Slide-in cart, mounted by CartProvider while open. Escape, backdrop click and
 * route changes close it; body scroll is locked; Tab is trapped; focus moves in
 * and returns to the opener.
 */
export function CartDrawer() {
  const { lines, count, subtotal, installTotal, setQty, remove, closeCart } = useCart();
  const [shown, setShown] = useState(false);
  const panel = useRef<HTMLDivElement>(null);
  const closeBtn = useRef<HTMLButtonElement>(null);
  const pathname = usePathname();
  const firstPath = useRef(pathname);

  useEffect(() => {
    if (pathname !== firstPath.current) closeCart();
  }, [pathname, closeCart]);

  useEffect(() => {
    const opener = document.activeElement as HTMLElement | null;
    const raf = requestAnimationFrame(() => {
      setShown(true);
      closeBtn.current?.focus();
    });
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        closeCart();
        return;
      }
      if (e.key !== "Tab" || !panel.current) return;
      const els = Array.from(panel.current.querySelectorAll<HTMLElement>(FOCUSABLE));
      if (els.length === 0) return;
      const first = els[0];
      const last = els[els.length - 1];
      const cur = document.activeElement;
      if (!panel.current.contains(cur)) {
        e.preventDefault();
        first.focus();
      } else if (e.shiftKey && cur === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && cur === last) {
        e.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", onKey);

    return () => {
      cancelAnimationFrame(raf);
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
      opener?.focus?.();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const shipping = shippingFor(subtotal);
  const total = subtotal + installTotal + shipping;
  const remaining = FREE_SHIPPING_OVER - subtotal;
  const progress = Math.min(100, Math.round((subtotal / FREE_SHIPPING_OVER) * 100));

  return (
    <div className="fixed inset-0 z-[70]" role="dialog" aria-modal="true" aria-labelledby="cart-drawer-title">
      <button
        type="button"
        tabIndex={-1}
        aria-label="Close cart"
        onClick={closeCart}
        className={`absolute inset-0 bg-void/70 transition-opacity duration-200 ${shown ? "opacity-100" : "opacity-0"}`}
      />
      <div
        ref={panel}
        className={`absolute inset-y-0 right-0 flex w-full flex-col border-l border-tint/10 bg-void shadow-2xl shadow-tint/10 transition-[transform,opacity] duration-200 sm:w-[26rem] ${
          shown ? "translate-x-0 opacity-100" : "translate-x-4 opacity-0"
        }`}
      >
        <div className="flex h-14 shrink-0 items-center justify-between border-b border-tint/10 px-4 md:h-[68px]">
          <h2 id="cart-drawer-title" className="font-display text-sm font-bold uppercase tracking-[0.12em]">
            Your cart{count > 0 && <span className="ml-2 text-dim tnum">({count})</span>}
          </h2>
          <button
            ref={closeBtn}
            type="button"
            onClick={closeCart}
            aria-label="Close cart"
            className="grid h-10 w-10 place-items-center text-chalk/85 transition-colors duration-150 hover:text-accent"
          >
            <Icon name="close" size={22} />
          </button>
        </div>

        {lines.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center px-6 text-center">
            <Icon name="bag" size={32} className="text-dim" />
            <p className="mt-4 font-display text-lg uppercase">Your cart is empty</p>
            <p className="mt-2 max-w-xs text-sm text-ash">Find something for your car and it will show up here.</p>
            <Link href="/shop" onClick={closeCart} className="btn btn-primary btn-sm mt-6">
              Continue shopping
            </Link>
          </div>
        ) : (
          <>
            <div className="shrink-0 border-b border-tint/10 px-4 py-3">
              <p className="text-xs text-ash tnum">
                {remaining > 0
                  ? `Add ${rupees(remaining)} more for free shipping`
                  : "You've unlocked free shipping"}
              </p>
              <div
                className="mt-2 h-1 w-full bg-tint/10"
                role="progressbar"
                aria-label="Progress to free shipping"
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={progress}
              >
                <div className="h-full bg-accent transition-[width] duration-200" style={{ width: `${progress}%` }} />
              </div>
            </div>

            <ul className="flex-1 divide-y divide-tint/8 overflow-y-auto overscroll-contain px-4">
              {lines.map((l) => (
                <li key={l.id} className="flex gap-3 py-4">
                  <CartThumb image={l.image} />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <Link
                        href={l.href}
                        onClick={closeCart}
                        className="text-sm font-semibold leading-snug transition-colors duration-150 hover:text-accent"
                      >
                        {l.name}
                      </Link>
                      <button
                        type="button"
                        onClick={() => remove(l.id)}
                        aria-label={`Remove ${l.name}`}
                        className="shrink-0 text-dim transition-colors duration-150 hover:text-danger"
                      >
                        <Icon name="close" size={16} />
                      </button>
                    </div>
                    {l.variant && <p className="mt-0.5 text-xs text-ash">{l.variant}</p>}
                    <p className="mt-0.5 text-xs text-dim tnum">
                      {rupees(l.price)} each
                      {l.install ? ` · installation ${rupees(l.install)}` : ""}
                    </p>
                    <div className="mt-2 flex items-center justify-between">
                      <div className="flex items-center border border-tint/12">
                        <button
                          type="button"
                          aria-label={`Decrease ${l.name}`}
                          onClick={() => setQty(l.id, l.qty - 1)}
                          className="grid h-9 w-9 place-items-center text-ash transition-colors duration-150 hover:text-accent"
                        >
                          <Icon name="minus" size={14} />
                        </button>
                        <span className="w-8 text-center font-display text-sm font-bold tnum" aria-live="polite">
                          {l.qty}
                        </span>
                        <button
                          type="button"
                          aria-label={`Increase ${l.name}`}
                          onClick={() => setQty(l.id, l.qty + 1)}
                          className="grid h-9 w-9 place-items-center text-ash transition-colors duration-150 hover:text-accent"
                        >
                          <Icon name="plus" size={14} />
                        </button>
                      </div>
                      <p className="font-display text-sm font-bold tnum">
                        {rupees((l.price + (l.install ?? 0)) * l.qty)}
                      </p>
                    </div>
                  </div>
                </li>
              ))}
            </ul>

            <div className="shrink-0 border-t border-tint/10 px-4 pb-4 pt-4">
              <dl className="space-y-1.5 text-sm">
                <div className="flex items-center justify-between">
                  <dt className="text-ash">Subtotal</dt>
                  <dd className="font-display font-bold tnum">{rupees(subtotal)}</dd>
                </div>
                {installTotal > 0 && (
                  <div className="flex items-center justify-between">
                    <dt className="text-ash">Installation</dt>
                    <dd className="tnum">{rupees(installTotal)}</dd>
                  </div>
                )}
                <div className="flex items-center justify-between">
                  <dt className="text-ash">Shipping</dt>
                  <dd className="tnum">{shipping === 0 ? "Free" : rupees(shipping)}</dd>
                </div>
              </dl>
              <p className="mt-1 text-[11px] text-dim">Prices inclusive of GST.</p>
              <a
                href={whatsapp(orderMessage(lines, { subtotal, installTotal, shipping, total }))}
                target="_blank"
                rel="noreferrer noopener"
                className="btn btn-whatsapp btn-block mt-4"
              >
                <Icon name="whatsapp" size={16} />
                Confirm order on WhatsApp
              </a>
              <Link href="/cart" onClick={closeCart} className="btn btn-outline btn-block mt-2">
                View cart
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
