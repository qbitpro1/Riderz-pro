import { guardMutation, ok, readJson, route } from "@/lib/server/http";
import { saveTax } from "@/lib/server/onboarding";
import { CAN_EDIT_ONBOARDING, requireVendor } from "@/lib/server/session";
import { taxStepSchema } from "@/lib/vendor/validators";

export const dynamic = "force-dynamic";

/** Save the tax step. While changes are requested, only flagged sections are accepted. */
export const PUT = route(async (req: Request) => {
  guardMutation(req);
  const vendor = await requireVendor(CAN_EDIT_ONBOARDING);
  const body = await readJson(req, taxStepSchema);
  return ok({ vendor: await saveTax(vendor.id, body) });
});
