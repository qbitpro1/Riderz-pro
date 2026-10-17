import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AccountShell } from "@/components/account/AccountShell";
import { LiveTracking } from "@/components/tracking/LiveTracking";
import { customerOrderDetail, customerPage } from "@/lib/server/customers";
import { customerOrderPayment } from "@/lib/server/payments";
import { rupees } from "@/lib/format";
import { whatsapp } from "@/lib/data/site";
import { ORDER_STATUS_TEXT, PART_STATUS_LABELS, PART_STEPS, fmtDay, type AccountOrderPart } from "@/lib/account/types";

export const metadata: Metadata = { title: "Order details", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

type Params = { params: Promise<{ number: string }> };

export default async function OrderPage({ params }: Params) {
  const number = (await params).number.toUpperCase();
  const me = await customerPage(`/account/orders/${encodeURIComponent(number)}`);
  const order = /^RZP-[A-Z0-9]{6}$/.test(number) ? await customerOrderDetail(me.id, number) : null;
  if (!order) notFound();
  const payment = await customerOrderPayment(me.id, order.number);
  // Live map while a Riderzpro rider has the delivery (it polls, and stops once delivered).
  const riding = order.parts.some((p) => p.rider?.status === "accepted" || p.rider?.status === "picked_up");

  return (
    <AccountShell me={me} title={`Order ${order.number}`}>
      <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm">
        <span className="text-ash">Placed {fmtDay(order.createdAt)}</span>
        <span className={`rounded-sm px-2 py-0.5 text-xs font-bold ${order.status === "cancelled" ? "bg-danger/10 text-danger" : "bg-tint/5 text-chalk"}`}>
          {ORDER_STATUS_TEXT[order.status]}
        </span>
        <Link href="/account/orders" className="ml-auto text-sm font-semibold text-accent">
          All orders
        </Link>
      </div>

      <div className="mt-6 grid gap-8 lg:grid-cols-[1fr_20rem]">
        <div className="min-w-0 space-y-4">
          {riding && <LiveTracking number={order.number} sellers={Object.fromEntries(order.parts.map((p) => [p.key, p.seller]))} />}
          {order.parts.map((p) => (
            <Part key={p.key} part={p} orderStatus={order.status} />
          ))}
        </div>

        <aside className="space-y-4">
          <div className="card p-4 text-sm">
            <p className="text-xs font-bold uppercase tracking-[0.12em] text-dim">Payment summary</p>
            <dl className="mt-3 space-y-1.5">
              <Row label="Items" value={rupees(order.subtotal)} />
              <Row label="Shipping" value={order.shipping ? rupees(order.shipping) : "Free"} />
              <div className="border-t border-tint/10 pt-1.5">
                <Row label="Total" value={rupees(order.total)} strong />
              </div>
            </dl>
            {payment && <p className="mt-2 text-xs text-ash">{payment.label}</p>}
            <p className="mt-3 text-xs text-dim">Prices include GST.</p>
            {(order.status === "confirmed" || order.status === "completed") && (
              <Link href={`/account/orders/${order.number}/invoice`} className="mt-3 inline-block text-xs font-semibold text-accent underline underline-offset-4">
                Tax invoice
              </Link>
            )}
          </div>
          <div className="card p-4 text-sm">
            <p className="text-xs font-bold uppercase tracking-[0.12em] text-dim">Delivering to</p>
            <p className="mt-3 font-semibold text-chalk">{order.name}</p>
            <p className="mt-1 text-ash">
              {order.address}
              <br />
              {order.city}, {order.state} {order.pincode}
            </p>
            <p className="mt-1 text-ash tnum">+91 {order.phone}</p>
            {order.notes && <p className="mt-2 text-xs text-dim">Note: {order.notes}</p>}
          </div>
          <div className="flex flex-col gap-2">
            <a
              href={whatsapp(`Hi Riderzpro, I have a question about my order ${order.number}.`)}
              target="_blank"
              rel="noreferrer noopener"
              className="btn btn-whatsapp btn-block"
            >
              Ask about this order on WhatsApp
            </a>
            <Link href={`/account/help?order=${order.number}`} className="btn btn-outline btn-block">
              Send us a message
            </Link>
          </div>
        </aside>
      </div>
    </AccountShell>
  );
}

function Row({ label, value, strong = false }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className="flex justify-between gap-4">
      <dt className={strong ? "font-semibold text-chalk" : "text-ash"}>{label}</dt>
      <dd className={`tnum ${strong ? "font-bold text-chalk" : "text-chalk"}`}>{value}</dd>
    </div>
  );
}

