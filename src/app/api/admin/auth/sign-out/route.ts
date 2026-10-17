import { guardMutation, ok, route } from "@/lib/server/http";
import { signOutAdmin } from "@/lib/server/admin-auth";

export const dynamic = "force-dynamic";

export const POST = route(async (req: Request) => {
  guardMutation(req);
  await signOutAdmin();
  return ok();
});
