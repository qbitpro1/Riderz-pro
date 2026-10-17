import { clientIp, guardMutation, ok, readJson, route } from "@/lib/server/http";
import { requireAdmin } from "@/lib/server/admin-auth";
import { demoStoreSchema, seedDemoStore } from "@/lib/server/demo-store";

export const dynamic = "force-dynamic";
// Copies product photos into the database; give it time.
export const maxDuration = 120;

/** Create or refresh the "Indus Enterprises" demo store (src/lib/server/demo-store.ts). */
export const POST = route(async (req: Request) => {
  guardMutation(req);
  const me = await requireAdmin("sellers");
  const body = await readJson(req, demoStoreSchema);
  const result = await seedDemoStore(body, { type: "admin", id: me.email }, clientIp(req));
  return ok({ result });
});
