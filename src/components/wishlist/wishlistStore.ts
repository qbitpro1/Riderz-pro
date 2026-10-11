"use client";

import { useMemo, useSyncExternalStore } from "react";
import type { ProductImage } from "@/lib/store/types";

/**
 * Browser-only "save for later". No accounts yet, so the list lives in
 * localStorage; a small snapshot of each product is kept so the wishlist page
 * renders without a catalogue lookup (prices may go stale — the page says so).
 */
export type WishlistItem = {
  slug: string;
  href: string;
  title: string;
  brandName: string;
  price: number | null;
  mrp: number | null;
  image?: ProductImage;
  hasOptions: boolean;
  savedAt: number;
};

export type WishlistInput = Omit<WishlistItem, "savedAt">;

const KEY = "riderzpro.wishlist.v1";
const MAX = 50;
const EMPTY: WishlistItem[] = [];

let items: WishlistItem[] = EMPTY;
let loaded = false;
const listeners = new Set<() => void>();

function parse(raw: string | null): WishlistItem[] {
  if (!raw) return EMPTY;
  try {
    const data: unknown = JSON.parse(raw);
    if (!Array.isArray(data)) return EMPTY;
    const list = data
      .filter(
        (x): x is WishlistItem =>
          !!x && typeof x.slug === "string" && typeof x.href === "string" && typeof x.title === "string",
      )
      .slice(0, MAX);
    return list.length ? list : EMPTY;
  } catch {
    return EMPTY;
  }
}

function read(): WishlistItem[] {
  try {
    return parse(window.localStorage.getItem(KEY));
  } catch {
    return EMPTY;
  }
}

function load() {
  if (loaded || typeof window === "undefined") return;
  loaded = true;
  items = read();
}

function emit() {
  listeners.forEach((l) => l());
}

function commit(next: WishlistItem[]) {
  items = next.length ? next : EMPTY;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(items));
  } catch {
    /* storage full or blocked — the in-memory list still works for this visit */
  }
  emit();
}

function onStorage(e: StorageEvent) {
  if (e.key !== null && e.key !== KEY) return;
  items = read();
  emit();
}

function subscribe(l: () => void) {
  load();
  if (listeners.size === 0) window.addEventListener("storage", onStorage);
  listeners.add(l);
  return () => {
    listeners.delete(l);
    if (listeners.size === 0) window.removeEventListener("storage", onStorage);
  };
}

function getSnapshot() {
  load();
  return items;
}

const noopSubscribe = () => () => {};

export function useWishlist() {
  const list = useSyncExternalStore(subscribe, getSnapshot, () => EMPTY);
  const ready = useSyncExternalStore(
    noopSubscribe,
    () => true,
    () => false,
  );

  return useMemo(
    () => ({
      items: list,
      count: list.length,
      ready,
      has: (slug: string) => list.some((i) => i.slug === slug),
      toggle: (item: WishlistInput) => {
        load();
        if (items.some((i) => i.slug === item.slug)) {
          commit(items.filter((i) => i.slug !== item.slug));
        } else {
          commit([{ ...item, savedAt: Date.now() }, ...items].slice(0, MAX));
        }
      },
      remove: (slug: string) => {
        load();
        commit(items.filter((i) => i.slug !== slug));
      },
      clear: () => commit([]),
    }),
    [list, ready],
  );
}
