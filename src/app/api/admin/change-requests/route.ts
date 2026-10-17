import { listChangeRequests } from "@/lib/server/admin-vendors";
import { ok, route } from "@/lib/server/http";
import { requireAdmin } from "@/lib/server/admin-auth";

export const dynamic = "force-dynamic";

/** Bank change requests, pending first. The sealed payload is never returned. */
export const GET = route(async () => {
  await requireAdmin("sellers");
  return ok({ items: await listChangeRequests() });
});
