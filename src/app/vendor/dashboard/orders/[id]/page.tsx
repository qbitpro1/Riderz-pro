import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, FileText } from "lucide-react";
import { OrderActions } from "@/components/vendor/orders/OrderActions";
import { StatusBadge } from "@/components/vendor/orders/StatusBadge";
import { fmtDateTime } from "@/components/vendor/orders/format";
import { rupees } from "@/lib/format";
import { vendorOrderDetail } from "@/lib/server/orders";
import { vendorPage } from "@/lib/server/session";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Order", robots: { index: false, follow: false } };

export default async function VendorOrderPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const vendor = await vendorPage(["approved", "suspended"], `/vendor/dashboard/orders/${id}`);
  const order = await vendorOrderDetail(vendor.id, id);
  if (!order) notFound();

  const timeline = [
    { label: "Placed", at: order.createdAt },
    { label: "Accepted", at: order.acceptedAt },
    { label: "Packed", at: order.packedAt },
    { label: "Shipped", at: order.shippedAt },
    { label: "Delivered", at: order.deliveredAt },
    { label: "Cancelled", at: order.cancelledAt },
    { label: "Returned", at: order.returnedAt },
  ].filter((t) => t.at);

  return (
    <div className="space-y-6">
      <Link href="/vendor/dashboard/orders" className="inline-flex items-center gap-1.5 text-xs text-ash hover:text-accent">
        <ArrowLeft size={14} aria-hidden /> All orders
      </Link>

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="display-3">{order.number}</h1>
          <p className="mt-2 text-sm text-ash">Placed {fmtDateTime(order.createdAt)}</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <StatusBadge status={order.status} />
          <Link href={`/vendor/dashboard/orders/${order.id}/invoice`} className="btn btn-outline btn-sm">
            <FileText size={14} aria-hidden /> Print packing slip &amp; invoice
          </Link>
        </div>
      </div>

      {vendor.status === "approved" && (
        <section className="card p-5" aria-labelledby="next-step">
          <h2 id="next-step" className="eyebrow mb-3">Next step</h2>
          {order.status === "shipped" && (
            <p className="mb-3 text-sm text-ash">
              With {order.courier} · tracking {order.trackingNumber}. Mark it delivered once the customer has it.
            </p>
          )}
          {["delivered", "cancelled", "return_requested", "returned"].includes(order.status) ? (
            <p className="text-sm text-ash">
              {order.status === "delivered"
                ? "Delivered. This order is settled to you after the return window."
                : order.cancelReason
                  ? `Reason: ${order.cancelReason}`
                  : "Nothing more to do on this order."}
            </p>
          ) : (
            <OrderActions id={order.id} status={order.status} />
          )}
        </section>
      )}

      <div className="grid gap-6 lg:grid-cols-[1.6fr_1fr] lg:items-start">
        <section className="card overflow-hidden" aria-labelledby="items-h">
          <h2 id="items-h" className="eyebrow px-5 pt-5">Items to pack</h2>
          <ul className="mt-3 divide-y divide-tint/8">
            {order.items.map((i) => (
              <li key={i.id} className="flex items-start justify-between gap-4 px-5 py-4">
                <div className="min-w-0">
                  <p className="text-sm font-semibold">{i.title}</p>
                  {i.variant && <p className="mt-0.5 text-xs text-ash">{i.variant}</p>}
                  <p className="mt-0.5 text-xs text-dim tnum">
                    {rupees(i.unitPrice)} × {i.qty}
                  </p>
                </div>
                <p className="shrink-0 font-display font-bold tnum">{rupees(i.lineTotal)}</p>
              </li>
            ))}
          </ul>
          <div className="flex items-baseline justify-between border-t border-tint/10 px-5 py-4">
            <span className="font-display text-sm font-bold uppercase tracking-[0.14em]">Order value</span>
            <span className="font-display text-xl font-extrabold tnum">{rupees(order.subtotal)}</span>
          </div>
        </section>

        <div className="space-y-6">
          <section className="card p-5" aria-labelledby="ship-h">
            <h2 id="ship-h" className="eyebrow mb-3">Ship to</h2>
            <p className="text-sm font-semibold">{order.customerName}</p>
            <p className="mt-1 text-sm text-ash">
              {order.address}
              <br />
              {order.city}, {order.state} {order.pincode}
            </p>
            <p className="mt-2 text-sm tnum">
              <a href={`tel:+91${order.customerPhone}`} className="underline underline-offset-4 hover:text-accent">
                +91 {order.customerPhone}
              </a>
            </p>
            {order.notes && <p className="mt-3 border-t border-tint/8 pt-3 text-xs text-ash">Customer note: {order.notes}</p>}
          </section>

          <section className="card p-5" aria-labelledby="time-h">
            <h2 id="time-h" className="eyebrow mb-3">Timeline</h2>
            <ol className="space-y-2 text-sm">
              {timeline.map((t) => (
                <li key={t.label} className="flex justify-between gap-4">
                  <span className="text-ash">{t.label}</span>
                  <span className="text-xs text-dim tnum">{fmtDateTime(t.at)}</span>
                </li>
              ))}
            </ol>
            {order.trackingNumber && (
              <p className="mt-3 border-t border-tint/8 pt-3 text-xs text-ash">
                {order.courier} · {order.trackingNumber}
              </p>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
