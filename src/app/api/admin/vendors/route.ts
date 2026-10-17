import { listVendors, parseVendorFilter } from "@/lib/server/admin-vendors";
import { ok, route } from "@/lib/server/http";
import { requireAdmin } from "@/lib/server/admin-auth";

export const dynamic = "force-dynamic";

/** KYC queue. ?status=queue|all|<status>&q=  (default: submitted + under_review + changes_requested). Sellers role. */
export const GET = route(async (req: Request) => {
  await requireAdmin("sellers");
  const url = new URL(req.url);
  const result = await listVendors(parseVendorFilter(url.searchParams.get("status")), url.searchParams.get("q") ?? "");
  return ok(result);
});
