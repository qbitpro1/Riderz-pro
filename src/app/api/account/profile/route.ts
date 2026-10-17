import { guardMutation, ok, readJson, route } from "@/lib/server/http";
import { requireCustomer, updateName } from "@/lib/server/customers";
import { profileSchema } from "@/lib/account/schemas";

export const dynamic = "force-dynamic";

/** PATCH { name } */
export const PATCH = route(async (req: Request) => {
  guardMutation(req);
  const me = await requireCustomer();
  const { name } = await readJson(req, profileSchema);
  await updateName(me.id, name);
  return ok({ name });
});
