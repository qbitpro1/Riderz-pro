import type { Metadata } from "next";
import { OrdersBoard } from "@/components/vendor/orders/OrdersBoard";
import { listVendorOrders } from "@/lib/server/orders";
import { vendorPage } from "@/lib/server/session";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Orders", robots: { index: false, follow: false } };

export default async function VendorOrdersPage() {
  const vendor = await vendorPage(["approved", "suspended"], "/vendor/dashboard/orders");
  const orders = await listVendorOrders(vendor.id);
  return (
    <div className="space-y-6">
      <div>
        <h1 className="display-3">ORDERS</h1>
        <p className="mt-2 max-w-2xl text-sm text-ash">
          Accept, pack and ship each order. Add the courier and tracking number when it leaves your shop; the order is
          settled to you after delivery.
        </p>
      </div>
      {vendor.status === "suspended" && (
        <p className="card border-gold/30 p-4 text-sm text-gold">Your store is suspended, so orders are read-only for now.</p>
      )}
      <OrdersBoard orders={orders} canAct={vendor.status === "approved"} />
    </div>
  );
}
