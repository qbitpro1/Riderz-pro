/**
 * BASE → TOP: WHAT THE EXTRA MONEY BUYS
 *
 * The honest version of a variant comparison. Powertrain, pack, range and
 * price deltas are computed from Mahindra's published figures, so those are
 * exact. Equipment deltas are not asserted, because the official variant chart
 * has not been verified line by line — a fabricated "adds ventilated seats"
 * row is exactly the kind of thing a customer would hold us to at delivery.
 *
 * The step therefore reports what it knows and names what it doesn't.
 */

import { LADDER, battery, variant, type Variant, type VariantPrice } from "./factory";

export type ChangeKind = "added" | "upgraded" | "optional" | "unavailable" | "unchanged";

export type Change = {
  kind: ChangeKind;
  label: string;
  detail: string;
};

export type Step = {
  slug: string;
  from: Variant;
  to: Variant;
  /** Cheapest-to-cheapest delta between the two rungs, in rupees. */
  priceDelta: number;
  fromPrice: number;
  toPrice: number;
  changes: Change[];
  /** What we cannot yet claim about this step. */
  unverified: string | null;
};

const cheapest = (v: Variant): VariantPrice =>
  v.prices.reduce((lo, p) => (p.exShowroom < lo.exShowroom ? p : lo), v.prices[0]);

const dearest = (v: Variant): VariantPrice =>
  v.prices.reduce((hi, p) => (p.exShowroom > hi.exShowroom ? p : hi), v.prices[0]);

/**
 * Powertrain changes between two rungs, derived rather than typed out, so the
 * numbers cannot drift away from the battery table.
 */
function powertrainChanges(from: Variant, to: Variant): Change[] {
  const a = battery(cheapest(from).batteryId);
  const b = battery(cheapest(to).batteryId);
  const out: Change[] = [];

  if (a.id === b.id) {
    out.push({
      kind: "unchanged",
      label: "Powertrain",
      detail: `Same ${a.label} pack — ${a.powerKw} kW, ${a.torqueNm} Nm, ${a.certifiedRangeKm} km certified. Nothing about how it drives changes at this step.`,
    });
  } else {
    out.push({
      kind: "upgraded",
      label: "Battery pack",
      detail: `${a.label} → ${b.label}`,
    });
    out.push({
      kind: "upgraded",
      label: "Certified range",
      detail: `${a.certifiedRangeKm} km → ${b.certifiedRangeKm} km (+${b.certifiedRangeKm - a.certifiedRangeKm} km, ${b.rangeCycle})`,
    });
    if (b.powerKw !== a.powerKw) {
      out.push({
        kind: "upgraded",
        label: "Power",
        detail: `${a.powerKw} kW (${a.powerPs} PS) → ${b.powerKw} kW (${b.powerPs} PS)`,
      });
    }
    if (b.dcPeakKw !== a.dcPeakKw) {
      out.push({
        kind: "upgraded",
        label: "DC charging",
        detail: `Up to ${a.dcPeakKw} kW → up to ${b.dcPeakKw} kW. Both still 20–80% in 20 minutes on their rated charger.`,
      });
    }
  }

  // A rung that offers a second pack is a real, priced choice — worth showing
  // as optional rather than burying it in the powertrain row.
  const top = dearest(to);
  const low = cheapest(to);
  if (top.batteryId !== low.batteryId) {
    const t = battery(top.batteryId);
    out.push({
      kind: "optional",
      label: `${t.label} pack available on this rung`,
      detail: `+₹${((top.exShowroom - low.exShowroom) / 1_00_000).toFixed(2).replace(/\.00$/, "")} lakh for ${t.certifiedRangeKm} km certified and ${t.powerKw} kW.`,
    });
  }

  return out;
}

/** BaaS availability is a genuine difference between rungs. */
function baasChange(from: Variant, to: Variant): Change | null {
  const fromHas = from.prices.some((p) => p.baas);
  const toHas = to.prices.some((p) => p.baas);
  if (fromHas && !toHas) {
    return {
      kind: "unavailable",
      label: "Battery-as-a-Service",
      detail: "BaaS is offered on ONE and TWO only. From this rung upward the battery is bought with the car.",
    };
  }
  return null;
}

export const STEPS: Step[] = LADDER.slice(0, -1).map((from, i) => {
  const to = LADDER[i + 1];
  const changes = powertrainChanges(from, to);
  const baas = baasChange(from, to);
  if (baas) changes.push(baas);

  const samePack = cheapest(from).batteryId === cheapest(to).batteryId;

  return {
    slug: `${from.slug}-to-${to.slug}`,
    from,
    to,
    fromPrice: cheapest(from).exShowroom,
    toPrice: cheapest(to).exShowroom,
    priceDelta: cheapest(to).exShowroom - cheapest(from).exShowroom,
    changes,
    unverified: samePack
      ? `Every rupee of this step buys equipment, not performance. The exact equipment list is being verified against Mahindra's official ${to.name} variant chart before we publish it — we will not guess at a feature list a customer would hold us to on delivery day.`
      : `Equipment added at ${to.name} beyond the powertrain is being verified against Mahindra's official variant chart.`,
  };
});

export function step(slug: string): Step | undefined {
  return STEPS.find((s) => s.slug === slug);
}

/** Cheapest route to each rung, for the comparison cards. */
export function entryPrice(slug: string): number {
  const v = variant(slug);
  if (!v) return 0;
  return cheapest(v).exShowroom;
}

export function entryBattery(slug: string) {
  const v = variant(slug);
  if (!v) return null;
  return battery(cheapest(v).batteryId);
}

/**
 * Headline stats for a rung card — the six things a shopper actually compares
 * before they open a spec sheet.
 */
export function cardStats(slug: string): { label: string; value: string }[] {
  const b = entryBattery(slug);
  const v = variant(slug);
  if (!b || !v) return [];
  const baas = v.prices.find((p) => p.baas)?.baas;
  return [
    { label: "Battery", value: b.label },
    { label: "Certified range", value: `${b.certifiedRangeKm} km` },
    { label: "Power", value: `${b.powerKw} kW · ${b.powerPs} PS` },
    { label: "Torque", value: `${b.torqueNm} Nm` },
    { label: "DC charging", value: `up to ${b.dcPeakKw} kW` },
    { label: "Drive", value: "Rear-wheel drive" },
    ...(baas ? [{ label: "BaaS entry", value: "available" }] : []),
  ];
}
