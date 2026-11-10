import { ok, route } from "@/lib/server/http";
import { requireAdmin } from "@/lib/server/admin-auth";
import { listCatalogAdmin } from "@/lib/server/catalog";

export const dynamic = "force-dynamic";

/** GET ?q=&brand=&filter=&page= → { rows, total, counts } the catalogue as stored. Catalogue role. */
export const GET = route(async (req: Request) => {
  await requireAdmin("catalog");
  const u = new URL(req.url);
  return ok(await listCatalogAdmin({ q: u.searchParams.get("q") ?? undefined, brand: u.searchParams.get("brand") ?? undefined, filter: u.searchParams.get("filter") ?? undefined, page: Number(u.searchParams.get("page") ?? 1) || 1 }));
});
