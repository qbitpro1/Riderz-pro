import { ApiError, ok, rateLimit, route } from "@/lib/server/http";
import { requireCustomer } from "@/lib/server/customers";
import { customerTracking } from "@/lib/server/tracking";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ number: string }> };

/**
 * GET → { tracking: { live, deliveryPoint, jobs } } — live rider tracking for the signed-in
 * customer's own order (polled every 10 s by the order page while a rider job is live). Any other
 * number is "not found". The rider's position appears only while they carry this parcel.
 */
export const GET = route(async (_req: Request, { params }: Ctx) => {
  const me = await requireCustomer();
  const number = (await params).number.toUpperCase();
  if (!/^RZP-[A-Z0-9]{6}$/.test(number)) throw new ApiError(404, "not_found", "Order not found.");
  await rateLimit(`track:${me.id}`, 40, 60);
  const tracking = await customerTracking(me.id, number);
  if (!tracking) throw new ApiError(404, "not_found", "Order not found.");
  return ok({ tracking });
});
