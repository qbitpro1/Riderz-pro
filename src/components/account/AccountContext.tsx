"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import { api } from "@/lib/vendor/client";
import type { CustomerSelf } from "@/lib/account/types";
import { replaceWishlist, watchWishlist, wishlistSnapshot, type WishlistItem } from "@/components/wishlist/wishlistStore";
import { GARAGE_EVENT, readGarage, writeGarage, type Garage } from "@/components/fitment/FitmentPicker";

/**
 * Who is signed in, for the shopper chrome (header link, checkout prefill). Asked once per page
 * load from /api/account/me; pages that change the session call `refresh()`. Not asked on the
 * seller dashboard, the Offline Store screen or the rider app, which have their own sign-ins.
 *
 * While someone is signed in it keeps the browser's wishlist and chosen car in step with the
 * account:
 *   - The first time this browser syncs with an account (a fresh sign-in), what was saved here while
 *     signed out is added to the account, and a car chosen here wins.
 *   - After that the account is the reference: each page load takes the account's list and car, and
 *     each change sends just that change (add one, remove one, new car). So another device holding
 *     an older list can't wipe or bring back items.
 *   - Signing out clears both from this browser (they stay in the account), so the next person on
 *     a shared device does not see them.
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

/** Routes with their own sign-in, where the shopper account is not used. */
const OWN_SIGN_IN = ["/vendor/dashboard", "/store", "/rider"];
const ownSignIn = (path: string) => OWN_SIGN_IN.some((p) => path === p || path.startsWith(`${p}/`));

/** Which account this browser's wishlist and car were last synced with. */
const SYNCED_KEY = "riderzpro.account.synced";
const readSynced = () => {
  try {
    return localStorage.getItem(SYNCED_KEY);
  } catch {
    return null;
  }
};
const writeSynced = (id: string | null) => {
  try {
    if (id) localStorage.setItem(SYNCED_KEY, id);
    else localStorage.removeItem(SYNCED_KEY);
  } catch {
    /* storage blocked: every page load then merges, which only ever adds */
  }
};

/** Set while signing out, so clearing this browser's copies is not saved to the account as "cleared". */
let signingOut = false;

export function AccountProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const skip = ownSignIn(pathname);
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
    if (skip) {
      setReady(true);
      return;
    }
    void refresh();
  }, [refresh, skip]);

  const forget = useCallback(() => {
    signingOut = true;
    try {
      replaceWishlist([]);
      writeGarage(null);
      writeSynced(null);
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
      {customer && !skip && <AccountSync key={customer.id} customer={customer} />}
      {children}
    </AccountContext.Provider>
  );
}

const sameCar = (a: Garage | null, b: Garage | null) =>
  a === b || (!!a && !!b && a.brandSlug === b.brandSlug && a.modelSlug === b.modelSlug && a.variant === b.variant && a.year === b.year);

/** Mounted only while signed in (keyed by customer, so a different account starts fresh). */
function AccountSync({ customer }: { customer: CustomerSelf }) {
  const known = useRef<Map<string, WishlistItem> | null>(null);

  /* ---- wishlist ---- */
  useEffect(() => {
    let alive = true;
    let unwatch: (() => void) | null = null;
    const firstSync = readSynced() !== customer.id;

    (async () => {
      let list: WishlistItem[];
      try {
        list = firstSync
          ? // Add what was saved here while signed out; the answer is the account's whole list.
            (await api<{ items: WishlistItem[] }>("/api/account/wishlist", { method: "PUT", body: { items: wishlistSnapshot() } })).items
          : (await api<{ items: WishlistItem[] }>("/api/account/wishlist")).items;
      } catch {
        return; // leave the local list alone; nothing is lost
      }
      if (!alive) return;
      writeSynced(customer.id);
      known.current = new Map(list.map((i) => [i.slug, i]));
      replaceWishlist(list);

      // From now on send each change on its own.
      unwatch = watchWishlist(() => {
        if (signingOut || !known.current) return;
        const now = new Map(wishlistSnapshot().map((i) => [i.slug, i]));
        const added = [...now.values()].filter((i) => !known.current!.has(i.slug));
        const removed = [...known.current.keys()].filter((slug) => !now.has(slug));
        known.current = now;
        if (added.length) api("/api/account/wishlist", { method: "PUT", body: { items: added } }).catch(() => {});
        for (const slug of removed) {
          api(`/api/account/wishlist?slug=${encodeURIComponent(slug)}`, { method: "DELETE" }).catch(() => {});
        }
      });
    })();

    return () => {
      alive = false;
      unwatch?.();
    };
    // Runs once per signed-in customer (the component is keyed by id).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ---- chosen car ---- */
  useEffect(() => {
    const local = readGarage();
    const server = customer.car;
    const firstSync = readSynced() !== customer.id;
    if (firstSync && local) {
      if (!sameCar(local, server)) api("/api/account/car", { method: "PUT", body: { car: local } }).catch(() => {});
    } else if (!sameCar(local, server)) {
      writeGarage(server); // the account is the reference (fires before the listener below exists)
    }
    const onChange = (e: Event) => {
      if (signingOut) return;
      const car = (e as CustomEvent<Garage | null>).detail;
      api("/api/account/car", { method: "PUT", body: { car } }).catch(() => {});
    };
    window.addEventListener(GARAGE_EVENT, onChange);
    return () => window.removeEventListener(GARAGE_EVENT, onChange);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return null;
}
