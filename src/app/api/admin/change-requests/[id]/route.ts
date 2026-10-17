import { changeDecisionSchema, decideChangeRequest } from "@/lib/server/admin-vendors";
import { clientIp, guardMutation, ok, readJson, route } from "@/lib/server/http";
import { requireAdmin } from "@/lib/server/admin-auth";

export const dynamic = "force-dynamic";

/** { action: "approve" | "reject", note? } — approve writes the sealed bank details to vendor_secrets. */
export const POST = route(async (req: Request, { params }: { params: Promise<{ id: string }> }) => {
  guardMutation(req);
  const me = await requireAdmin("sellers");
  const body = await readJson(req, changeDecisionSchema);
  await decideChangeRequest((await params).id, body, me.email, clientIp(req));
  return ok();
});
