import { ApiError, ok, route } from "@/lib/server/http";
import { vendorOrderDetail } from "@/lib/server/orders";
import { requireVendor } from "@/lib/server/session";

export const dynamic = "force-dynamic";

/** One of this seller's orders, with what they need to ship it. Other sellers' items are never included. */
export const GET = route(async (_req: Request, { params }: { params: Promise<{ id: string }> }) => {
  const vendor = await requireVendor(["approved", "suspended"]);
  const order = await vendorOrderDetail(vendor.id, (await params).id);
  if (!order) throw new ApiError(404, "not_found", "Order not found.");
  return ok({ order });
});
