import "server-only";

import { sql, sqlOne } from "@/lib/db/client";
import { newId } from "./security";
import type { EmailProvider, ProviderAnswer, SmsProvider } from "./messaging/types";
import { Msg91SmsProvider, sendMsg91Flow, sendMsg91Otp, tenDigits } from "./messaging/msg91";
import { ResendEmailProvider, sendResendEmail } from "./messaging/resend";
import { sendTwilioSms, TwilioSmsProvider } from "./messaging/twilio";

export type { EmailProvider, ProviderAnswer, SmsProvider } from "./messaging/types";
export { tenDigits } from "./messaging/msg91";

/**
 * EMAIL AND SMS
 *
 * One place for the providers, shared by sign-in codes (otp.ts), order emails (order-emails.ts) and
 * delivery alerts (rider arriving / arrived, job offers, shop receipt).
 *
 *   development   messages are printed in the server console ([mail:dev], [sms:dev]); with
 *                 OTP_SEND_IN_DEV=true, channels whose provider keys are set send for real
 *   production    email  resend   RESEND_API_KEY and a sender (ORDERS_EMAIL_FROM for order emails,
 *                                  OTP_EMAIL_FROM or RESEND_FROM otherwise)
 *                 sms    msg91    MSG91_AUTH_KEY, plus a DLT-approved template id per message
 *                                  (MSG91_OTP_TEMPLATE_ID for codes, MSG91_TEMPLATE_* below for the rest)
 *                        twilio   TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_FROM
 *                 OTP_EMAIL_PROVIDER / OTP_SMS_PROVIDER choose one when keys for several are set.
 *                 Without a provider, a message is skipped with a console note (codes refuse instead).
 *
 * Never log message bodies outside development, provider answers, or keys: only status codes.
 * `sendOnce` records each send in message_log (no message bodies), so a message goes out once.
 */

export const env = (k: string) => process.env[k]?.trim() || "";
const isProduction = () => process.env.NODE_ENV === "production";

/* --------------------------------------------------------------- modular provider instances */

const msg91Provider = new Msg91SmsProvider();
const twilioProvider = new TwilioSmsProvider();
const resendProvider = new ResendEmailProvider();

export function getSmsProvider(msg91Ready = true): SmsProvider | null {
  const p = env("OTP_SMS_PROVIDER");
  if (p === "msg91") return msg91Provider.isReady() && msg91Ready ? msg91Provider : null;
  if (p === "twilio") return twilioProvider.isReady() ? twilioProvider : null;
  if (msg91Provider.isReady() && msg91Ready) return msg91Provider;
  if (twilioProvider.isReady()) return twilioProvider;
  return null;
}

export function getEmailProvider(from: string): EmailProvider | null {
  const p = env("OTP_EMAIL_PROVIDER");
  if (p && p !== "resend") return null;
  return resendProvider.isReady(from) ? resendProvider : null;
}

/* --------------------------------------------------------------- provider checks */

export function emailProvider(from: string): "resend" | null {
  return getEmailProvider(from)?.name ?? null;
}

/** `msg91Ready`: whether MSG91 has what this message needs (codes also need MSG91_OTP_TEMPLATE_ID). */
export function smsProvider(msg91Ready: boolean): "msg91" | "twilio" | null {
  return getSmsProvider(msg91Ready)?.name ?? null;
}

/** In development: send for real only when asked to (OTP_SEND_IN_DEV=true) and a provider is set. */
export const printInsteadOfSending = (hasProvider: boolean) =>
  !isProduction() && (env("OTP_SEND_IN_DEV") !== "true" || !hasProvider);

/* --------------------------------------------------------------- provider delegates */

export async function resendEmail(m: {
  from: string;
  to: string;
  subject: string;
  text: string;
  html?: string;
  replyTo?: string;
}): Promise<ProviderAnswer> {
  return sendResendEmail(m);
}

export async function msg91Otp(m: {
  templateId: string;
  mobile: string;
  otp: string;
  expiryMinutes: number;
}): Promise<ProviderAnswer> {
  return sendMsg91Otp(m);
}

export async function msg91Flow(m: {
  templateId: string;
  mobile: string;
  vars: Record<string, string>;
}): Promise<ProviderAnswer> {
  return sendMsg91Flow(m);
}

export async function twilioSms(m: { mobile: string; text: string }): Promise<ProviderAnswer> {
  return sendTwilioSms(m);
}

/* ------------------------------------------------------- general messages */

/**
 *   sent     the provider accepted it
 *   dev      printed in the development console instead
 *   skipped  not sent on purpose (no recipient, no provider, no template id); `reason` says why
 *   failed   the provider refused it or could not be reached; safe to try again
 */
export type SendStatus = "sent" | "dev" | "skipped" | "failed";
export type SendResult = { status: SendStatus; providerId: string | null; reason?: string };

const fromAnswer = (channel: string, a: ProviderAnswer): SendResult => {
  if (a.ok) return { status: "sent", providerId: a.id };
  console.error(`[${channel}] provider answered ${a.status}`);
  return { status: "failed", providerId: null, reason: `provider_${a.status}` };
};

