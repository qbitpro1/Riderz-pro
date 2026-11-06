/**
 * VEHICLE BAR STATE — the pure part of the "What do you drive?" bar, kept free of React and storage
 * so it can be unit tested.
 *
 *   empty  → the four selects (Brand → Model → Variant → Year), each enabled once the previous
 *            step is chosen; "Show parts that fit" is enabled as soon as a brand is picked and,
 *            if a later step is still open, points the shopper at it instead of submitting
 *   saved  → the car is stored (lib/client/garage) and results are filtered to parts that fit
 */

export type VehicleModel = { slug: string; name: string; variants: string[]; years: number[] };
export type VehicleBrand = { slug: string; name: string; models: VehicleModel[] };

export type Selection = { brand: string; model: string; variant: string; year: string };
export type Step = keyof Selection;

export const STEPS: Step[] = ["brand", "model", "variant", "year"];
export const EMPTY_SELECTION: Selection = { brand: "", model: "", variant: "", year: "" };

/** A saved car, in the shape lib/client/garage stores. */
export type SavedCar = { brandSlug: string; modelSlug: string; variant: string; year: number; label: string };

export type BarState = { kind: "empty" } | { kind: "saved"; car: SavedCar };

/** The bar shows the saved state whenever a car is stored, the empty state otherwise. */
export const barState = (car: SavedCar | null): BarState => (car ? { kind: "saved", car } : { kind: "empty" });

/** Choosing a step clears every later step, so a stale variant can never outlive its model. */
export function choose(sel: Selection, step: Step, value: string): Selection {
  const next = { ...sel, [step]: value };
  for (const later of STEPS.slice(STEPS.indexOf(step) + 1)) next[later] = "";
  return next;
}

/** Whether a step's select is enabled: the brand always, later steps once the previous one is chosen. */
export function stepEnabled(sel: Selection, step: Step): boolean {
  if (step === "brand") return true;
  if (step === "model") return Boolean(sel.brand);
  return Boolean(sel.model); // variant and year both depend on the model
}

/** The button is enabled as soon as a brand is picked. */
export const canSubmit = (sel: Selection): boolean => Boolean(sel.brand);

/** The first step still to choose, or null when the selection is complete. */
export const missingStep = (sel: Selection): Step | null => STEPS.find((s) => !sel[s]) ?? null;

export function findCar(brands: readonly VehicleBrand[], sel: Selection) {
  const brand = brands.find((b) => b.slug === sel.brand);
  const model = brand?.models.find((m) => m.slug === sel.model);
  return { brand, model };
}

/**
 * The car to save for a complete, valid selection, or null when a step is missing or the
 * variant / year doesn't belong to the chosen model.
 */
export function toSavedCar(brands: readonly VehicleBrand[], sel: Selection): SavedCar | null {
  const { brand, model } = findCar(brands, sel);
  const year = Number(sel.year);
  if (!brand || !model || !model.variants.includes(sel.variant) || !model.years.includes(year)) return null;
  return {
    brandSlug: brand.slug,
    modelSlug: model.slug,
    variant: sel.variant,
    year,
    label: `${brand.name} ${model.name} ${sel.variant} ${year}`,
  };
}

/** A saved car back as a selection, so "Change car" starts from it. */
export const fromSavedCar = (car: SavedCar): Selection => ({
  brand: car.brandSlug,
  model: car.modelSlug,
  variant: car.variant,
  year: String(car.year),
});

/** "{Brand} {Model}" and "{Variant} · {Year}" for the saved bar; falls back to the stored label. */
export function carTitle(brands: readonly VehicleBrand[], car: SavedCar): { name: string; detail: string; model: string } {
  const { brand, model } = findCar(brands, fromSavedCar(car));
  if (!brand || !model) return { name: car.label, detail: "", model: car.label };
  return { name: `${brand.name} ${model.name}`, detail: `${car.variant} · ${car.year}`, model: model.name };
}
