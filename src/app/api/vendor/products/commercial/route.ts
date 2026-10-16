import { guardMutation, ok, readJson, route } from "@/lib/server/http";
import { CAN_SELL, requireVendor } from "@/lib/server/session";
import { bulkCommercial, bulkCommercialSchema } from "@/lib/server/vendor-catalogue";

export const dynamic = "force-dynamic";

/** PATCH { items: [{ id, stock?, lowStockAt?, price?, mrp? }] } (max 200) → { products } — one transaction. */
export const PATCH = route(async (req: Request) => {
  guardMutation(req);
  const vendor = await requireVendor(CAN_SELL);
  const { items } = await readJson(req, bulkCommercialSchema, 128 * 1024);
  return ok({ products: await bulkCommercial(vendor.id, items) });
});
