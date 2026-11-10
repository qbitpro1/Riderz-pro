import { clientIp, guardMutation, ok, readJson, route } from "@/lib/server/http";
import { requireAdmin } from "@/lib/server/admin-auth";
import { addAdminHoldReply, adminHoldSchema, holdMessages } from "@/lib/server/vendor-hold";

export const dynamic = "force-dynamic";

/** GET → { messages } the freeze conversation with this seller. Sellers role. */
export const GET = route(async (_req: Request, { params }: { params: Promise<{ id: string }> }) => {
  await requireAdmin("sellers");
  return ok({ messages: await holdMessages((await params).id) });
});

/** POST { body } → 201. Answer a frozen seller (their dashboard shows it at once). */
export const POST = route(async (req: Request, { params }: { params: Promise<{ id: string }> }) => {
  guardMutation(req);
  const me = await requireAdmin("sellers");
  const { body } = await readJson(req, adminHoldSchema);
  const id = (await params).id;
  await addAdminHoldReply(id, me.email, body, clientIp(req));
  return ok({ messages: await holdMessages(id) }, 201);
});
