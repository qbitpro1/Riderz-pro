"use client";

import { useEffect, useRef, useState } from "react";
import { useBrowserValue, useLatest } from "@/lib/client/hooks";
import { Mic, MicOff } from "lucide-react";

/**
 * VOICE SEARCH
 *
 * A mic button for the search box, so the store manager can say "seat covers for Creta"
 * on a smart TV instead of typing. Uses the browser's speech recognition (Chrome, Edge,
 * Android TV browsers, Safari). The button is hidden where the browser has no speech
 * recognition. Needs microphone permission and HTTPS (or localhost).
 *
 * Fast on purpose: the words show while the customer speaks, and as soon as they stop talking
 * (a final result, or SILENCE_MS without new words) the search is done: we don't wait for the
 * browser's own end-of-speech timeout, which can take seconds in a noisy shop. `onFinal` gets the
 * finished words once.
 *
 * Note: Chrome sends the audio to its speech service to turn it into text.
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

const MESSAGES: Record<string, string> = {
  "not-allowed": "Allow the microphone for this site to search by voice.",
  "service-not-allowed": "Voice search is blocked on this device.",
  "no-speech": "Didn't catch that. Tap the mic and try again.",
  "audio-capture": "No microphone found on this device.",
  network: "Voice search needs an internet connection.",
};

export function VoiceSearch({
  onText,
  onFinal,
  onListening,
}: {
  /** The words so far, while the customer speaks. */
  onText: (text: string) => void;
  /** The finished words, once per tap of the mic (not called when nothing was heard). */
  onFinal?: (text: string) => void;
  onListening?: (on: boolean) => void;
}) {
  const supported = useBrowserValue(() => recognitionCtor() !== null, false);
  const [listening, setListeningState] = useState(false);
  const [ready, setReady] = useState(false);
  const [heard, setHeard] = useState("");
  const [note, setNote] = useState<string | null>(null);
  const rec = useRef<Recognition | null>(null);
  const timers = useRef<number[]>([]);
  const silence = useRef<number | null>(null);
  const done = useRef(false);
  const onListeningRef = useLatest(onListening);
  const onFinalRef = useLatest(onFinal);

  /** Tells the parent only when listening actually starts or stops. */
  const setListening = (on: boolean) => {
    setListeningState(on);
    onListeningRef.current?.(on);
  };

  useEffect(
    () => () => {
      for (const t of timers.current) window.clearTimeout(t);
      if (silence.current) window.clearTimeout(silence.current);
      rec.current?.abort();
    },
    [],
  );
  useEffect(() => {
    if (!note) return;
    const t = window.setTimeout(() => setNote(null), 4000);
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
    setListening(false);
    if (text) {
      onText(text);
      onFinalRef.current?.(text);
    }
  }

  function stop() {
    finish(heard);
  }

  function start() {
    const Ctor = recognitionCtor();
    if (!Ctor) return;
    rec.current?.abort();
    const r = new Ctor();
    r.lang = "en-IN";
    r.interimResults = true;
    r.continuous = false;
    r.maxAlternatives = 1;
    done.current = false;
    let latest = "";
    r.onaudiostart = () => setReady(true);
    r.onresult = (e) => {
      let text = "";
      let final = false;
      for (let i = 0; i < e.results.length; i++) {
        text += e.results[i][0].transcript;
        if (e.results[i].isFinal) final = true;
      }
      latest = text.trim();
      setReady(true);
      setHeard(latest);
      onText(latest);
      if (final) return finish(latest);
      // No new words for a moment: the customer has finished speaking.
      if (silence.current) window.clearTimeout(silence.current);
      silence.current = window.setTimeout(() => finish(latest), SILENCE_MS);
    };
    r.onerror = (e) => {
      if (e.error !== "aborted") setNote(MESSAGES[e.error] ?? "Voice search stopped. Try again.");
    };
    r.onend = () => finish(latest);
    rec.current = r;
    setNote(null);
    setHeard("");
    setReady(false);
    try {
      r.start();
      setListening(true);
      timers.current.push(
        window.setTimeout(() => {
          if (!latest) {
            setNote(MESSAGES["no-speech"]);
            finish("");
          }
        }, NO_SPEECH_MS),
        window.setTimeout(() => finish(latest), MAX_MS),
      );
    } catch {
      setNote("Voice search could not start. Try again.");
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={listening ? stop : start}
        aria-pressed={listening}
        aria-label={listening ? "Stop listening" : "Search by voice"}
        className={`relative grid h-12 w-12 shrink-0 place-items-center rounded-full transition-[transform,background-color,color] duration-200 active:scale-90 ${
          listening ? "bg-accent text-on-accent" : "text-ash active:bg-steel"
        }`}
      >
        {listening && <span aria-hidden className="ss-ring absolute inset-0 rounded-full bg-accent" />}
        {listening ? <MicOff size={20} aria-hidden className="relative" /> : <Mic size={20} aria-hidden />}
      </button>
      <p aria-live="polite" className="sr-only">
        {listening ? "Listening. Say a product, brand or car." : ""}
      </p>
      {(listening || note) && (
        // Sized to its text (not the narrow mic slot it sits in) and right-aligned under the mic.
        <div className="ss-pop pointer-events-none absolute right-0 top-full z-20 mt-3 flex w-max max-w-[min(24rem,calc(100vw-2rem))] items-center gap-2.5 rounded-2xl bg-chalk px-5 py-3 text-base font-semibold leading-snug text-void shadow-lg">
          {listening && <span aria-hidden className="h-2.5 w-2.5 shrink-0 animate-pulse rounded-full bg-accent" />}
          <span>{listening ? (heard ? `“${heard}”` : ready ? "Listening… say a product, brand or car" : "Starting the mic…") : note}</span>
        </div>
      )}
    </>
  );
}
