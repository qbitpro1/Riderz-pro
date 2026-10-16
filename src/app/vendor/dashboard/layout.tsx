import type { Metadata } from "next";
import type { ReactNode } from "react";
import { sqlOne } from "@/lib/db/client";
import { vendorPage } from "@/lib/server/session";
import { DashboardShell } from "@/components/vendor/dashboard/DashboardShell";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Seller dashboard",
  robots: { index: false, follow: false },
};

export default async function DashboardLayout({ children }: { children: ReactNode }) {
  const vendor = await vendorPage(["approved", "suspended"], "/vendor/dashboard");

  const [unread, fresh] = await Promise.all([
    sqlOne<{ n: string }>("SELECT count(*) AS n FROM notifications WHERE vendor_id = $1 AND read_at IS NULL", [vendor.id]),
    sqlOne<{ n: string }>("SELECT count(*) AS n FROM vendor_orders WHERE vendor_id = $1 AND status = 'new'", [vendor.id]),
  ]);

  return (
    <DashboardShell
      storeName={vendor.storeName ?? "Your store"}
      slug={vendor.slug}
      tier={vendor.tier}
      status={vendor.status === "suspended" ? "suspended" : "approved"}
      unreadNotifications={Number(unread?.n ?? 0)}
      newOrders={Number(fresh?.n ?? 0)}
    >
      {children}
    </DashboardShell>
  );
}
