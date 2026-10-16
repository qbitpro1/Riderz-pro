import { ok, route } from "@/lib/server/http";
import { requireVendor } from "@/lib/server/session";
import { otpDeliveryAvailable } from "@/lib/server/otp";
import { vendorHome } from "@/lib/vendor/types";

export const dynamic = "force-dynamic";

/** The signed-in vendor (no secrets) and where they belong. */
export const GET = route(async () => {
  const vendor = await requireVendor();
  return ok({
    vendor,
    home: vendorHome(vendor.status),
    otp: { email: otpDeliveryAvailable("email"), mobile: otpDeliveryAvailable("mobile") },
  });
});
