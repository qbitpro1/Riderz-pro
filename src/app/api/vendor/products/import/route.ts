import { ApiError, guardMutation, ok, rateLimit, readJson, route } from "@/lib/server/http";
import { CAN_SELL, requireVendor } from "@/lib/server/session";
import { importCatalogue, importRequestSchema } from "@/lib/server/vendor-import";

export const dynamic = "force-dynamic";
// Photos named by link are downloaded one by one; a large catalogue takes a while.
export const maxDuration = 300;

/**
 * POST { products: [...], submit?: boolean } → { results, summary }
 * Creates every product under the signed-in seller (see src/lib/server/vendor-import.ts).
 */
export const POST = route(async (req: Request) => {
  guardMutation(req);
  const vendor = await requireVendor(CAN_SELL);
  await rateLimit(`product-import:${vendor.id}`, 20, 60 * 60);
  const body = await readJson(req, importRequestSchema, 2 * 1024 * 1024);
  if (!vendor.slug) throw new ApiError(409, "no_store", "Set your store name before adding products.");
  const { results } = await importCatalogue({ id: vendor.id, storeName: vendor.storeName }, body.products, body.submit);
  const count = (o: string) => results.filter((r) => r.outcome === o).length;
  return ok({ results, summary: { submitted: count("submitted"), draft: count("draft"), failed: count("failed") } }, 201);
});
