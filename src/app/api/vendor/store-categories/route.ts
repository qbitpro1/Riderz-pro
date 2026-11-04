import { guardMutation, ok, rateLimit, readJson, route } from "@/lib/server/http";
import { CAN_SELL, requireVendor } from "@/lib/server/session";
import { listStoreCategories, storeCategoryAction, storeCategoryActionSchema } from "@/lib/server/store-categories";

export const dynamic = "force-dynamic";

/** GET → { categories } — this seller's own shop categories and sub-categories. */
export const GET = route(async () => {
  const vendor = await requireVendor(["approved", "suspended"]);
  return ok({ categories: await listStoreCategories(vendor.id) });
});

/** POST { action: create | rename | move | delete, … } → { categories } */
export const POST = route(async (req: Request) => {
  guardMutation(req);
  const vendor = await requireVendor(CAN_SELL);
  await rateLimit(`store-categories:${vendor.id}`, 300, 60 * 60);
  const body = await readJson(req, storeCategoryActionSchema, 4 * 1024);
  return ok({ categories: await storeCategoryAction(vendor.id, body) });
});
