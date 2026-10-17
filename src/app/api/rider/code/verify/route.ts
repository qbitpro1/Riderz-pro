import { clientIp, guardMutation, ok, rateLimit, readJson, route } from "@/lib/server/http";
import { signInRider } from "@/lib/server/riders";
import { riderCodeVerifySchema } from "@/lib/rider/types";

export const dynamic = "force-dynamic";

/** POST { mobile, code } → signed in to the rider app. */
export const POST = route(async (req: Request) => {
  guardMutation(req);
  await rateLimit(`rider-verify-ip:${clientIp(req)}`, 20, 10 * 60);
  const { mobile, code } = await readJson(req, riderCodeVerifySchema);
  await signInRider(mobile, code, req.headers.get("user-agent"));
  return ok({ signedIn: true });
});
