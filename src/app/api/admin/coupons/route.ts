import { guardMutation, ok, readJson, route } from "@/lib/server/http";
import { requireAdmin } from "@/lib/server/admin-auth";
import { createCoupon, listCoupons } from "@/lib/server/coupons";
import { couponInputSchema } from "@/lib/coupons/types";

export const dynamic = "force-dynamic";

export const GET = route(async () => {
  await requireAdmin("coupons");
  return ok({ coupons: await listCoupons() });
});

export const POST = route(async (req: Request) => {
  guardMutation(req);
  const me = await requireAdmin("coupons");
  const body = await readJson(req, couponInputSchema, 8 * 1024);
  return ok({ coupon: await createCoupon(me.email, body) }, 201);
});
