import Link from "next/link";
import { AlertTriangle, ArrowRight, Boxes, ClipboardList, IndianRupee, PackageCheck, Truck, Warehouse } from "lucide-react";
import { vendorPage } from "@/lib/server/session";
import { vendorOverview } from "@/lib/server/vendor-catalogue";
import { rupees } from "@/lib/format";
import { VENDOR_ORDER_LABELS, type VendorOrderStatus } from "@/lib/vendor/types";

export const dynamic = "force-dynamic";

const dateFmt = new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "short", year: "numeric", timeZone: "Asia/Kolkata" });

export default async function OverviewPage() {
  const vendor = await vendorPage(["approved", "suspended"], "/vendor/dashboard");
  const { kpis, recentOrders, attention } = await vendorOverview(vendor.id, vendor.commissionRate);
  const base = "/vendor/dashboard";

  const tiles = [
    { label: "New orders to accept", value: String(kpis.newOrders), icon: ClipboardList, href: `${base}/orders`, hot: kpis.newOrders > 0 },
    { label: "Orders in progress", value: String(kpis.ordersInProgress), icon: Truck, href: `${base}/orders` },
    { label: "Delivered sales, 30 days", value: rupees(kpis.deliveredSales30d), icon: IndianRupee, href: `${base}/payments` },
    { label: "Products live", value: String(kpis.productsLive), icon: PackageCheck, href: `${base}/products?status=live` },
    { label: "Under review", value: String(kpis.productsPending), icon: Boxes, href: `${base}/products?status=pending_review` },
    { label: "Changes requested", value: String(kpis.productsChangesRequested), icon: AlertTriangle, href: `${base}/products?status=changes_requested`, hot: kpis.productsChangesRequested > 0 },
    { label: "Low stock", value: String(kpis.lowStock), icon: Warehouse, href: `${base}/inventory`, hot: kpis.lowStock > 0 },
    { label: "Commission rate", value: kpis.commissionRate === null ? "Not set" : `${kpis.commissionRate}%`, icon: IndianRupee },
  ];

  const actions: { href: string; text: string }[] = [];
  if (kpis.productsChangesRequested > 0)
    actions.push({ href: `${base}/products?status=changes_requested`, text: `${kpis.productsChangesRequested} product${kpis.productsChangesRequested === 1 ? " needs" : "s need"} changes before review` });
  if (kpis.newOrders > 0)
    actions.push({ href: `${base}/orders`, text: `${kpis.newOrders} new order${kpis.newOrders === 1 ? "" : "s"} waiting to be accepted` });
  if (kpis.lowStock > 0)
    actions.push({ href: `${base}/inventory`, text: `${kpis.lowStock} live product${kpis.lowStock === 1 ? " is" : "s are"} low on stock${kpis.outOfStock ? ` (${kpis.outOfStock} out)` : ""}` });

  return (
    <div className="space-y-6">
      <div>
        <p className="eyebrow">Overview</p>
        <h1 className="display-3 mt-1">Welcome back, {vendor.storeName ?? "seller"}</h1>
      </div>

      <section aria-label="Key numbers" className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {tiles.map((t) => {
          const body = (
            <>
              <span className="flex items-center justify-between gap-2 text-ash">
                <span className="text-[11px] font-bold uppercase tracking-[0.1em]">{t.label}</span>
                <t.icon size={16} aria-hidden className={t.hot ? "text-accent" : "text-dim"} />
              </span>
              <span className={`mt-3 block font-display text-2xl font-extrabold tnum ${t.hot ? "text-accent" : "text-chalk"}`}>{t.value}</span>
            </>
          );
          return t.href ? (
            <Link key={t.label} href={t.href} className="card block p-4 transition-colors hover:border-accent/50">
              {body}
            </Link>
          ) : (
            <div key={t.label} className="card p-4">
              {body}
            </div>
          );
        })}
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="card p-4" aria-labelledby="actions-h">
          <h2 id="actions-h" className="font-display text-lg font-extrabold text-chalk">
            Action centre
          </h2>
          {actions.length === 0 ? (
            <p className="mt-3 text-sm text-ash">Nothing needs your attention right now.</p>
          ) : (
            <ul className="mt-3 divide-y divide-tint/10">
              {actions.map((a) => (
                <li key={a.href}>
                  <Link href={a.href} className="flex min-h-11 items-center justify-between gap-3 py-2 text-sm text-chalk hover:text-accent">
                    <span>{a.text}</span>
                    <ArrowRight size={16} aria-hidden className="shrink-0" />
                  </Link>
                </li>
              ))}
            </ul>
          )}
          {attention.length > 0 && (
            <ul className="mt-3 space-y-1 border-t border-tint/10 pt-3">
              {attention.map((a) => (
                <li key={a.id} className="flex items-center justify-between gap-3 text-sm">
                  <Link href={`${base}/products/${a.id}`} className="min-w-0 truncate text-ash hover:text-accent">
                    {a.title} <span className="text-dim">· {a.sku}</span>
                  </Link>
                  <span className="shrink-0 text-xs font-semibold text-gold">{a.reason}</span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="card p-4" aria-labelledby="recent-h">
          <div className="flex items-center justify-between gap-3">
            <h2 id="recent-h" className="font-display text-lg font-extrabold text-chalk">
              Recent orders
            </h2>
            <Link href={`${base}/orders`} className="text-xs font-bold uppercase tracking-[0.1em] text-accent hover:underline">
              All orders
            </Link>
          </div>
          {recentOrders.length === 0 ? (
            <p className="mt-3 text-sm text-ash">No orders yet. They appear here as soon as a shopper buys from your store.</p>
          ) : (
            <ul className="mt-3 divide-y divide-tint/10">
              {recentOrders.map((o) => (
                <li key={o.id}>
                  <Link href={`${base}/orders/${o.id}`} className="flex min-h-12 items-center justify-between gap-3 py-2 hover:text-accent">
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-semibold text-chalk">{o.number}</span>
                      <span className="block text-xs text-dim">{dateFmt.format(new Date(o.createdAt))}</span>
                    </span>
                    <span className="text-right">
                      <span className="block text-sm font-semibold text-chalk tnum">{rupees(o.subtotal)}</span>
                      <span className="block text-xs text-ash">{VENDOR_ORDER_LABELS[o.status as VendorOrderStatus] ?? o.status}</span>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
