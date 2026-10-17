import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { OrderStatusButtons, PartActions } from "@/components/admin/orders/AdminOrderActions";
import { ORDER_STATUS_LABELS } from "@/components/admin/orders/types";
import { PAYMENT_STATUS_LABELS } from "@/lib/payments/types";
import { fmtDateTime } from "@/components/vendor/orders/format";
import { StatusBadge } from "@/components/vendor/orders/StatusBadge";
import type { OrderItemView } from "@/components/vendor/orders/types";
import { rupees } from "@/lib/format";
import { adminOrderDetail } from "@/lib/server/orders";
import { adminPaymentSummary } from "@/lib/server/payments";
import { PaymentCard } from "@/components/admin/orders/PaymentCard";
import { adminPage } from "@/lib/server/admin-auth";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Order",
  robots: { index: false, follow: false, nocache: true },
};

function Items({ items }: { items: OrderItemView[] }) {
  return (
    <ul className="divide-y divide-tint/8">
      {items.map((i) => (
        <li key={i.id} className="flex items-start justify-between gap-4 py-2 text-sm">
          <div className="min-w-0">
            <p>{i.title}</p>
            {i.variant && <p className="text-xs text-ash">{i.variant}</p>}
            <p className="text-xs text-dim tnum">
              {rupees(i.unitPrice)} × {i.qty}
              {i.installPrice > 0 ? ` + installation ${rupees(i.installPrice)} each` : ""}
            </p>
          </div>
          <p className="shrink-0 font-bold tnum">{rupees(i.lineTotal)}</p>
        </li>
      ))}
    </ul>
  );
}

export default async function AdminOrderPage({ params }: { params: Promise<{ id: string }> }) {
  await adminPage("orders.view", "/admin/orders");
  const order = await adminOrderDetail((await params).id);
  if (!order) notFound();
  const payment = await adminPaymentSummary(order.id);
  const paidOnline = order.paymentMethod === "online" && (order.paymentStatus === "paid" || order.paymentStatus === "partially_refunded");

  return (
    <section className="section pt-24 md:pt-32">
      <div className="shell">
        <Link href="/admin/orders" className="text-xs text-ash underline underline-offset-4 hover:text-accent">All orders</Link>
        <p className="eyebrow mb-3 mt-4">Internal · not indexed</p>
        <h1 className="display-2">{order.number}</h1>
        <p className="mt-3 text-sm text-ash">
          {ORDER_STATUS_LABELS[order.status]} · placed {fmtDateTime(order.createdAt)} via {order.channel}
          {order.paymentMethod === "online" ? ` · ${PAYMENT_STATUS_LABELS[order.paymentStatus]}` : ""}
        </p>
        {(order.status === "confirmed" || order.status === "completed") && (
          <Link href={`/admin/orders/${order.id}/invoice`} className="mt-2 inline-block text-xs font-semibold text-accent underline underline-offset-4">
            Customer tax invoice
          </Link>
        )}

        <div className="mt-6 grid gap-6 lg:grid-cols-[1.6fr_1fr] lg:items-start">
          <div className="space-y-6">
            {order.houseItems.length > 0 && (
              <div className="card p-5">
                <h2 className="eyebrow mb-3">Riderzpro items</h2>
                <Items items={order.houseItems} />
              </div>
            )}
            {order.parts.map((p) => (
              <div key={p.id} className="card p-5">
                <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
                  <h2 className="eyebrow">{p.storeName}</h2>
                  <StatusBadge status={p.status} />
                </div>
                <Items items={p.items} />
                <p className="mt-3 text-xs text-ash tnum">
                  Seller subtotal {rupees(p.subtotal)} · commission {p.commissionRate}%
                  {p.trackingNumber ? ` · ${p.courier} ${p.trackingNumber}` : ""}
                  {p.paidOut ? " · paid out" : ""}
                </p>
                {p.cancelReason && <p className="mt-1 text-xs text-ash">Reason: {p.cancelReason}</p>}
                <PartActions partId={p.id} status={p.status} paidOnline={paidOnline} />
              </div>
            ))}
          </div>

          <div className="space-y-6">
            <div className="card p-5">
              <h2 className="eyebrow mb-3">Customer</h2>
              <p className="text-sm font-semibold">{order.customerName}</p>
              <p className="mt-1 text-sm text-ash">
                {order.address}
                <br />
                {order.city}, {order.state} {order.pincode}
              </p>
              <p className="mt-2 text-sm tnum">+91 {order.customerPhone}</p>
              {order.customerEmail && <p className="text-sm">{order.customerEmail}</p>}
              {order.notes && <p className="mt-3 border-t border-tint/8 pt-3 text-xs text-ash">Note: {order.notes}</p>}
            </div>

            <div className="card p-5">
              <h2 className="eyebrow mb-3">Totals</h2>
              <dl className="space-y-1.5 text-sm">
                <div className="flex justify-between"><dt className="text-ash">Items</dt><dd className="tnum">{rupees(order.subtotal)}</dd></div>
                <div className="flex justify-between"><dt className="text-ash">Shipping</dt><dd className="tnum">{order.shipping === 0 ? "Free" : rupees(order.shipping)}</dd></div>
                {order.couponCode && (
                  <div className="flex justify-between"><dt className="text-ash">Coupon {order.couponCode}</dt><dd className="tnum">{order.discount ? `−${rupees(order.discount)}` : "Free delivery"}</dd></div>
                )}
                <div className="flex justify-between border-t border-tint/8 pt-2"><dt className="font-bold">Total</dt><dd className="font-display text-lg font-extrabold tnum">{rupees(order.total)}</dd></div>
              </dl>
            </div>

            {payment && <PaymentCard orderId={order.id} summary={payment} />}

            <div className="card p-5">
              <h2 className="eyebrow mb-3">Order status</h2>
              <OrderStatusButtons orderId={order.id} status={order.status} paymentMethod={order.paymentMethod} paymentStatus={order.paymentStatus} />
              {order.parts.length > 0 && (
                <p className="mt-3 text-xs text-dim">
                  Orders with seller parts close on their own once every part is delivered, cancelled or returned.
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
