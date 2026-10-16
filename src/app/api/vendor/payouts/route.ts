import { ok, route } from "@/lib/server/http";
import { payoutOverview } from "@/lib/server/payouts";
import { requireVendor } from "@/lib/server/session";

export const dynamic = "force-dynamic";

/** This seller's settlement summary, per-order amounts and payout history. Bank number shown as last four only. */
export const GET = route(async () => {
  const vendor = await requireVendor(["approved", "suspended"]);
  return ok({ ...(await payoutOverview(vendor.id)) });
});
