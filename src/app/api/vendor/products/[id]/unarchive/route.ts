import { guardMutation, ok, route } from "@/lib/server/http";
import { CAN_SELL, requireVendor } from "@/lib/server/session";
import { unarchiveProduct } from "@/lib/server/vendor-catalogue";

export const dynamic = "force-dynamic";

/** POST → { product } — archived → draft. */
export const POST = route(async (req: Request, { params }: { params: Promise<{ id: string }> }) => {
  guardMutation(req);
  const vendor = await requireVendor(CAN_SELL);
  return ok({ product: await unarchiveProduct(vendor.id, (await params).id) });
});
