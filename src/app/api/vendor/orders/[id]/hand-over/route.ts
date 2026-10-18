import { clientIp, guardMutation, ok, route } from "@/lib/server/http";
import { CAN_SELL, requireVendor } from "@/lib/server/session";
import { handOverStoreOrder } from "@/lib/server/store-sales";

export const dynamic = "force-dynamic";

/** [id] is the seller's part of a shop screen order: goods handed over (and paid, at the counter). */
export const POST = route(async (req: Request, { params }: { params: Promise<{ id: string }> }) => {
  guardMutation(req);
  const vendor = await requireVendor(CAN_SELL);
  await handOverStoreOrder(vendor.id, (await params).id, clientIp(req));
  return ok();
});
