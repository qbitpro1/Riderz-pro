import "server-only";

import { sql, sqlOne } from "@/lib/db/client";
import { SITE } from "@/lib/data/site";
import { rupees } from "@/lib/format";
import type { VendorSelf } from "@/lib/vendor/types";
import { ApiError } from "./http";
import { env, sendEmail, sendSms, smsProvider, tenDigits, type SendResult } from "./messaging";
import { newId } from "./security";
import { storeSettings } from "./store-sales";
import { screenStore } from "./store-screen";
import { audit } from "./vendors";

/**
 * RECEIPTS AFTER A SHOP SCREEN SALE
 *
 * When the order is placed, the screen offers "Get your receipt": SMS to the mobile given at
 * checkout, email to an address the customer types, or Skip. Nothing is sent unless the customer
 * asks. A receipt goes only for this seller's own screen order, placed in the last
 * RECEIPT_WINDOW_MINUTES, and never for a cancelled one.
 *
 * SMS: Twilio sends the text; MSG91 needs a DLT template in MSG91_TEMPLATE_STORE_RECEIPT with the
 * wording of RECEIPT_SMS_TEMPLATE. Without a provider the customer is told SMS isn't available and
 * offered email. Each request is recorded in store_receipts (channel and outcome only, never the
 * mobile or email) and in the audit log.
 */

export const RECEIPT_WINDOW_MINUTES = 30;

/** The DLT wording for MSG91 (variables filled in order, at most 30 characters each). */
export const RECEIPT_SMS_TEMPLATE = "{#var#} receipt: order {#var#}, Rs {#var#}, {#var#}. Thank you for shopping with us.";

type ReceiptOrder = {
  id: string;
  number: string;
  status: string;
  customer_name: string;
  customer_phone: string;
  subtotal: number;
  discount: number;
  total: number;
  payment_method: string;
  payment_status: string;
  created_at: Date;
};

type ReceiptItem = { title: string; qty: number; unit_price: number; line_total: number; warranty_months: number | null };

export type Receipt = {
  shop: { name: string; address: string | null };
  order: ReceiptOrder;
  items: ReceiptItem[];
  pay: string;
};

const when = new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "short", year: "numeric", hour: "numeric", minute: "2-digit", timeZone: "Asia/Kolkata" });

const payLabel = (o: ReceiptOrder) =>
  o.payment_method === "counter"
    ? o.payment_status === "paid" ? "Paid at the counter" : "To pay at the counter"
    : o.payment_status === "paid" ? "Paid on the screen (UPI / card)" : "Paying on the screen (UPI / card)";

const warranty = (m: number | null) => (m ? (m % 12 === 0 ? `${m / 12} year${m === 12 ? "" : "s"} warranty` : `${m} month${m === 1 ? "" : "s"} warranty`) : null);

/** The receipt for one of this seller's recent screen orders, or a 404. */
export async function loadReceipt(vendor: VendorSelf, number: string): Promise<Receipt> {
  const order = await sqlOne<ReceiptOrder>(
    `SELECT o.id, o.number, o.status, o.customer_name, o.customer_phone, o.subtotal, o.discount, o.total, o.payment_method, o.payment_status, o.created_at
       FROM orders o JOIN vendor_orders vo ON vo.order_id = o.id
      WHERE o.number = $1 AND vo.vendor_id = $2 AND o.channel = 'store' AND o.created_at > now() - make_interval(mins => $3)`,
    [number, vendor.id, RECEIPT_WINDOW_MINUTES],
  );
  if (!order || order.status === "cancelled") throw new ApiError(404, "not_found", "A receipt can't be sent for this order from the screen. Please ask the staff.");
  const items = await sql<ReceiptItem>(
    `SELECT i.title, i.qty, i.unit_price, i.line_total, p.warranty_months
       FROM order_items i LEFT JOIN vendor_products p ON i.product_kind = 'vendor' AND p.id = i.product_ref
      WHERE i.order_id = $1 ORDER BY i.id`,
    [order.id],
  );
  const s = await storeSettings(vendor.id);
  const shop = screenStore(vendor, s);
  return { shop: { name: shop.name, address: shop.address }, order, items, pay: payLabel(order) };
}

