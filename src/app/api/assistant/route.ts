import { clientIp, guardMutation, ok, rateLimit, readJson, route, ApiError } from "@/lib/server/http";
import { askWebAssistant } from "@/lib/server/assistant/web";
import { askWebLocal } from "@/lib/server/assistant/web-local";
import { assistantEnabled } from "@/lib/server/assistant/claude";
import { onlinePaymentsEnabled } from "@/lib/server/payments";
import { ASSISTANT_MAX_CHARS, ASSISTANT_MAX_TURNS, assistantRequestSchema } from "@/lib/assistant/types";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

/**
 * Ask AI runs on the free engine (web-local.ts: no AI service, no cost). Set
 * WEB_ASSISTANT_ENGINE=claude (with ANTHROPIC_API_KEY) to answer with Claude instead; if Claude
 * fails or its daily limit is used up, the free engine answers.
 */
const useClaude = () => process.env.WEB_ASSISTANT_ENGINE?.trim() === "claude" && assistantEnabled();

/** GET → { enabled }: always on (the free engine needs no key). */
export const GET = route(async () => ok({ enabled: true }));

/**
 * POST { messages, car? } → { reply, products }. The conversation is sent each time (the server
 * keeps nothing); only the last ASSISTANT_MAX_TURNS messages are used.
 */
export const POST = route(async (req: Request) => {
  guardMutation(req);
  const ip = clientIp(req);
  const body = await readJson(req, assistantRequestSchema, 64 * 1024);
  const last = body.messages[body.messages.length - 1];
  if (last.role !== "user" || !last.content.trim()) throw new ApiError(400, "invalid", "Type a question first.");
  if (last.content.length > ASSISTANT_MAX_CHARS) throw new ApiError(400, "too_long", `Please keep it under ${ASSISTANT_MAX_CHARS} characters.`);
  await rateLimit(`assistant:ip:${ip}`, 30, 10 * 60);
  await rateLimit(`assistant:ip-day:${ip}`, 300, 24 * 60 * 60);
  const messages = body.messages.slice(-ASSISTANT_MAX_TURNS);
  const car = body.car ?? null;

  if (useClaude()) {
    try {
      await rateLimit("assistant:all-day", Number(process.env.ASSISTANT_DAILY_LIMIT ?? 3000), 24 * 60 * 60);
      const { text, products } = await askWebAssistant(messages, car);
      return ok({ reply: text, products });
    } catch (err) {
      console.error("[assistant] Claude unavailable, answering with the free engine:", err instanceof Error ? err.message : err);
    }
  }
  const { text, products } = await askWebLocal(messages, car, onlinePaymentsEnabled());
  return ok({ reply: text, products });
});
