import { decideProduct, productDecisionSchema } from "@/lib/server/admin-vendors";
import { clientIp, guardMutation, ok, readJson, route } from "@/lib/server/http";
import { requireAdmin } from "@/lib/server/admin-auth";

export const dynamic = "force-dynamic";

/** approve | request_changes | reject for a pending_review product, or a live product with a pending revision. */
export const POST = route(async (req: Request, { params }: { params: Promise<{ id: string }> }) => {
  guardMutation(req);
  const me = await requireAdmin("sellers");
  const body = await readJson(req, productDecisionSchema);
  return ok(await decideProduct((await params).id, body, me.email, clientIp(req)));
});
