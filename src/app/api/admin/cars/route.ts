import { clientIp, guardMutation, ok, readJson, route } from "@/lib/server/http";
import { requireAdmin } from "@/lib/server/admin-auth";
import { carSchema, listCarsAdmin, saveCar } from "@/lib/server/cars";

export const dynamic = "force-dynamic";

/** GET → { cars } every car, drafts and archived too. Catalogue role. */
export const GET = route(async () => {
  await requireAdmin("catalog");
  return ok({ cars: await listCarsAdmin() });
});

/** POST car → 201 { car: { id, slug } }. */
export const POST = route(async (req: Request) => {
  guardMutation(req);
  const me = await requireAdmin("catalog");
  const input = await readJson(req, carSchema);
  return ok({ car: await saveCar(null, input, me.email, clientIp(req)) }, 201);
});
