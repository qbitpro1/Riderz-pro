import { ApiError, guardMutation, ok, rateLimit, readJson, route } from "@/lib/server/http";
import { requireApprovedRider, riderAct, riderActionSchema } from "@/lib/server/riders";

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
  return ok({ status: await riderAct(rider, id, input) });
});
