import type { Metadata } from "next";
import Link from "next/link";
import DispatchBoard from "@/components/admin/riders/DispatchBoard";
import { dispatchCandidates, listJobsAdmin, listRidersAdmin } from "@/lib/server/riders";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Rider dispatch", robots: { index: false, follow: false, nocache: true } };

export default async function DispatchPage() {
  const [candidates, { items: riders }, live, recent] = await Promise.all([
    dispatchCandidates(),
    listRidersAdmin("approved"),
    listJobsAdmin("live"),
    listJobsAdmin("recent"),
  ]);
  return (
    <section className="section pt-24 md:pt-32">
      <div className="shell">
        <p className="eyebrow mb-3">Internal · not indexed</p>
        <h1 className="display-2">RIDER DISPATCH</h1>
        <p className="mt-2 max-w-2xl text-sm text-ash">
          Offer a seller&apos;s shipment in Delhi NCR to an approved rider. The rider collects it once the seller marks it packed, and finishes with the customer&apos;s 4-digit code.{" "}
          <Link href="/admin/riders" className="text-accent hover:underline">Riders</Link> · <Link href="/admin/rider-payouts" className="text-accent hover:underline">Payouts</Link>
        </p>
        <DispatchBoard candidates={candidates} riders={riders} live={live} recent={recent} />
      </div>
    </section>
  );
}
