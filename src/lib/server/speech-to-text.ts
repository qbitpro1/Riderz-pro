import "server-only";

import { ApiError } from "@/lib/server/http";

/**
 * SPEECH TO TEXT for the shop screen's mic, used when the browser has no speech recognition of its
 * own (a TV set-top box browser such as JioSphere). The screen records the customer's voice and
 * sends it here; a provider turns it into text.
 *
 * Off unless SPEECH_TO_TEXT_PROVIDER names a provider and its key is set. Providers:
 *   sarvam  Sarvam AI (https://docs.sarvam.ai): Indian English, Hindi and Hinglish. SARVAM_API_KEY.
 * To add one: write a `Provider` below and list it in PROVIDERS.
 *
 * Audio and transcripts are never logged or stored.
 */

export type Transcribe = (audio: Blob, filename: string) => Promise<string>;
type Provider = { name: string; configured: () => boolean; transcribe: Transcribe };

const env = (k: string) => process.env[k]?.trim() || "";
/** The outbound call gives up after this long (the customer is waiting at the screen). */
const TIMEOUT_MS = 15_000;

const sarvam: Provider = {
  name: "sarvam",
  configured: () => Boolean(env("SARVAM_API_KEY")),
  async transcribe(audio, filename) {
    const form = new FormData();
    form.append("file", audio, filename);
    form.append("model", env("SARVAM_STT_MODEL") || "saaras:v3");
    // translit: Hindi comes back in Latin letters ("seat cover dikhao"), which Salesman AI and the
    // shop search understand. English stays English. "unknown": Sarvam detects the language.
    form.append("mode", env("SARVAM_STT_MODE") || "translit");
    form.append("language_code", env("SARVAM_STT_LANGUAGE") || "unknown");
    let res: Response;
    try {
      res = await fetch("https://api.sarvam.ai/speech-to-text", {
        method: "POST",
        headers: { "api-subscription-key": env("SARVAM_API_KEY") },
        body: form,
        signal: AbortSignal.timeout(TIMEOUT_MS),
        cache: "no-store",
      });
    } catch (err) {
      const timedOut = err instanceof Error && (err.name === "TimeoutError" || err.name === "AbortError");
      console.error(`[speech-to-text] sarvam ${timedOut ? "timed out" : "unreachable"}`);
      throw new ApiError(503, "stt_unavailable", "Voice typing didn't answer in time. Please try again or type.");
    }
    if (!res.ok) {
      // Status only: the body could echo the request.
      console.error(`[speech-to-text] sarvam answered ${res.status}`);
      if (res.status === 429) throw new ApiError(503, "stt_busy", "Voice typing is busy. Please try again in a minute or type.");
      throw new ApiError(503, "stt_unavailable", "Voice typing isn't working right now. Please type instead.");
    }
    const data = (await res.json().catch(() => null)) as { transcript?: unknown } | null;
    return typeof data?.transcript === "string" ? data.transcript : "";
  },
};

const PROVIDERS: Record<string, Provider> = { sarvam };

/** The provider in use, or null when voice typing is off (no provider chosen, or its key missing). */
export function speechProvider(): Provider | null {
  const p = PROVIDERS[env("SPEECH_TO_TEXT_PROVIDER").toLowerCase()];
  return p && p.configured() ? p : null;
}

/** Why voice typing is off although a provider is chosen (for the start-up settings check). */
export function speechConfigWarning(): string | null {
  const name = env("SPEECH_TO_TEXT_PROVIDER").toLowerCase();
  if (!name) return null;
  const p = PROVIDERS[name];
  if (!p) return `SPEECH_TO_TEXT_PROVIDER "${name}" is not known (use: ${Object.keys(PROVIDERS).join(", ")}): shop-screen voice typing is off.`;
  if (!p.configured()) return `SPEECH_TO_TEXT_PROVIDER is ${name} but its key isn't set: shop-screen voice typing is off.`;
  return null;
}
