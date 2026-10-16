import { sql } from "@/lib/db/client";
import { guardMutation, ok, readJson, route } from "@/lib/server/http";
import { requireVendor } from "@/lib/server/session";
import { checkOtp } from "@/lib/server/otp";
import { audit } from "@/lib/server/vendors";
import { otpSchema } from "@/lib/vendor/validators";

export const dynamic = "force-dynamic";

export const POST = route(async (req: Request) => {
  guardMutation(req);
  const vendor = await requireVendor();
  const { channel, code } = await readJson(req, otpSchema);
  await checkOtp({ target: channel === "email" ? vendor.email : vendor.mobile, purpose: "verify", code });
  await sql(
    channel === "email"
      ? "UPDATE vendors SET email_verified_at = now(), updated_at = now() WHERE id = $1"
      : "UPDATE vendors SET mobile_verified_at = now(), updated_at = now() WHERE id = $1",
    [vendor.id],
  );
  await audit({ type: "vendor", id: vendor.id }, `vendor.verify_${channel}`, { vendorId: vendor.id });
  return ok({ verified: channel });
});
