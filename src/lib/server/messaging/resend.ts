import "server-only";

import type { EmailProvider, ProviderAnswer } from "./types";

const TIMEOUT_MS = 10_000;

const env = (k: string) => process.env[k]?.trim() || "";

export async function sendResendEmail(m: {
  from: string;
  to: string;
  subject: string;
  text: string;
  html?: string;
  replyTo?: string;
}): Promise<ProviderAnswer> {
  const apiKey = env("RESEND_API_KEY");
  if (!apiKey || !m.from) {
    return { ok: false, status: 500, id: null };
  }

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: m.from,
      to: [m.to],
      subject: m.subject,
      text: m.text,
      html: m.html,
      reply_to: m.replyTo,
    }),
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });

  let id: string | null = null;
  if (res.ok) {
    try {
      const data = (await res.json()) as { id?: unknown };
      id = typeof data.id === "string" ? data.id.slice(0, 120) : null;
    } catch {
      id = null;
    }
  }

  return { ok: res.ok, status: res.status, id };
}

export class ResendEmailProvider implements EmailProvider {
  readonly name = "resend" as const;

  isReady(from: string): boolean {
    return Boolean(env("RESEND_API_KEY") && from);
  }

  async sendEmail(opts: {
    from: string;
    to: string;
    subject: string;
    text: string;
    html?: string;
    replyTo?: string;
  }): Promise<ProviderAnswer> {
    return sendResendEmail(opts);
  }
}

