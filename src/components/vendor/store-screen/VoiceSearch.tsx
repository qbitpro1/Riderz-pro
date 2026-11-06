"use client";

import { useEffect, useRef, useState } from "react";
import { useBrowserValue, useLatest } from "@/lib/client/hooks";
import { api, ApiFailure } from "@/lib/vendor/client";
import { Loader2, Mic, MicOff } from "lucide-react";
import { canRecord, startRecording, type Recording } from "./voiceRecorder";

/**
 * VOICE SEARCH
 *
 * A mic button for the search box and Salesman AI, so the customer can say "seat covers for Creta"
 * on a smart TV instead of typing. Two ways to turn speech into words:
 *
 *   1. The browser's own speech recognition (Chrome, Edge, Android TV browsers, Safari). Fast: the
 *      words show while the customer speaks, and as soon as they stop talking (a final result, or
 *      SILENCE_MS without new words) the search is done. Chrome sends the audio to its speech service.
 *   2. Where the browser has none, or it fails on this device ("network", "service-not-allowed",
 *      "language-not-supported": a TV set-top box browser such as JioSphere), the screen records
 *      the voice (voiceRecorder.ts: stops on a short silence, after 12 s, or on a tap) and
 *      /api/vendor/store-screen/transcribe turns it into words (needs SPEECH_TO_TEXT_PROVIDER).
 *
 * Either way `onText` and `onFinal` get the finished words once per tap. The mic needs permission
 * and the secure (https) address; on plain http the button says so instead of hiding.
 */

/** Quiet time after the last heard word that counts as "done speaking". */
const SILENCE_MS = 1100;
/** Give up when nothing at all is heard for this long. */
const NO_SPEECH_MS = 7000;
/** Hard stop, even in a noisy room. */
const MAX_MS = 12_000;

type Recognition = {
  lang: string;
  interimResults: boolean;
  continuous: boolean;
  maxAlternatives: number;
  start: () => void;
  stop: () => void;
  abort: () => void;
  onresult: ((e: { resultIndex: number; results: ArrayLike<ArrayLike<{ transcript: string }> & { isFinal: boolean }> }) => void) | null;
  onerror: ((e: { error: string }) => void) | null;
  onend: (() => void) | null;
  onaudiostart?: (() => void) | null;
};

function recognitionCtor(): (new () => Recognition) | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as { SpeechRecognition?: new () => Recognition; webkitSpeechRecognition?: new () => Recognition };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

/** Browser speech errors that mean "this device can't do it": switch to recording. */
const FALLBACK_ERRORS = new Set(["network", "service-not-allowed", "language-not-supported"]);
/** Set once the browser's speech recognition failed that way, for every mic on the page this visit. */
let browserSpeechBroken = false;

const ALLOW_MIC = "The microphone is blocked. Allow it for this site (the lock or mic icon next to the address, or the browser's site settings), then tap the mic again.";
const NEEDS_HTTPS = "Voice needs the secure address of this page (starting with https://). Open the shop screen with https:// to use the mic.";

const MESSAGES: Record<string, string> = {
  "not-allowed": ALLOW_MIC,
  "service-not-allowed": "Voice search is blocked on this device.",
  "no-speech": "Didn't catch that. Tap the mic and try again.",
  "audio-capture": "No microphone found on this device.",
  network: "Voice search needs an internet connection.",
};

/** Words for a mic that couldn't be opened (getUserMedia's error names). */
function micMessage(err: unknown): string {
  const name = err instanceof Error || err instanceof DOMException ? err.name : "";
  if (name === "NotAllowedError" || name === "SecurityError") return window.isSecureContext ? ALLOW_MIC : NEEDS_HTTPS;
  if (name === "NotFoundError" || name === "OverconstrainedError") return MESSAGES["audio-capture"];
  if (name === "NotReadableError" || name === "AbortError") return "The microphone is busy in another app. Close it and try again.";
  return "The microphone could not start. Try again.";
}

type Phase = "off" | "starting" | "listening" | "transcribing";

