import { sql } from "@/lib/db/client";
import { ApiError, clientIp, guardMutation, ok, rateLimit, readJson, route } from "@/lib/server/http";
import { hashPassword, newId } from "@/lib/server/security";
import { startSession } from "@/lib/server/session";
import { audit } from "@/lib/server/vendors";
import { signUpSchema } from "@/lib/vendor/validators";

export const dynamic = "force-dynamic";

/** Create a seller account (status draft) and sign it in. Contact details are verified afterwards. */
export const POST = route(async (req: Request) => {
  guardMutation(req);
  const ip = clientIp(req);
  await rateLimit(`signup:${ip}`, 10, 60 * 60);
  const body = await readJson(req, signUpSchema);

  const clash = await sql<{ id: string }>("SELECT id FROM vendors WHERE lower(email) = $1 OR mobile = $2 LIMIT 1", [
    body.email,
    body.mobile,
  ]);
  if (clash.length) {
    throw new ApiError(409, "exists", "A seller account with this email or mobile already exists. Sign in instead.");
  }

  const id = newId("ven");
  try {
    await sql(
      `INSERT INTO vendors (id, email, mobile, password_hash, full_name, business_type)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [id, body.email, body.mobile, await hashPassword(body.password), body.fullName, body.businessType],
    );
  } catch (err) {
    // Two sign-ups racing for the same email/mobile: the unique index decides.
    if ((err as { code?: string }).code === "23505") {
      throw new ApiError(409, "exists", "A seller account with this email or mobile already exists. Sign in instead.");
    }
    throw err;
  }
  await audit({ type: "vendor", id }, "vendor.signup", { vendorId: id, ip });
  await startSession(id, req.headers.get("user-agent"));
  return ok({ next: "/vendor/onboarding" }, 201);
});
