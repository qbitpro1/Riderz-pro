import { vendorReview } from "@/lib/server/admin-vendors";
import { ApiError, ok, route } from "@/lib/server/http";

export const dynamic = "force-dynamic";

/** The full application for review. Secrets are never included (see ./reveal). */
export const GET = route(async (_req: Request, { params }: { params: Promise<{ id: string }> }) => {
  const review = await vendorReview((await params).id);
  if (!review) throw new ApiError(404, "not_found", "Seller not found.");
  return ok({ review });
});
