import { clientIp, guardMutation, ok, readJson, route } from "@/lib/server/http";
import { requireAdmin } from "@/lib/server/admin-auth";
import { adminJobAction, jobAdminActionSchema } from "@/lib/server/riders";

export const dynamic = "force-dynamic";

/** POST { action: "cancel", reason } or { action: "unlock_code" } */
export const POST = route(async (req: Request, { params }: { params: Promise<{ id: string }> }) => {
  guardMutation(req);
  const me = await requireAdmin("dispatch");
  const body = await readJson(req, jobAdminActionSchema);
  await adminJobAction((await params).id, body, me.email, clientIp(req));
  return ok();
});
