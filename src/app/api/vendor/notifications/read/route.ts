import { guardMutation, ok, readJson, route } from "@/lib/server/http";
import { requireVendor } from "@/lib/server/session";
import { listNotifications, markNotificationsRead, markReadSchema } from "@/lib/server/vendor-account";

export const dynamic = "force-dynamic";

/** { ids?: string[], all?: boolean } — only the caller's own notifications are touched. */
export const POST = route(async (req: Request) => {
  guardMutation(req);
  const vendor = await requireVendor();
  const input = await readJson(req, markReadSchema);
  await markNotificationsRead(vendor.id, input);
  const { unread } = await listNotifications(vendor.id);
  return ok({ unread });
});
