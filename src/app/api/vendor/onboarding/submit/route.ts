import { guardMutation, ok, rateLimit, route } from "@/lib/server/http";
import { submitApplication } from "@/lib/server/onboarding";
import { CAN_EDIT_ONBOARDING, requireVendor } from "@/lib/server/session";

export const dynamic = "force-dynamic";

/** Submit (or resubmit) the application for KYC review. */
export const POST = route(async (req: Request) => {
  guardMutation(req);
  const vendor = await requireVendor(CAN_EDIT_ONBOARDING);
  await rateLimit(`onboarding-submit:${vendor.id}`, 10, 60 * 60);
  await submitApplication(vendor.id);
  return ok({ next: "/vendor/pending" });
});
