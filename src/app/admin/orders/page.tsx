import type { Metadata } from "next";
import Link from "next/link";
import { ORDER_STATUSES, ORDER_STATUS_LABELS, type OrderStatus } from "@/components/admin/orders/types";
import { fmtDateTime, STATUS_TONE } from "@/components/vendor/orders/format";
import { rupees } from "@/lib/format";
import { listAdminOrders } from "@/lib/server/orders";
import { VENDOR_ORDER_LABELS } from "@/lib/vendor/types";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Orders",
  description: "Internal order list.",
  robots: { index: false, follow: false, nocache: true },
};

const ORDER_TONE: Record<OrderStatus, string> = {
  placed: "text-gold border-gold/40",
  confirmed: "text-accent border-accent/40",
  completed: "text-accent border-accent/40",
  cancelled: "text-danger border-danger/40",
};

export default async function AdminOrdersPage({ searchParams }: { searchParams: Promise<{ status?: string; q?: string }> }) {
  const sp = await searchParams;
  const status = ORDER_STATUSES.find((s) => s === sp.status);
  const q = (sp.q ?? "").slice(0, 80);
  const orders = await listAdminOrders({ status, q });
  const href = (s?: string) => `/admin/orders?${new URLSearchParams({ ...(s ? { status: s } : {}), ...(q ? { q } : {}) }).toString()}`;

  return (
    <section className="section pt-24 md:pt-32">
      <div className="shell">
        <p className="eyebrow mb-3">Internal · not indexed</p>
        <h1 className="display-2">ORDERS</h1>
        <p className="mt-4 max-w-2xl text-sm leading-relaxed text-ash">
          Every order placed on the site, newest first, with each seller&apos;s part and its status.
        </p>

        <form action="/admin/orders" method="get" role="search" className="mt-6 flex flex-wrap items-end gap-3">
          <div className="min-w-0 flex-1 basis-64">
            <label className="label" htmlFor="q">Search</label>
            <input id="q" name="q" defaultValue={q} className="field" placeholder="Order number, name or mobile" maxLength={80} />
          </div>
          {status && <input type="hidden" name="status" value={status} />}
          <button type="submit" className="btn btn-primary btn-sm">Search</button>
        </form>

        <nav aria-label="Filter by status" className="mt-4 flex flex-wrap gap-2">
          <Link href={href()} className={`chip ${!status ? "chip-active" : ""}`}>All</Link>
          {ORDER_STATUSES.map((s) => (
            <Link key={s} href={href(s)} className={`chip ${status === s ? "chip-active" : ""}`}>{ORDER_STATUS_LABELS[s]}</Link>
          ))}
        </nav>

        {orders.length === 0 ? (
          <p className="card mt-8 p-8 text-center text-sm text-ash">No orders match.</p>
        ) : (
          <ul className="mt-8 space-y-3">
            {orders.map((o) => (
              <li key={o.id} className="card p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <Link href={`/admin/orders/${o.id}`} className="font-display text-lg font-bold hover:text-accent">{o.number}</Link>
                    <p className="text-xs text-dim">{fmtDateTime(o.createdAt)}</p>
                    <p className="mt-1 text-sm">{o.customerName} · <span className="tnum">+91 {o.customerPhone}</span></p>
                    <p className="text-xs text-ash">{o.city}, {o.state}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-display text-xl font-extrabold tnum">{rupees(o.total)}</p>
                    <span className={`chip mt-1 bg-transparent ${ORDER_TONE[o.status]}`}>{ORDER_STATUS_LABELS[o.status]}</span>
                  </div>
                </div>
                <ul className="mt-3 flex flex-wrap gap-2 border-t border-tint/8 pt-3 text-xs">
                  {o.houseItems.length > 0 && <li className="chip bg-transparent">Riderzpro · {o.houseItems.length} item{o.houseItems.length === 1 ? "" : "s"}</li>}
                  {o.parts.map((p) => (
                    <li key={p.id} className={`chip bg-transparent ${STATUS_TONE[p.status]}`}>
                      {p.storeName} · {VENDOR_ORDER_LABELS[p.status]}
                    </li>
                  ))}
                </ul>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
