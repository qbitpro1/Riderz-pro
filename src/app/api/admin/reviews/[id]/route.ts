import { clientIp, guardMutation, ok, readJson, route } from "@/lib/server/http";
import { requireAdmin } from "@/lib/server/admin-auth";
import { decideReview, reviewDecisionSchema } from "@/lib/server/reviews";

export const dynamic = "force-dynamic";

/** POST { action: approve | reject } — approved reviews show on the site and count in ratings. */
export const POST = route(async (req: Request, { params }: { params: Promise<{ id: string }> }) => {
  guardMutation(req);
  const me = await requireAdmin("support");
  const { action } = await readJson(req, reviewDecisionSchema);
  await decideReview((await params).id, action, me.email, clientIp(req));
  return ok();
});
