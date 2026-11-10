/**
 * Riderzpro's own cars for sale: the shapes only. The cars themselves are in the database
 * (car_listings), added by the team in /admin/cars; read them with src/lib/server/cars.ts.
 */

export type Fuel = "Petrol" | "Diesel" | "CNG" | "Electric" | "Hybrid";
export type Transmission = "Manual" | "Automatic";
export type Drivetrain = "2WD" | "AWD" | "4WD";

export const FUELS: Fuel[] = ["Petrol", "Diesel", "CNG", "Electric", "Hybrid"];
export const TRANSMISSIONS: Transmission[] = ["Manual", "Automatic"];
export const DRIVETRAINS: Drivetrain[] = ["2WD", "AWD", "4WD"];
export const BODY_TYPES = ["Hatchback", "Sedan", "SUV", "MUV", "MPV", "Coupe", "Convertible", "Pickup", "Off-Roader"] as const;
export type BodyType = (typeof BODY_TYPES)[number];
export const CAR_STATUSES = ["draft", "live", "sold", "archived"] as const;
export type CarStatus = (typeof CAR_STATUSES)[number];

export type Car = {
  id: string;
  slug: string;
  status: CarStatus;
  brand: string;
  model: string;
  variant: string;
  year: number;
  price: number;
  km: number;
  fuel: Fuel;
  transmission: Transmission;
  owners: number;
  /** "1st Owner", "2nd Owner"… */
  owner: string;
  city: string;
  state: string;
  body: BodyType;
  engine: string | null;
  power: string | null;
  drivetrain: Drivetrain;
  colour: string | null;
  registration: string | null;
  insurance: string | null;
  serviceHistory: string | null;
  note: string;
  highlights: string[];
  modifications: { name: string; value: string }[];
  /** Uploaded photo URLs, first is the cover. */
  photos: string[];
  photoIds: string[];
  financing: boolean;
  featured: boolean;
  createdAt: string;
};

export const ownerLabel = (n: number) => `${n}${n === 1 ? "st" : n === 2 ? "nd" : n === 3 ? "rd" : "th"} Owner`;
