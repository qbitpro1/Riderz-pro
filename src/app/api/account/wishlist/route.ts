import { guardMutation, ok, rateLimit, readJson, route } from "@/lib/server/http";
import { getWishlist, requireCustomer, setWishlist } from "@/lib/server/customers";
import { wishlistSchema } from "@/lib/account/schemas";

export const dynamic = "force-dynamic";

/** GET → { items } */
export const GET = route(async () => {
  const me = await requireCustomer();
  return ok({ items: await getWishlist(me.id) });
});

/** PUT { items } → { items } (replaces the saved list; the browser merges first). */
export const PUT = route(async (req: Request) => {
  guardMutation(req);
  const me = await requireCustomer();
  await rateLimit(`cust-wishlist:${me.id}`, 120, 10 * 60);
  const { items } = await readJson(req, wishlistSchema, 128 * 1024);
  return ok({ items: await setWishlist(me.id, items) });
});
