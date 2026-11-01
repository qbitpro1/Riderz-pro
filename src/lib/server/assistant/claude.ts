import "server-only";

import { ApiError } from "../http";

/**
 * THE CLAUDE API, with a small tool loop (no SDK: one `fetch` per turn).
 *
 *   ANTHROPIC_API_KEY   required; without it the assistant answers "not switched on yet"
 *   ASSISTANT_MODEL     optional, default claude-sonnet-5-5
 *   ANTHROPIC_API_BASE  tests only (a local mock); ignored in production
 *
 * `runAssistant` sends the conversation with our tools, runs each tool the model asks for on the
 * server (our own catalogue, never the open web), and stops after MAX_STEPS rounds. Tool results
 * are data: the system prompt tells the model never to follow instructions found inside them.
 */

export const DEFAULT_MODEL = "claude-sonnet-5-5";
const MAX_STEPS = 5;
const MAX_TOKENS = 900;
const TIMEOUT_MS = 30_000;

const env = (k: string) => process.env[k]?.trim() || "";
export const assistantEnabled = () => Boolean(env("ANTHROPIC_API_KEY"));

function apiBase(): string {
  const override = env("ANTHROPIC_API_BASE");
  if (override && process.env.NODE_ENV !== "production") return override.replace(/\/+$/, "");
  return "https://api.anthropic.com";
}

export type Tool = {
  name: string;
  description: string;
  input_schema: Record<string, unknown>;
  /** Runs on the server. Returns what the model sees (kept small). */
  run: (input: Record<string, unknown>) => Promise<unknown>;
};

type TextBlock = { type: "text"; text: string };
type ToolUseBlock = { type: "tool_use"; id: string; name: string; input: Record<string, unknown> };
type ToolResultBlock = { type: "tool_result"; tool_use_id: string; content: string; is_error?: boolean };
type Block = TextBlock | ToolUseBlock | ToolResultBlock;
export type ClaudeMessage = { role: "user" | "assistant"; content: string | Block[] };

type ClaudeResponse = { content: Block[]; stop_reason: string; usage?: { input_tokens: number; output_tokens: number } };

async function callClaude(body: Record<string, unknown>): Promise<ClaudeResponse> {
  let res: Response;
  try {
    res = await fetch(`${apiBase()}/v1/messages`, {
      method: "POST",
      headers: { "x-api-key": env("ANTHROPIC_API_KEY"), "anthropic-version": "2023-06-01", "content-type": "application/json" },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
  } catch {
    throw new ApiError(502, "assistant_unreachable", "The assistant didn't answer. Please try again.");
  }
  if (!res.ok) {
    // Never pass the provider's answer (or our key) on; status only in the log.
    console.error(`[assistant] Claude API answered ${res.status}`);
    if (res.status === 429 || res.status === 529) throw new ApiError(503, "assistant_busy", "The assistant is busy right now. Please try again in a minute.");
    throw new ApiError(502, "assistant_error", "The assistant couldn't answer just now. Please try again.");
  }
  return (await res.json()) as ClaudeResponse;
}

export type Usage = { input: number; output: number };

export async function runAssistant(opts: { system: string; messages: ClaudeMessage[]; tools: Tool[] }): Promise<{ text: string; steps: number; usage: Usage }> {
  if (!assistantEnabled()) throw new ApiError(503, "assistant_off", "The AI assistant isn't switched on yet.");
  const byName = new Map(opts.tools.map((t) => [t.name, t]));
  const tools = opts.tools.map(({ name, description, input_schema }) => ({ name, description, input_schema }));
  const messages = [...opts.messages];
  let text = "";
  const usage: Usage = { input: 0, output: 0 };

  for (let step = 1; step <= MAX_STEPS; step++) {
    const r = await callClaude({ model: env("ASSISTANT_MODEL") || DEFAULT_MODEL, max_tokens: MAX_TOKENS, system: opts.system, messages, tools });
    usage.input += r.usage?.input_tokens ?? 0;
    usage.output += r.usage?.output_tokens ?? 0;
    const said = r.content.filter((b): b is TextBlock => b.type === "text").map((b) => b.text).join("\n").trim();
    if (said) text = said;
    const uses = r.content.filter((b): b is ToolUseBlock => b.type === "tool_use");
    if (r.stop_reason !== "tool_use" || uses.length === 0) return { text, steps: step, usage };

    messages.push({ role: "assistant", content: r.content });
    const results: ToolResultBlock[] = [];
    for (const u of uses) {
      const tool = byName.get(u.name);
      if (!tool) {
        results.push({ type: "tool_result", tool_use_id: u.id, content: "Unknown tool.", is_error: true });
        continue;
      }
      try {
        const out = await tool.run(u.input ?? {});
        results.push({ type: "tool_result", tool_use_id: u.id, content: JSON.stringify(out).slice(0, 12_000) });
      } catch (err) {
        console.error(`[assistant] tool ${u.name} failed:`, err instanceof Error ? err.message : err);
        results.push({ type: "tool_result", tool_use_id: u.id, content: "That lookup failed.", is_error: true });
      }
    }
    messages.push({ role: "user", content: results });
  }
  return { text: text || "Sorry, I couldn't finish that. Could you ask in a different way?", steps: MAX_STEPS, usage };
}

/** Text-only history from the browser → Claude messages (first must be the user's). */
export function historyToMessages(history: { role: "user" | "assistant"; content: string; note?: string }[]): ClaudeMessage[] {
  const out: ClaudeMessage[] = [];
  for (const m of history) {
    const content = (m.note ? `${m.content}\n\n${m.note}` : m.content).trim();
    if (!content) continue;
    const last = out[out.length - 1];
    if (last && last.role === m.role && typeof last.content === "string") last.content += `\n\n${content}`;
    else out.push({ role: m.role, content });
  }
  while (out.length && out[0].role !== "user") out.shift();
  return out;
}
