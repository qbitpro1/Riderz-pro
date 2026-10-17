import { ok, route } from "@/lib/server/http";
import { currentCustomer } from "@/lib/server/customers";

export const dynamic = "force-dynamic";

/** GET → { customer } (null when signed out). */
export const GET = route(async () => ok({ customer: await currentCustomer() }));
