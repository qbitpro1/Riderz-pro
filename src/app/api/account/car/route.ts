import { guardMutation, ok, readJson, route } from "@/lib/server/http";
import { requireCustomer, setCar } from "@/lib/server/customers";
import { carSchema } from "@/lib/account/schemas";

export const dynamic = "force-dynamic";

/** PUT { car | null } — the car chosen in "What do you drive?". */
export const PUT = route(async (req: Request) => {
  guardMutation(req);
  const me = await requireCustomer();
  const { car } = await readJson(req, carSchema);
  await setCar(me.id, car);
  return ok({ car });
});
