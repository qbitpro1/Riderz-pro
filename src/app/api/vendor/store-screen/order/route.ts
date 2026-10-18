import { ApiError, ok, route } from "@/lib/server/http";
import { CAN_SELL, requireVendor } from "@/lib/server/session";
import { storeOrderStatus } from "@/lib/server/store-sales";

export const dynamic = "force-dynamic";

/** GET ?number=RZP-… → where one of this shop's screen orders stands (for the waiting screen). */
export const GET = route(async (req: Request) => {
  const vendor = await requireVendor(CAN_SELL, { whileLocked: true });
  const number = new URL(req.url).searchParams.get("number") ?? "";
  if (!/^RZP-[A-Z0-9]{6}$/.test(number)) throw new ApiError(400, "invalid", "Unknown order.");
  const o = await storeOrderStatus(vendor.id, number);
  if (!o) throw new ApiError(404, "not_found", "Order not found.");
  return ok({ order: { number: o.number, total: o.total, status: o.status, paymentMethod: o.payment_method, paymentStatus: o.payment_status, partStatus: o.part_status } });
});
