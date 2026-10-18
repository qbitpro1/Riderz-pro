"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { maxFor } from "./lib";
import type { ScreenProduct } from "./types";

/* ------------------------------------------------------------------ order */

export type OrderLine = { product: ScreenProduct; qty: number };

/**
 * Next short order token, "A-1" … "A-99", "B-1" …, counted per store in sessionStorage so
 * two customers in a row never hold the same number. Falls back to a random one if storage is blocked.
 */
function nextToken(slug: string): string {
  let n: number;
  try {
    const key = `rzp-screen-token:${slug}`;
    n = (Number(sessionStorage.getItem(key)) || 0) + 1;
    sessionStorage.setItem(key, String(n));
  } catch {
    n = 1 + Math.floor(Math.random() * 2000);
  }
  const letter = String.fromCharCode(65 + (Math.floor((n - 1) / 99) % 26));
  return `${letter}-${((n - 1) % 99) + 1}`;
}

/** The customer's order: quantities (capped at stock), totals, and a token given on the first item. */
export function useOrder(products: ScreenProduct[], slug: string) {
  const [qtys, setQtys] = useState<Record<string, number>>({});
  const [token, setToken] = useState<string | null>(null);
  const [bump, setBump] = useState(0);
  const tokenRef = useRef<string | null>(null);
  const byId = useMemo(() => new Map(products.map((p) => [p.id, p])), [products]);

  const setQty = useCallback(
    (id: string, qty: number) => {
      const p = byId.get(id);
      if (!p) return;
      const q = Math.max(0, Math.min(Math.floor(qty), maxFor(p)));
      if (q > 0 && !tokenRef.current) {
        tokenRef.current = nextToken(slug);
        setToken(tokenRef.current);
      }
      setQtys((o) => {
        if ((o[id] ?? 0) === q) return o;
        const next = { ...o };
        if (q === 0) delete next[id];
        else next[id] = q;
        return next;
      });
      setBump((n) => n + 1);
    },
    [byId, slug],
  );

  const clear = useCallback(() => {
    tokenRef.current = null;
    setToken(null);
    setQtys({});
  }, []);

  const lines = useMemo<OrderLine[]>(
    () =>
      Object.entries(qtys)
        .map(([id, qty]) => ({ product: byId.get(id), qty }))
        .filter((l): l is OrderLine => Boolean(l.product) && l.qty > 0),
    [qtys, byId],
  );
  const count = lines.reduce((n, l) => n + l.qty, 0);
  const total = lines.reduce((n, l) => n + l.product.price * l.qty, 0);
  const mrpTotal = lines.reduce((n, l) => n + Math.max(l.product.mrp, l.product.price) * l.qty, 0);
  const savings = mrpTotal - total;

  return { qtys, lines, count, total, savings, token, bump, setQty, clear };
}

/* ------------------------------------------------------------------- idle */

/**
 * Calls `onIdle` once after `ms` without a touch, key or scroll. Does nothing while `paused`.
 * The timer restarts whenever `paused` or `ms` changes, and after every interaction.
 */
export function useIdle(onIdle: () => void, ms: number, paused: boolean) {
  const cb = useRef(onIdle);
  useEffect(() => {
    cb.current = onIdle;
  });
  useEffect(() => {
    if (paused) return;
    let timer = window.setTimeout(() => cb.current(), ms);
    const poke = () => {
      window.clearTimeout(timer);
      timer = window.setTimeout(() => cb.current(), ms);
    };
    const events = ["pointerdown", "pointermove", "keydown", "wheel", "touchstart", "scroll"] as const;
    events.forEach((e) => window.addEventListener(e, poke, { passive: true, capture: true }));
    return () => {
      window.clearTimeout(timer);
      events.forEach((e) => window.removeEventListener(e, poke, { capture: true }));
    };
  }, [ms, paused]);
}

/** True once per change of `value` for a moment: drives the cart badge "bump". */
export function usePulse(value: number, ms = 450): boolean {
  const [on, setOn] = useState(false);
  const first = useRef(true);
  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    setOn(true);
    const t = window.setTimeout(() => setOn(false), ms);
    return () => window.clearTimeout(t);
  }, [value, ms]);
  return on;
}

/**
 * False once `expiresAt` (epoch ms) has passed, and re-renders at that moment, so something that
 * expires (a special price) disappears on time without polling. True while `expiresAt` is null.
 */
export function useStillValid(expiresAt: number | null): boolean {
  const [expired, setExpired] = useState<number | null>(null);
  useEffect(() => {
    if (expiresAt === null) return;
    const t = window.setTimeout(() => setExpired(expiresAt), Math.max(0, expiresAt - Date.now()));
    return () => window.clearTimeout(t);
  }, [expiresAt]);
  return expiresAt === null || expired !== expiresAt;
}
