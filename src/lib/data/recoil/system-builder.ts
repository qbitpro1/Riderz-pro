import { PRODUCTS, type CatalogProduct } from "./index";

/**
 * BUILD MY AUDIO SYSTEM
 *
 * Rules-based, not magic. Each goal defines which slots the system needs and
 * roughly how the budget is divided; the picker then chooses the best-fitting
 * in-stock RECOIL product for each slot. If a slot cannot be filled inside the
 * budget it is reported as skipped rather than substituted with something that
 * does not belong in that system.
 */

export type Goal =
  | "clarity"
  | "bass"
  | "loud"
  | "premium"
  | "audiophile"
  | "spl"
  | "oem-plus";

export type Budget = 10000 | 25000 | 50000 | 100000 | 200000;

export const BUDGETS: { value: Budget; label: string }[] = [
  { value: 10000, label: "₹10,000" },
  { value: 25000, label: "₹25,000" },
  { value: 50000, label: "₹50,000" },
  { value: 100000, label: "₹1,00,000" },
  { value: 200000, label: "₹2,00,000+" },
];

export const GOALS: { value: Goal; label: string; blurb: string }[] = [
  { value: "clarity", label: "Better clarity", blurb: "Vocals and detail the factory speakers cannot resolve." },
  { value: "bass", label: "Strong bass", blurb: "Add the bottom two octaves your doors can't reach." },
  { value: "loud", label: "Loud system", blurb: "High output that stays clean at volume." },
  { value: "premium", label: "Premium sound", blurb: "Balanced, processed, properly staged." },
  { value: "audiophile", label: "Audiophile", blurb: "Accuracy first — measured and tuned." },
  { value: "spl", label: "SPL", blurb: "Competition-grade output. Not a daily-driver build." },
  { value: "oem-plus", label: "OEM+ upgrade", blurb: "Keep the factory head unit and dashboard exactly as they are." },
];

type SlotKey = "source" | "front" | "rear" | "amplifier" | "monoAmp" | "subwoofer" | "processor" | "damping" | "wiring" | "power";

type Slot = {
  key: SlotKey;
  label: string;
  /** Why this slot exists in this particular system. */
  reason: string;
  categories: string[];
  subcategories?: string[];
  /** Share of the budget this slot should absorb. */
  share: number;
  /** Slots the system cannot be sold without. */
  essential?: boolean;
};

const DAMPING: Slot = {
  key: "damping",
  label: "Sound deadening",
  reason: "A door skin is a resonating steel panel. Damp it and every speaker on the car improves.",
  categories: ["Damping"],
  share: 0.14,
};

const WIRING: Slot = {
  key: "wiring",
  label: "Wiring kit",
  reason: "An amplifier is only as good as the power and signal reaching it.",
  categories: ["Wiring"],
  subcategories: ["Amplifier Kits"],
  share: 0.08,
  essential: true,
};

const RECIPES: Record<Goal, Slot[]> = {
  clarity: [
    { key: "front", label: "Front stage", reason: "Component speakers put the image on the dashboard instead of in the doors.", categories: ["Speakers"], subcategories: ["Component"], share: 0.45, essential: true },
    DAMPING,
    { key: "amplifier", label: "Amplifier", reason: "Head-unit power clips long before it gets loud. A small amp fixes that.", categories: ["Amplifiers"], subcategories: ["4-Channel"], share: 0.33 },
    WIRING,
  ],
  bass: [
    { key: "subwoofer", label: "Subwoofer", reason: "The only way to get the bottom two octaves into the car.", categories: ["Subwoofers"], share: 0.4, essential: true },
    { key: "monoAmp", label: "Mono amplifier", reason: "A subwoofer needs its own dedicated power.", categories: ["Amplifiers"], subcategories: ["Mono"], share: 0.35, essential: true },
    WIRING,
    DAMPING,
  ],
  loud: [
    { key: "front", label: "Pro front stage", reason: "Pro midranges hold up at volume where dome-tweeter coaxials give up.", categories: ["Speakers"], subcategories: ["Pro Midrange", "Pro Coaxial"], share: 0.3, essential: true },
    { key: "amplifier", label: "Multi-channel amplifier", reason: "High output across every channel, not just the fronts.", categories: ["Amplifiers"], subcategories: ["4-Channel", "5-Channel"], share: 0.34, essential: true },
    { key: "subwoofer", label: "Subwoofer", reason: "Keeps the midbass free to do midbass.", categories: ["Subwoofers"], share: 0.22 },
    WIRING,
  ],
  premium: [
    { key: "front", label: "Component front stage", reason: "The foundation of any processed system.", categories: ["Speakers"], subcategories: ["Component"], share: 0.3, essential: true },
    { key: "processor", label: "DSP", reason: "Time alignment and EQ — the part that makes a system sound designed rather than assembled.", categories: ["Processors"], subcategories: ["DSP"], share: 0.28, essential: true },
    { key: "subwoofer", label: "Subwoofer", reason: "Extends the response below what a door can support.", categories: ["Subwoofers"], share: 0.18 },
    DAMPING,
    WIRING,
  ],
  audiophile: [
    { key: "front", label: "Reference front stage", reason: "Three-way separation for a stage that holds its position.", categories: ["Speakers"], subcategories: ["Component"], share: 0.34, essential: true },
    { key: "processor", label: "DSP", reason: "Per-driver time alignment and parametric correction.", categories: ["Processors"], subcategories: ["DSP"], share: 0.22, essential: true },
    { key: "amplifier", label: "Amplifier", reason: "Clean headroom so nothing clips at listening level.", categories: ["Amplifiers"], share: 0.22 },
    DAMPING,
    WIRING,
  ],
  spl: [
    { key: "subwoofer", label: "SPL subwoofer", reason: "Purpose-built for output, not for background listening.", categories: ["Subwoofers"], subcategories: ["SPL"], share: 0.42, essential: true },
    { key: "monoAmp", label: "SPL mono amplifier", reason: "SPL drivers need serious current behind them.", categories: ["Amplifiers"], subcategories: ["Mono"], share: 0.36, essential: true },
    { key: "power", label: "Electrical support", reason: "Capacitors, distribution and terminals to keep voltage stable under load.", categories: ["Power"], share: 0.12 },
    WIRING,
  ],
  "oem-plus": [
    { key: "front", label: "Drop-in front speakers", reason: "Direct replacement for the factory drivers, no dashboard changes.", categories: ["Speakers"], subcategories: ["Coaxial", "Component"], share: 0.42, essential: true },
    DAMPING,
    { key: "processor", label: "Line output converter", reason: "Takes a clean signal off the factory head unit without touching the dashboard.", categories: ["Signal"], share: 0.2 },
    WIRING,
  ],
};

