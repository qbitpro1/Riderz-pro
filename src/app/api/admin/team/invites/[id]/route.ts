import { guardMutation, ok, route } from "@/lib/server/http";
import { requireAdmin, revokeInvite } from "@/lib/server/admin-auth";

export const dynamic = "force-dynamic";

/** Cancels an open invite or reset link. */
export const DELETE = route(async (req: Request, { params }: { params: Promise<{ id: string }> }) => {
  guardMutation(req);
  const me = await requireAdmin("team");
  await revokeInvite(me, (await params).id);
  return ok();
});
