import { guardMutation, ok, readJson, route } from "@/lib/server/http";
import { requireAdmin } from "@/lib/server/admin-auth";
import { couponAction } from "@/lib/server/coupons";
import { couponActionSchema } from "@/lib/coupons/types";

export const dynamic = "force-dynamic";

/** [id] is a coupon. Pause, resume, end (for good), show on /offers or hide. */
export const POST = route(async (req: Request, { params }: { params: Promise<{ id: string }> }) => {
  guardMutation(req);
  const me = await requireAdmin("coupons");
  const body = await readJson(req, couponActionSchema, 1024);
  await couponAction(me.email, (await params).id, body.action);
  return ok();
});
