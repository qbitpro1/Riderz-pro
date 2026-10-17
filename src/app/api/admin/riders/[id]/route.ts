import { clientIp, guardMutation, ok, readJson, route } from "@/lib/server/http";
import { requireAdmin } from "@/lib/server/admin-auth";
import { riderDecision, riderDecisionSchema } from "@/lib/server/riders";

export const dynamic = "force-dynamic";

/** POST { action, note?, checked? } — approve, ask for changes, reject, suspend or reinstate a rider. */
export const POST = route(async (req: Request, { params }: { params: Promise<{ id: string }> }) => {
  guardMutation(req);
  const me = await requireAdmin("riders");
  const body = await readJson(req, riderDecisionSchema);
  await riderDecision((await params).id, body, me.email, clientIp(req));
  return ok();
});