export function VoiceSearch({
  onText,
  onFinal,
  onListening,
  popup = "below",
}: {
  /** The words so far, while the customer speaks. */
  onText: (text: string) => void;
  /** The finished words, once per tap of the mic (not called when nothing was heard). */
  onFinal?: (text: string) => void;
  /** True from the tap until the words are ready (or the mic gives up). */
  onListening?: (on: boolean) => void;
  /** Where the "Listening…" bubble shows: under the mic (a search bar at the top) or above it (a box at the bottom). */
  popup?: "below" | "above";
}) {
  // Shown on plain http too, so a tap can explain that voice needs https.
  const supported = useBrowserValue(() => recognitionCtor() !== null || canRecord() || !window.isSecureContext, false);
  const [phase, setPhaseState] = useState<Phase>("off");
  const [heard, setHeard] = useState("");
  const [note, setNote] = useState<string | null>(null);
  const rec = useRef<Recognition | null>(null);
  const recording = useRef<Recording | null>(null);
  const timers = useRef<number[]>([]);
  const silence = useRef<number | null>(null);
  const done = useRef(false);
  /** The browser's speech failed and recording took over: its late "end" must not finish the turn. */
  const switched = useRef(false);
  const mounted = useRef(true);
  const onListeningRef = useLatest(onListening);
  const onFinalRef = useLatest(onFinal);
  const onTextRef = useLatest(onText);

  const listening = phase !== "off";
  /** Tells the parent only when listening actually starts or stops. */
  const phaseRef = useRef<Phase>("off");
  const setPhase = (p: Phase) => {
    const was = phaseRef.current;
    phaseRef.current = p;
    setPhaseState(p);
    if ((was === "off") !== (p === "off")) onListeningRef.current?.(p !== "off");
  };

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      for (const t of timers.current) window.clearTimeout(t);
      if (silence.current) window.clearTimeout(silence.current);
      rec.current?.abort();
      recording.current?.cancel();
    };
  }, []);
  useEffect(() => {
    if (!note) return;
    // Long instructions (allow the mic, use https) stay up long enough to read on a TV.
    const t = window.setTimeout(() => setNote(null), Math.min(10_000, 3000 + note.length * 45));
    return () => window.clearTimeout(t);
  }, [note]);

  if (!supported) return null;

  function clearTimers() {
    for (const t of timers.current) window.clearTimeout(t);
    timers.current = [];
    if (silence.current) window.clearTimeout(silence.current);
    silence.current = null;
  }

  /** The customer is done: hand over the words once and stop listening right away. */
  function finish(text: string) {
    if (done.current) return;
    done.current = true;
    clearTimers();
    rec.current?.abort();
    setPhase("off");
    if (text) {
      onTextRef.current(text);
      onFinalRef.current?.(text);
    }
  }

  function stop() {
    if (recording.current) return recording.current.stop();
    if (phase === "transcribing") return;
    finish(heard);
  }

  function start() {
    setNote(null);
    setHeard("");
    if (!window.isSecureContext) return setNote(NEEDS_HTTPS);
    const Ctor = recognitionCtor();
    if (!Ctor || browserSpeechBroken) {
      if (canRecord()) return void record();
      return setNote(browserSpeechBroken ? MESSAGES["service-not-allowed"] : "Voice search isn't available in this browser.");
    }
    rec.current?.abort();
    const r = new Ctor();
    r.lang = "en-IN";
    r.interimResults = true;
    r.continuous = false;
    r.maxAlternatives = 1;
    done.current = false;
    switched.current = false;
    let latest = "";
    r.onaudiostart = () => setPhase("listening");
    r.onresult = (e) => {
      let text = "";
      let final = false;
      for (let i = 0; i < e.results.length; i++) {
        text += e.results[i][0].transcript;
        if (e.results[i].isFinal) final = true;
      }
      latest = text.trim();
      setPhase("listening");
      setHeard(latest);
      onTextRef.current(latest);
      if (final) return finish(latest);
      // No new words for a moment: the customer has finished speaking.
      if (silence.current) window.clearTimeout(silence.current);
      silence.current = window.setTimeout(() => finish(latest), SILENCE_MS);
    };
    r.onerror = (e) => {
      // This device's speech service doesn't work: record the voice and turn it into words on the server.
      if (FALLBACK_ERRORS.has(e.error) && !latest && canRecord()) {
        browserSpeechBroken = true;
        switched.current = true;
        clearTimers();
        void record();
        return;
      }
      if (e.error === "not-allowed" && !window.isSecureContext) return setNote(NEEDS_HTTPS);
      if (e.error !== "aborted") setNote(MESSAGES[e.error] ?? "Voice search stopped. Try again.");
    };
    r.onend = () => {
      if (!switched.current) finish(latest);
    };
    rec.current = r;
    try {
      r.start();
      setPhase("starting");
      timers.current.push(
        window.setTimeout(() => {
          if (!latest && !switched.current) {
            setNote(MESSAGES["no-speech"]);
            finish("");
          }
        }, NO_SPEECH_MS),
        window.setTimeout(() => {
          if (!switched.current) finish(latest);
        }, MAX_MS),
      );
    } catch {
      if (canRecord()) return void record();
      setNote("Voice search could not start. Try again.");
    }
  }

  /** Records the customer, then asks the server for the words. */
  async function record() {
    done.current = false;
    setPhase("starting");
    let r: Recording;
    try {
      r = await startRecording({ onSpeaking: () => mounted.current && setHeard("…") });
    } catch (err) {
      setNote(micMessage(err));
      return finish("");
    }
    // Stopped (or closed) while the mic was opening.
    if (!mounted.current || done.current) return r.cancel();
    recording.current = r;
    setPhase("listening");
    const clip = await r.result;
    recording.current = null;
    if (!mounted.current || !clip) return;
    if (!clip.spoke || clip.blob.size < 1000) {
      setNote(MESSAGES["no-speech"]);
      return finish("");
    }
    setPhase("transcribing");
    const form = new FormData();
    form.append("audio", clip.blob, "voice");
    form.append("ms", String(clip.ms));
    let text = "";
    try {
      text = (await api<{ text: string }>("/api/vendor/store-screen/transcribe", { form })).text.trim();
      if (!text) setNote(MESSAGES["no-speech"]);
    } catch (err) {
      setNote(err instanceof ApiFailure ? err.message : "Voice typing didn't answer. Please try again or type.");
    }
    if (mounted.current) finish(text);
  }

  const status =
    phase === "transcribing"
      ? "Turning speech into text…"
      : heard && heard !== "…"
        ? `“${heard}”`
        : phase === "listening"
          ? heard === "…"
            ? "Listening… tap the mic when you're done"
            : "Listening… say a product, brand or car"
          : "Starting the mic…";

  return (
    <>
      <button
        type="button"
        onClick={listening ? stop : start}
        disabled={phase === "transcribing"}
        aria-pressed={listening}
        aria-label={phase === "transcribing" ? "Turning speech into text" : listening ? "Stop listening" : "Search by voice"}
        className={`relative grid h-12 w-12 shrink-0 place-items-center rounded-full transition-[transform,background-color,color] duration-200 active:scale-90 ${
          listening ? "bg-accent text-on-accent" : "text-ash active:bg-steel"
        }`}
      >
        {listening && phase !== "transcribing" && <span aria-hidden className="ss-ring absolute inset-0 rounded-full bg-accent" />}
        {phase === "transcribing" ? (
          <Loader2 size={20} aria-hidden className="relative animate-spin" />
        ) : listening ? (
          <MicOff size={20} aria-hidden className="relative" />
        ) : (
          <Mic size={20} aria-hidden />
        )}
      </button>
      <p aria-live="polite" className="sr-only">
        {phase === "transcribing" ? "Turning speech into text." : listening ? "Listening. Say a product, brand or car." : ""}
      </p>
      {(listening || note) && (
        // Sized to its text (not the narrow mic slot it sits in) and right-aligned under (or over) the mic.
        <div
          role={note && !listening ? "alert" : undefined}
          className={`ss-pop pointer-events-none absolute right-0 z-20 flex w-max max-w-[min(26rem,calc(100vw-2rem))] items-center gap-2.5 rounded-2xl bg-chalk px-5 py-3 text-base font-semibold leading-snug text-void shadow-lg ${
            popup === "above" ? "bottom-full mb-3" : "top-full mt-3"
          }`}
        >
          {listening && <span aria-hidden className="h-2.5 w-2.5 shrink-0 animate-pulse rounded-full bg-accent" />}
          <span>{listening ? status : note}</span>
        </div>
      )}
    </>
  );
}
