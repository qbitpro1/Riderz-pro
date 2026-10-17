import { bulkApprove, bulkApproveSchema } from "@/lib/server/admin-vendors";
import { clientIp, guardMutation, ok, readJson, route } from "@/lib/server/http";
import { requireAdmin } from "@/lib/server/admin-auth";

export const dynamic = "force-dynamic";

/** Approve up to 50 products; each is checked on its own (vendor approved, still pending). */
export const POST = route(async (req: Request) => {
  guardMutation(req);
  const me = await requireAdmin("sellers");
  const { ids } = await readJson(req, bulkApproveSchema);
  return ok({ results: await bulkApprove(ids, me.email, clientIp(req)) });
});
