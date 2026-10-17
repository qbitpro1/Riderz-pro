import { ApiError, ok, route } from "@/lib/server/http";
import { requireAdmin } from "@/lib/server/admin-auth";
import { listAdminOrders } from "@/lib/server/orders";
import { ORDER_STATUSES, type OrderStatus } from "@/components/admin/orders/types";

export const dynamic = "force-dynamic";

/** All orders, newest first. `?status=placed|confirmed|completed|cancelled`, `?q=` order number, name or phone. */
export const GET = route(async (req: Request) => {
  await requireAdmin("orders.view");
  const params = new URL(req.url).searchParams;
  const status = params.get("status");
  if (status && !(ORDER_STATUSES as readonly string[]).includes(status)) throw new ApiError(400, "invalid", "Unknown status.");
  const orders = await listAdminOrders({ status: (status as OrderStatus | null) ?? undefined, q: params.get("q") ?? undefined });
  return ok({ orders });
});
