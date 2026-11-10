import { clientIp, guardMutation, ok, readJson, route } from "@/lib/server/http";
import { requireAdmin } from "@/lib/server/admin-auth";
import { leadUpdateSchema, updateLead } from "@/lib/server/leads";

export const dynamic = "force-dynamic";

/** POST { status: new | contacted | closed, note? }. Support role. */
export const POST = route(async (req: Request, { params }: { params: Promise<{ id: string }> }) => {
  guardMutation(req);
  const me = await requireAdmin("support");
  const input = await readJson(req, leadUpdateSchema);
  await updateLead((await params).id, input, me.email, clientIp(req));
  return ok();
});
