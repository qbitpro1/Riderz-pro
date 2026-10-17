"use client";

import { useEffect, useRef, useState } from "react";
import { Mic, MicOff } from "lucide-react";

/**
 * VOICE SEARCH
 *
 * A mic button for the search box, so the store manager can say "seat covers for Creta"
 * on a smart TV instead of typing. Uses the browser's speech recognition (Chrome, Edge,
 * Android TV browsers, Safari). The button is hidden where the browser has no speech
 * recognition. Needs microphone permission and HTTPS (or localhost).
 *
 * Note: Chrome sends the audio to its speech service to turn it into text.
 */

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

export function VoiceSearch({ onText, onListening }: { onText: (text: string) => void; onListening?: (on: boolean) => void }) {
  const [supported, setSupported] = useState(false);
  const [listening, setListening] = useState(false);
  const [note, setNote] = useState<string | null>(null);
  const rec = useRef<Recognition | null>(null);
  const timer = useRef<number | null>(null);

  useEffect(() => setSupported(recognitionCtor() !== null), []);
  useEffect(() => () => rec.current?.abort(), []);
  useEffect(() => {
    onListening?.(listening);
  }, [listening, onListening]);
  useEffect(() => {
    if (!note) return;
    const t = window.setTimeout(() => setNote(null), 4000);
    return () => window.clearTimeout(t);
  }, [note]);

  if (!supported) return null;

  function stop() {
    if (timer.current) window.clearTimeout(timer.current);
    rec.current?.stop();
  }

  function start() {
    const Ctor = recognitionCtor();
    if (!Ctor) return;
    const r = new Ctor();
    r.lang = "en-IN";
    r.interimResults = true;
    r.continuous = false;
    r.maxAlternatives = 1;
    r.onresult = (e) => {
      let text = "";
      for (let i = 0; i < e.results.length; i++) text += e.results[i][0].transcript;
      onText(text.trim());
    };
    r.onerror = (e) => setNote(MESSAGES[e.error] ?? (e.error === "aborted" ? null : "Voice search stopped. Try again."));
    r.onend = () => {
      setListening(false);
      if (timer.current) window.clearTimeout(timer.current);
    };
    rec.current = r;
    setNote(null);
    try {
      r.start();
      setListening(true);
      // Stop listening after 10 seconds even if the room is noisy.
      timer.current = window.setTimeout(() => r.stop(), 10_000);
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
          <span>{listening ? "Listening… say a product, brand or car" : note}</span>
        </div>
      )}
    </>
  );
}
