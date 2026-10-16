import { sqlOne } from "@/lib/db/client";
import { ApiError, clientIp, guardMutation, ok, rateLimit, readJson, route } from "@/lib/server/http";
import { decoyHash, verifyPassword } from "@/lib/server/security";
import { startSession } from "@/lib/server/session";
import { audit, type VendorRow } from "@/lib/server/vendors";
import { vendorHome } from "@/lib/vendor/types";
import { emailSchema, mobileSchema, signInSchema } from "@/lib/vendor/validators";

export const dynamic = "force-dynamic";

/** Sign in with email or mobile + password. One generic error for every failure. */
export const POST = route(async (req: Request) => {
  guardMutation(req);
  const ip = clientIp(req);
  await rateLimit(`signin-ip:${ip}`, 30, 15 * 60);
  const { identifier, password } = await readJson(req, signInSchema);

  const asEmail = emailSchema.safeParse(identifier);
  const asMobile = mobileSchema.safeParse(identifier);
  const key = asEmail.success ? asEmail.data : asMobile.success ? asMobile.data : identifier.toLowerCase();
  await rateLimit(`signin-id:${key}`, 8, 15 * 60);

  const row = asEmail.success
    ? await sqlOne<VendorRow>("SELECT * FROM vendors WHERE lower(email) = $1", [asEmail.data])
    : asMobile.success
      ? await sqlOne<VendorRow>("SELECT * FROM vendors WHERE mobile = $1", [asMobile.data])
      : null;

  // Always run one password check so response time does not reveal whether the account exists.
  const valid = await verifyPassword(password, row?.password_hash ?? (await decoyHash()));
  if (!row || !valid) {
    throw new ApiError(401, "bad_credentials", "That email/mobile and password do not match.");
  }
  if (row.status === "rejected") {
    throw new ApiError(403, "rejected", "This seller application was not approved. Contact seller support for details.");
  }
  await audit({ type: "vendor", id: row.id }, "vendor.signin", { vendorId: row.id, ip });
  await startSession(row.id, req.headers.get("user-agent"));
  return ok({ next: vendorHome(row.status) });
});
