import type { MediaKey } from "@/lib/media";

export type Fuel = "Petrol" | "Diesel" | "CNG" | "Electric" | "Hybrid";
export type Transmission = "Manual" | "Automatic";
export type Drivetrain = "2WD" | "AWD" | "4WD";
export type CarCondition = "New" | "Used" | "Certified" | "Modified";
export type PriceTier = "Budget" | "Premium" | "Luxury";

export type Car = {
  slug: string;
  brand: string;
  brandSlug: string;
  model: string;
  variant: string;
  year: number;
  price: number;
  km: number;
  fuel: Fuel;
  transmission: Transmission;
  owner: string;
  city: string;
  state: string;
  body: string;
  engine: string;
  power: string;
  drivetrain: Drivetrain;
  condition: CarCondition;
  tier: PriceTier;
  verified: boolean;
  financing: boolean;
  inspectionScore: number;
  insurance: string;
  registration: string;
  serviceHistory: string;
  photoCount: number;
  hasVideo: boolean;
  has360: boolean;
  images: MediaKey[];
  highlights: string[];
  modifications?: { name: string; value: string }[];
  note: string;
  featured?: boolean;
};

/**
 * Riderzpro's own car listings. Empty: the earlier 16 cars were demo content. The car pages show their
 * empty state ("tell us what you want") until real listings are added here.
 */
export const CARS: Car[] = [];

export const FEATURED_CARS = CARS.filter((c) => c.featured);

export function getCar(slug: string): Car | undefined {
  return CARS.find((c) => c.slug === slug);
}

export function relatedCars(car: Car, limit = 3): Car[] {
  return CARS.filter((c) => c.slug !== car.slug)
    .map((c) => {
      let score = 0;
      if (c.body === car.body) score += 3;
      if (c.brandSlug === car.brandSlug) score += 2;
      if (c.tier === car.tier) score += 2;
      if (Math.abs(c.price - car.price) < 5_00_000) score += 2;
      if (c.city === car.city) score += 1;
      return { c, score };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((x) => x.c);
}

export const CAR_FILTERS = {
  condition: ["New", "Certified", "Used", "Modified"] as const,
  body: ["SUV", "Off-Roader", "Sedan", "Hatchback", "Pickup", "MUV"] as const,
  fuel: ["Petrol", "Diesel", "CNG", "Electric", "Hybrid"] as const,
  transmission: ["Manual", "Automatic"] as const,
  drivetrain: ["2WD", "AWD", "4WD"] as const,
  owner: ["1st Owner", "2nd Owner", "3rd Owner"] as const,
  tier: ["Budget", "Premium", "Luxury"] as const,
  price: [
    { label: "Under ₹10 L", min: 0, max: 10_00_000 },
    { label: "₹10 – 20 L", min: 10_00_000, max: 20_00_000 },
    { label: "₹20 – 35 L", min: 20_00_000, max: 35_00_000 },
    { label: "₹35 L +", min: 35_00_000, max: Number.MAX_SAFE_INTEGER },
  ],
  year: [
    { label: "2023 & newer", min: 2023, max: 2030 },
    { label: "2020 – 2022", min: 2020, max: 2022 },
    { label: "2017 – 2019", min: 2017, max: 2019 },
    { label: "Before 2017", min: 1990, max: 2016 },
  ],
  km: [
    { label: "Under 25,000", min: 0, max: 25_000 },
    { label: "25k – 50k", min: 25_000, max: 50_000 },
    { label: "50k – 80k", min: 50_000, max: 80_000 },
    { label: "80,000 +", min: 80_000, max: Number.MAX_SAFE_INTEGER },
  ],
};

export const CAR_CITIES = Array.from(new Set(CARS.map((c) => c.city))).sort();
export const CAR_BRANDS = Array.from(new Set(CARS.map((c) => c.brand))).sort();
