import { clientIp, guardMutation, ok, rateLimit, readJson, route } from "@/lib/server/http";
import { signInWithCode } from "@/lib/server/customers";
import { verifyCodeSchema } from "@/lib/account/schemas";

export const dynamic = "force-dynamic";

/** POST { identifier, code } → { created } and a session cookie. */
export const POST = route(async (req: Request) => {
  guardMutation(req);
  await rateLimit(`cust-verify-ip:${clientIp(req)}`, 20, 10 * 60);
  const { identifier, code } = await readJson(req, verifyCodeSchema);
  const { created } = await signInWithCode(identifier, code, req.headers.get("user-agent"));
  return ok({ created });
});
