import { ApiError, ok, route } from "@/lib/server/http";
import { requireAdmin } from "@/lib/server/admin-auth";
import { sellerReport } from "@/lib/server/admin-reports";

export const dynamic = "force-dynamic";

const DAY = /^\d{4}-\d{2}-\d{2}$/;
const istDay = (days = 0) => new Date(Date.now() + 5.5 * 3600 * 1000 + days * 86400 * 1000).toISOString().slice(0, 10);

/**
 * GET ?from=&to=&vendor= → { report } sales, commission and payouts per seller (India dates, both
 * included; default the last 30 days). With `vendor`, only that seller, plus their daily sales and
 * best products. Reports role.
 */
export const GET = route(async (req: Request) => {
  await requireAdmin("reports");
  const u = new URL(req.url);
  const from = u.searchParams.get("from") || istDay(-29);
  const to = u.searchParams.get("to") || istDay();
  const vendor = u.searchParams.get("vendor") || null;
  if (!DAY.test(from) || !DAY.test(to) || from > to) throw new ApiError(400, "invalid", "Choose a valid date range.");
  if (vendor && !/^ven_[A-Za-z0-9_-]{10,40}$/.test(vendor)) throw new ApiError(400, "invalid", "Unknown seller.");
  const report = await sellerReport({ from, to }, vendor);
  return ok({ ...report });
});
