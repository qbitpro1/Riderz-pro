import { ok, route } from "@/lib/server/http";
import { listCustomerOrders, requireCustomer } from "@/lib/server/customers";

export const dynamic = "force-dynamic";

/** GET → { orders } — the signed-in customer's orders, newest first. */
export const GET = route(async () => {
  const me = await requireCustomer();
  return ok({ orders: await listCustomerOrders(me.id) });
});
