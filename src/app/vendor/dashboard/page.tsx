import Link from "next/link";
import { AlertTriangle, ArrowRight, Boxes, ClipboardList, IndianRupee, MonitorSmartphone, PackageCheck, Truck, Warehouse } from "lucide-react";
import { offlineStoreHref, storeHref } from "@/lib/vendor/types";
import { vendorPage } from "@/lib/server/session";
import { vendorOverview } from "@/lib/server/vendor-catalogue";
import { screenProducts } from "@/lib/server/store-screen";
import { rupees } from "@/lib/format";
import { VENDOR_ORDER_LABELS, type VendorOrderStatus } from "@/lib/vendor/types";

export const dynamic = "force-dynamic";

const dateFmt = new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "short", year: "numeric", timeZone: "Asia/Kolkata" });

export default async function OverviewPage() {
  const vendor = await vendorPage(["approved", "suspended"], "/vendor/dashboard");
  const [{ kpis, recentOrders, attention }, onScreen] = await Promise.all([
    vendorOverview(vendor.id, vendor.commissionRate),
    screenProducts(vendor.id),
  ]);
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

      {/* Online marketplace: the public storefront, then the Offline Store screen for the seller's own shop. */}
      {vendor.status === "approved" && vendor.slug && (
        <section aria-labelledby="online-store" className="card p-5 md:p-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 id="online-store" className="font-display text-xl font-extrabold uppercase text-chalk">Online store</h2>
              <p className="mt-1 max-w-2xl text-sm leading-relaxed text-ash">
                Your approved products are on the Riderzpro website, sold across India with your store name on them. Orders arrive under Orders.
              </p>
            </div>
            <Link href={storeHref(vendor.slug)} className="btn btn-outline shrink-0">
              View my online store <ArrowRight size={16} aria-hidden />
            </Link>
          </div>
        </section>
      )}

      {/* The Offline Store screen: a separate tool for the seller's physical shop. */}
      <section aria-labelledby="offline-store" className="rounded-[4px] border-2 border-accent/60 bg-accent/10 p-5 md:p-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex gap-4">
            <span className="grid h-12 w-12 shrink-0 place-items-center rounded-[2px] bg-accent text-on-accent">
              <MonitorSmartphone size={24} aria-hidden />
            </span>
            <div>
              <h2 id="offline-store" className="font-display text-xl font-extrabold uppercase text-chalk">Offline Store</h2>
              <p className="mt-1 max-w-2xl text-sm leading-relaxed text-ash">
                For your own shop: show your available stock to customers who walk in. Open it on a tablet or TV: customers browse,
                ask the AI salesperson, and order and pay right there or at your counter. Closing the screen needs your password.
              </p>
              <p className="mt-2 text-sm font-semibold text-chalk">
                {onScreen.length === 0
                  ? "No products on the screen yet: approved products with stock appear here."
                  : `${onScreen.length} product${onScreen.length === 1 ? "" : "s"} on the screen`}
              </p>
            </div>
          </div>
          {vendor.status === "approved" && vendor.slug ? (
            <div className="flex shrink-0 flex-col gap-2">
              <Link href={offlineStoreHref(vendor.slug)} className="btn btn-primary">
                Open Offline Store <ArrowRight size={16} aria-hidden />
              </Link>
              <Link href="/vendor/dashboard/store-screen" className="btn btn-outline btn-sm">
                AI and payment settings
              </Link>
            </div>
          ) : (
            <p className="text-sm text-danger">Available again once your store is reinstated.</p>
          )}
        </div>
      </section>

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
