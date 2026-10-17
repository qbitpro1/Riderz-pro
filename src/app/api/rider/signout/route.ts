import { guardMutation, ok, route } from "@/lib/server/http";
import { signOutRider } from "@/lib/server/riders";

export const dynamic = "force-dynamic";

export const POST = route(async (req: Request) => {
  guardMutation(req);
  await signOutRider();
  return ok({ signedOut: true });
});
