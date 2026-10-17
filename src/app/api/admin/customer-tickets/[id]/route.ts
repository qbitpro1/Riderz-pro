import { actOnCustomerTicket, customerTicketActionSchema } from "@/lib/server/admin-customers";
import { clientIp, guardMutation, ok, readJson, route } from "@/lib/server/http";
import { requireAdmin } from "@/lib/server/admin-auth";

export const dynamic = "force-dynamic";

/** { action: "reply", reply } or { action: "close" } */
export const POST = route(async (req: Request, { params }: { params: Promise<{ id: string }> }) => {
  guardMutation(req);
  const me = await requireAdmin("support");
  const body = await readJson(req, customerTicketActionSchema);
  await actOnCustomerTicket((await params).id, body, me.email, clientIp(req));
  return ok();
});
