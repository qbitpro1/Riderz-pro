import { guardMutation, ok, rateLimit, readJson, route } from "@/lib/server/http";
import { requireCustomer } from "@/lib/server/customers";
import { cartSchema, getCart, saveCart } from "@/lib/server/customer-cart";

export const dynamic = "force-dynamic";

/** GET → { lines, updatedAt } the signed-in customer's saved cart. */
export const GET = route(async () => {
  const me = await requireCustomer();
  return ok(await getCart(me.id));
});

/** PUT { lines } → { lines } replaces the saved cart. Prices are checked again at checkout. */
export const PUT = route(async (req: Request) => {
  guardMutation(req);
  const me = await requireCustomer();
  await rateLimit(`cust-cart:${me.id}`, 300, 10 * 60);
  const { lines } = await readJson(req, cartSchema, 128 * 1024);
  await saveCart(me.id, lines);
  return ok(await getCart(me.id));
});
