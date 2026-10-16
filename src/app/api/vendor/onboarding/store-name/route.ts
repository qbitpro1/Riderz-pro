import { ApiError, ok, rateLimit, route } from "@/lib/server/http";
import { checkStoreName } from "@/lib/server/onboarding";
import { CAN_EDIT_ONBOARDING, requireVendor } from "@/lib/server/session";
import { slugify } from "@/lib/vendor/validators";

export const dynamic = "force-dynamic";

/** GET ?name= → { available, slug } — is the store name free, and a free address for it. */
export const GET = route(async (req: Request) => {
  const vendor = await requireVendor(CAN_EDIT_ONBOARDING);
  await rateLimit(`store-name:${vendor.id}`, 120, 10 * 60);
  const name = (new URL(req.url).searchParams.get("name") ?? "").trim().slice(0, 60);
  const base = slugify(name);
  if (name.length < 3 || base.length < 3) throw new ApiError(400, "invalid", "Enter at least 3 characters.", { storeName: "Use at least 3 characters" });
  return ok(await checkStoreName(vendor.id, name, base));
});
