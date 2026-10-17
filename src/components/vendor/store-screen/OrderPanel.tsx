"use client";

import { useState } from "react";
import { ShoppingBag, Trash2 } from "lucide-react";
import { rupees } from "@/lib/format";
import { CloseButton, Layer } from "./Layer";
import { maxFor, ui } from "./lib";
import type { OrderLine } from "./hooks";
import { Photo, Stepper } from "./parts";

export function Totals({ count, total, savings }: { count: number; total: number; savings: number }) {
  return (
    <div className="space-y-1.5">
      {savings > 0 && (
        <div className="flex items-baseline justify-between text-base text-ash">
          <span>Items at MRP</span>
          <span className="tnum line-through">{rupees(total + savings)}</span>
        </div>
      )}
      {savings > 0 && (
        <div className="flex items-baseline justify-between text-base font-bold text-accent">
          <span>You save</span>
          <span className="tnum">{rupees(savings)}</span>
        </div>
      )}
      <div className="flex items-baseline justify-between pt-1">
        <span className="text-lg font-semibold text-chalk">
          Total <span className="text-base font-medium text-dim">({count} {count === 1 ? "item" : "items"})</span>
        </span>
        <span className="tnum font-display text-4xl font-extrabold tracking-tight text-chalk">{rupees(total)}</span>
      </div>
      <p className="text-right text-sm text-dim">Includes GST</p>
    </div>
  );
}

/**
 * THE ORDER PANEL: a right-hand panel on landscape screens and a bottom sheet on portrait ones.
 * Thumbnails, quantity steppers (capped at stock), remove, and the totals with savings against MRP.
 */
export function OrderPanel({
  lines,
  count,
  total,
  savings,
  setQty,
  onReview,
  onClear,
  onClose,
}: {
  lines: OrderLine[];
  count: number;
  total: number;
  savings: number;
  setQty: (id: string, n: number) => void;
  onReview: () => void;
  onClear: () => void;
  onClose: () => void;
}) {
  const [confirmClear, setConfirmClear] = useState(false);
  return (
    <Layer label="Your order" onClose={onClose} kind="drawer">
      <div className="flex items-center justify-between gap-3 border-b border-tint/10 px-5 py-4 md:px-6">
        <div>
          <h2 className="font-display text-2xl font-extrabold tracking-tight text-chalk">Your order</h2>
          <p className="text-sm text-dim tnum">{count} {count === 1 ? "item" : "items"}</p>
        </div>
        <CloseButton onClick={onClose} label="Close your order" />
      </div>

      <div className="ss-scroll min-h-0 flex-1 overflow-y-auto px-5 md:px-6">
        {count === 0 ? (
          <div className="grid h-full min-h-56 place-items-center py-10 text-center">
            <div>
              <ShoppingBag size={44} className="mx-auto text-dim" aria-hidden />
              <p className="mt-4 font-display text-xl font-extrabold tracking-tight text-chalk">Nothing here yet</p>
              <p className="mt-1 text-base text-ash">Tap Add to order on anything you like.</p>
              <button type="button" data-autofocus onClick={onClose} className={`${ui.primary} mt-6`}>
                Keep browsing
              </button>
            </div>
          </div>
        ) : (
          <ul className="divide-y divide-tint/10">
            {lines.map(({ product: p, qty }) => (
              <li key={p.id} className="flex gap-4 py-4">
                <Photo id={p.images[0]} alt="" sizes="96px" className="h-24 w-24 shrink-0 rounded-2xl" pad="p-1.5" />
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="truncate text-[13px] font-semibold text-dim">{p.brand}</p>
                      <p className="line-clamp-2 text-base font-semibold leading-snug text-chalk">{p.title}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setQty(p.id, 0)}
                      aria-label={`Remove ${p.title}`}
                      className="-mr-2 -mt-1 grid h-12 w-12 shrink-0 place-items-center rounded-full text-dim transition-colors active:bg-steel hover:text-danger"
                    >
                      <Trash2 size={18} aria-hidden />
                    </button>
                  </div>
                  <div className="mt-1.5 flex items-center justify-between gap-2">
                    <Stepper value={qty} max={maxFor(p)} onChange={(n) => setQty(p.id, n)} label={p.title} compact />
                    <div className="text-right">
                      <p className="tnum text-lg font-bold text-chalk">{rupees(p.price * qty)}</p>
                      {qty > 1 && <p className="tnum text-xs text-dim">{rupees(p.price)} each</p>}
                    </div>
                  </div>
                  {qty >= maxFor(p) && <p className="mt-1 text-xs font-semibold text-accent">That is all we have in stock</p>}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {count > 0 && (
        <div className="space-y-4 border-t border-tint/10 bg-carbon px-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-5 md:px-6">
          <Totals count={count} total={total} savings={savings} />
          <button type="button" data-autofocus onClick={onReview} className={`${ui.primary} w-full min-h-16 text-lg`}>
            Review and show at counter
          </button>
          {confirmClear ? (
            <div className="grid grid-cols-2 gap-2">
              <button type="button" onClick={() => setConfirmClear(false)} className={`${ui.secondary} min-h-12`}>
                Keep order
              </button>
              <button type="button" onClick={onClear} className={`${ui.secondary} min-h-12 border-danger text-danger`}>
                Yes, clear it
              </button>
            </div>
          ) : (
            <button type="button" onClick={() => setConfirmClear(true)} className="min-h-12 w-full text-base font-semibold text-dim transition-colors hover:text-danger">
              Clear order
            </button>
          )}
        </div>
      )}
    </Layer>
  );
}
