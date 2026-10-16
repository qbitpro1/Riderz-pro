import { clientIp, guardMutation, ok, readJson, route } from "@/lib/server/http";
import { CAN_SELL, requireVendor } from "@/lib/server/session";
import { requestBankChange } from "@/lib/server/vendor-account";
import { bankStepSchema } from "@/lib/vendor/validators";

export const dynamic = "force-dynamic";

/** Asks for a payout account change. Stored sealed; an admin approves it. One pending at a time. */
export const POST = route(async (req: Request) => {
  guardMutation(req);
  const vendor = await requireVendor(CAN_SELL);
  const input = await readJson(req, bankStepSchema);
  const pending = await requestBankChange(vendor, input, clientIp(req));
  return ok({ pending }, 201);
});
