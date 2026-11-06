import { describe, expect, it } from "vitest";
import {
  EMPTY_SELECTION,
  barState,
  canSubmit,
  carTitle,
  choose,
  fromSavedCar,
  missingStep,
  stepEnabled,
  toSavedCar,
  type VehicleBrand,
} from "../vehicleBarState";

const BRANDS: VehicleBrand[] = [
  {
    slug: "hyundai",
    name: "Hyundai",
    models: [{ slug: "creta", name: "Creta", variants: ["SX", "SX(O)"], years: [2023, 2024] }],
  },
  {
    slug: "mahindra",
    name: "Mahindra",
    models: [{ slug: "thar", name: "Thar", variants: ["LX 4x4"], years: [2022] }],
  },
];

describe("vehicle bar state", () => {
  it("is empty without a saved car and saved with one", () => {
    expect(barState(null)).toEqual({ kind: "empty" });
    const car = toSavedCar(BRANDS, { brand: "hyundai", model: "creta", variant: "SX", year: "2024" })!;
    expect(barState(car)).toEqual({ kind: "saved", car });
  });

  it("enables each select only once the previous step is chosen", () => {
    expect(stepEnabled(EMPTY_SELECTION, "brand")).toBe(true);
    expect(stepEnabled(EMPTY_SELECTION, "model")).toBe(false);
    const withBrand = choose(EMPTY_SELECTION, "brand", "hyundai");
    expect(stepEnabled(withBrand, "model")).toBe(true);
    expect(stepEnabled(withBrand, "variant")).toBe(false);
    expect(stepEnabled(withBrand, "year")).toBe(false);
    const withModel = choose(withBrand, "model", "creta");
    expect(stepEnabled(withModel, "variant")).toBe(true);
    expect(stepEnabled(withModel, "year")).toBe(true);
  });

  it("clears later steps when an earlier one changes", () => {
    const full = { brand: "hyundai", model: "creta", variant: "SX", year: "2024" };
    expect(choose(full, "brand", "mahindra")).toEqual({ brand: "mahindra", model: "", variant: "", year: "" });
    expect(choose(full, "model", "creta")).toEqual({ brand: "hyundai", model: "creta", variant: "", year: "" });
  });

  it("enables the button as soon as a brand is picked and points at the next missing step", () => {
    expect(canSubmit(EMPTY_SELECTION)).toBe(false);
    const sel = choose(EMPTY_SELECTION, "brand", "hyundai");
    expect(canSubmit(sel)).toBe(true);
    expect(missingStep(sel)).toBe("model");
    expect(missingStep({ brand: "hyundai", model: "creta", variant: "SX", year: "" })).toBe("year");
    expect(missingStep({ brand: "hyundai", model: "creta", variant: "SX", year: "2024" })).toBeNull();
  });

  it("saves only a complete, consistent car", () => {
    expect(toSavedCar(BRANDS, { brand: "hyundai", model: "creta", variant: "SX", year: "" })).toBeNull();
    expect(toSavedCar(BRANDS, { brand: "hyundai", model: "creta", variant: "LX 4x4", year: "2024" })).toBeNull();
    expect(toSavedCar(BRANDS, { brand: "hyundai", model: "creta", variant: "SX", year: "2019" })).toBeNull();
    expect(toSavedCar(BRANDS, { brand: "hyundai", model: "creta", variant: "SX(O)", year: "2024" })).toEqual({
      brandSlug: "hyundai",
      modelSlug: "creta",
      variant: "SX(O)",
      year: 2024,
      label: "Hyundai Creta SX(O) 2024",
    });
  });

  it("round-trips a saved car for 'Change car' and titles it for the saved bar", () => {
    const sel = { brand: "mahindra", model: "thar", variant: "LX 4x4", year: "2022" };
    const car = toSavedCar(BRANDS, sel)!;
    expect(fromSavedCar(car)).toEqual(sel);
    expect(carTitle(BRANDS, car)).toEqual({ name: "Mahindra Thar", detail: "LX 4x4 · 2022", model: "Thar" });
  });

  it("falls back to the stored label for a car no longer in the list", () => {
    const car = { brandSlug: "gone", modelSlug: "old", variant: "X", year: 2010, label: "Old Car X 2010" };
    expect(carTitle(BRANDS, car)).toEqual({ name: "Old Car X 2010", detail: "", model: "Old Car X 2010" });
  });
});
