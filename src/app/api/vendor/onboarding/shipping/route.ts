import { guardMutation, ok, readJson, route } from "@/lib/server/http";
import { saveShipping } from "@/lib/server/onboarding";
import { CAN_EDIT_ONBOARDING, requireVendor } from "@/lib/server/session";
import { shippingStepSchema } from "@/lib/vendor/validators";

export const dynamic = "force-dynamic";

/** Save the shipping step. While changes are requested, only flagged sections are accepted. */
export const PUT = route(async (req: Request) => {
  guardMutation(req);
  const vendor = await requireVendor(CAN_EDIT_ONBOARDING);
  const body = await readJson(req, shippingStepSchema);
  return ok({ vendor: await saveShipping(vendor.id, body) });
});
