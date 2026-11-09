import "server-only";

import type { ProviderAnswer, SmsProvider } from "./types";
import { tenDigits } from "./msg91";

const TIMEOUT_MS = 10_000;

const env = (k: string) => process.env[k]?.trim() || "";

export async function sendTwilioSms(m: { mobile: string; text: string }): Promise<ProviderAnswer> {
  const sid = env("TWILIO_ACCOUNT_SID");
  const token = env("TWILIO_AUTH_TOKEN");
  const from = env("TWILIO_FROM");
  if (!sid || !token || !from) return { ok: false, status: 500, id: null };

  const mobile = tenDigits(m.mobile);
  if (mobile.length !== 10) return { ok: false, status: 400, id: null };

  const res = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${encodeURIComponent(sid)}/Messages.json`, {
    method: "POST",
    headers: {
      Authorization: "Basic " + Buffer.from(`${sid}:${token}`).toString("base64"),
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({ To: `+91${mobile}`, From: from, Body: m.text }),
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });

  let id: string | null = null;
  if (res.ok) {
    try {
      const data = (await res.json()) as { sid?: unknown };
      id = typeof data.sid === "string" ? data.sid.slice(0, 120) : null;
    } catch {
      id = null;
    }
  }

  return { ok: res.ok, status: res.status, id };
}

export class TwilioSmsProvider implements SmsProvider {
  readonly name = "twilio" as const;

  isReady(): boolean {
    return Boolean(env("TWILIO_ACCOUNT_SID") && env("TWILIO_AUTH_TOKEN") && env("TWILIO_FROM"));
  }

  async sendOtp(opts: { templateId: string; mobile: string; otp: string; expiryMinutes: number }): Promise<ProviderAnswer> {
    const text = `${opts.otp} is your Riderzpro verification code. It expires in ${opts.expiryMinutes} minutes. Do not share it with anyone.`;
    return sendTwilioSms({ mobile: opts.mobile, text });
  }

  async sendTransactional(opts: { mobile: string; text: string }): Promise<ProviderAnswer> {
    return sendTwilioSms({ mobile: opts.mobile, text: opts.text });
  }
}