const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");

/** The receipt as an email (HTML and plain text), in the style of the order confirmation. */
export function receiptEmail(r: Receipt) {
  const { shop, order: o, items } = r;
  const subject = `Your receipt from ${shop.name}: order ${o.number}`;
  const itemText = (i: ReceiptItem) => {
    const w = warranty(i.warranty_months);
    return `${i.title} x ${i.qty}: ${rupees(i.line_total)}${w ? ` (${w})` : ""}`;
  };
  const text = [
    `Receipt from ${shop.name}`,
    ...(shop.address ? [shop.address] : []),
    "",
    `Order ${o.number}, ${when.format(new Date(o.created_at))}`,
    "",
    ...items.map((i) => `- ${itemText(i)}`),
    "",
    ...(o.discount ? [`List price: ${rupees(o.subtotal)}`, `Special price discount: -${rupees(o.discount)}`] : []),
    `Total: ${rupees(o.total)} (prices include GST)`,
    `Payment: ${r.pay}`,
    "",
    "Keep this receipt for returns and warranty claims.",
    `Bought on the ${shop.name} shop screen, powered by Riderzpro. Questions: ${SITE.email} or ${SITE.phone}.`,
  ].join("\n");

  const td = 'style="padding:8px 0;border-bottom:1px solid #eee;vertical-align:top"';
  const tdR = 'style="padding:8px 0 8px 12px;border-bottom:1px solid #eee;text-align:right;vertical-align:top;white-space:nowrap"';
  const row = (label: string, value: string, strong = false) =>
    `<tr><td style="padding:4px 0;${strong ? "font-weight:700" : "color:#555"}">${label}</td><td style="padding:4px 0;text-align:right;${strong ? "font-weight:700" : ""}">${value}</td></tr>`;
  const html = `<!doctype html><html><body style="margin:0;background:#f5f5f5;font-family:Arial,Helvetica,sans-serif;color:#111">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f5f5f5"><tr><td align="center" style="padding:24px 12px">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#fff;border-radius:8px">
<tr><td style="padding:24px 24px 8px"><p style="margin:0;font-size:12px;letter-spacing:2px;text-transform:uppercase;color:#888">Receipt</p>
<h1 style="margin:8px 0 0;font-size:22px">${esc(shop.name)}</h1>
${shop.address ? `<p style="margin:4px 0 0;font-size:14px;color:#555">${esc(shop.address)}</p>` : ""}
<p style="margin:12px 0 0;font-size:14px;line-height:1.5">Order <strong>${esc(o.number)}</strong> · ${esc(when.format(new Date(o.created_at)))}</p></td></tr>
<tr><td style="padding:16px 24px"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="font-size:14px">
${items
  .map((i) => {
    const w = warranty(i.warranty_months);
    return `<tr><td ${td}>${esc(i.title)}<br><span style="color:#777;font-size:12px">Qty ${i.qty} · ${rupees(i.unit_price)} each${w ? ` · ${esc(w)}` : ""}</span></td><td ${tdR}>${rupees(i.line_total)}</td></tr>`;
  })
  .join("\n")}
</table>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="font-size:14px;margin-top:8px">
${o.discount ? `${row("List price", rupees(o.subtotal))}${row("Special price discount", `-${rupees(o.discount)}`)}` : ""}${row("Total", rupees(o.total), true)}${row("Payment", esc(r.pay))}
</table><p style="margin:4px 0 0;font-size:12px;color:#777">Prices include GST. Keep this receipt for returns and warranty claims.</p></td></tr>
<tr><td style="padding:16px 24px;border-top:1px solid #eee;font-size:12px;color:#777;line-height:1.5">Bought on the ${esc(shop.name)} shop screen, powered by Riderzpro.<br>Questions? Write to ${esc(SITE.email)} or call ${esc(SITE.phone)}.</td></tr>
</table></td></tr></table></body></html>`;
  return { subject, text, html };
}

