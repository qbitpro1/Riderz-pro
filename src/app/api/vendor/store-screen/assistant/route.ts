import { z } from "zod";
import { ApiError, guardMutation, ok, rateLimit, readJson, route } from "@/lib/server/http";
import { CAN_SELL, requireVendor } from "@/lib/server/session";
import { askStoreAssistant } from "@/lib/server/assistant/store";
import { storeSettings } from "@/lib/server/store-sales";
import { ASSISTANT_MAX_CHARS, ASSISTANT_MAX_TURNS, assistantRequestSchema } from "@/lib/assistant/types";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

const schema = assistantRequestSchema.extend({
  cart: z.array(z.object({ id: z.string().max(80), qty: z.number().int().min(1).max(99) })).max(60).default([]),
  offerId: z.string().regex(/^sof_[A-Za-z0-9_-]{6,40}$/).nullable().optional(),
});

/** The shop screen's AI salesperson (the signed-in seller's screen; works while it is locked). */
export const POST = route(async (req: Request) => {
  guardMutation(req);
  const vendor = await requireVendor(CAN_SELL, { whileLocked: true });
  if (!(await storeSettings(vendor.id)).aiEnabled) throw new ApiError(403, "assistant_off", "The AI assistant is switched off for this shop.");
  const body = await readJson(req, schema, 64 * 1024);
  const last = body.messages[body.messages.length - 1];
  if (last.role !== "user" || !last.content.trim()) throw new ApiError(400, "invalid", "Say or type a question first.");
  if (last.content.length > ASSISTANT_MAX_CHARS) throw new ApiError(400, "too_long", "Please keep it shorter.");
  await rateLimit(`store-assistant:${vendor.id}`, 60, 10 * 60);
  await rateLimit(`store-assistant-day:${vendor.id}`, Number(process.env.STORE_ASSISTANT_DAILY_LIMIT ?? 800), 24 * 60 * 60);
  const r = await askStoreAssistant(vendor, { messages: body.messages.slice(-ASSISTANT_MAX_TURNS), cart: body.cart, car: body.car ?? null, offerId: body.offerId ?? null });
  return ok({ reply: r.text, products: r.products, actions: r.actions });
});
