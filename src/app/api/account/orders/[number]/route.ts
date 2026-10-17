import { ApiError, ok, route } from "@/lib/server/http";
import { customerOrderDetail, requireCustomer } from "@/lib/server/customers";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ number: string }> };

/** GET → { order } — only the signed-in customer's own order; any other number is "not found". */
export const GET = route(async (_req: Request, { params }: Ctx) => {
  const me = await requireCustomer();
  const number = (await params).number.toUpperCase();
  const order = /^RZP-[A-Z0-9]{6}$/.test(number) ? await customerOrderDetail(me.id, number) : null;
  if (!order) throw new ApiError(404, "not_found", "Order not found.");
  return ok({ order });
});
