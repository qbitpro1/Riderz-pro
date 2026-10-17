"use client";

import { useEffect, useState, type FormEvent } from "react";
import { LogOut, Maximize, Minimize, RotateCcw } from "lucide-react";
import { api, ApiFailure } from "@/lib/vendor/client";
import { CloseButton, Layer } from "./Layer";
import { COUNTDOWN_S, ui } from "./lib";

/**
 * The seller's way out: a plain "Exit" button. One tap opens the seller options; leaving the screen
 * still needs the seller's password, so a customer who taps it only sees the password box.
 */
export function SellerAccess({ onOpen, className = "" }: { onOpen: () => void; className?: string }) {
  return (
    <button
      type="button"
      onClick={onOpen}
      aria-label="Exit the store screen (seller only)"
      className={`inline-flex h-12 shrink-0 items-center gap-2 rounded-full border border-tint/15 bg-void px-4 text-sm font-semibold text-ash transition-[transform,background-color] duration-200 active:scale-95 hover:bg-carbon ${className}`}
    >
      <LogOut size={18} aria-hidden />
      <span>Exit</span>
    </button>
  );
}

/** Seller options: full screen on or off, and leaving the store screen (needs the seller's password). */
export function SellerDialog({ onClose, onWelcome }: { onClose: () => void; onWelcome: () => void }) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [full, setFull] = useState(false);

  useEffect(() => {
    const sync = () => setFull(Boolean(document.fullscreenElement));
    sync();
    document.addEventListener("fullscreenchange", sync);
    return () => document.removeEventListener("fullscreenchange", sync);
  }, []);

  async function toggleFull() {
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
      else await document.documentElement.requestFullscreen();
    } catch {
      /* not allowed here (some tablets); the screen still works */
    }
  }

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (!password) {
      setError("Enter your password.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const res = await api<{ next: string }>("/api/vendor/store-screen", { body: { action: "unlock", password } });
      if (document.fullscreenElement) await document.exitFullscreen().catch(() => {});
      window.location.href = res.next;
    } catch (err) {
      setError(err instanceof ApiFailure ? err.message : "Something went wrong. Please try again.");
      setPassword("");
      setBusy(false);
    }
  }

  return (
    <Layer label="Seller options" onClose={onClose} size="sm">
      <form onSubmit={submit} noValidate className="p-6">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="font-display text-2xl font-extrabold tracking-tight text-chalk">Seller only</h2>
            <p className="mt-1 text-base text-ash">Enter your seller password to close the store screen and go back to your dashboard.</p>
          </div>
          <CloseButton onClick={onClose} />
        </div>

        <button type="button" onClick={toggleFull} className={`${ui.secondary} mt-5 min-h-12 w-full`}>
          {full ? <Minimize size={18} aria-hidden /> : <Maximize size={18} aria-hidden />}
          {full ? "Leave full screen" : "Go full screen"}
        </button>

        <button type="button" onClick={onWelcome} className={`${ui.secondary} mt-3 min-h-12 w-full`}>
          <RotateCcw size={18} aria-hidden /> Clear the order and show the welcome screen
        </button>

        <label htmlFor="screen-password" className="label mt-5">
          Seller password
        </label>
        <input
          id="screen-password"
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="field min-h-14! rounded-xl! text-base!"
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? "screen-password-msg" : undefined}
          data-autofocus
        />
        {error && (
          <p id="screen-password-msg" role="alert" className="mt-2 text-sm font-medium text-danger">
            {error}
          </p>
        )}
        <div className="mt-5 grid grid-cols-2 gap-3">
          <button type="button" onClick={onClose} className={ui.secondary}>
            Cancel
          </button>
          <button type="submit" disabled={busy} className={ui.primary}>
            {busy ? "Checking…" : "Exit to dashboard"}
          </button>
        </div>
      </form>
    </Layer>
  );
}

/** "Still there?": an unattended order clears itself when the countdown ends. */
export function IdlePrompt({ onStay, onTimeout }: { onStay: () => void; onTimeout: () => void }) {
  const [left, setLeft] = useState(COUNTDOWN_S);
  useEffect(() => {
    if (left <= 0) {
      onTimeout();
      return;
    }
    const t = window.setTimeout(() => setLeft((n) => n - 1), 1000);
    return () => window.clearTimeout(t);
  }, [left, onTimeout]);
  return (
    <Layer label="Are you still there?" onClose={onStay} size="sm">
      <div className="p-7 text-center">
        <div className="relative mx-auto grid h-24 w-24 place-items-center">
          <svg viewBox="0 0 36 36" className="absolute inset-0 -rotate-90" aria-hidden>
            <circle cx="18" cy="18" r="16" fill="none" strokeWidth="2.5" className="stroke-steel" />
            <circle
              cx="18"
              cy="18"
              r="16"
              fill="none"
              strokeWidth="2.5"
              strokeLinecap="round"
              className="stroke-accent transition-[stroke-dashoffset] duration-1000 ease-linear"
              strokeDasharray={100.5}
              strokeDashoffset={100.5 * (1 - left / COUNTDOWN_S)}
            />
          </svg>
          <span className="tnum font-display text-3xl font-extrabold text-chalk">{left}</span>
        </div>
        <h2 className="mt-5 font-display text-3xl font-extrabold tracking-tight text-chalk">Still there?</h2>
        <p className="mt-2 text-base text-ash" aria-live="polite">
          Your order clears in {left} seconds so the next customer can start fresh.
        </p>
        <div className="mt-6 grid gap-3">
          <button type="button" data-autofocus onClick={onStay} className={ui.primary}>
            I am still here
          </button>
          <button type="button" onClick={onTimeout} className={`${ui.secondary} min-h-12`}>
            Clear it now
          </button>
        </div>
      </div>
    </Layer>
  );
}
