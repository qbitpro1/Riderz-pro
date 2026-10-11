"use client";

import { useSyncExternalStore } from "react";

/**
 * Tiny shared state so the header, the drawer and the mobile bottom bar can
 * open the same search panel and menu drawer without a provider in the layout.
 */
type State = { drawer: boolean; search: boolean };

let state: State = { drawer: false, search: false };
const SERVER: State = { drawer: false, search: false };
const listeners = new Set<() => void>();

function set(next: Partial<State>) {
  state = { ...state, ...next };
  listeners.forEach((l) => l());
}

function subscribe(l: () => void) {
  listeners.add(l);
  return () => {
    listeners.delete(l);
  };
}

export const navActions = {
  openDrawer: () => set({ drawer: true, search: false }),
  closeDrawer: () => set({ drawer: false }),
  openSearch: () => set({ search: true, drawer: false }),
  closeSearch: () => set({ search: false }),
  closeAll: () => set({ drawer: false, search: false }),
};

export function useNavState(): State {
  return useSyncExternalStore(
    subscribe,
    () => state,
    () => SERVER,
  );
}
