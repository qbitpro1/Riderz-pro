import { ok, route } from "@/lib/server/http";
import { currentCustomer } from "@/lib/server/customers";
import { housekeeping } from "@/lib/server/housekeeping";

export const dynamic = "force-dynamic";

/** GET → { customer } (null when signed out). Asked on most page loads, so it also starts the hourly housekeeping safety net. */
export const GET = route(async () => {
  housekeeping();
  return ok({ customer: await currentCustomer() });
});
