import { actOnTicket, ticketActionSchema } from "@/lib/server/admin-vendors";
import { adminActor, clientIp, guardMutation, ok, readJson, route } from "@/lib/server/http";

export const dynamic = "force-dynamic";

/** { action: "reply", reply } or { action: "close" } */
export const POST = route(async (req: Request, { params }: { params: Promise<{ id: string }> }) => {
  guardMutation(req);
  const body = await readJson(req, ticketActionSchema);
  await actOnTicket((await params).id, body, adminActor(req), clientIp(req));
  return ok();
});
