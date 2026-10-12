"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { readStored } from "@/lib/storage";
import type { CartLine } from "@/lib/store/types";
import { CartDrawer } from "./CartDrawer";

export type { CartLine };

type CartState = {
  lines: CartLine[];
  count: number;
  subtotal: number;
  installTotal: number;
  /** Adds `qty` of a line (merging with the same `id`) and opens the cart drawer unless `opts.open` is false. */
  add: (line: Omit<CartLine, "qty">, qty?: number, opts?: { open?: boolean }) => void;
  setQty: (id: string, qty: number) => void;
  remove: (id: string) => void;
  clear: () => void;
  ready: boolean;
  drawerOpen: boolean;
  openCart: () => void;
  closeCart: () => void;
};

const KEY = "riderzpro.cart.v1";
/** The most of one line the cart — and the checkout endpoint — accepts. */
export const MAX_QTY = 99;

const CartCtx = createContext<CartState | null>(null);

/**
 * Repairs lines saved by older versions: they have no `id` (the slug was the
 * key, so `id = slug`) and early ones have no `href`; every product now
 * lives at `/products/{slug}`.
 */
function repair(line: CartLine): CartLine {
  const id = line.id || line.slug;
  if (line.href) return line.id ? line : { ...line, id };
  return { ...line, id, href: `/products/${line.slug}` };
}

/** Reads stored lines, repairing old ones and dropping any that could corrupt the totals. */
function parseLines(raw: string | null): CartLine[] | null {
  if (!raw) return null;
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return null;
    const out: CartLine[] = [];
    for (const x of parsed as Partial<CartLine>[]) {
      if (!x || typeof x !== "object" || typeof x.slug !== "string" || !x.slug) continue;
      if (typeof x.price !== "number" || !Number.isFinite(x.price) || x.price < 0) continue;
      if (typeof x.qty !== "number" || !Number.isFinite(x.qty) || x.qty < 1) continue;
      if (x.id !== undefined && (typeof x.id !== "string" || !x.id)) continue;
      if (x.install !== undefined && (typeof x.install !== "number" || !Number.isFinite(x.install) || x.install < 0)) continue;
      const line = repair(x as CartLine);
      if (typeof line.name !== "string") continue;
      out.push({ ...line, qty: Math.min(MAX_QTY, Math.floor(x.qty)) });
    }
    return out;
  } catch {
    return null;
  }
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [lines, setLines] = useState<CartLine[]>([]);
  const [ready, setReady] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);

  useEffect(() => {
    try {
      const stored = parseLines(readStored(KEY));
      if (stored) setLines(stored);
    } catch {
      // A corrupt or unavailable store should never block the page.
    }
    setReady(true);
  }, []);

  // Another tab changed the cart: follow it, so two open tabs never overwrite each other with stale lines.
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key !== null && e.key !== KEY) return;
      setLines(parseLines(e.newValue) ?? []);
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  useEffect(() => {
    if (!ready) return;
    try {
      localStorage.setItem(KEY, JSON.stringify(lines));
    } catch {
      /* storage full or blocked — cart simply doesn't persist */
    }
  }, [lines, ready]);

  const openCart = useCallback(() => setDrawerOpen(true), []);
  const closeCart = useCallback(() => setDrawerOpen(false), []);

  const add = useCallback((line: Omit<CartLine, "qty">, qty = 1, opts?: { open?: boolean }) => {
    setLines((prev) => {
      const found = prev.find((l) => l.id === line.id);
      if (found) {
        // Same product and options: only the quantity grows. The line keeps the
        // installation choice it was first added with.
        return prev.map((l) => (l.id === line.id ? { ...l, qty: Math.min(MAX_QTY, l.qty + qty) } : l));
      }
      return [...prev, { ...line, qty: Math.min(MAX_QTY, qty) }];
    });
    if (opts?.open !== false) setDrawerOpen(true);
  }, []);

  const setQty = useCallback((id: string, qty: number) => {
    setLines((prev) =>
      qty <= 0
        ? prev.filter((l) => l.id !== id)
        : prev.map((l) => (l.id === id ? { ...l, qty: Math.min(MAX_QTY, qty) } : l)),
    );
  }, []);

  const remove = useCallback((id: string) => {
    setLines((prev) => prev.filter((l) => l.id !== id));
  }, []);

  const clear = useCallback(() => setLines([]), []);

  const value = useMemo<CartState>(() => {
    const count = lines.reduce((n, l) => n + l.qty, 0);
    const subtotal = lines.reduce((n, l) => n + l.price * l.qty, 0);
    const installTotal = lines.reduce((n, l) => n + (l.install ?? 0) * l.qty, 0);
    return {
      lines,
      count,
      subtotal,
      installTotal,
      add,
      setQty,
      remove,
      clear,
      ready,
      drawerOpen,
      openCart,
      closeCart,
    };
  }, [lines, add, setQty, remove, clear, ready, drawerOpen, openCart, closeCart]);

  return (
    <CartCtx.Provider value={value}>
      {children}
      {drawerOpen && <CartDrawer />}
    </CartCtx.Provider>
  );
}

export function useCart(): CartState {
  const ctx = useContext(CartCtx);
  if (!ctx) throw new Error("useCart must be used inside <CartProvider>");
  return ctx;
}
