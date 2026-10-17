import { ApiError, guardMutation, ok, rateLimit, readJson, route } from "@/lib/server/http";
import { contactFree, requireCustomer } from "@/lib/server/customers";
import { sendOtp } from "@/lib/server/otp";
import { sendCodeSchema } from "@/lib/account/schemas";

export const dynamic = "force-dynamic";

/** POST { identifier } → sends a code to a new mobile or email for this account. */
export const POST = route(async (req: Request) => {
  guardMutation(req);
  const me = await requireCustomer();
  await rateLimit(`cust-contact:${me.id}`, 6, 60 * 60);
  const { identifier } = await readJson(req, sendCodeSchema);
  const current = identifier.channel === "mobile" ? me.mobile : me.email;
  if (current === identifier.target) throw new ApiError(400, "same", "That is already on your account.", { identifier: "That is already on your account." });
  if (!(await contactFree(me.id, identifier))) {
    const what = identifier.channel === "mobile" ? "mobile number" : "email";
    throw new ApiError(409, "taken", `That ${what} belongs to another Riderzpro account.`, { identifier: `That ${what} belongs to another account.` });
  }
  await sendOtp({ vendorId: null, channel: identifier.channel, target: identifier.target, purpose: "customer_contact" });
  return ok({ sent: true, channel: identifier.channel });
});
