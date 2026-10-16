import { clientIp, guardMutation, ok, readJson, route } from "@/lib/server/http";
import { requireVendor } from "@/lib/server/session";
import { changePassword, passwordChangeSchema } from "@/lib/server/vendor-account";

export const dynamic = "force-dynamic";

/** Any signed-in vendor. Signs out every other device and keeps this browser signed in. */
export const POST = route(async (req: Request) => {
  guardMutation(req);
  const vendor = await requireVendor();
  const { current, next } = await readJson(req, passwordChangeSchema);
  await changePassword(vendor, current, next, clientIp(req), req.headers.get("user-agent"));
  return ok();
});
