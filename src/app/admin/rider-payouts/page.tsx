import type { Metadata } from "next";
import Link from "next/link";
import RiderPayouts from "@/components/admin/riders/RiderPayouts";
import { listRidersAdmin } from "@/lib/server/riders";
import { adminPage } from "@/lib/server/admin-auth";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Rider payouts", robots: { index: false, follow: false, nocache: true } };

export default async function RiderPayoutsPage() {
  await adminPage("payouts", "/admin/rider-payouts");
  const { items } = await listRidersAdmin("all");
  return (
    <section className="section pt-24 md:pt-32">
      <div className="shell">
        <p className="eyebrow mb-3">Internal · not indexed</p>
        <h1 className="display-2">RIDER PAYOUTS</h1>
        <p className="mt-2 max-w-2xl text-sm text-ash">
          Pay the rider by bank transfer or UPI, then record it here with the reference. That marks every delivered, unpaid job as paid.{" "}
          <Link href="/admin/dispatch" className="text-accent hover:underline">Dispatch</Link>
        </p>
        <RiderPayouts riders={items} />
      </div>
    </section>
  );
}
