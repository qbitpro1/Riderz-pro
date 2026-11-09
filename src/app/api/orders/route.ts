import { ApiError, clientIp, guardMutation, ok, rateLimit, readJson, route } from "@/lib/server/http";
import { placeOrder } from "@/lib/server/orders";
import { housekeeping } from "@/lib/server/housekeeping";
import { onlinePaymentsEnabled, releaseUnpaidOrdersSoon, startOnlinePayment } from "@/lib/server/payments";
import { currentCustomer } from "@/lib/server/customers";
import { placeOrderSchema } from "@/components/cart/orderSchema";

export const dynamic = "force-dynamic";

/**
 * Checkout capture. The browser sends who/where and which products and how many;
 * every price, the shipping and the total are worked out here. A signed-in customer's
 * order joins their account (from the session).
 *
 *   Online payment only (Razorpay).
 *   The Razorpay order is created here for the server's total, in paise; the browser only
 *   opens Checkout with it. Unpaid orders are released after UNPAID_HOLD_MINUTES.
 */
export const POST = route(async (req: Request) => {
  guardMutation(req);
  await rateLimit(`order:${clientIp(req)}`, 10, 10 * 60);
  const input = await readJson(req, placeOrderSchema, 32 * 1024);
  await rateLimit(`order-mobile:${input.customer.mobile}`, 10, 60 * 60);

  if (!onlinePaymentsEnabled()) {
    throw new ApiError(503, "payments_unavailable", "Online payment isn't available right now. Please try again in a few minutes.");
  }

  releaseUnpaidOrdersSoon();
  housekeeping();

  const me = await currentCustomer();
  const order = await placeOrder(input, me?.id ?? null);
  const summary = { number: order.number, total: order.total };
  const payment = await startOnlinePayment(order);
  return ok({ order: summary, payment }, 201);
});
