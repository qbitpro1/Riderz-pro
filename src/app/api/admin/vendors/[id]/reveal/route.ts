import { revealSchema, revealSecret } from "@/lib/server/admin-vendors";
import { clientIp, guardMutation, ok, readJson, route } from "@/lib/server/http";
import { requireAdmin } from "@/lib/server/admin-auth";

export const dynamic = "force-dynamic";

/** Unseals the bank account number or PAN once, for the reason given. Audited as kyc.reveal_<field>. */
export const POST = route(async (req: Request, { params }: { params: Promise<{ id: string }> }) => {
  guardMutation(req);
  const me = await requireAdmin("sellers.reveal");
  const body = await readJson(req, revealSchema);
  const result = await revealSecret((await params).id, body, me.email, clientIp(req));
  return ok({ revealed: result });
});
