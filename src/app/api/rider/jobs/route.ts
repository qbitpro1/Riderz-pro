import { ok, route } from "@/lib/server/http";
import { requireApprovedRider, riderEarnings, riderJobs } from "@/lib/server/riders";

export const dynamic = "force-dynamic";

/** GET → { live, done, earnings } for the signed-in rider (polled by the rider app). */
export const GET = route(async () => {
  const rider = await requireApprovedRider();
  const [jobs, earnings] = await Promise.all([riderJobs(rider.id), riderEarnings(rider.id)]);
  return ok({ ...jobs, earnings });
});
