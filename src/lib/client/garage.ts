"use client";

import { useSyncExternalStore } from "react";
import { readStored } from "@/lib/storage";

/**
 * MY GARAGE: the shopper's car, kept in this browser (and, when signed in, in the account:
 * AccountContext syncs it). Every component reads it through `useGarage`, so a change in one
 * picker, another tab or the account shows everywhere at once.
 */
export type Garage = {
  brandSlug: string;
  modelSlug: string;
  variant: string;
  year: number;
  label: string;
};

const KEY = "riderzpro.garage.v1";

/** Fired on window when the chosen car changes on this page. */
export const GARAGE_EVENT = "riderzpro:garage";

let lastRaw: string | null | undefined;
let lastGarage: Garage | null = null;

/** The saved car, or null. The same object is returned until the stored value changes. */
export function readGarage(): Garage | null {
  if (typeof window === "undefined") return null;
  let raw: string | null;
  try {
    raw = readStored(KEY);
  } catch {
    return null;
  }
  if (raw !== lastRaw) {
    lastRaw = raw;
    try {
      lastGarage = raw ? (JSON.parse(raw) as Garage) : null;
    } catch {
      lastGarage = null;
    }
  }
  return lastGarage;
}

/** Saves (or clears) the chosen car in this browser and tells listeners. */
export function writeGarage(g: Garage | null) {
  try {
    if (g) localStorage.setItem(KEY, JSON.stringify(g));
    else localStorage.removeItem(KEY);
  } catch {
    /* storage blocked: the choice still works for this visit */
  }
  window.dispatchEvent(new CustomEvent(GARAGE_EVENT, { detail: g }));
}

function subscribe(onChange: () => void) {
  const onStorage = (e: StorageEvent) => {
    if (e.key === KEY || e.key === null) onChange();
  };
  window.addEventListener(GARAGE_EVENT, onChange);
  window.addEventListener("storage", onStorage);
  return () => {
    window.removeEventListener(GARAGE_EVENT, onChange);
    window.removeEventListener("storage", onStorage);
  };
}

/** The saved car (null on the server and during hydration). */
export function useGarage(): Garage | null {
  return useSyncExternalStore(subscribe, readGarage, () => null);
}

/** A stable key for remounting a form that starts from the saved car. */
export const garageKey = (g: Garage | null) => (g ? `${g.brandSlug}/${g.modelSlug}/${g.variant}/${g.year}` : "none");
