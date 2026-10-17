import { clientIp, guardMutation, ok, rateLimit, readJson, route } from "@/lib/server/http";
import { createTicket, currentCustomer } from "@/lib/server/customers";
import { ticketSchema } from "@/lib/account/schemas";

export const dynamic = "force-dynamic";

/** POST { name, mobile, email?, orderNumber?, topic, body } → { ticket: { id } }. Guests welcome. */
export const POST = route(async (req: Request) => {
  guardMutation(req);
  await rateLimit(`ticket-ip:${clientIp(req)}`, 5, 60 * 60);
  const input = await readJson(req, ticketSchema, 16 * 1024);
  const me = await currentCustomer();
  return ok({ ticket: await createTicket(input, me?.id ?? null) }, 201);
});
