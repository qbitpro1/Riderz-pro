import { ApiError, ok, route } from "@/lib/server/http";
import { listVendorOrders } from "@/lib/server/orders";
import { requireVendor } from "@/lib/server/session";
import { VENDOR_ORDER_STATUSES, type VendorOrderStatus } from "@/lib/vendor/types";

export const dynamic = "force-dynamic";

/** This seller's orders, newest first. `?status=` narrows to one status. */
export const GET = route(async (req: Request) => {
  const vendor = await requireVendor(["approved", "suspended"]);
  const status = new URL(req.url).searchParams.get("status");
  if (status && !(VENDOR_ORDER_STATUSES as readonly string[]).includes(status)) {
    throw new ApiError(400, "invalid", "Unknown status.");
  }
  const orders = await listVendorOrders(vendor.id, (status as VendorOrderStatus | null) ?? undefined);
  return ok({ orders });
});
