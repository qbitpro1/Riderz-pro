import { guardMutation, ok, rateLimit, readJson, route } from "@/lib/server/http";
import { getCart, requireCustomer, saveCart } from "@/lib/server/customers";
import { cartSchema } from "@/lib/account/schemas";

export const dynamic = "force-dynamic";

/** GET → { lines } — the signed-in shopper's saved cart. */
export const GET = route(async () => {
  const me = await requireCustomer();
  return ok({ lines: await getCart(me.id) });
});

/** PUT { lines, merge? } → { lines } — replaces the saved cart, or adds to it with `merge`. */
export const PUT = route(async (req: Request) => {
  guardMutation(req);
  const me = await requireCustomer();
  await rateLimit(`cust-cart:${me.id}`, 600, 10 * 60);
  const { lines, merge } = await readJson(req, cartSchema, 256 * 1024);
  return ok({ lines: await saveCart(me.id, lines, merge) });
});
