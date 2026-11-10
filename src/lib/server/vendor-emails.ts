import "server-only";

import { sqlOne } from "@/lib/db/client";
import { SITE } from "@/lib/data/site";
import { sendEmail, sendOnce, type SendResult } from "./messaging";
import { siteUrl } from "./order-emails";

/**
 * EMAILS TO SELLERS
 *
 * "Your seller account is active": sent once, when an admin approves the application after checking
 * its documents (admin-vendors.ts decideVendor). Recorded in message_log like order emails (never the
 * text), so a retry never sends it twice. In development it is printed in the server console.
 */

const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

export function approvedEmail(v: { full_name: string; store_name: string; email: string; commission_rate: string | null; tier: string | null }) {
  const base = siteUrl();
  const signIn = `${base}/vendor/auth`;
  const first = v.full_name.trim().split(/\s+/)[0] || "there";
  const subject = `Your Riderzpro seller account is active: ${v.store_name}`;
  const terms = [v.commission_rate ? `Commission: ${Number(v.commission_rate)}% of each sale` : null, v.tier ? `Tier: ${v.tier}` : null].filter(Boolean) as string[];
  const text = [
    `Hi ${first},`,
    "",
    `Good news: our team has checked your documents and approved ${v.store_name}. Your seller account is now active and you can sign in.`,
    "",
    `Sign in: ${signIn}`,
    `(Use ${v.email} or your mobile number and your password.)`,
    "",
    ...terms,
    ...(terms.length ? [""] : []),
    "Next steps:",
    "1. Add your products. Each one is checked by our team before it appears on Riderzpro.",
    "2. Keep your stock up to date so customers only order what you have.",
    "3. Accept and pack new orders from your dashboard.",
    "",
    `Questions? Reply to this email, write to ${SITE.email} or call ${SITE.phone}.`,
    "",
    `Riderzpro (${SITE.legalName})`,
  ].join("\n");
  const html = `<!doctype html><html><body style="margin:0;background:#f5f5f5;font-family:Arial,Helvetica,sans-serif;color:#111">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f5f5f5"><tr><td align="center" style="padding:24px 12px">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#fff;border-radius:8px">
<tr><td style="padding:24px 24px 8px"><p style="margin:0;font-size:12px;letter-spacing:2px;text-transform:uppercase;color:#888">Riderzpro seller portal</p>
<h1 style="margin:8px 0 0;font-size:22px">Your seller account is active</h1>
<p style="margin:12px 0 0;font-size:14px;line-height:1.5">Hi ${esc(first)}, our team has checked your documents and approved <strong>${esc(v.store_name)}</strong>. You can sign in now.</p></td></tr>
${terms.length ? `<tr><td style="padding:8px 24px;font-size:14px;line-height:1.6">${terms.map(esc).join("<br>")}</td></tr>` : ""}
<tr><td style="padding:12px 24px"><a href="${esc(signIn)}" style="display:inline-block;background:#111;color:#fff;text-decoration:none;padding:10px 16px;border-radius:6px;font-size:14px;font-weight:700">Sign in to your dashboard</a>
<p style="margin:10px 0 0;font-size:12px;color:#777">Use ${esc(v.email)} or your mobile number and your password.</p></td></tr>
<tr><td style="padding:8px 24px 20px;font-size:14px;line-height:1.6"><p style="margin:0;font-size:12px;letter-spacing:1px;text-transform:uppercase;color:#888">Next steps</p>
<ol style="margin:6px 0 0;padding-left:20px"><li>Add your products. Each one is checked by our team before it appears on Riderzpro.</li><li>Keep your stock up to date.</li><li>Accept and pack new orders from your dashboard.</li></ol></td></tr>
<tr><td style="padding:16px 24px;border-top:1px solid #eee;font-size:12px;color:#777;line-height:1.5">Questions? Reply to this email, write to ${esc(SITE.email)} or call ${esc(SITE.phone)}.<br>Riderzpro · ${esc(SITE.legalName)}</td></tr>
</table></td></tr></table></body></html>`;
  return { subject, text, html };
}

/** Emails the seller that their account is active. Once per seller; never throws. */
export async function sendVendorApprovedEmail(vendorId: string): Promise<SendResult> {
  try {
    const v = await sqlOne<{ email: string; full_name: string; store_name: string | null; commission_rate: string | null; tier: string | null }>(
      "SELECT email, full_name, store_name, commission_rate, tier FROM vendors WHERE id = $1 AND status = 'approved'",
      [vendorId],
    );
    if (!v) return { status: "skipped", providerId: null, reason: "not_approved" };
    const mail = approvedEmail({ ...v, store_name: v.store_name ?? "your store" });
    return await sendOnce({ kind: "vendor_approved", orderId: null, channel: "email", ref: vendorId }, () =>
      sendEmail({ to: v.email, subject: mail.subject, text: mail.text, html: mail.html, replyTo: SITE.email }),
    );
  } catch (err) {
    console.error("[vendor-email] approved email failed:", err instanceof Error ? err.message : "error");
    return { status: "failed", providerId: null, reason: "error" };
  }
}
