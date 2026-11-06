import { ApiError, assertBodySize, guardMutation, ok, rateLimit, route } from "@/lib/server/http";
import { CAN_SELL, requireVendor } from "@/lib/server/session";
import { speechProvider } from "@/lib/server/speech-to-text";

export const dynamic = "force-dynamic";
export const maxDuration = 30;

/** One voice clip: at most this big and this long (the screen stops recording at 12 s). */
const MAX_BYTES = 1024 * 1024;
const MAX_MS = 15_000;
const TYPES = /^audio\/(webm|ogg|mp4|mpeg|wav|x-wav|aac)(;.*)?$/i;
const EXT: Record<string, string> = { webm: "webm", ogg: "ogg", mp4: "m4a", mpeg: "mp3", wav: "wav", "x-wav": "wav", aac: "aac" };

/**
 * VOICE TYPING for the shop screen (the signed-in seller's screen; works while it is locked, like
 * Salesman AI). The screen sends a short recording of the customer when the browser can't turn
 * speech into text itself; the answer is the words. Off unless a provider is set (speech-to-text.ts).
 * Audio and words are never logged or kept.
 */
export const POST = route(async (req: Request) => {
  guardMutation(req);
  const vendor = await requireVendor(CAN_SELL, { whileLocked: true });
  const provider = speechProvider();
  assertBodySize(req, MAX_BYTES + 16 * 1024);
  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    throw new ApiError(400, "bad_audio", "The recording could not be read. Please try again.");
  }
  const audio = form.get("audio");
  if (!(audio instanceof Blob) || audio.size === 0) throw new ApiError(400, "bad_audio", "The recording could not be read. Please try again.");
  if (audio.size > MAX_BYTES) throw new ApiError(413, "too_large", "That recording is too long. Please say it in a few words.");
  const type = audio.type.toLowerCase();
  const m = TYPES.exec(type);
  if (!m) throw new ApiError(415, "bad_type", "That kind of recording isn't supported.");
  const ms = Number(form.get("ms") ?? 0);
  if (!Number.isFinite(ms) || ms > MAX_MS) throw new ApiError(413, "too_large", "That recording is too long. Please say it in a few words.");

  if (!provider) throw new ApiError(503, "stt_off", "Voice typing isn't switched on for this shop yet. Please type instead.");
  await rateLimit(`store-transcribe:${vendor.id}`, 60, 10 * 60);
  await rateLimit(`store-transcribe-day:${vendor.id}`, Number(process.env.SPEECH_TO_TEXT_DAILY_LIMIT ?? 500), 24 * 60 * 60);
  const text = (await provider.transcribe(audio, `voice.${EXT[m[1].toLowerCase()] ?? "webm"}`)).replace(/\s+/g, " ").trim().slice(0, 300);
  return ok({ text });
});
