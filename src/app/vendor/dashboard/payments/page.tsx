import type { Metadata } from "next";
import { PaymentsView } from "@/components/vendor/payments/PaymentsView";
import { payoutOverview } from "@/lib/server/payouts";
import { vendorPage } from "@/lib/server/session";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Payments", robots: { index: false, follow: false } };

export default async function VendorPaymentsPage() {
  const vendor = await vendorPage(["approved", "suspended"], "/vendor/dashboard/payments");
  const data = await payoutOverview(vendor.id);
  return (
    <div className="space-y-6">
      <div>
        <h1 className="display-3">PAYMENTS</h1>
        <p className="mt-2 max-w-2xl text-sm text-ash">
          On online orders you earn the order value less Riderzpro&apos;s commission and the 18% GST on that
          commission. Sales on your shop screen carry no commission (0%), and shop counter sales are already in your
          hands, so they are not listed here. Money becomes payable {data.delayDays} days after delivery and is sent to
          your bank account by Riderzpro.
        </p>
      </div>
      <PaymentsView data={data} />
    </div>
  );
}
