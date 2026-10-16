import type { Metadata } from "next";
import ChangeRequests from "@/components/admin/vendors/ChangeRequests";
import { listChangeRequests } from "@/lib/server/admin-vendors";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Seller change requests",
  robots: { index: false, follow: false, nocache: true },
};

export default async function ChangeRequestsPage() {
  const items = await listChangeRequests();
  const pending = items.filter((i) => i.status === "pending").length;
  return (
    <section className="section pt-24 md:pt-32">
      <div className="shell">
        <p className="eyebrow mb-3">Internal · not indexed</p>
        <h1 className="display-2">BANK CHANGE REQUESTS</h1>
        <p className="mt-4 max-w-2xl text-sm leading-relaxed text-ash">
          {pending} waiting. Sellers cannot change their payout account themselves: they ask, you verify, then approve. The account number stays sealed; it is never shown here.
        </p>
        <ChangeRequests items={items} />
      </div>
    </section>
  );
}
