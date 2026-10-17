import "server-only";

import { sql, sqlOne } from "@/lib/db/client";
import { ApiError } from "./http";
import { newId, newOtpCode, sameHash, sha256 } from "./security";

/**
 * ONE-TIME CODES (email / mobile verification, password reset, customer sign-in)
 *
 * Six random digits, stored hashed, valid 10 minutes, 5 tries, one resend per
 * 30 seconds. Delivery goes through `deliver`:
 *
 *   development   the code is printed in the server console
 *   production    the provider named in OTP_EMAIL_PROVIDER / OTP_SMS_PROVIDER, with its keys:
 *                   email  resend   RESEND_API_KEY, OTP_EMAIL_FROM ("Riderzpro <codes@your-domain>")
 *                   sms    msg91    MSG91_AUTH_KEY, MSG91_OTP_TEMPLATE_ID (a DLT-approved template
 *                                   with an ##OTP## variable)
 *                          twilio   TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_FROM
 *                 Without a configured provider, sending answers "unavailable" (sellers' contact
 *                 details are then checked by the admin team during KYC review).
 */

export type OtpChannel = "email" | "mobile";
export type OtpPurpose = "verify" | "login" | "reset" | "customer_login" | "customer_contact";

const TTL_MINUTES = 10;
const MAX_ATTEMPTS = 5;
const RESEND_SECONDS = 30;

const env = (k: string) => process.env[k]?.trim() || "";

function emailProvider(): "resend" | null {
  return env("OTP_EMAIL_PROVIDER") === "resend" && env("RESEND_API_KEY") && env("OTP_EMAIL_FROM") ? "resend" : null;
}

function smsProvider(): "msg91" | "twilio" | null {
  const p = env("OTP_SMS_PROVIDER");
  if (p === "msg91" && env("MSG91_AUTH_KEY") && env("MSG91_OTP_TEMPLATE_ID")) return "msg91";
  if (p === "twilio" && env("TWILIO_ACCOUNT_SID") && env("TWILIO_AUTH_TOKEN") && env("TWILIO_FROM")) return "twilio";
  return null;
}

export function otpDeliveryAvailable(channel: OtpChannel): boolean {
  if (process.env.NODE_ENV !== "production") return true;
  return channel === "email" ? emailProvider() !== null : smsProvider() !== null;
}

const WHAT: Record<OtpPurpose, string> = {
  verify: "verification",
  login: "sign-in",
  reset: "password reset",
  customer_login: "sign-in",
  customer_contact: "verification",
};

async function deliver(channel: OtpChannel, target: string, code: string, purpose: OtpPurpose): Promise<void> {
  if (process.env.NODE_ENV !== "production") {
    console.info(`[otp:dev] ${purpose} code for ${channel} ${target}: ${code}`);
    return;
  }
  const text = `${code} is your Riderzpro ${WHAT[purpose]} code. It expires in ${TTL_MINUTES} minutes. Do not share it with anyone.`;
  const signal = AbortSignal.timeout(10_000);
  let res: Response;

  if (channel === "email" && emailProvider() === "resend") {
    res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${env("RESEND_API_KEY")}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from: env("OTP_EMAIL_FROM"), to: [target], subject: `Your Riderzpro code: ${code}`, text }),
      signal,
    });
  } else if (channel === "mobile" && smsProvider() === "msg91") {
    res = await fetch("https://control.msg91.com/api/v5/otp?" + new URLSearchParams({
      template_id: env("MSG91_OTP_TEMPLATE_ID"),
      mobile: `91${target}`,
      otp: code,
      otp_expiry: String(TTL_MINUTES),
    }), { method: "POST", headers: { authkey: env("MSG91_AUTH_KEY"), "Content-Type": "application/json" }, signal });
  } else if (channel === "mobile" && smsProvider() === "twilio") {
    const sid = env("TWILIO_ACCOUNT_SID");
    res = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${encodeURIComponent(sid)}/Messages.json`, {
      method: "POST",
      headers: {
        Authorization: "Basic " + Buffer.from(`${sid}:${env("TWILIO_AUTH_TOKEN")}`).toString("base64"),
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({ To: `+91${target}`, From: env("TWILIO_FROM"), Body: text }),
      signal,
    });
  } else {
    // `otpDeliveryAvailable` keeps callers from getting here.
    throw new ApiError(503, "otp_unavailable", "Verification codes are not switched on yet.");
  }

  if (!res.ok) {
    // Never log the code or the provider's full answer (it can echo the message).
    console.error(`[otp] ${channel} provider answered ${res.status}`);
    throw new ApiError(502, "otp_failed", "We couldn't send the code just now. Please try again in a minute.");
  }
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