export type SystemSlot = {
  key: SlotKey;
  label: string;
  reason: string;
  product: CatalogProduct | null;
  skipped?: string;
};

export type SystemBuild = {
  goal: Goal;
  budget: Budget;
  vehicle: string | null;
  slots: SystemSlot[];
  total: number;
  withinBudget: boolean;
  notes: string[];
};

function pick(slot: Slot, target: number, taken: Set<string>): CatalogProduct | null {
  const candidates = PRODUCTS.filter(
    (p) =>
      !taken.has(p.sku) &&
      p.sellingPrice != null &&
      slot.categories.includes(p.category) &&
      (!slot.subcategories || slot.subcategories.includes(p.subcategory)),
  );
  if (candidates.length === 0) return null;

  // Closest to the slot's share of the budget, preferring to stay under it.
  return candidates.sort((a, b) => {
    const da = a.sellingPrice! - target;
    const db = b.sellingPrice! - target;
    const cost = (d: number) => (d <= 0 ? -d : d * 1.6);
    return cost(da) - cost(db);
  })[0];
}

export function buildSystem(budget: Budget, goal: Goal, vehicle: string | null = null): SystemBuild {
  const recipe = RECIPES[goal];
  const taken = new Set<string>();
  const notes: string[] = [];
  const slots: SystemSlot[] = [];

  for (const slot of recipe) {
    const target = budget * slot.share;
    const product = pick(slot, target, taken);

    if (!product) {
      slots.push({ ...slot, product: null, skipped: "Nothing in the current price list fits this slot." });
      continue;
    }
    taken.add(product.sku);
    slots.push({ key: slot.key, label: slot.label, reason: slot.reason, product });
  }

  const total = slots.reduce((n, s) => n + (s.product?.sellingPrice ?? 0), 0);

  // Drop non-essential slots, cheapest-value-first, until the build fits.
  if (total > budget) {
    const optional = recipe.filter((s) => !s.essential).map((s) => s.key);
    for (const key of optional.reverse()) {
      const running = slots.reduce((n, s) => n + (s.product?.sellingPrice ?? 0), 0);
      if (running <= budget) break;
      const slot = slots.find((s) => s.key === key && s.product);
      if (slot) {
        notes.push(`${slot.label} left out to stay inside ${formatINR(budget)} — worth adding as a stage two.`);
        slot.product = null;
        slot.skipped = "Outside this budget";
      }
    }
  }

  const finalTotal = slots.reduce((n, s) => n + (s.product?.sellingPrice ?? 0), 0);

  if (goal === "spl") {
    notes.push(
      "An SPL build needs electrical work beyond the parts list — big-three upgrade, second battery and alternator capacity. We quote that after seeing the car.",
    );
  }
  if (slots.some((s) => s.key === "subwoofer" && s.product)) {
    notes.push("Enclosure design is quoted separately: the box matters as much as the driver.");
  }
  if (finalTotal > budget) {
    notes.push(
      `The smallest sensible combination for this goal comes to ${formatINR(finalTotal)}. We would rather show you that than a system that will disappoint.`,
    );
  }

  return {
    goal,
    budget,
    vehicle,
    slots,
    total: finalTotal,
    withinBudget: finalTotal <= budget,
    notes,
  };
}

function formatINR(v: number) {
  return `₹${v.toLocaleString("en-IN")}`;
}
