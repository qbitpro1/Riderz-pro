import { ApiError, clientIp, guardMutation, ok, rateLimit, readJson, route } from "@/lib/server/http";
import { placeOrder } from "@/lib/server/orders";
import { housekeeping } from "@/lib/server/housekeeping";
import { onlinePaymentsEnabled, releaseUnpaidOrdersSoon, startOnlinePayment } from "@/lib/server/payments";
import { currentCustomer } from "@/lib/server/customers";
import { placeOrderSchema } from "@/components/cart/orderSchema";

export const dynamic = "force-dynamic";

const WHATSAPP_MAX_QTY = 10;
const WHATSAPP_MAX_UNITS = 30;

/**
 * Checkout capture. The browser sends who/where and which products and how many;
 * every price, the shipping and the total are worked out here. A signed-in customer's
 * order joins their account (from the session).
 *
 *   paymentMethod "whatsapp" (default) → { order: { number, total } }
 *   paymentMethod "online"             → { order: { number, total }, payment: OnlinePaymentStart }
 *     The Razorpay order is created here for the server's total, in paise; the browser only
 *     opens Checkout with it. Unpaid orders are released after UNPAID_HOLD_MINUTES.
 */
export const POST = route(async (req: Request) => {
  guardMutation(req);
  await rateLimit(`order:${clientIp(req)}`, 10, 10 * 60);
  const input = await readJson(req, placeOrderSchema, 32 * 1024);
  // Pay-later (WhatsApp) orders hold seller stock until someone cancels them, so they get tighter
  // limits than paid ones: per mobile number as well as per IP, and a cap on quantities.
  await rateLimit(`order-mobile:${input.customer.mobile}`, 5, 60 * 60);
  if (input.paymentMethod !== "online") {
    const units = input.lines.reduce((n, l) => n + l.qty, 0);
    if (input.lines.some((l) => l.qty > WHATSAPP_MAX_QTY) || units > WHATSAPP_MAX_UNITS) {
      throw new ApiError(
        400,
        "too_many_units",
        `For orders paid on WhatsApp, please keep it to ${WHATSAPP_MAX_QTY} of an item and ${WHATSAPP_MAX_UNITS} items in all, or pay online. For bigger orders, message us.`,
      );
    }
  }
  releaseUnpaidOrdersSoon();
  housekeeping();
  if (input.paymentMethod === "online" && !onlinePaymentsEnabled()) {
    throw new ApiError(409, "payments_unavailable", "Online payment isn't available right now. Please order on WhatsApp.");
  }
  const me = await currentCustomer();
  const order = await placeOrder(input, me?.id ?? null, { method: input.paymentMethod });
  const summary = { number: order.number, total: order.total };
  if (input.paymentMethod !== "online") return ok({ order: summary }, 201);
  const payment = await startOnlinePayment(order);
  return ok({ order: summary, payment }, 201);
});
