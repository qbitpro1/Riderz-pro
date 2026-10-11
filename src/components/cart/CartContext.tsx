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
  /** Adds `qty` of a line (merging with the same `id`) and opens the cart drawer. */
  add: (line: Omit<CartLine, "qty">, qty?: number) => void;
  setQty: (id: string, qty: number) => void;
  remove: (id: string) => void;
  clear: () => void;
  ready: boolean;
  drawerOpen: boolean;
  openCart: () => void;
  closeCart: () => void;
};

const KEY = "riderzpro.cart.v1";
const CartCtx = createContext<CartState | null>(null);

/**
 * Repairs lines saved by older versions: they have no `id` (the slug was the
 * key, so `id = slug`) and early ones have no `href`, all of which linked to
 * `/product/…`, which only the house range lives under. RECOIL lines are
 * recognisable by their name.
 */
function repair(line: CartLine): CartLine {
  const id = line.id || line.slug;
  if (line.href) return line.id ? line : { ...line, id };
  const base = line.name.startsWith("RECOIL ") ? "/products" : "/product";
  return { ...line, id, href: `${base}/${line.slug}` };
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [lines, setLines] = useState<CartLine[]>([]);
  const [ready, setReady] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);

  useEffect(() => {
    try {
      const raw = readStored(KEY);
      if (raw) {
        const parsed: unknown = JSON.parse(raw);
        if (Array.isArray(parsed)) setLines((parsed as CartLine[]).map(repair));
      }
    } catch {
      // A corrupt or unavailable store should never block the page.
    }
    setReady(true);
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

  const add = useCallback((line: Omit<CartLine, "qty">, qty = 1) => {
    setLines((prev) => {
      const found = prev.find((l) => l.id === line.id);
      if (found) {
        return prev.map((l) => (l.id === line.id ? { ...l, ...line, qty: l.qty + qty } : l));
      }
      return [...prev, { ...line, qty }];
    });
    setDrawerOpen(true);
  }, []);

  const setQty = useCallback((id: string, qty: number) => {
    setLines((prev) =>
      qty <= 0 ? prev.filter((l) => l.id !== id) : prev.map((l) => (l.id === id ? { ...l, qty } : l)),
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
