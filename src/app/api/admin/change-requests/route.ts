import { listChangeRequests } from "@/lib/server/admin-vendors";
import { ok, route } from "@/lib/server/http";

export const dynamic = "force-dynamic";

/** Bank change requests, pending first. The sealed payload is never returned. */
export const GET = route(async () => ok({ items: await listChangeRequests() }));
