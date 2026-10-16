"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Inbox } from "lucide-react";
import { rupees } from "@/lib/format";
import { ORDER_TABS, type OrderTabId, type VendorOrderListItem } from "./types";
import { fmtDate } from "./format";
import { OrderActions } from "./OrderActions";
import { StatusBadge } from "./StatusBadge";

function summary(o: VendorOrderListItem) {
  const rest = o.itemCount - 1;
  return rest > 0 ? `${o.firstTitle} + ${rest} more` : o.firstTitle;
}

export function OrdersBoard({ orders, canAct }: { orders: VendorOrderListItem[]; canAct: boolean }) {
  const counts = useMemo(() => {
    const c = {} as Record<OrderTabId, number>;
    for (const t of ORDER_TABS) c[t.id] = orders.filter((o) => (t.statuses as readonly string[]).includes(o.status)).length;
    return c;
  }, [orders]);

  const [tab, setTab] = useState<OrderTabId>(() => ORDER_TABS.find((t) => counts[t.id] > 0)?.id ?? "new");
  const active = ORDER_TABS.find((t) => t.id === tab)!;
  const list = orders.filter((o) => (active.statuses as readonly string[]).includes(o.status));

  return (
    <div>
      <div role="tablist" aria-label="Order stage" className="-mx-1 flex gap-1 overflow-x-auto px-1 pb-1">
        {ORDER_TABS.map((t) => (
          <button
            key={t.id}
            role="tab"
            type="button"
            id={`orders-tab-${t.id}`}
            aria-selected={tab === t.id}
            aria-controls="orders-panel"
            onClick={() => setTab(t.id)}
            className={`chip shrink-0 cursor-pointer px-3 py-2 ${tab === t.id ? "chip-active" : ""}`}
          >
            {t.label}
            <span className="tnum opacity-80">{counts[t.id]}</span>
          </button>
        ))}
      </div>

      <div id="orders-panel" role="tabpanel" aria-labelledby={`orders-tab-${tab}`} className="mt-5">
        {list.length === 0 ? (
          <div className="card p-10 text-center">
            <Inbox size={28} className="mx-auto text-dim" aria-hidden />
            <p className="mt-3 font-display text-lg uppercase">No {active.label.toLowerCase()} orders</p>
            <p className="mx-auto mt-1 max-w-sm text-sm text-ash">
              {tab === "new" ? "New orders from shoppers appear here the moment they are placed." : "Orders move here as you work through them."}
            </p>
          </div>
        ) : (
          <>
            {/* desktop ------------------------------------------------ */}
            <div className="card hidden overflow-x-auto md:block">
              <table className="w-full text-left text-sm">
                <caption className="sr-only">{active.label} orders</caption>
                <thead>
                  <tr className="border-b border-tint/10 text-[11px] uppercase tracking-[0.12em] text-dim">
                    <th scope="col" className="px-4 py-3 font-bold">Order</th>
                    <th scope="col" className="px-4 py-3 font-bold">Customer</th>
                    <th scope="col" className="px-4 py-3 font-bold">Items</th>
                    <th scope="col" className="px-4 py-3 text-right font-bold">Amount</th>
                    <th scope="col" className="px-4 py-3 font-bold">Status</th>
                    <th scope="col" className="px-4 py-3 font-bold">
                      <span className="sr-only">Actions</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-tint/8">
                  {list.map((o) => (
                    <tr key={o.id} className="align-top">
                      <td className="px-4 py-3">
                        <Link href={`/vendor/dashboard/orders/${o.id}`} className="font-display font-bold hover:text-accent">
                          {o.number}
                        </Link>
                        <p className="text-xs text-dim">{fmtDate(o.createdAt)}</p>
                      </td>
                      <td className="px-4 py-3">
                        <p>{o.customerName}</p>
                        <p className="text-xs text-dim">{o.city}, {o.state}</p>
                      </td>
                      <td className="max-w-[16rem] px-4 py-3 text-ash">{summary(o)}</td>
                      <td className="px-4 py-3 text-right font-display font-bold tnum">{rupees(o.subtotal)}</td>
                      <td className="px-4 py-3">
                        <StatusBadge status={o.status} />
                        {o.trackingNumber && <p className="mt-1 text-xs text-dim">{o.courier} · {o.trackingNumber}</p>}
                      </td>
                      <td className="px-4 py-3">{canAct && <OrderActions id={o.id} status={o.status} compact />}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* mobile ------------------------------------------------- */}
            <ul className="space-y-3 md:hidden">
              {list.map((o) => (
                <li key={o.id} className="card p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <Link href={`/vendor/dashboard/orders/${o.id}`} className="font-display font-bold hover:text-accent">
                        {o.number}
                      </Link>
                      <p className="text-xs text-dim">{fmtDate(o.createdAt)}</p>
                    </div>
                    <StatusBadge status={o.status} />
                  </div>
                  <p className="mt-3 text-sm">{summary(o)}</p>
                  <p className="mt-1 text-xs text-ash">{o.customerName} · {o.city}, {o.state}</p>
                  {o.trackingNumber && <p className="mt-1 text-xs text-dim">{o.courier} · {o.trackingNumber}</p>}
                  <div className="mt-3 flex flex-wrap items-center justify-between gap-3 border-t border-tint/8 pt-3">
                    <span className="font-display text-lg font-extrabold tnum">{rupees(o.subtotal)}</span>
                    {canAct && <OrderActions id={o.id} status={o.status} compact />}
                  </div>
                </li>
              ))}
            </ul>
          </>
        )}
      </div>
    </div>
  );
}
