import { clientIp, guardMutation, ok, rateLimit, readJson, route } from "@/lib/server/http";
import { placeOrder } from "@/lib/server/orders";
import { currentCustomer } from "@/lib/server/customers";
import { placeOrderSchema } from "@/components/cart/orderSchema";

export const dynamic = "force-dynamic";

/**
 * Checkout capture. The browser sends who/where and which products and how many;
 * every price, the shipping and the total are worked out here. Answers only the
 * order number and total. A signed-in customer's order joins their account (from the session).
 */
export const POST = route(async (req: Request) => {
  guardMutation(req);
  await rateLimit(`order:${clientIp(req)}`, 10, 10 * 60);
  const input = await readJson(req, placeOrderSchema, 32 * 1024);
  const me = await currentCustomer();
  const order = await placeOrder(input, me?.id ?? null);
  return ok({ order }, 201);
});
