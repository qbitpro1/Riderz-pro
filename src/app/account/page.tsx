import type { Metadata } from "next";
import Link from "next/link";
import { AccountShell } from "@/components/account/AccountShell";
import { OrderList } from "@/components/account/OrderList";
import { customerPage, listAddresses, listCustomerOrders } from "@/lib/server/customers";

export const metadata: Metadata = { title: "Your account", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default async function AccountPage() {
  const me = await customerPage("/account");
  const [orders, addresses] = await Promise.all([listCustomerOrders(me.id), listAddresses(me.id)]);
  const home = addresses.find((a) => a.isDefault);

  const cards = [
    { href: "/account/orders", title: "Orders", body: orders.length ? `${orders.length} order${orders.length === 1 ? "" : "s"}` : "No orders yet" },
    { href: "/account/addresses", title: "Addresses", body: home ? `${home.label}: ${home.city}` : "Add one for faster checkout" },
    { href: "/wishlist", title: "Wishlist", body: "Saved to your account" },
    { href: "/shop", title: "Your car", body: me.car ? me.car.label : "Pick your car to see parts that fit" },
  ];

  return (
    <AccountShell me={me} title="Your account">
      <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((c) => (
          <li key={c.title}>
            <Link href={c.href} className="card block h-full p-4 transition-colors hover:border-accent">
              <p className="text-xs font-bold uppercase tracking-[0.12em] text-dim">{c.title}</p>
              <p className="mt-2 text-sm font-semibold text-chalk">{c.body}</p>
            </Link>
          </li>
        ))}
      </ul>

      <div className="mt-10 flex items-end justify-between gap-4">
        <h2 className="font-display text-lg font-extrabold uppercase tracking-tight text-chalk">Recent orders</h2>
        {orders.length > 3 && (
          <Link href="/account/orders" className="text-sm font-semibold text-accent">
            All orders
          </Link>
        )}
      </div>
      <div className="mt-4">
        {orders.length ? (
          <OrderList orders={orders.slice(0, 3)} />
        ) : (
          <p className="card p-6 text-sm text-ash">
            Orders you place while signed in, and earlier orders placed with your mobile number, show up here.{" "}
            <Link href="/shop" className="font-semibold text-accent">Start shopping</Link>
          </p>
        )}
      </div>
    </AccountShell>
  );
}
