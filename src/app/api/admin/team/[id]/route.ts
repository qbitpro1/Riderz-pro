import { guardMutation, ok, readJson, route } from "@/lib/server/http";
import { changeMember, requireAdmin } from "@/lib/server/admin-auth";
import { memberActionSchema } from "@/lib/admin/roles";

export const dynamic = "force-dynamic";

/** [id] is a team member. Change role, disable / enable, password reset link, sign out everywhere. */
export const POST = route(async (req: Request, { params }: { params: Promise<{ id: string }> }) => {
  guardMutation(req);
  const me = await requireAdmin("team");
  const body = await readJson(req, memberActionSchema, 2 * 1024);
  return ok(await changeMember(me, (await params).id, body));
});
