import { changeDecisionSchema, decideChangeRequest } from "@/lib/server/admin-vendors";
import { adminActor, clientIp, guardMutation, ok, readJson, route } from "@/lib/server/http";

export const dynamic = "force-dynamic";

/** { action: "approve" | "reject", note? } — approve writes the sealed bank details to vendor_secrets. */
export const POST = route(async (req: Request, { params }: { params: Promise<{ id: string }> }) => {
  guardMutation(req);
  const body = await readJson(req, changeDecisionSchema);
  await decideChangeRequest((await params).id, body, adminActor(req), clientIp(req));
  return ok();
});
