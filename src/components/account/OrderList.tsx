import Link from "next/link";
import { rupees } from "@/lib/format";
import { ORDER_STATUS_TEXT, fmtDay, type AccountOrderSummary } from "@/lib/account/types";

export function OrderList({ orders }: { orders: AccountOrderSummary[] }) {
  return (
    <ul className="divide-y divide-tint/10 border-y border-tint/10">
      {orders.map((o) => (
        <li key={o.number}>
          <Link href={`/account/orders/${o.number}`} className="flex flex-wrap items-center justify-between gap-x-6 gap-y-1 py-4 transition-colors hover:bg-tint/5 sm:px-2">
            <div className="min-w-0">
              <p className="font-display text-sm font-extrabold tracking-wide text-chalk tnum">{o.number}</p>
              <p className="mt-0.5 truncate text-sm text-ash">
                {o.firstItem}
                {o.itemCount > 1 ? ` and ${o.itemCount - 1} more` : ""}
              </p>
            </div>
            <div className="flex items-center gap-4 text-sm">
              <span className="text-dim">{fmtDay(o.createdAt)}</span>
              <span className={`rounded-sm px-2 py-0.5 text-xs font-bold ${o.status === "cancelled" ? "bg-danger/10 text-danger" : "bg-tint/5 text-chalk"}`}>
                {ORDER_STATUS_TEXT[o.status]}
              </span>
              <span className="font-semibold text-chalk tnum">{rupees(o.total)}</span>
            </div>
          </Link>
        </li>
      ))}
    </ul>
  );
}
