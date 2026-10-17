import { decideVendor, vendorDecisionSchema } from "@/lib/server/admin-vendors";
import { clientIp, guardMutation, ok, readJson, route } from "@/lib/server/http";
import { requireAdmin } from "@/lib/server/admin-auth";

export const dynamic = "force-dynamic";

/** start_review | approve | request_changes | reject | suspend | reinstate. 409 when the seller's status moved on. */
export const POST = route(async (req: Request, { params }: { params: Promise<{ id: string }> }) => {
  guardMutation(req);
  const me = await requireAdmin("sellers");
  const body = await readJson(req, vendorDecisionSchema);
  const result = await decideVendor((await params).id, body, me.email, clientIp(req));
  return ok(result);
});
