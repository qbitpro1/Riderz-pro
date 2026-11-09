import "server-only";

import type { ProviderAnswer, SmsProvider } from "./types";

const TIMEOUT_MS = 10_000;

const env = (k: string) => process.env[k]?.trim() || "";

/** Indian mobile to the 10 digits we store (accepts +91 / 91 / 0 prefixes). */
export const tenDigits = (mobile: string) => mobile.replace(/\D/g, "").slice(-10);

/**
 * Safely parses provider response.
 * Crucial MSG91 detail: MSG91 v5 APIs often return HTTP 200 even on failures,
 * with JSON bodies like `{ "type": "error", "message": "..." }` or `{ "status": "error", ... }`.
 * We must detect these so they are treated as failures, not successes.
 */
async function parseMsg91Response(res: Response, extractId: (b: Record<string, unknown>) => unknown): Promise<ProviderAnswer> {
  let body: Record<string, unknown> | null = null;
  try {
    body = (await res.json()) as Record<string, unknown>;
  } catch {
    body = null;
  }

  // Check if MSG91 reported an error inside the JSON payload
  const hasErrorFlag = body?.type === "error" || body?.status === "error";
  const ok = res.ok && !hasErrorFlag;
  const status = ok ? res.status : res.status >= 400 ? res.status : 502;

  let id: string | null = null;
  if (ok && body) {
    try {
      const v = extractId(body);
      id = typeof v === "string" ? v.slice(0, 120) : null;
    } catch {
      id = null;
    }
  }

  return { ok, status, id };
}

/**
 * Sends OTP via MSG91 OTP API (v5).
 * Query parameters: template_id, mobile (with 91 prefix), otp, otp_expiry.
 * Header: authkey.
 */
export async function sendMsg91Otp(m: {
  templateId: string;
  mobile: string;
  otp: string;
  expiryMinutes: number;
}): Promise<ProviderAnswer> {
  const authKey = env("MSG91_AUTH_KEY");
  if (!authKey) return { ok: false, status: 500, id: null };

  const mobile = tenDigits(m.mobile);
  if (mobile.length !== 10) return { ok: false, status: 400, id: null };

  const params = new URLSearchParams({
    template_id: m.templateId,
    mobile: `91${mobile}`,
    otp: m.otp,
    otp_expiry: String(m.expiryMinutes),
  });

  const res = await fetch(`https://control.msg91.com/api/v5/otp?${params.toString()}`, {
    method: "POST",
    headers: {
      authkey: authKey,
      "Content-Type": "application/json",
      accept: "application/json",
    },
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });

  return parseMsg91Response(res, (b) => b.request_id ?? b.message);
}

/**
 * Sends transactional SMS via MSG91 Flow API (v5).
 * Flow variables are formatted as var1, var2, etc. matching the approved DLT template order.
 */
export async function sendMsg91Flow(m: {
  templateId: string;
  mobile: string;
  vars: Record<string, string>;
}): Promise<ProviderAnswer> {
  const authKey = env("MSG91_AUTH_KEY");
  if (!authKey) return { ok: false, status: 500, id: null };

  const mobile = tenDigits(m.mobile);
  if (mobile.length !== 10) return { ok: false, status: 400, id: null };

  const res = await fetch("https://control.msg91.com/api/v5/flow", {
    method: "POST",
    headers: {
      authkey: authKey,
      "Content-Type": "application/json",
      accept: "application/json",
    },
    body: JSON.stringify({
      template_id: m.templateId,
      short_url: "0",
      recipients: [{ mobiles: `91${mobile}`, ...m.vars }],
    }),
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });

  return parseMsg91Response(res, (b) => b.message ?? b.request_id);
}

export class Msg91SmsProvider implements SmsProvider {
  readonly name = "msg91" as const;

  isReady(forMessage?: { templateId?: string; isOtp?: boolean }): boolean {
    const hasKey = Boolean(env("MSG91_AUTH_KEY"));
    if (!hasKey) return false;
    if (forMessage?.isOtp) return Boolean(env("MSG91_OTP_TEMPLATE_ID"));
    if (forMessage?.templateId !== undefined) return Boolean(forMessage.templateId);
    return true;
  }

  async sendOtp(opts: { templateId: string; mobile: string; otp: string; expiryMinutes: number }): Promise<ProviderAnswer> {
    return sendMsg91Otp(opts);
  }

  async sendTransactional(opts: {
    mobile: string;
    templateId?: string;
    vars?: string[];
    text: string;
    tag?: string;
  }): Promise<ProviderAnswer> {
    if (!opts.templateId) {
      return { ok: false, status: 400, id: null };
    }
    const cleanVars = (opts.vars ?? []).map((v) => v.replace(/\s+/g, " ").trim().slice(0, 30));
    const vars = Object.fromEntries(cleanVars.map((v, i) => [`var${i + 1}`, v]));
    return sendMsg91Flow({ templateId: opts.templateId, mobile: opts.mobile, vars });
  }
}

