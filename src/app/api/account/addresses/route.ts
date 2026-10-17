import { guardMutation, ok, readJson, route } from "@/lib/server/http";
import { listAddresses, requireCustomer, saveAddress } from "@/lib/server/customers";
import { addressSchema } from "@/lib/account/schemas";

export const dynamic = "force-dynamic";

/** GET → { addresses } */
export const GET = route(async () => {
  const me = await requireCustomer();
  return ok({ addresses: await listAddresses(me.id) });
});

/** POST { address fields } → { address } */
export const POST = route(async (req: Request) => {
  guardMutation(req);
  const me = await requireCustomer();
  const input = await readJson(req, addressSchema);
  return ok({ address: await saveAddress(me.id, input) }, 201);
});
