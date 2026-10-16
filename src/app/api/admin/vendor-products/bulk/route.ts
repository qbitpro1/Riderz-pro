import { bulkApprove, bulkApproveSchema } from "@/lib/server/admin-vendors";
import { adminActor, clientIp, guardMutation, ok, readJson, route } from "@/lib/server/http";

export const dynamic = "force-dynamic";

/** Approve up to 50 products; each is checked on its own (vendor approved, still pending). */
export const POST = route(async (req: Request) => {
  guardMutation(req);
  const { ids } = await readJson(req, bulkApproveSchema);
  return ok({ results: await bulkApprove(ids, adminActor(req), clientIp(req)) });
});
