import { createHmac, timingSafeEqual } from "node:crypto";

/**
 * Razorpay signature checks (server only: they need the key secret / webhook secret).
 * Kept free of app imports so scripts/test-payments-signature.mjs can test it directly.
 *
 *   Checkout success   hex HMAC-SHA256( razorpay_order_id + "|" + razorpay_payment_id , RAZORPAY_KEY_SECRET )
 *   Webhook            hex HMAC-SHA256( raw request body , RAZORPAY_WEBHOOK_SECRET )  ← header X-Razorpay-Signature
 */

export function hmacSha256Hex(secret: string, data: string | Uint8Array): string {
  return createHmac("sha256", secret).update(data).digest("hex");
}

/** Constant-time compare of two hex digests; false for anything malformed. */
export function sameHexDigest(expected: string, given: string): boolean {
  if (!/^[0-9a-f]{64}$/i.test(given) || !/^[0-9a-f]{64}$/i.test(expected)) return false;
  const a = Buffer.from(expected.toLowerCase(), "hex");
  const b = Buffer.from(given.toLowerCase(), "hex");
  return a.length === b.length && timingSafeEqual(a, b);
}

export function verifyCheckoutSignature(razorpayOrderId: string, razorpayPaymentId: string, signature: string, keySecret: string): boolean {
  if (!keySecret || !razorpayOrderId || !razorpayPaymentId || !signature) return false;
  return sameHexDigest(hmacSha256Hex(keySecret, `${razorpayOrderId}|${razorpayPaymentId}`), signature);
}

/** `rawBody` must be the exact bytes Razorpay sent (never re-serialised JSON). */
export function verifyWebhookSignature(rawBody: string | Uint8Array, signature: string | null, webhookSecret: string): boolean {
  if (!webhookSecret || !signature) return false;
  return sameHexDigest(hmacSha256Hex(webhookSecret, rawBody), signature.trim());
}

/** Integer rupees → integer paise, the unit Razorpay's API takes and returns. */
export function rupeesToPaise(rupees: number): number {
  if (!Number.isSafeInteger(rupees) || rupees < 0) throw new Error("Amount must be a whole number of rupees");
  return rupees * 100;
}
