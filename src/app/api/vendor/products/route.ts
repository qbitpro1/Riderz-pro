import { ApiError, guardMutation, ok, rateLimit, readJson, route } from "@/lib/server/http";
import { CAN_SELL, requireVendor } from "@/lib/server/session";
import { createProduct, createProductSchema, listProducts, listQuerySchema } from "@/lib/server/vendor-catalogue";

export const dynamic = "force-dynamic";

/** GET ?status=&q= → { products: VendorProduct[] } (this vendor's own). */
export const GET = route(async (req: Request) => {
  const vendor = await requireVendor(["approved", "suspended"]);
  const url = new URL(req.url);
  const parsed = listQuerySchema.safeParse({
    status: url.searchParams.get("status") || undefined,
    q: url.searchParams.get("q") || undefined,
  });
  if (!parsed.success) throw new ApiError(400, "invalid", "That filter is not valid.");
  return ok({ products: await listProducts(vendor.id, parsed.data) });
});

/** POST { content, commercial, submit } → 201 { product } */
export const POST = route(async (req: Request) => {
  guardMutation(req);
  const vendor = await requireVendor(CAN_SELL);
  await rateLimit(`product-create:${vendor.id}`, 200, 60 * 60);
  const body = await readJson(req, createProductSchema, 256 * 1024);
  return ok({ product: await createProduct(vendor.id, body) }, 201);
});
