import { guardMutation, ok, route } from "@/lib/server/http";
import { endSession } from "@/lib/server/session";

export const dynamic = "force-dynamic";

export const POST = route(async (req: Request) => {
  guardMutation(req);
  await endSession();
  return ok({ next: "/vendor/auth" });
});
