import { clientIp, guardMutation, ok, readJson, route } from "@/lib/server/http";
import { requireAdmin } from "@/lib/server/admin-auth";
import { catalogEditSchema, updateCatalogProduct } from "@/lib/server/catalog";

export const dynamic = "force-dynamic";

/** PUT { price, mrp, stock, status } — a catalogue product's price, MRP, stock count (null = not counted) and live/hidden. Catalogue role. */
export const PUT = route(async (req: Request, { params }: { params: Promise<{ slug: string }> }) => {
  guardMutation(req);
  const me = await requireAdmin("catalog");
  const input = await readJson(req, catalogEditSchema);
  await updateCatalogProduct((await params).slug, input, me.email, clientIp(req));
  return ok();
});
