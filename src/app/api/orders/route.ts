import { clientIp, guardMutation, ok, rateLimit, readJson, route } from "@/lib/server/http";
import { placeOrder } from "@/lib/server/orders";
import { placeOrderSchema } from "@/components/cart/orderSchema";

export const dynamic = "force-dynamic";

/**
 * Checkout capture. The browser sends who/where and which products and how many;
 * every price, the shipping and the total are worked out here. Answers only the
 * order number and total.
 */
export const POST = route(async (req: Request) => {
  guardMutation(req);
  await rateLimit(`order:${clientIp(req)}`, 10, 10 * 60);
  const input = await readJson(req, placeOrderSchema, 32 * 1024);
  const order = await placeOrder(input);
  return ok({ order }, 201);
});