const unreachable = (channel: string, err: unknown): SendResult => {
  console.error(`[${channel}] provider not reachable:`, err instanceof Error ? err.name : "error");
  return { status: "failed", providerId: null, reason: "unreachable" };
};

/** The sender for order emails. */
export const ordersEmailFrom = () => env("ORDERS_EMAIL_FROM") || env("OTP_EMAIL_FROM") || env("RESEND_FROM");

/** Sends one email. Never throws for a provider problem: the result says what happened. */
export async function sendEmail(m: {
  to: string;
  subject: string;
  html: string;
  text: string;
  from?: string;
  replyTo?: string;
}): Promise<SendResult> {
  const from = m.from || ordersEmailFrom();
  const provider = emailProvider(from);
  if (printInsteadOfSending(provider !== null)) {
    console.info(`[mail:dev] to ${m.to}: ${m.subject}\n${m.text}`);
    return { status: "dev", providerId: null };
  }
  if (!provider) {
    console.warn("[mail] no email provider is set up; message skipped");
    return { status: "skipped", providerId: null, reason: "no_provider" };
  }
  try {
    return fromAnswer("mail", await resendEmail({ from, to: m.to, subject: m.subject, text: m.text, html: m.html, replyTo: m.replyTo }));
  } catch (err) {
    return unreachable("mail", err);
  }
}

/**
 * Sends one SMS to an Indian mobile. MSG91 needs the DLT `templateId` and the template's `vars`
 * (in order); Twilio sends `text`. Without a template id MSG91 skips the message with a note.
 */
export async function sendSms(m: { to: string; text: string; templateId?: string; vars?: string[]; tag?: string }): Promise<SendResult> {
  const mobile = tenDigits(m.to);
  if (mobile.length !== 10) return { status: "skipped", providerId: null, reason: "no_mobile" };
  const provider = smsProvider(true);
  if (printInsteadOfSending(provider !== null)) {
    console.info(`[sms:dev] to ${mobile}${m.tag ? ` (${m.tag})` : ""}: ${m.text}`);
    return { status: "dev", providerId: null };
  }
  if (!provider) {
    console.warn("[sms] no SMS provider is set up; message skipped");
    return { status: "skipped", providerId: null, reason: "no_provider" };
  }
  try {
    if (provider === "msg91") {
      if (!m.templateId) {
        console.warn(`[sms] no MSG91 template id for ${m.tag ?? "this message"}; message skipped`);
        return { status: "skipped", providerId: null, reason: "no_template" };
      }
      const cleanVars = (m.vars ?? []).map((v) => v.replace(/\s+/g, " ").trim().slice(0, 30));
      const vars = Object.fromEntries(cleanVars.map((v, i) => [`var${i + 1}`, v]));
      return fromAnswer("sms", await msg91Flow({ templateId: m.templateId, mobile, vars }));
    }
    return fromAnswer("sms", await twilioSms({ mobile, text: m.text }));
  } catch (err) {
    return unreachable("sms", err);
  }
}

/* ------------------------------------------------------------ SMS templates */

/**
 * The DLT templates (wording from docs/team/Amrutha_work.md). `{#var#}` marks each variable, filled
 * in order. MSG91 needs the approved template id in the named env variable; Twilio sends the text.
 */
export const SMS_TEMPLATES = {
  order_confirmed: {
    env: "MSG91_TEMPLATE_ORDER_CONFIRMED",
    text: "Thanks! Riderzpro order {#var#} for Rs {#var#} is confirmed. Track: {#var#}",
  },
  rider_arriving: {
    env: "MSG91_TEMPLATE_RIDER_ARRIVING",
    text: "Your Riderzpro order {#var#} is arriving in about {#var#} minutes. Delivery code: {#var#}.",
  },
  rider_arrived: {
    env: "MSG91_TEMPLATE_RIDER_ARRIVED",
    text: "Your Riderzpro rider has arrived with order {#var#}. Share code {#var#} only after you get the parcel.",
  },
  rider_offer: {
    env: "MSG91_TEMPLATE_RIDER_OFFER",
    text: "New Riderzpro delivery near {#var#}. Open the rider app to accept.",
  },
  store_receipt: {
    env: "MSG91_TEMPLATE_STORE_RECEIPT",
    text: "{#var#} receipt: order {#var#}, Rs {#var#}, {#var#}. Thank you for shopping with us.",
  },
} as const;
export type SmsTemplate = keyof typeof SMS_TEMPLATES;

