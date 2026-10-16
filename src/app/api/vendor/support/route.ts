import { clientIp, guardMutation, ok, readJson, route } from "@/lib/server/http";
import { requireVendor } from "@/lib/server/session";
import { createTicket, listTickets, ticketSchema } from "@/lib/server/vendor-account";

export const dynamic = "force-dynamic";

const ALLOW = ["approved", "suspended"] as const;

export const GET = route(async () => {
  const vendor = await requireVendor(ALLOW);
  return ok({ tickets: await listTickets(vendor.id) });
});

/** Raise a ticket (10 per day). Suspended sellers can still write to support. */
export const POST = route(async (req: Request) => {
  guardMutation(req);
  const vendor = await requireVendor(ALLOW);
  const input = await readJson(req, ticketSchema);
  const ticket = await createTicket(vendor, input, clientIp(req));
  return ok({ ticket }, 201);
});
