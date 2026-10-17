import { clientIp, guardMutation, ok, rateLimit, readJson, route } from "@/lib/server/http";
import { sendOtp } from "@/lib/server/otp";
import { riderCodeSendSchema } from "@/lib/rider/types";

export const dynamic = "force-dynamic";

/** POST { mobile } → sends a rider sign-in code. */
export const POST = route(async (req: Request) => {
  guardMutation(req);
  await rateLimit(`rider-code-ip:${clientIp(req)}`, 10, 10 * 60);
  const { mobile } = await readJson(req, riderCodeSendSchema);
  await rateLimit(`rider-code-to:${mobile}`, 5, 60 * 60);
  await sendOtp({ vendorId: null, channel: "mobile", target: mobile, purpose: "rider_login" });
  return ok({ sent: true });
});
