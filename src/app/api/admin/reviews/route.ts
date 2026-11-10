import { ok, route } from "@/lib/server/http";
import { requireAdmin } from "@/lib/server/admin-auth";
import { listReviewsAdmin } from "@/lib/server/reviews";

export const dynamic = "force-dynamic";

/** GET ?status=pending|approved|rejected → { items, counts }. Support role. */
export const GET = route(async (req: Request) => {
  await requireAdmin("support");
  const s = new URL(req.url).searchParams.get("status");
  return ok(await listReviewsAdmin(s === "approved" || s === "rejected" ? s : "pending"));
});
