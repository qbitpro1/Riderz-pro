import { ok, route } from "@/lib/server/http";
import { dispatchPositions } from "@/lib/server/tracking";

export const dynamic = "force-dynamic";

/** GET → { riders } — each live job's last rider position and open off-route alert (dispatch board). */
export const GET = route(async () => ok({ riders: await dispatchPositions() }));
