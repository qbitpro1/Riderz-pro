import { ApiError, guardMutation, ok, readJson, route } from "@/lib/server/http";
import { CAN_SELL, requireVendor } from "@/lib/server/session";
import { deleteDraft, getProduct, updateProduct, updateProductSchema } from "@/lib/server/vendor-catalogue";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

/** GET → { product } */
export const GET = route(async (_req: Request, { params }: Ctx) => {
  const vendor = await requireVendor(["approved", "suspended"]);
  const product = await getProduct(vendor.id, (await params).id);
  if (!product) throw new ApiError(404, "not_found", "Product not found.");
  return ok({ product });
});

/** PATCH { content?, commercial?, submit? } → { product } */
export const PATCH = route(async (req: Request, { params }: Ctx) => {
  guardMutation(req);
  const vendor = await requireVendor(CAN_SELL);
  const body = await readJson(req, updateProductSchema, 256 * 1024);
  return ok({ product: await updateProduct(vendor.id, (await params).id, body) });
});

/** DELETE → { deleted: true } — drafts that never went live only. */
export const DELETE = route(async (req: Request, { params }: Ctx) => {
  guardMutation(req);
  const vendor = await requireVendor(CAN_SELL);
  await deleteDraft(vendor.id, (await params).id);
  return ok({ deleted: true });
});
