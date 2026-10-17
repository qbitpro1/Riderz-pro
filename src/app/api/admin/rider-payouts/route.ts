import { adminActor, clientIp, guardMutation, ok, readJson, route } from "@/lib/server/http";
import { createRiderPayout, riderPayoutSchema } from "@/lib/server/riders";

export const dynamic = "force-dynamic";

/** POST { riderId, reference } → { payout } — records payment for all the rider's unpaid deliveries. */
export const POST = route(async (req: Request) => {
  guardMutation(req);
  const body = await readJson(req, riderPayoutSchema);
  return ok({ payout: await createRiderPayout(body, adminActor(req), clientIp(req)) }, 201);
});
