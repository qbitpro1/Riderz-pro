import { adminActor, clientIp, guardMutation, ok, readJson, route } from "@/lib/server/http";
import { riderDecision, riderDecisionSchema } from "@/lib/server/riders";

export const dynamic = "force-dynamic";

/** POST { action, note?, checked? } — approve, ask for changes, reject, suspend or reinstate a rider. */
export const POST = route(async (req: Request, { params }: { params: Promise<{ id: string }> }) => {
  guardMutation(req);
  const body = await readJson(req, riderDecisionSchema);
  await riderDecision((await params).id, body, adminActor(req), clientIp(req));
  return ok();
});
