import { after } from "next/server";
import { guardMutation, ok, rateLimit, readJson, route } from "@/lib/server/http";
import { requireApprovedRider } from "@/lib/server/riders";
import { ensureDeliveryPoint, recordPing } from "@/lib/server/tracking";
import { pingSchema } from "@/lib/tracking/geo";

export const dynamic = "force-dynamic";

/**
 * POST { jobIds, lat, lng, accuracy, heading?, speed?, ageMs? } → { jobs: [{ id, stored, reason? }] }
 * The rider's phone, about every 10 s, while they have an accepted or picked-up job. 409
 * consent_needed without location consent; 409 no_live_job when none of the jobs is theirs and live
 * (the phone stops sending).
 */
export const POST = route(async (req: Request) => {
  guardMutation(req);
  const rider = await requireApprovedRider();
  // About one every 10 s is expected; this allows retries and two tabs without letting a phone flood.
  await rateLimit(`rider-ping:${rider.id}`, 40, 2 * 60);
  const input = await readJson(req, pingSchema, 4 * 1024);
  const result = await recordPing(rider, input);
  // First ping for an order with no map point yet: geocode its address after answering.
  for (const orderId of result.needsDeliveryPoint) after(() => ensureDeliveryPoint(orderId));
  return ok({ jobs: result.jobs });
});
