import { guardMutation, ok, readJson, route } from "@/lib/server/http";
import { applyRider, requireRiderSession } from "@/lib/server/riders";
import { applySchema } from "@/lib/rider/types";

export const dynamic = "force-dynamic";

/** POST { application } → { rider } (new, or resubmitted after changes were asked for). */
export const POST = route(async (req: Request) => {
  guardMutation(req);
  const { mobile } = await requireRiderSession();
  const input = await readJson(req, applySchema);
  return ok({ rider: await applyRider(mobile, input) });
});