/** The template's text with its variables filled in order. */
export function fillTemplate(template: SmsTemplate, vars: string[]): string {
  let i = 0;
  return SMS_TEMPLATES[template].text.replace(/\{#var#\}/g, () => vars[i++] ?? "");
}

export function sendTemplateSms(template: SmsTemplate, to: string, vars: string[]): Promise<SendResult> {
  // DLT variables are at most 30 characters each.
  const clean = vars.map((v) => v.replace(/\s+/g, " ").trim().slice(0, 30));
  return sendSms({ to, text: fillTemplate(template, clean), templateId: env(SMS_TEMPLATES[template].env) || undefined, vars: clean, tag: template });
}

/* ----------------------------------------------------------- once per event */

export type MessageKind = "order_confirmation" | SmsTemplate;
export type MessageChannel = "email" | "sms";

/** Tries again after a failure, or after a send that never finished (server stopped mid-way). */
const STALE_PENDING_MINUTES = 10;

/**
 * Runs `send` once per (kind, order, channel, ref) and records the outcome in message_log. A repeat
 * call answers the recorded outcome without sending; a failed send is tried again next time.
 */
export async function sendOnce(
  key: { kind: MessageKind; orderId: string | null; channel: MessageChannel; ref?: string },
  send: () => Promise<SendResult>,
): Promise<SendResult & { repeat?: true }> {
  const ref = key.ref ?? "";
  const dedupe = `${key.kind}:${key.orderId ?? "-"}:${key.channel}:${ref}`;
  const claimed = await sqlOne<{ id: string }>(
    `INSERT INTO message_log (id, dedupe_key, kind, order_id, channel, ref, status)
     VALUES ($1, $2, $3, $4, $5, $6, 'pending')
     ON CONFLICT (dedupe_key) DO UPDATE SET status = 'pending', attempts = message_log.attempts + 1, updated_at = now()
       WHERE message_log.status = 'failed'
          OR (message_log.status = 'pending' AND message_log.updated_at < now() - make_interval(mins => $7))
     RETURNING id`,
    [newId("msg"), dedupe, key.kind, key.orderId, key.channel, ref, STALE_PENDING_MINUTES],
  );
  if (!claimed) {
    const prev = await sqlOne<{ status: SendStatus | "pending"; provider_id: string | null; reason: string | null }>(
      "SELECT status, provider_id, reason FROM message_log WHERE dedupe_key = $1",
      [dedupe],
    );
    const status: SendStatus = !prev || prev.status === "pending" ? "skipped" : prev.status;
    return { status, providerId: prev?.provider_id ?? null, reason: prev?.status === "pending" ? "in_progress" : prev?.reason ?? undefined, repeat: true };
  }
  let result: SendResult;
  try {
    result = await send();
  } catch (err) {
    console.error(`[messaging] ${key.kind} failed:`, err instanceof Error ? err.message : "error");
    result = { status: "failed", providerId: null, reason: "error" };
  }
  await sql("UPDATE message_log SET status = $2, provider_id = $3, reason = $4, updated_at = now() WHERE id = $1", [
    claimed.id,
    result.status,
    result.providerId,
    result.reason ?? null,
  ]);
  return result;
}

/* ---------------------------------------------------- delivery alerts (riders) */

type JobForSms = { order_id: string; number: string; drop_phone: string; delivery_code: string; city: string; rider_mobile: string };

const jobForSms = (jobId: string) =>
  sqlOne<JobForSms>(
    `SELECT j.order_id, o.number, j.drop_phone, j.delivery_code, j.city, r.mobile AS rider_mobile
       FROM rider_jobs j JOIN orders o ON o.id = j.order_id JOIN riders r ON r.id = j.rider_id
      WHERE j.id = $1`,
    [jobId],
  );

const noJob: SendResult = { status: "skipped", providerId: null, reason: "no_job" };

/** "Arriving in about N minutes" to the customer, once per delivery job (call at about 500 m). */
export async function smsRiderArriving(jobId: string, opts: { minutes: number }): Promise<SendResult> {
  const j = await jobForSms(jobId);
  if (!j) return noJob;
  const minutes = String(Math.max(1, Math.round(opts.minutes)));
  return sendOnce({ kind: "rider_arriving", orderId: j.order_id, channel: "sms", ref: jobId }, () =>
    sendTemplateSms("rider_arriving", j.drop_phone, [j.number, minutes, j.delivery_code]),
  );
}

/** "Your rider has arrived" to the customer, once per delivery job (call at about 50 m). */
export async function smsRiderArrived(jobId: string): Promise<SendResult> {
  const j = await jobForSms(jobId);
  if (!j) return noJob;
  return sendOnce({ kind: "rider_arrived", orderId: j.order_id, channel: "sms", ref: jobId }, () =>
    sendTemplateSms("rider_arrived", j.drop_phone, [j.number, j.delivery_code]),
  );
}

/** "New delivery near <area>" to the rider the job was offered to, once per job. */
export async function smsRiderOffer(jobId: string, opts: { area?: string } = {}): Promise<SendResult> {
  const j = await jobForSms(jobId);
  if (!j) return noJob;
  return sendOnce({ kind: "rider_offer", orderId: j.order_id, channel: "sms", ref: jobId }, () =>
    sendTemplateSms("rider_offer", j.rider_mobile, [opts.area?.trim() || j.city]),
  );
}
