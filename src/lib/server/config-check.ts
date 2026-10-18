import "server-only";

/**
 * PRODUCTION SETTINGS CHECK
 *
 * `checkConfig()` sorts every setting into problems (the site must not start), warnings (a part of
 * the site stays off or is less safe) and the features that are on. Run at server start
 * (src/instrumentation.ts) and reported by /api/health. Values are never logged, only names.
 */

const env = (k: string) => process.env[k]?.trim() || "";

export type ConfigReport = {
  problems: string[];
  warnings: string[];
  features: { payments: boolean; paymentWebhook: boolean; email: boolean; sms: boolean; assistant: boolean; cron: boolean };
};

export function checkConfig(): ConfigReport {
  const problems: string[] = [];
  const warnings: string[] = [];

  if (!env("DATABASE_URL")) problems.push("DATABASE_URL is not set (orders, accounts and sellers need the database).");
  else if (!/^postgres(ql)?:\/\//.test(env("DATABASE_URL"))) problems.push("DATABASE_URL must be a postgres:// connection string.");

  const key = env("VENDOR_DATA_KEY");
  if (!key) problems.push("VENDOR_DATA_KEY is not set (sellers' bank details and PAN can't be stored).");
  else if (Buffer.from(key, "base64").length !== 32) problems.push("VENDOR_DATA_KEY must be 32 bytes, base64 (openssl rand -base64 32).");

  if (!env("ADMIN_USER") || !env("ADMIN_PASSWORD")) warnings.push("ADMIN_USER / ADMIN_PASSWORD not set: nobody can sign in to /admin for the first time.");
  else if (env("ADMIN_PASSWORD").length < 16) warnings.push("ADMIN_PASSWORD is shorter than 16 characters.");
  if (!env("NEXT_PUBLIC_SITE_URL")) warnings.push("NEXT_PUBLIC_SITE_URL not set: links in emails and SMS use https://riderzpro.com.");
  if (env("OTP_SEND_IN_DEV")) warnings.push("OTP_SEND_IN_DEV is set; it is for local testing only (ignored in production).");
  if (env("RAZORPAY_API_BASE") || env("ANTHROPIC_API_BASE")) warnings.push("RAZORPAY_API_BASE / ANTHROPIC_API_BASE are test settings (ignored in production); remove them.");

  const features = {
    payments: Boolean(env("RAZORPAY_KEY_ID") && env("RAZORPAY_KEY_SECRET")),
    paymentWebhook: Boolean(env("RAZORPAY_WEBHOOK_SECRET")),
    email: Boolean(env("RESEND_API_KEY") && (env("OTP_EMAIL_FROM") || env("RESEND_FROM"))),
    sms: Boolean((env("MSG91_AUTH_KEY") && env("MSG91_OTP_TEMPLATE_ID")) || (env("TWILIO_ACCOUNT_SID") && env("TWILIO_AUTH_TOKEN") && env("TWILIO_FROM"))),
    assistant: Boolean(env("ANTHROPIC_API_KEY")),
    cron: Boolean(env("CRON_SECRET")),
  };
  if (features.payments && !features.paymentWebhook) warnings.push("Razorpay keys set but RAZORPAY_WEBHOOK_SECRET isn't: payments from a closed tab are only found by the unpaid-order check.");
  if (features.payments && env("RAZORPAY_KEY_ID").startsWith("rzp_test_")) warnings.push("Razorpay is in TEST mode (rzp_test_ key): no real money is taken.");
  if (!features.email) warnings.push("Email is off (RESEND_API_KEY + sender): no sign-in codes or order emails by email.");
  if (!features.sms) warnings.push("SMS is off (MSG91 or Twilio): mobile sign-in codes and delivery alerts can't be sent.");
  if (!features.cron) warnings.push("CRON_SECRET not set: schedule /api/cron/housekeeping hourly (see docs/DEPLOY.md); until then it only runs when the site is busy.");
  return { problems, warnings, features };
}
