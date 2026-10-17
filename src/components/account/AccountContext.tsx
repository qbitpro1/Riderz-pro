"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { api } from "@/lib/vendor/client";
import type { CustomerSelf } from "@/lib/account/types";
import { replaceWishlist, watchWishlist, wishlistSnapshot, type WishlistItem } from "@/components/wishlist/wishlistStore";
import { GARAGE_EVENT, readGarage, writeGarage, type Garage } from "@/components/fitment/FitmentPicker";

/**
 * Who is signed in, for the shopper chrome (header link, checkout prefill). Asked once per page
 * load from /api/account/me; pages that change the session call `refresh()`.
 *
 * While someone is signed in it also keeps the browser's wishlist and chosen car in step with
 * the account: on sign-in the two wishlists are merged (newest first) and a car chosen on this
 * device wins over the saved one; after that every change is saved to the account. Signing out
 * clears both from this browser (they stay in the account), so the next person on a shared
 * device does not see them.
 */

type AccountState = {
  customer: CustomerSelf | null;
  /** False until the first answer arrives (avoid flashing "Sign in" for a signed-in customer). */
  ready: boolean;
  refresh: () => Promise<void>;
  signOut: (everywhere?: boolean) => Promise<void>;
  /** After the account was deleted: forget it and its copies in this browser. */
  forget: () => void;
};

const AccountContext = createContext<AccountState>({
  customer: null,
  ready: false,
  refresh: async () => {},
  signOut: async () => {},
  forget: () => {},
});

export const useAccount = () => useContext(AccountContext);

/** Set while signing out, so clearing this browser's copies is not saved to the account as "cleared". */
let signingOut = false;

export function AccountProvider({ children }: { children: ReactNode }) {
  const [customer, setCustomer] = useState<CustomerSelf | null>(null);
  const [ready, setReady] = useState(false);

  const refresh = useCallback(async () => {
    try {
      const res = await api<{ customer: CustomerSelf | null }>("/api/account/me");
      setCustomer(res.customer);
    } catch {
      setCustomer(null); // accounts unavailable: the site works as a guest
    } finally {
      setReady(true);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const forget = useCallback(() => {
    signingOut = true;
    try {
      replaceWishlist([]);
      writeGarage(null);
    } finally {
      signingOut = false;
    }
    setCustomer(null);
  }, []);

  const signOut = useCallback(
    async (everywhere = false) => {
      await api("/api/account/signout", { body: { everywhere } });
      forget();
    },
    [forget],
  );

  const value = useMemo(() => ({ customer, ready, refresh, signOut, forget }), [customer, ready, refresh, signOut, forget]);
  return (
    <AccountContext.Provider value={value}>
      {customer && <AccountSync key={customer.id} customer={customer} />}
      {children}
    </AccountContext.Provider>
  );
}

const sameList = (a: WishlistItem[], b: WishlistItem[]) =>
  a.length === b.length && a.every((x, i) => x.slug === b[i].slug && x.savedAt === b[i].savedAt);

const sameCar = (a: Garage | null, b: Garage | null) =>
  a === b || (!!a && !!b && a.brandSlug === b.brandSlug && a.modelSlug === b.modelSlug && a.variant === b.variant && a.year === b.year);

/** Mounted only while signed in (keyed by customer, so a different account starts fresh). */
function AccountSync({ customer }: { customer: CustomerSelf }) {
  const savedList = useRef<WishlistItem[] | null>(null);
  const timer = useRef<number | null>(null);

  /* ---- wishlist ---- */
  useEffect(() => {
    let alive = true;
    let unwatch: (() => void) | null = null;

    const push = (list: WishlistItem[]) => {
      if (savedList.current && sameList(savedList.current, list)) return;
      savedList.current = list;
      api("/api/account/wishlist", { method: "PUT", body: { items: list } }).catch(() => {
        savedList.current = null; // try again on the next change
      });
    };

    (async () => {
      let server: WishlistItem[] = [];
      try {
        server = (await api<{ items: WishlistItem[] }>("/api/account/wishlist")).items;
      } catch {
        return; // leave the local list alone; nothing is lost
      }
      if (!alive) return;
      const bySlug = new Map<string, WishlistItem>();
      for (const i of [...wishlistSnapshot(), ...server]) {
        const had = bySlug.get(i.slug);
        if (!had || i.savedAt > had.savedAt) bySlug.set(i.slug, i);
      }
      const merged = [...bySlug.values()].sort((a, b) => b.savedAt - a.savedAt).slice(0, 50);
      savedList.current = server;
      if (!sameList(wishlistSnapshot(), merged)) replaceWishlist(merged);
      push(merged);
      unwatch = watchWishlist(() => {
        if (signingOut) return;
        if (timer.current) window.clearTimeout(timer.current);
        timer.current = window.setTimeout(() => push(wishlistSnapshot()), 600);
      });
    })();

    return () => {
      alive = false;
      unwatch?.();
      if (timer.current) window.clearTimeout(timer.current);
    };
  }, []);

  /* ---- chosen car ---- */
  useEffect(() => {
    const local = readGarage();
    const server = customer.car;
    if (local && !sameCar(local, server)) {
      api("/api/account/car", { method: "PUT", body: { car: local } }).catch(() => {});
    } else if (!local && server) {
      writeGarage(server);
    }
    const onChange = (e: Event) => {
      if (signingOut) return;
      const car = (e as CustomEvent<Garage | null>).detail;
      api("/api/account/car", { method: "PUT", body: { car } }).catch(() => {});
    };
    window.addEventListener(GARAGE_EVENT, onChange);
    return () => window.removeEventListener(GARAGE_EVENT, onChange);
    // Runs once per signed-in customer (the component is keyed by id).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return null;
}
