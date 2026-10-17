import { redirect } from "next/navigation";
import Link from "next/link";
import { RiderSignIn } from "@/components/rider/RiderSignIn";
import { riderSession } from "@/lib/server/riders";
import { RIDER_STATUS_LABELS, SERVICE_AREA_LABEL, vehicleLabel } from "@/lib/rider/types";

export const dynamic = "force-dynamic";

const PERKS = [
  ["Ride in your own area", `Deliveries across ${SERVICE_AREA_LABEL}: seller to customer, the same day.`],
  ["Paid per delivery", "See the pay before you accept. Earnings are paid to your bank account or UPI."],
  ["Choose when you ride", "Go online when you want jobs; go offline any time."],
];

/** Rider home: sign in, then the application status, or straight to the dashboard once approved. */
export default async function RiderHome() {
  const s = await riderSession();
  if (s?.rider?.status === "approved") redirect("/rider/dashboard");
  if (s && !s.rider) redirect("/rider/apply");

  if (!s) {
    return (
      <div>
        <p className="eyebrow">Ride with Riderzpro</p>
        <h1 className="display-3 mt-2">Deliver car accessories in {SERVICE_AREA_LABEL}.</h1>
        <div className="mt-6 grid gap-6 md:grid-cols-[1fr_22rem] md:items-start">
          <div className="md:order-2">
            <RiderSignIn />
          </div>
          <ul className="space-y-3 md:order-1">
            {PERKS.map(([t, b]) => (
              <li key={t} className="card p-4">
                <p className="text-sm font-semibold text-chalk">{t}</p>
                <p className="mt-1 text-sm text-ash">{b}</p>
              </li>
            ))}
          </ul>
        </div>
      </div>
    );
  }

  const r = s.rider!;
  return (
    <div className="space-y-4">
      <p className="eyebrow">Your application</p>
      <h1 className="display-3">{RIDER_STATUS_LABELS[r.status]}</h1>
      <div className="card p-5 text-sm">
        <p className="text-ash">
          {r.name} · {r.city} · {vehicleLabel(r.vehicleType)}
          {r.vehicleNumber ? ` · ${r.vehicleNumber}` : ""}
        </p>
        {r.status === "applied" && (
          <p className="mt-3 text-chalk">
            Thanks for applying. Our team will call you to check your driving licence, RC and insurance (for motor vehicles), usually within 2 working days.
          </p>
        )}
        {r.reviewNote && (
          <p className="mt-3 rounded-sm border border-gold/40 bg-gold/10 p-3 text-chalk">
            <span className="font-semibold">Note from our team:</span> {r.reviewNote}
          </p>
        )}
        {(r.status === "applied" || r.status === "changes_requested") && (
          <Link href="/rider/apply" className="btn btn-outline btn-sm mt-4">
            {r.status === "changes_requested" ? "Update and resubmit" : "Edit application"}
          </Link>
        )}
        {(r.status === "rejected" || r.status === "suspended") && (
          <p className="mt-3 text-ash">Questions? Call rider support on WhatsApp from the Riderzpro website.</p>
        )}
      </div>
    </div>
  );
}
