import { guardMutation, ok, route } from "@/lib/server/http";
import { CAN_SELL, requireVendor } from "@/lib/server/session";
import { duplicateProduct } from "@/lib/server/vendor-catalogue";

export const dynamic = "force-dynamic";

/** POST → 201 { product } — a copy as a new draft with SKU suffix "-copy" and stock 0. */
export const POST = route(async (req: Request, { params }: { params: Promise<{ id: string }> }) => {
  guardMutation(req);
  const vendor = await requireVendor(CAN_SELL);
  return ok({ product: await duplicateProduct(vendor.id, (await params).id) }, 201);
});
