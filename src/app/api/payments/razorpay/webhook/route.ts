import { ApiError, ok, route } from "@/lib/server/http";
import { handleRazorpayWebhook } from "@/lib/server/payments";

export const dynamic = "force-dynamic";

/**
 * Razorpay → server webhook. No Origin check (it is server to server); instead the exact raw body
 * must carry a valid X-Razorpay-Signature (HMAC-SHA256 with RAZORPAY_WEBHOOK_SECRET). Each event id
 * (X-Razorpay-Event-Id) is processed once. Events: payment.captured, payment.failed, order.paid,
 * refund.processed, refund.failed (others are acknowledged and ignored).
 */
export const POST = route(async (req: Request) => {
  const raw = await req.text();
  if (raw.length > 256 * 1024) throw new ApiError(413, "too_large", "Too large.");
  const result = await handleRazorpayWebhook(raw, req.headers.get("x-razorpay-signature"), req.headers.get("x-razorpay-event-id"));
  return ok(result);
});
