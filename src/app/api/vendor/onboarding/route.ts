import { ok, route } from "@/lib/server/http";
import { loadOnboarding } from "@/lib/server/onboarding";
import { CAN_EDIT_ONBOARDING, requireVendor } from "@/lib/server/session";

export const dynamic = "force-dynamic";

/** The signed-in vendor's onboarding state: answers, OTP availability, uploaded files, masked bank. */
export const GET = route(async () => {
  const vendor = await requireVendor(CAN_EDIT_ONBOARDING);
  return ok({ ...(await loadOnboarding(vendor.id)) });
});
