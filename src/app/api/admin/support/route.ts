import { listTickets } from "@/lib/server/admin-vendors";
import { ok, route } from "@/lib/server/http";

export const dynamic = "force-dynamic";

/** ?status=open|answered|closed|all (default open first, all statuses) */
export const GET = route(async (req: Request) => {
  const s = new URL(req.url).searchParams.get("status");
  const filter = s === "open" || s === "answered" || s === "closed" ? s : "all";
  return ok(await listTickets(filter));
});
