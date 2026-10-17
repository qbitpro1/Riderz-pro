import { guardMutation, ok, readJson, route } from "@/lib/server/http";
import { inviteMember, listTeam, requireAdmin } from "@/lib/server/admin-auth";
import { inviteSchema } from "@/lib/admin/roles";

export const dynamic = "force-dynamic";

export const GET = route(async () => {
  await requireAdmin("team");
  return ok(await listTeam());
});

/** Creates a one-time invite link (shown once to copy; also emailed when email is set up). */
export const POST = route(async (req: Request) => {
  guardMutation(req);
  const me = await requireAdmin("team");
  const body = await readJson(req, inviteSchema, 4 * 1024);
  const invite = await inviteMember(me, body);
  return ok({ invite }, 201);
});
