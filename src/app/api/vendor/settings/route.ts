import { ok, clientIp, guardMutation, readJson, route } from "@/lib/server/http";
import { CAN_SELL, requireVendor } from "@/lib/server/session";
import { getSettings, settingsPatchSchema, updateSettings } from "@/lib/server/vendor-account";

export const dynamic = "force-dynamic";

export const GET = route(async () => {
  const vendor = await requireVendor(["approved", "suspended"]);
  return ok({ settings: await getSettings(vendor) });
});

/** Store profile, contact, shipping, returns and pickup address. No review needed. */
export const PATCH = route(async (req: Request) => {
  guardMutation(req);
  const vendor = await requireVendor(CAN_SELL);
  const patch = await readJson(req, settingsPatchSchema);
  await updateSettings(vendor, patch, clientIp(req));
  const fresh = await requireVendor(CAN_SELL);
  return ok({ settings: await getSettings(fresh) });
});
