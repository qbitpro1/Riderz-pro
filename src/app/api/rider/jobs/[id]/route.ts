import { after } from "next/server";
import { ApiError, guardMutation, ok, rateLimit, readJson, route } from "@/lib/server/http";
import { requireApprovedRider, riderAct, riderActionSchema } from "@/lib/server/riders";
import { ensureDeliveryPointForJob } from "@/lib/server/tracking";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

/** POST { action: accept | decline | pickup | deliver (+ code) } → { status } */
export const POST = route(async (req: Request, { params }: Ctx) => {
  guardMutation(req);
  const rider = await requireApprovedRider();
  const { id } = await params;
  if (!/^job_[A-Za-z0-9_-]{10,40}$/.test(id)) throw new ApiError(404, "not_found", "Job not found.");
  await rateLimit(`rider-act:${rider.id}`, 60, 10 * 60);
  const input = await readJson(req, riderActionSchema);
  const status = await riderAct(rider, id, input);
  // Place the delivery address on the map once, before the parcel is on its way (live tracking).
  if (status === "accepted") after(() => ensureDeliveryPointForJob(id));
  return ok({ status });
});
