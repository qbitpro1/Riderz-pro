import { adminActor, clientIp, guardMutation, ok, readJson, route } from "@/lib/server/http";
import { createJob, createJobSchema } from "@/lib/server/riders";

export const dynamic = "force-dynamic";

/** POST { vendorOrderId, riderId, earning, note? } → { job } — offer a shipment to a rider. */
export const POST = route(async (req: Request) => {
  guardMutation(req);
  const body = await readJson(req, createJobSchema);
  return ok({ job: await createJob(body, adminActor(req), clientIp(req)) }, 201);
});
