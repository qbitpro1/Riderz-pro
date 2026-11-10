import { ok, route } from "@/lib/server/http";
import { requireAdmin } from "@/lib/server/admin-auth";
import { listLeadsAdmin } from "@/lib/server/leads";

export const dynamic = "force-dynamic";

/** GET ?status=&kind= → { items, counts }. Support role. */
export const GET = route(async (req: Request) => {
  await requireAdmin("support");
  const u = new URL(req.url);
  return ok(await listLeadsAdmin({ status: u.searchParams.get("status") ?? undefined, kind: u.searchParams.get("kind") ?? undefined }));
});
