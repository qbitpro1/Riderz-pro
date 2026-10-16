import { clientIp, guardMutation, ok, readJson, route } from "@/lib/server/http";
import { CAN_SELL, requireVendor } from "@/lib/server/session";
import { holidaySchema, setHoliday } from "@/lib/server/vendor-account";

export const dynamic = "force-dynamic";

export const POST = route(async (req: Request) => {
  guardMutation(req);
  const vendor = await requireVendor(CAN_SELL);
  const { on } = await readJson(req, holidaySchema);
  await setHoliday(vendor, on, clientIp(req));
  return ok({ holidayMode: on });
});
