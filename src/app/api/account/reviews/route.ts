import { clientIp, guardMutation, ok, readJson, route } from "@/lib/server/http";
import { requireCustomer } from "@/lib/server/customers";
import { reviewSchema, submitReview } from "@/lib/server/reviews";

export const dynamic = "force-dynamic";

/** POST { orderNumber, productSlug|null, rating, title?, body, name, city?, vehicle? } → 201. Shown once an admin approves it. */
export const POST = route(async (req: Request) => {
  guardMutation(req);
  const me = await requireCustomer();
  const input = await readJson(req, reviewSchema, 16 * 1024);
  return ok({ review: await submitReview(me.id, input, clientIp(req)) }, 201);
});
