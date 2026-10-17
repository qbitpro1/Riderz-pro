import { listVendorProducts, parseProductState } from "@/lib/server/admin-vendors";
import { ok, route } from "@/lib/server/http";
import { requireAdmin } from "@/lib/server/admin-auth";

export const dynamic = "force-dynamic";

/** ?state=pending|revisions|live|all&q= */
export const GET = route(async (req: Request) => {
  await requireAdmin("sellers");
  const url = new URL(req.url);
  return ok(await listVendorProducts(parseProductState(url.searchParams.get("state")), url.searchParams.get("q") ?? ""));
});
