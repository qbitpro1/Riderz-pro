import { ok, route } from "@/lib/server/http";
import { requireVendor } from "@/lib/server/session";
import { listNotifications } from "@/lib/server/vendor-account";

export const dynamic = "force-dynamic";

/** Newest first, last 100, plus the unread count. */
export const GET = route(async () => {
  const vendor = await requireVendor();
  return ok(await listNotifications(vendor.id));
});
