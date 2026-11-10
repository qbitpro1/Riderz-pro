import { clientIp, guardMutation, ok, readJson, route } from "@/lib/server/http";
import { requireAdmin } from "@/lib/server/admin-auth";
import { buildSchema, listBuildsAdmin, saveBuild } from "@/lib/server/builds";

export const dynamic = "force-dynamic";

/** GET → { builds } every build. Catalogue role. */
export const GET = route(async () => {
  await requireAdmin("catalog");
  return ok({ builds: await listBuildsAdmin() });
});

/** POST build → 201 { build: { id, slug } }. */
export const POST = route(async (req: Request) => {
  guardMutation(req);
  const me = await requireAdmin("catalog");
  const input = await readJson(req, buildSchema);
  return ok({ build: await saveBuild(null, input, me.email, clientIp(req)) }, 201);
});
