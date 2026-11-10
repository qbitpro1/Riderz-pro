import { clientIp, guardMutation, ok, readJson, route } from "@/lib/server/http";
import { requireAdmin } from "@/lib/server/admin-auth";
import { carSchema, saveCar } from "@/lib/server/cars";

export const dynamic = "force-dynamic";

/** PUT car → { car: { id, slug } } saves every field (status live / sold / archived included). */
export const PUT = route(async (req: Request, { params }: { params: Promise<{ id: string }> }) => {
  guardMutation(req);
  const me = await requireAdmin("catalog");
  const input = await readJson(req, carSchema);
  return ok({ car: await saveCar((await params).id, input, me.email, clientIp(req)) });
});
