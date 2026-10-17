import { clientIp, guardMutation, ok, rateLimit, readJson, route } from "@/lib/server/http";
import { sendOtp } from "@/lib/server/otp";
import { sendCodeSchema } from "@/lib/account/schemas";

export const dynamic = "force-dynamic";

/**
 * POST { identifier } → { sent: true }. Sends a sign-in code to a mobile or an email. The answer is
 * the same whether or not an account exists (the first verified code creates one).
 */
export const POST = route(async (req: Request) => {
  guardMutation(req);
  await rateLimit(`cust-code-ip:${clientIp(req)}`, 10, 10 * 60);
  const { identifier } = await readJson(req, sendCodeSchema);
  await rateLimit(`cust-code-to:${identifier.target}`, 5, 60 * 60);
  await sendOtp({ vendorId: null, channel: identifier.channel, target: identifier.target, purpose: "customer_login" });
  return ok({ sent: true, channel: identifier.channel });
});
