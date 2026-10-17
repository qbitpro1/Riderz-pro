import { redirect } from "next/navigation";
import { RiderApp } from "@/components/rider/RiderApp";
import { riderEarnings, riderJobs, riderPage } from "@/lib/server/riders";

export const dynamic = "force-dynamic";
export const metadata = { title: "Deliveries" };

export default async function RiderDashboardPage() {
  const { rider } = await riderPage();
  if (!rider || rider.status !== "approved") redirect("/rider");
  const [jobs, earnings] = await Promise.all([riderJobs(rider.id), riderEarnings(rider.id)]);
  return <RiderApp rider={rider} initialJobs={jobs} initialEarnings={earnings} />;
}
