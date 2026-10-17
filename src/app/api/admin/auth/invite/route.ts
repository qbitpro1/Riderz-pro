import { clientIp, guardMutation, ok, readJson, route } from "@/lib/server/http";
import { acceptInvite } from "@/lib/server/admin-auth";
import { acceptInviteSchema } from "@/lib/admin/roles";

export const dynamic = "force-dynamic";

/** Uses a one-time invite or reset link: sets the name and password, then signs in. */
export const POST = route(async (req: Request) => {
  guardMutation(req);
  const body = await readJson(req, acceptInviteSchema, 4 * 1024);
  const me = await acceptInvite({ token: body.token, name: body.name, password: body.password }, clientIp(req));
  return ok({ admin: { name: me.name, role: me.role } });
});
