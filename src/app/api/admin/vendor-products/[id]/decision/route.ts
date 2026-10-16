import { decideProduct, productDecisionSchema } from "@/lib/server/admin-vendors";
import { adminActor, clientIp, guardMutation, ok, readJson, route } from "@/lib/server/http";

export const dynamic = "force-dynamic";

/** approve | request_changes | reject for a pending_review product, or a live product with a pending revision. */
export const POST = route(async (req: Request, { params }: { params: Promise<{ id: string }> }) => {
  guardMutation(req);
  const body = await readJson(req, productDecisionSchema);
  return ok(await decideProduct((await params).id, body, adminActor(req), clientIp(req)));
});
