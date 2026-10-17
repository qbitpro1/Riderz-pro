import { ok, route } from "@/lib/server/http";
import { onlinePaymentsEnabled } from "@/lib/server/payments";

export const dynamic = "force-dynamic";

/** Whether the cart can offer "Pay online". Never returns a key or secret. */
export const GET = route(async () => ok({ enabled: onlinePaymentsEnabled() }));