/** The receipt as one SMS text (Twilio), kept short. */
export function receiptSmsText(r: Receipt): string {
  const { shop, order: o, items } = r;
  const first = items.slice(0, 2).map((i) => `${i.title.slice(0, 40)} x${i.qty}`).join(", ");
  const more = items.length > 2 ? ` +${items.length - 2} more` : "";
  return `${shop.name}: receipt for order ${o.number}. ${first}${more}. Total Rs ${o.total}${o.discount ? ` (saved Rs ${o.discount})` : ""}. ${r.pay}. Thank you!`;
}

export type ReceiptOutcome = { sent: boolean; status: SendResult["status"]; message: string };

/** Sends the receipt by the channel the customer picked. Never throws for a provider problem. */
export async function sendStoreReceipt(
  vendor: VendorSelf,
  input: { number: string; channel: "sms" | "email"; email?: string | null },
  ip: string,
): Promise<ReceiptOutcome> {
  const r = await loadReceipt(vendor, input.number);
  let result: SendResult;
  if (input.channel === "email") {
    if (!input.email) throw new ApiError(400, "invalid", "Enter your email address.", { email: "Enter your email address" });
    const mail = receiptEmail(r);
    result = await sendEmail({ to: input.email, subject: mail.subject, html: mail.html, text: mail.text, replyTo: SITE.email });
  } else {
    const templateId = env("MSG91_TEMPLATE_STORE_RECEIPT");
    const text = receiptSmsText(r);
    if (!smsProvider(Boolean(templateId))) {
      // Not set up (as on a local machine): say so plainly rather than pretend it went.
      console.warn(`[store-receipt] SMS is not set up; receipt for ${r.order.number} not sent`);
      if (process.env.NODE_ENV !== "production") console.info(`[sms:dev] would send to ${tenDigits(r.order.customer_phone)}: ${text}`);
      result = { status: "skipped", providerId: null, reason: "no_provider" };
    } else {
      const vars = [r.shop.name, r.order.number, String(r.order.total), r.order.payment_status === "paid" ? "paid" : "pay at counter"].map((v) =>
        v.replace(/\s+/g, " ").trim().slice(0, 30),
      );
      result = await sendSms({ to: r.order.customer_phone, text, templateId: templateId || undefined, vars, tag: "store_receipt" });
    }
  }

  await sql("INSERT INTO store_receipts (id, order_id, vendor_id, channel, status, reason) VALUES ($1,$2,$3,$4,$5,$6)", [
    newId("rcp"), r.order.id, vendor.id, input.channel, result.status, result.reason ?? null,
  ]).catch((err) => console.error("[store-receipt] could not record:", err instanceof Error ? err.message : err));
  await audit({ type: "vendor", id: vendor.id }, "store_screen.receipt", {
    vendorId: vendor.id, ip, detail: { number: r.order.number, channel: input.channel, status: result.status, reason: result.reason ?? null },
  }).catch(() => undefined);

  const where = input.channel === "email" ? input.email! : `your mobile ending ${tenDigits(r.order.customer_phone).slice(-4)}`;
  switch (result.status) {
    case "sent":
      return { sent: true, status: "sent", message: `Receipt sent to ${where}.` };
    case "dev":
      return { sent: true, status: "dev", message: `Test mode: the receipt for ${where} was written to the server log, not sent.` };
    case "skipped":
      return {
        sent: false,
        status: "skipped",
        message: input.channel === "sms" ? "SMS receipts aren't available at this shop yet. Try email, or ask the staff for a printed bill." : "Email receipts aren't available at this shop yet. Please ask the staff for a printed bill.",
      };
    default:
      return { sent: false, status: "failed", message: `We couldn't send it just now. Try again${input.channel === "sms" ? ", or try email" : ""}.` };
  }
}
