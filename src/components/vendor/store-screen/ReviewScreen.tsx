"use client";

import { useEffect, useState } from "react";
import { ArrowLeft, Printer, RotateCcw } from "lucide-react";
import { rupees } from "@/lib/format";
import { Layer } from "./Layer";
import { ui } from "./lib";
import type { OrderLine } from "./hooks";
import { Photo, StoreMark } from "./parts";
import type { ScreenStore } from "./types";

const when = new Intl.DateTimeFormat("en-IN", { weekday: "short", day: "numeric", month: "short", year: "numeric", hour: "numeric", minute: "2-digit" });

/**
 * THE SHOW-AT-THE-COUNTER SCREEN
 *
 * Big and plain so it reads from across the counter: the store, the order number, the time, every
 * item with its photo, quantity and price, the total (GST included) and what to do next. Printable.
 * Nothing here is a bill and nothing is saved.
 */
export function ReviewScreen({
  store,
  lines,
  count,
  total,
  savings,
  token,
  onBack,
  onNewOrder,
}: {
  store: ScreenStore;
  lines: OrderLine[];
  count: number;
  total: number;
  savings: number;
  token: string | null;
  onBack: () => void;
  onNewOrder: () => void;
}) {
  const [confirmNew, setConfirmNew] = useState(false);
  const [now] = useState(() => new Date());
  useEffect(() => {
    if (count === 0) onBack();
  }, [count, onBack]);

  return (
    <Layer label="Your order, show at the counter" onClose={onBack} kind="full">
      <div className="ss-scroll min-h-0 flex-1 overflow-y-auto">
        <div className="ss-print mx-auto grid max-w-[1700px] gap-8 px-5 py-6 md:px-10 md:py-10 lg:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)] lg:gap-14">
          {/* Items */}
          <section className="min-w-0" aria-label="Items in your order">
            <div className="flex items-center gap-4">
              <StoreMark store={store} className="h-14 w-14 md:h-16 md:w-16" />
              <div className="min-w-0">
                <p className="truncate font-display text-2xl font-extrabold tracking-tight text-chalk md:text-3xl">{store.name}</p>
                {store.city && <p className="text-base text-ash">{store.city}</p>}
              </div>
            </div>

            <ul className="mt-7 divide-y divide-tint/10 border-y border-tint/10">
              {lines.map(({ product: p, qty }) => (
                <li key={p.id} className="flex items-center gap-4 py-4 md:gap-6 md:py-5">
                  <Photo id={p.images[0]} alt="" sizes="128px" className="h-20 w-20 shrink-0 rounded-2xl md:h-28 md:w-28" pad="p-2" />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-dim md:text-base">{p.brand}</p>
                    <p className="line-clamp-2 text-lg font-semibold leading-snug text-chalk md:text-2xl">{p.title}</p>
                    <p className="tnum mt-1 text-base text-ash md:text-lg">
                      {rupees(p.price)} each
                    </p>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="tnum text-base font-semibold text-ash md:text-xl">× {qty}</p>
                    <p className="tnum font-display text-xl font-extrabold tracking-tight text-chalk md:text-3xl">{rupees(p.price * qty)}</p>
                  </div>
                </li>
              ))}
            </ul>
          </section>

          {/* Ticket */}
          <aside className="min-w-0 lg:sticky lg:top-6 lg:self-start" aria-label="Order summary">
            <div className="rounded-[2rem] border border-tint/10 bg-carbon p-6 md:p-8">
              <p className="text-base font-semibold text-dim">Order number</p>
              <p className="tnum font-display text-[clamp(4rem,10vw,7.5rem)] font-extrabold leading-none tracking-[-0.05em] text-accent">{token ?? "-"}</p>
              <p className="mt-2 text-base text-ash md:text-lg">{when.format(now)}</p>

              <dl className="mt-6 space-y-2 border-t border-tint/10 pt-5">
                <div className="flex items-baseline justify-between text-lg text-ash">
                  <dt>Items</dt>
                  <dd className="tnum font-semibold text-chalk">{count}</dd>
                </div>
                {savings > 0 && (
                  <div className="flex items-baseline justify-between text-lg font-bold text-accent">
                    <dt>You save on MRP</dt>
                    <dd className="tnum">{rupees(savings)}</dd>
                  </div>
                )}
                <div className="flex items-baseline justify-between pt-2">
                  <dt className="text-xl font-semibold text-chalk">Total</dt>
                  <dd className="tnum font-display text-5xl font-extrabold tracking-tight text-chalk md:text-6xl">{rupees(total)}</dd>
                </div>
                <p className="text-right text-sm text-dim">All prices include GST</p>
              </dl>

              <div className="mt-6 rounded-2xl bg-accent px-5 py-5 text-center text-on-accent">
                <p className="font-display text-2xl font-extrabold leading-tight tracking-tight md:text-3xl">Show this screen at the counter</p>
                <p className="mt-1.5 text-base opacity-90">Our team will confirm the items and take payment there.</p>
              </div>
            </div>

            <div className="ss-noprint mt-5 grid gap-3">
              <button type="button" data-autofocus onClick={onBack} className={ui.secondary}>
                <ArrowLeft size={20} aria-hidden /> Add more items
              </button>
              <button type="button" onClick={() => window.print()} className={`${ui.secondary} min-h-12`}>
                <Printer size={18} aria-hidden /> Print this order
              </button>
              {confirmNew ? (
                <div className="grid grid-cols-2 gap-3">
                  <button type="button" onClick={() => setConfirmNew(false)} className={ui.secondary}>
                    Keep this order
                  </button>
                  <button type="button" onClick={onNewOrder} className={ui.primary}>
                    Yes, start new
                  </button>
                </div>
              ) : (
                <button type="button" onClick={() => setConfirmNew(true)} className={ui.primary}>
                  <RotateCcw size={20} aria-hidden /> Start a new order
                </button>
              )}
              <p className="text-center text-sm text-dim">This is not a bill. Nothing is saved on this screen.</p>
            </div>
          </aside>
        </div>
      </div>
    </Layer>
  );
}
