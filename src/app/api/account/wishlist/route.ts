import { ApiError, guardMutation, ok, rateLimit, readJson, route } from "@/lib/server/http";
import { getWishlist, mergeWishlist, removeWishlistItem, requireCustomer } from "@/lib/server/customers";
import { wishlistSchema } from "@/lib/account/schemas";

export const dynamic = "force-dynamic";

/** GET → { items } */
export const GET = route(async () => {
  const me = await requireCustomer();
  return ok({ items: await getWishlist(me.id) });
});

/** PUT { items } → { items } — adds (or refreshes) these items; never removes others. */
export const PUT = route(async (req: Request) => {
  guardMutation(req);
  const me = await requireCustomer();
  await rateLimit(`cust-wishlist:${me.id}`, 120, 10 * 60);
  const { items } = await readJson(req, wishlistSchema, 128 * 1024);
  return ok({ items: await mergeWishlist(me.id, items) });
});

/** DELETE ?slug=… → removes one item. */
export const DELETE = route(async (req: Request) => {
  guardMutation(req);
  const me = await requireCustomer();
  await rateLimit(`cust-wishlist:${me.id}`, 120, 10 * 60);
  const slug = new URL(req.url).searchParams.get("slug") ?? "";
  if (!/^[a-z0-9][a-z0-9:_-]{0,199}$/i.test(slug)) throw new ApiError(400, "invalid", "That item is not valid.");
  await removeWishlistItem(me.id, slug);
  return ok({ removed: slug });
});
