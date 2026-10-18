"use client";

import { useEffect, useRef, useSyncExternalStore } from "react";

const subscribeNever = () => () => {};

/**
 * True in the browser once hydrated; false on the server and during hydration. Use it for UI that
 * depends on browser-only facts, so the first client render matches the server HTML.
 */
export function useHydrated(): boolean {
  return useSyncExternalStore(subscribeNever, () => true, () => false);
}

/**
 * A browser-only value read once per render (a feature check such as speech recognition), and
 * `serverValue` on the server and during hydration. `read` must return a primitive or a stable
 * reference.
 */
export function useBrowserValue<T>(read: () => T, serverValue: T): T {
  return useSyncExternalStore(subscribeNever, read, () => serverValue);
}

/** The latest value of `value`, for callbacks that outlive the render that created them. */
export function useLatest<T>(value: T) {
  const ref = useRef(value);
  useEffect(() => {
    ref.current = value;
  }, [value]);
  return ref;
}

/**
 * Runs `run` every `ms` while the tab is visible (and once at the start when `immediate`), never
 * two at a time, and stops on unmount. `run` gets an AbortSignal that fires on unmount.
 * Coming back to the tab runs it at once.
 */
export function usePoll(run: (signal: AbortSignal) => Promise<void>, ms: number, opts: { immediate?: boolean; enabled?: boolean } = {}) {
  const { immediate = true, enabled = true } = opts;
  const latest = useLatest(run);
  useEffect(() => {
    if (!enabled) return;
    const ctl = new AbortController();
    let busy = false;
    const tick = () => {
      if (busy || ctl.signal.aborted || document.visibilityState !== "visible") return;
      busy = true;
      latest.current(ctl.signal).finally(() => {
        busy = false;
      });
    };
    const first = immediate ? window.setTimeout(tick, 0) : undefined;
    const every = window.setInterval(tick, ms);
    document.addEventListener("visibilitychange", tick);
    return () => {
      ctl.abort();
      window.clearTimeout(first);
      window.clearInterval(every);
      document.removeEventListener("visibilitychange", tick);
    };
  }, [ms, immediate, enabled, latest]);
}
