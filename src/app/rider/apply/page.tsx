import { redirect } from "next/navigation";
import { RiderApplyForm } from "@/components/rider/RiderApplyForm";
import { riderPage } from "@/lib/server/riders";

export const dynamic = "force-dynamic";
export const metadata = { title: "Apply" };

export default async function RiderApplyPage() {
  const { mobile, rider } = await riderPage();
  if (rider && rider.status !== "applied" && rider.status !== "changes_requested") redirect("/rider");
  return (
    <div className="space-y-4">
      <p className="eyebrow">Ride with Riderzpro</p>
      <h1 className="display-3">{rider ? "Update your application" : "Apply to ride"}</h1>
      {rider?.reviewNote && rider.status === "changes_requested" && (
        <p className="rounded-sm border border-gold/40 bg-gold/10 p-3 text-sm text-chalk">
          <span className="font-semibold">Our team asked:</span> {rider.reviewNote}
        </p>
      )}
      <RiderApplyForm mobile={mobile} initial={rider} />
    </div>
  );
}
