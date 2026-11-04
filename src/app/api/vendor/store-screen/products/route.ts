import { ok, route } from "@/lib/server/http";
import { requireVendor } from "@/lib/server/session";
import { screenCategories, screenFitment, screenProducts } from "@/lib/server/store-screen";

export const dynamic = "force-dynamic";

/**
 * GET → { products, categories, fitment } — what the open store screen shows right now. The screen asks
 * every few seconds, so a product the seller just saved appears without touching the tablet.
 */
export const GET = route(async () => {
  const vendor = await requireVendor(["approved"], { whileLocked: true });
  const [products, categories] = await Promise.all([screenProducts(vendor.id), screenCategories(vendor.id)]);
  return ok({ products, categories, fitment: screenFitment(products) });
});