function Part({ part, orderStatus }: { part: AccountOrderPart; orderStatus: string }) {
  const stopped = part.status === "cancelled" || part.status === "return_requested" || part.status === "returned";
  const reached = part.status ? PART_STEPS.indexOf(part.status) : -1;
  return (
    <section className="card p-4 sm:p-5" aria-label={`Sold by ${part.seller}`}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm text-ash">
          Sold by <span className="font-semibold text-chalk">{part.seller}</span>
        </p>
        <p className={`text-sm font-bold ${stopped ? "text-danger" : "text-chalk"}`}>
          {part.status ? PART_STATUS_LABELS[part.status] : ORDER_STATUS_TEXT[orderStatus as keyof typeof ORDER_STATUS_TEXT]}
        </p>
      </div>

      {part.status && !stopped && (
        <ol className="mt-4 grid grid-cols-5 gap-1" aria-label="Progress">
          {PART_STEPS.map((s, i) => (
            <li key={s} className="min-w-0">
              <span className={`block h-1.5 rounded-full ${i <= reached ? "bg-accent" : "bg-tint/10"}`} />
              <span className={`mt-1.5 block truncate text-[11px] ${i <= reached ? "font-semibold text-chalk" : "text-dim"}`}>
                {PART_STATUS_LABELS[s]}
              </span>
            </li>
          ))}
        </ol>
      )}

      {part.rider && part.rider.status !== "delivered" && (
        <div className="mt-4 rounded-sm border border-accent/30 bg-accent/5 p-3 text-sm">
          <p className="font-semibold text-chalk">
            {part.rider.status === "picked_up"
              ? `${part.rider.firstName} is on the way with your order`
              : part.rider.status === "accepted"
                ? `${part.rider.firstName} will collect your order from the seller`
                : "A Riderzpro rider is being booked"}
          </p>
          <p className="mt-0.5 text-xs text-ash">Riderzpro rider · {part.rider.vehicle}</p>
          {part.rider.code && (
            <p className="mt-2 text-ash">
              Give this code to the rider when you receive the parcel:{" "}
              <span className="font-display text-xl font-extrabold tracking-[0.3em] text-chalk tnum">{part.rider.code}</span>
            </p>
          )}
        </div>
      )}

      {(part.courier || part.trackingNumber) && (
        <p className="mt-4 rounded-sm bg-tint/5 px-3 py-2 text-sm text-ash">
          {part.courier && <span className="font-semibold text-chalk">{part.courier}</span>}
          {part.trackingNumber && <span className="tnum"> · Tracking number {part.trackingNumber}</span>}
          {part.shippedAt && <span> · shipped {fmtDay(part.shippedAt)}</span>}
        </p>
      )}
      {part.deliveredAt && <p className="mt-2 text-sm text-ash">Delivered {fmtDay(part.deliveredAt)}</p>}

      <ul className="mt-4 divide-y divide-tint/10">
        {part.items.map((i) => (
          <li key={i.id} className="flex items-start justify-between gap-4 py-3 text-sm">
            <div className="min-w-0">
              {i.href ? (
                <Link href={i.href} className="font-semibold text-chalk hover:text-accent">
                  {i.title}
                </Link>
              ) : (
                <span className="font-semibold text-chalk">{i.title}</span>
              )}
              {i.variant && <p className="text-xs text-dim">{i.variant}</p>}
              <p className="mt-0.5 text-xs text-ash tnum">
                {i.qty} × {rupees(i.unitPrice)}
                {i.installPrice > 0 && ` + installation ${rupees(i.installPrice)}`}
              </p>
            </div>
            <span className="shrink-0 font-semibold text-chalk tnum">{rupees(i.lineTotal)}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
