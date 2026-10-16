import type { Metadata } from "next";
import NotificationList from "@/components/vendor/notifications/NotificationList";
import { vendorPage } from "@/lib/server/session";
import { listNotifications } from "@/lib/server/vendor-account";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Notifications", robots: { index: false } };

export default async function NotificationsPage() {
  const vendor = await vendorPage(["approved", "suspended"], "/vendor/dashboard/notifications");
  const { items } = await listNotifications(vendor.id);
  return (
    <>
      <h1 className="display-3">NOTIFICATIONS</h1>
      <p className="mt-2 max-w-2xl text-sm text-ash">Decisions on your store and products, orders, payouts and support replies.</p>
      <NotificationList initialItems={items} />
    </>
  );
}
