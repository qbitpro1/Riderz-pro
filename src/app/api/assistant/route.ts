import { clientIp, guardMutation, ok, rateLimit, readJson, route, ApiError } from "@/lib/server/http";
import { askWebAssistant } from "@/lib/server/assistant/web";
import { assistantEnabled } from "@/lib/server/assistant/claude";
import { ASSISTANT_MAX_CHARS, ASSISTANT_MAX_TURNS, assistantRequestSchema } from "@/lib/assistant/types";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

/** GET → { enabled }: whether the assistant is switched on (ANTHROPIC_API_KEY set). */
export const GET = route(async () => ok({ enabled: assistantEnabled() }));

/**
 * POST { messages, car? } → { reply, products }. The conversation is sent each time (the server
 * keeps nothing); only the last ASSISTANT_MAX_TURNS messages are used. Limits per visitor and per
 * day keep the cost bounded.
 */
export const POST = route(async (req: Request) => {
  guardMutation(req);
  const ip = clientIp(req);
  const body = await readJson(req, assistantRequestSchema, 64 * 1024);
  const last = body.messages[body.messages.length - 1];
  if (last.role !== "user" || !last.content.trim()) throw new ApiError(400, "invalid", "Type a question first.");
  if (last.content.length > ASSISTANT_MAX_CHARS) throw new ApiError(400, "too_long", `Please keep it under ${ASSISTANT_MAX_CHARS} characters.`);
  await rateLimit(`assistant:ip:${ip}`, 20, 10 * 60);
  await rateLimit(`assistant:ip-day:${ip}`, 120, 24 * 60 * 60);
  await rateLimit("assistant:all-day", Number(process.env.ASSISTANT_DAILY_LIMIT ?? 3000), 24 * 60 * 60);
  const { text, products } = await askWebAssistant(body.messages.slice(-ASSISTANT_MAX_TURNS), body.car ?? null);
  return ok({ reply: text, products });
});
