/**
 * RECORD A SHORT VOICE CLIP for voice typing on browsers without speech recognition (a TV
 * set-top box browser). Records with the mic until the customer stops talking (SILENCE_MS of quiet
 * after speech), nothing is heard for NO_SPEECH_MS, MAX_MS passes, or `stop()` is called (tap).
 * The clip is then sent to /api/vendor/store-screen/transcribe by VoiceSearch.
 */

/** Quiet time after speech that counts as "done speaking". */
const SILENCE_MS = 1200;
/** Give up when no speech at all is heard for this long. */
const NO_SPEECH_MS = 7000;
/** Hard stop (the server takes up to 15 s). */
export const RECORD_MAX_MS = 12_000;
const TICK_MS = 80;

export type Clip = { blob: Blob; ms: number; spoke: boolean };
export type Recording = { stop: () => void; cancel: () => void; result: Promise<Clip | null> };

/** True where the browser can record from the mic (needs https or localhost). */
export function canRecord(): boolean {
  if (typeof window === "undefined") return false;
  return Boolean(navigator.mediaDevices?.getUserMedia) && typeof window.MediaRecorder === "function";
}

function pickType(): string | undefined {
  const types = ["audio/webm;codecs=opus", "audio/webm", "audio/ogg;codecs=opus", "audio/mp4", "audio/mpeg"];
  return types.find((t) => typeof MediaRecorder.isTypeSupported === "function" && MediaRecorder.isTypeSupported(t));
}

/**
 * Asks for the mic and starts recording. Rejects with the browser's error (NotAllowedError,
 * NotFoundError, NotReadableError …) when the mic can't be used. `onSpeaking` fires once the
 * customer's voice is first heard.
 */
export async function startRecording(opts: { onSpeaking?: () => void } = {}): Promise<Recording> {
  const stream = await navigator.mediaDevices.getUserMedia({
    audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true, channelCount: 1 },
  });
  const mimeType = pickType();
  let rec: MediaRecorder;
  try {
    rec = new MediaRecorder(stream, { ...(mimeType ? { mimeType } : {}), audioBitsPerSecond: 32_000 });
  } catch (err) {
    for (const t of stream.getTracks()) t.stop();
    throw err;
  }
  const chunks: Blob[] = [];
  const started = Date.now();
  let spoke = false;
  let cancelled = false;
  let lastVoice = 0;

  // Loudness, to notice when the customer starts and stops talking.
  type AudioCtor = typeof AudioContext;
  const Ctx: AudioCtor | undefined = window.AudioContext ?? (window as unknown as { webkitAudioContext?: AudioCtor }).webkitAudioContext;
  let ctx: AudioContext | null = null;
  let analyser: AnalyserNode | null = null;
  try {
    if (Ctx) {
      ctx = new Ctx();
      void ctx.resume().catch(() => {});
      analyser = ctx.createAnalyser();
      analyser.fftSize = 1024;
      ctx.createMediaStreamSource(stream).connect(analyser);
    }
  } catch {
    analyser = null;
  }
  const buf = analyser ? new Float32Array(analyser.fftSize) : null;
  let floor = 0.01;
  let samples = 0;

  const level = () => {
    if (!analyser || !buf) return 0;
    analyser.getFloatTimeDomainData(buf);
    let sum = 0;
    for (const v of buf) sum += v * v;
    return Math.sqrt(sum / buf.length);
  };

  const result = new Promise<Clip | null>((resolve) => {
    rec.ondataavailable = (e) => {
      if (e.data.size) chunks.push(e.data);
    };
    rec.onstop = () => {
      cleanup();
      if (cancelled) return resolve(null);
      // Without a level meter we can't tell, so the clip counts as speech.
      resolve({ blob: new Blob(chunks, { type: (rec.mimeType || mimeType || "audio/webm").split(";")[0] }), ms: Date.now() - started, spoke: spoke || !analyser });
    };
    rec.onerror = () => {
      if (rec.state !== "inactive") return rec.stop();
      cleanup();
      resolve(null);
    };
  });

  const timer = window.setInterval(() => {
    const now = Date.now();
    const elapsed = now - started;
    const l = level();
    // The room's own noise for the first moment, then "voice" is clearly louder than that.
    if (elapsed < 300) {
      samples++;
      floor = Math.max(0.005, floor + (l - floor) / samples);
    } else if (l > Math.max(0.02, floor * 2.5)) {
      if (!spoke) opts.onSpeaking?.();
      spoke = true;
      lastVoice = now;
    }
    if (elapsed >= RECORD_MAX_MS) return finish();
    if (analyser && spoke && now - lastVoice >= SILENCE_MS) return finish();
    if (analyser && !spoke && elapsed >= NO_SPEECH_MS) return finish();
  }, TICK_MS);

  function cleanup() {
    window.clearInterval(timer);
    for (const t of stream.getTracks()) t.stop();
    void ctx?.close().catch(() => {});
  }
  function finish() {
    if (rec.state !== "inactive") rec.stop();
    else cleanup();
  }

  rec.start(250);
  return {
    stop: finish,
    cancel: () => {
      cancelled = true;
      finish();
    },
    result,
  };
}
