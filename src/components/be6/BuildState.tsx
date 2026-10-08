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
import { BUILDABLE, upgrade, type Upgrade } from "@/lib/data/be6/motorbotz";
import { battery, coloursFor, variant, type BatteryId, type Variant } from "@/lib/data/be6/factory";

/**
 * One build, shared by every interactive section on the BE 6 page.
 *
 * The page is long, and the configurator near the top and the price summary
 * near the bottom have to be describing the same car. Holding that in one
 * context — rather than in each component — is what stops the two disagreeing.
 *
 * Persisted to localStorage so a half-finished build survives a reload, in the
 * same spirit as the garage picker.
 */

const KEY = "mb:be6-build";

export type Be6Build = {
  variantSlug: string;
  batteryId: BatteryId;
  colourSlug: string;
  upgrades: string[];
};

const DEFAULT_BUILD: Be6Build = {
  variantSlug: "three",
  batteryId: "70",
  colourSlug: "stealth-black",
  upgrades: BUILDABLE.filter((u) => u.signature).map((u) => u.slug),
};

type Ctx = {
  build: Be6Build;
  setVariant: (slug: string) => void;
  setBattery: (id: BatteryId) => void;
  setColour: (slug: string) => void;
  toggleUpgrade: (slug: string) => void;
  clearUpgrades: () => void;
  /** Resolved objects, so consumers never re-do the lookup. */
  selected: {
    variant: Variant;
    battery: ReturnType<typeof battery>;
    /** Ex-showroom price of this variant on this pack, or null if not offered. */
    factoryPrice: number | null;
    baasPrice: number | null;
    upgrades: Upgrade[];
    upgradeTotal: number;
  };
};

const BuildCtx = createContext<Ctx | null>(null);

export function Be6BuildProvider({ children }: { children: ReactNode }) {
  const [build, setBuild] = useState<Be6Build>(DEFAULT_BUILD);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(KEY);
      if (!raw) return;
      const saved = JSON.parse(raw) as Partial<Be6Build>;
      // Validate against the current catalogue — a saved build can outlive a
      // variant or an upgrade, and a stale slug must not break the page.
      const v = saved.variantSlug && variant(saved.variantSlug) ? saved.variantSlug : DEFAULT_BUILD.variantSlug;
      const known = variant(v)!;
      const b =
        saved.batteryId && known.prices.some((p) => p.batteryId === saved.batteryId)
          ? saved.batteryId
          : known.prices[0].batteryId;
      const offered = coloursFor(v);
      const c = offered.some((x) => x.slug === saved.colourSlug) ? saved.colourSlug! : offered[0].slug;
      setBuild({
        variantSlug: v,
        batteryId: b,
        colourSlug: c,
        upgrades: (saved.upgrades ?? []).filter((s) => upgrade(s)),
      });
    } catch {
      /* A corrupt saved build is not worth a broken page. */
    }
  }, []);

  useEffect(() => {
    try {
      window.localStorage.setItem(KEY, JSON.stringify(build));
    } catch {
      /* Storage full or blocked — the build simply will not persist. */
    }
  }, [build]);

  const setVariant = useCallback((slug: string) => {
    const v = variant(slug);
    if (!v) return;
    setBuild((prev) => {
      // Keep the customer's pack if the new variant offers it; otherwise fall
      // to that variant's entry pack rather than an impossible combination.
      const keeps = v.prices.some((p) => p.batteryId === prev.batteryId);
      const nextBattery = keeps ? prev.batteryId : v.prices[0].batteryId;

      // Same rule for paint, and it has to come from coloursFor rather than
      // from the variant's exclusive colour. Mahindra restricts the Formula E
      // editions to four satins without any single one of them being
      // "the" edition colour, so checking exclusiveColourSlug alone let a
      // gloss Tango Red survive a switch onto an edition that cannot be
      // ordered in it.
      const offered = coloursFor(slug);
      const colourStillOffered = offered.some((c) => c.slug === prev.colourSlug);

      return {
        ...prev,
        variantSlug: slug,
        batteryId: nextBattery,
        colourSlug: colourStillOffered ? prev.colourSlug : offered[0].slug,
      };
    });
  }, []);

  const setBattery = useCallback((id: BatteryId) => {
    setBuild((prev) => {
      const v = variant(prev.variantSlug);
      if (!v?.prices.some((p) => p.batteryId === id)) return prev;
      return { ...prev, batteryId: id };
    });
  }, []);

  const setColour = useCallback((slug: string) => {
    setBuild((prev) => ({ ...prev, colourSlug: slug }));
  }, []);

  const toggleUpgrade = useCallback((slug: string) => {
    setBuild((prev) => ({
      ...prev,
      upgrades: prev.upgrades.includes(slug)
        ? prev.upgrades.filter((s) => s !== slug)
        : [...prev.upgrades, slug],
    }));
  }, []);

  const clearUpgrades = useCallback(() => {
    setBuild((prev) => ({ ...prev, upgrades: [] }));
  }, []);

  const selected = useMemo(() => {
    const v = variant(build.variantSlug)!;
    const b = battery(build.batteryId);
    const price = v.prices.find((p) => p.batteryId === build.batteryId);
    const ups = build.upgrades.map((s) => upgrade(s)).filter(Boolean) as Upgrade[];
    return {
      variant: v,
      battery: b,
      factoryPrice: price?.exShowroom ?? null,
      baasPrice: price?.baas ?? null,
      upgrades: ups,
      upgradeTotal: ups.reduce((n, u) => n + (u.price ?? 0), 0),
    };
  }, [build]);

  const value = useMemo<Ctx>(
    () => ({ build, setVariant, setBattery, setColour, toggleUpgrade, clearUpgrades, selected }),
    [build, setVariant, setBattery, setColour, toggleUpgrade, clearUpgrades, selected],
  );

  return <BuildCtx.Provider value={value}>{children}</BuildCtx.Provider>;
}

export function useBe6Build(): Ctx {
  const ctx = useContext(BuildCtx);
  if (!ctx) throw new Error("useBe6Build must be used inside Be6BuildProvider");
  return ctx;
}
