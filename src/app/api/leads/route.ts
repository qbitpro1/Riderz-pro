import { clientIp, guardMutation, ok, rateLimit, readJson, route } from "@/lib/server/http";
import { leadSchema, saveLead } from "@/lib/server/leads";
import { currentCustomer } from "@/lib/server/customers";

export const dynamic = "force-dynamic";

/** POST { kind, name?, phone?, email?, city?, details, message, page? } → 201. Guests welcome; a signed-in customer is linked. */
export const POST = route(async (req: Request) => {
  guardMutation(req);
  await rateLimit(`lead:${clientIp(req)}`, 30, 10 * 60);
  const input = await readJson(req, leadSchema, 16 * 1024);
  const me = await currentCustomer().catch(() => null);
  return ok({ lead: await saveLead(input, me?.id ?? null) }, 201);
});
