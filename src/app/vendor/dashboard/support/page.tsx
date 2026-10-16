import type { Metadata } from "next";
import SupportPanel from "@/components/vendor/support/SupportPanel";
import { vendorPage } from "@/lib/server/session";
import { listTickets } from "@/lib/server/vendor-account";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Support", robots: { index: false } };

export default async function SupportPage() {
  const vendor = await vendorPage(["approved", "suspended"], "/vendor/dashboard/support");
  const tickets = await listTickets(vendor.id);
  return (
    <>
      <h1 className="display-3">SUPPORT</h1>
      <p className="mt-2 max-w-2xl text-sm text-ash">Quick answers first, or send us a ticket and we will reply here.</p>
      <SupportPanel initialTickets={tickets} />
    </>
  );
}
