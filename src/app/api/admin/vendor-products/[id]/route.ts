import { productReview } from "@/lib/server/admin-vendors";
import { ApiError, ok, route } from "@/lib/server/http";

export const dynamic = "force-dynamic";

export const GET = route(async (_req: Request, { params }: { params: Promise<{ id: string }> }) => {
  const review = await productReview((await params).id);
  if (!review) throw new ApiError(404, "not_found", "Product not found.");
  return ok({ review });
});
