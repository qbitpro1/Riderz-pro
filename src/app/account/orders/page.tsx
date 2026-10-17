import type { Metadata } from "next";
import Link from "next/link";
import { AccountShell } from "@/components/account/AccountShell";
import { OrderList } from "@/components/account/OrderList";
import { customerPage, listCustomerOrders } from "@/lib/server/customers";

export const metadata: Metadata = { title: "Your orders", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default async function OrdersPage() {
  const me = await customerPage("/account/orders");
  const orders = await listCustomerOrders(me.id);
  return (
    <AccountShell me={me} title="Your orders">
      {orders.length ? (
        <OrderList orders={orders} />
      ) : (
        <p className="card p-6 text-sm text-ash">
          No orders yet. Orders placed with {me.mobile ? "your mobile number" : "this account"} show up here.{" "}
          <Link href="/shop" className="font-semibold text-accent">Start shopping</Link>
        </p>
      )}
      {!me.mobile && (
        <p className="mt-4 text-xs text-dim">
          Placed an order as a guest? <Link href="/account/settings" className="underline underline-offset-2">Add your mobile number</Link> and
          orders placed with it join your account.
        </p>
      )}
    </AccountShell>
  );
}
