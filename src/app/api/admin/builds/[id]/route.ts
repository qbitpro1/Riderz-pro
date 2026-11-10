import { clientIp, guardMutation, ok, readJson, route } from "@/lib/server/http";
import { requireAdmin } from "@/lib/server/admin-auth";
import { buildSchema, saveBuild } from "@/lib/server/builds";

export const dynamic = "force-dynamic";

/** PUT build → { build: { id, slug } } saves every field. */
export const PUT = route(async (req: Request, { params }: { params: Promise<{ id: string }> }) => {
  guardMutation(req);
  const me = await requireAdmin("catalog");
  const input = await readJson(req, buildSchema);
  return ok({ build: await saveBuild((await params).id, input, me.email, clientIp(req)) });
});
