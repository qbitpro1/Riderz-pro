import type { Metadata } from "next";
import { RecordPayoutForm } from "@/components/admin/payouts/RecordPayoutForm";
import { rupees } from "@/lib/format";
import { dueVendors } from "@/lib/server/payouts";
import { SETTLEMENT_DELAY_DAYS } from "@/lib/vendor/types";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Seller payouts",
  description: "Internal seller payout queue.",
  robots: { index: false, follow: false, nocache: true },
};

export default async function AdminPayoutsPage() {
  const vendors = await dueVendors();
  const total = vendors.reduce((n, v) => n + v.net, 0);

  return (
    <section className="section pt-24 md:pt-32">
      <div className="shell">
        <p className="eyebrow mb-3">Internal · not indexed</p>
        <h1 className="display-2">SELLER PAYOUTS</h1>
        <p className="mt-4 max-w-2xl text-sm leading-relaxed text-ash">
          Delivered orders become payable {SETTLEMENT_DELAY_DAYS} days after delivery. Make the bank transfer yourself, then
          record it here with the UTR so the seller sees it. Only the last four digits of the account are shown.
        </p>

        <p className="card mt-6 inline-block px-4 py-3 text-sm">
          <span className="text-ash">Total due now </span>
          <span className="font-display text-xl font-extrabold tnum">{rupees(total)}</span>
          <span className="text-ash"> · {vendors.length} seller{vendors.length === 1 ? "" : "s"}</span>
        </p>

        {vendors.length === 0 ? (
          <p className="card mt-8 p-8 text-center text-sm text-ash">Nothing is due for payout.</p>
        ) : (
          <div className="mt-8 space-y-6">
            {vendors.map((v) => (
              <RecordPayoutForm key={v.vendorId} vendor={v} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
