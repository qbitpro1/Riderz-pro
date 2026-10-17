import { adminActor, clientIp, guardMutation, ok, readJson, route } from "@/lib/server/http";
import { adminJobAction, jobAdminActionSchema } from "@/lib/server/riders";

export const dynamic = "force-dynamic";

/** POST { action: "cancel", reason } or { action: "unlock_code" } */
export const POST = route(async (req: Request, { params }: { params: Promise<{ id: string }> }) => {
  guardMutation(req);
  const body = await readJson(req, jobAdminActionSchema);
  await adminJobAction((await params).id, body, adminActor(req), clientIp(req));
  return ok();
});
