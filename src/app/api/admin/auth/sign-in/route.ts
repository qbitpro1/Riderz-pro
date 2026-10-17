import { clientIp, guardMutation, ok, readJson, route } from "@/lib/server/http";
import { signInAdmin } from "@/lib/server/admin-auth";
import { adminSignInSchema } from "@/lib/admin/roles";

export const dynamic = "force-dynamic";

/** Email + password (or the owner's hosting-settings login). Sets the admin session cookie. */
export const POST = route(async (req: Request) => {
  guardMutation(req);
  const body = await readJson(req, adminSignInSchema, 4 * 1024);
  const me = await signInAdmin(body.email, body.password, clientIp(req));
  return ok({ admin: { name: me.name, role: me.role } });
});
