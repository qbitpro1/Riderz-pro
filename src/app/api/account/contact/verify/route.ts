import { guardMutation, ok, rateLimit, readJson, route } from "@/lib/server/http";
import { changeContact, requireCustomer } from "@/lib/server/customers";
import { verifyCodeSchema } from "@/lib/account/schemas";

export const dynamic = "force-dynamic";

/** POST { identifier, code } → the new mobile or email is saved, verified. */
export const POST = route(async (req: Request) => {
  guardMutation(req);
  const me = await requireCustomer();
  await rateLimit(`cust-contact-verify:${me.id}`, 15, 10 * 60);
  const { identifier, code } = await readJson(req, verifyCodeSchema);
  await changeContact(me.id, identifier, code);
  return ok({ channel: identifier.channel, value: identifier.target });
});
