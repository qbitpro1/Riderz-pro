import { ok, route } from "@/lib/server/http";
import { requireVendor } from "@/lib/server/session";
import { vendorOverview } from "@/lib/server/vendor-catalogue";

export const dynamic = "force-dynamic";

/** GET → { overview: { kpis, recentOrders, attention } } for the signed-in vendor. */
export const GET = route(async () => {
  const vendor = await requireVendor(["approved", "suspended"]);
  return ok({ overview: await vendorOverview(vendor.id, vendor.commissionRate) });
});
