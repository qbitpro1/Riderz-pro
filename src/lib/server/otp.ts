import "server-only";

import { sql, sqlOne } from "@/lib/db/client";
import { ApiError } from "./http";
import { newId, newOtpCode, sameHash, sha256 } from "./security";

/**
 * ONE-TIME CODES (email / mobile verification, password reset)
 *
 * Six random digits, stored hashed, valid 10 minutes, 5 tries, one resend per
 * 30 seconds. Delivery goes through `deliver`:
 *
 *   development        the code is printed in the server console
 *   production         a provider must be configured; until then sending
 *                      returns "unavailable" and contact details are checked
 *                      by the admin team during KYC review instead
 *
 * To add a provider later, implement it in `deliver` (e.g. Resend for email,
 * MSG91 or Twilio for SMS) — nothing else changes.
 */

export type OtpChannel = "email" | "mobile";
export type OtpPurpose = "verify" | "login" | "reset";

const TTL_MINUTES = 10;
const MAX_ATTEMPTS = 5;
const RESEND_SECONDS = 30;

export function otpDeliveryAvailable(channel: OtpChannel): boolean {
  if (process.env.NODE_ENV !== "production") return true;
  return channel === "email" ? Boolean(process.env.OTP_EMAIL_PROVIDER) : Boolean(process.env.OTP_SMS_PROVIDER);
}

async function deliver(channel: OtpChannel, target: string, code: string, purpose: OtpPurpose): Promise<void> {
  if (process.env.NODE_ENV !== "production") {
    console.info(`[otp:dev] ${purpose} code for ${channel} ${target}: ${code}`);
    return;
  }
  // No provider is wired yet. `otpDeliveryAvailable` keeps callers from getting here.
  throw new ApiError(503, "otp_unavailable", "Verification codes are not switched on yet.");
}

/** Codes are scoped to a purpose and a target, so a verify code cannot reset a password. */
const codeHash = (target: string, purpose: OtpPurpose, code: string) => sha256(`${purpose}:${target}:${code}`);

export async function sendOtp(opts: { vendorId: string | null; channel: OtpChannel; target: string; purpose: OtpPurpose }) {
  if (!otpDeliveryAvailable(opts.channel)) {
    throw new ApiError(503, "otp_unavailable", "Verification codes are not switched on yet.");
  }
  const recent = await sqlOne<{ n: string }>(
    `SELECT count(*) AS n FROM vendor_otps
     WHERE target = $1 AND purpose = $2 AND created_at > now() - make_interval(secs => $3)`,
    [opts.target, opts.purpose, RESEND_SECONDS],
  );
  if (Number(recent?.n ?? 0) > 0) {
    throw new ApiError(429, "otp_wait", `Please wait ${RESEND_SECONDS} seconds before asking for another code.`);
  }
  const code = newOtpCode();
  // A new code replaces any earlier one for the same purpose.
  await sql("UPDATE vendor_otps SET consumed_at = now() WHERE target = $1 AND purpose = $2 AND consumed_at IS NULL", [
    opts.target,
    opts.purpose,
  ]);
  await sql(
    `INSERT INTO vendor_otps (id, vendor_id, channel, target, purpose, code_hash, expires_at)
     VALUES ($1, $2, $3, $4, $5, $6, now() + make_interval(mins => $7))`,
    [newId("otp"), opts.vendorId, opts.channel, opts.target, opts.purpose, codeHash(opts.target, opts.purpose, code), TTL_MINUTES],
  );
  await deliver(opts.channel, opts.target, code, opts.purpose);
}

/** Consumes the code if it matches. Wrong codes count against the attempt limit. */
export async function checkOtp(opts: { target: string; purpose: OtpPurpose; code: string }): Promise<void> {
  const row = await sqlOne<{ id: string; code_hash: string; attempts: number }>(
    `SELECT id, code_hash, attempts FROM vendor_otps
     WHERE target = $1 AND purpose = $2 AND consumed_at IS NULL AND expires_at > now()
     ORDER BY created_at DESC LIMIT 1`,
    [opts.target, opts.purpose],
  );
  if (!row) throw new ApiError(400, "otp_expired", "That code has expired. Ask for a new one.");
  if (row.attempts >= MAX_ATTEMPTS) throw new ApiError(429, "otp_locked", "Too many wrong codes. Ask for a new one.");
  if (!sameHash(row.code_hash, codeHash(opts.target, opts.purpose, opts.code))) {
    await sql("UPDATE vendor_otps SET attempts = attempts + 1 WHERE id = $1", [row.id]);
    throw new ApiError(400, "otp_wrong", "That code is not right.");
  }
  await sql("UPDATE vendor_otps SET consumed_at = now() WHERE id = $1", [row.id]);
}
