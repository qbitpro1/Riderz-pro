import { BRANDS } from "@/lib/data/vehicles";
import type { BodyType, Drivetrain, Fuel, Listing, Transmission } from "./types";

/**
 * Natural-language search.
 *
 * "Thar under 15 lakh", "Fortuner diesel automatic Delhi", "1st owner SUV under
 * 10 lakh", "4x4 under 20 lakh". Anything the parser cannot place is kept as
 * free text and matched against the listing, so a query is never silently
 * dropped.
 */

export type ParsedQuery = {
  makes: string[];
  models: string[];
  maxPrice: number | null;
  minPrice: number | null;
  fuels: Fuel[];
  transmissions: Transmission[];
  bodyTypes: BodyType[];
  drivetrains: Drivetrain[];
  cities: string[];
  maxOwners: number | null;
  maxKm: number | null;
  minYear: number | null;
  freeText: string[];
};

const CITIES = [
  "delhi", "new delhi", "gurugram", "gurgaon", "noida", "ghaziabad", "faridabad", "delhi ncr", "ncr",
  "mumbai", "pune", "bengaluru", "bangalore", "hyderabad", "chennai", "kochi", "ahmedabad", "jaipur",
  "lucknow", "nagpur", "coimbatore", "chandigarh", "kolkata", "indore",
];

const FUELS: Record<string, Fuel> = {
  petrol: "Petrol",
  diesel: "Diesel",
  cng: "CNG",
  electric: "Electric",
  ev: "Electric",
  hybrid: "Hybrid",
};

const TRANSMISSIONS: Record<string, Transmission> = {
  manual: "Manual",
  automatic: "Automatic",
  auto: "Automatic",
  amt: "AMT",
  cvt: "CVT",
  dct: "DCT",
  dsg: "DCT",
  at: "AT",
};

const BODY_TYPES: Record<string, BodyType> = {
  hatchback: "Hatchback",
  hatch: "Hatchback",
  sedan: "Sedan",
  suv: "SUV",
  muv: "MUV",
  mpv: "MPV",
  coupe: "Coupe",
  convertible: "Convertible",
  pickup: "Pickup",
  offroader: "Off-Roader",
};

const DRIVETRAINS: Record<string, Drivetrain> = {
  "4x4": "4WD",
  "4wd": "4WD",
  awd: "AWD",
  "4x2": "2WD",
  "2wd": "2WD",
};

const ALL_MAKES = BRANDS.map((b) => b.name);
const ALL_MODELS = BRANDS.flatMap((b) => b.models.map((m) => ({ make: b.name, model: m.name })));

export function parseQuery(raw: string): ParsedQuery {
  const q = ` ${raw.toLowerCase().replace(/[,]/g, " ").replace(/\s+/g, " ").trim()} `;
  const out: ParsedQuery = {
    makes: [], models: [], maxPrice: null, minPrice: null, fuels: [], transmissions: [],
    bodyTypes: [], drivetrains: [], cities: [], maxOwners: null, maxKm: null, minYear: null, freeText: [],
  };
  const consumed: string[] = [];
  const take = (phrase: string) => consumed.push(phrase);

  // Budget: "under 15 lakh", "below 40l", "upto 8.5 lakh", "20-30 lakh"
  const range = q.match(/(\d+(?:\.\d+)?)\s*(?:l|lakh|lac)?\s*(?:-|to)\s*(\d+(?:\.\d+)?)\s*(?:l|lakh|lac|cr|crore)/);
  if (range) {
    out.minPrice = toRupees(range[1], range[0]);
    out.maxPrice = toRupees(range[2], range[0]);
    take(range[0]);
  } else {
    const under = q.match(/(?:under|below|less than|upto|up to|within|max)\s*₹?\s*(\d+(?:\.\d+)?)\s*(l|lakh|lac|cr|crore|k)?/);
    if (under) {
      out.maxPrice = toRupees(under[1], under[2] ?? "lakh");
      take(under[0]);
    }
    const over = q.match(/(?:over|above|more than|minimum|min)\s*₹?\s*(\d+(?:\.\d+)?)\s*(l|lakh|lac|cr|crore)?/);
    if (over) {
      out.minPrice = toRupees(over[1], over[2] ?? "lakh");
      take(over[0]);
    }
  }

  // Odometer: "under 40000 km", "below 50k km"
  const km = q.match(/(?:under|below|less than|upto|up to|within)\s*(\d+(?:\.\d+)?)\s*(k|thousand)?\s*(?:km|kms|kilometers|kilometres)/);
  if (km) {
    const n = Number(km[1]);
    out.maxKm = km[2] ? n * 1000 : n;
    take(km[0]);
  }

  // Ownership: "1st owner", "single owner", "first owner"
  const owner = q.match(/\b(?:(1st|first|single)|(2nd|second)|(3rd|third))\s*owner\b/);
  if (owner) {
    out.maxOwners = owner[1] ? 1 : owner[2] ? 2 : 3;
    take(owner[0]);
  }

  // Year: "2022 or newer", or a bare four-digit year.
  const yearPhrase = q.match(/\b(20\d{2})\s*(?:\+|or newer|onwards|and above)\b/);
  if (yearPhrase) {
    out.minYear = Number(yearPhrase[1]);
    take(yearPhrase[0]);
  } else {
    const bare = q.match(/\b(19|20)\d{2}\b/);
    if (bare) {
      out.minYear = Number(bare[0]);
      take(bare[0]);
    }
  }

  for (const [word, value] of Object.entries(DRIVETRAINS)) {
    if (q.includes(` ${word} `)) {
      pushUnique(out.drivetrains, value);
      take(word);
    }
  }
  for (const [word, value] of Object.entries(FUELS)) {
    if (q.includes(` ${word} `)) {
      pushUnique(out.fuels, value);
      take(word);
    }
  }
  for (const [word, value] of Object.entries(TRANSMISSIONS)) {
    if (q.includes(` ${word} `)) {
      pushUnique(out.transmissions, value);
      take(word);
    }
  }
  for (const [word, value] of Object.entries(BODY_TYPES)) {
    if (q.includes(` ${word} `)) {
      pushUnique(out.bodyTypes, value);
      take(word);
    }
  }

  // Model before make: "Thar" implies Mahindra without the word being typed.
  for (const { make, model } of ALL_MODELS) {
    if (q.includes(` ${model.toLowerCase()} `)) {
      pushUnique(out.models, model);
      pushUnique(out.makes, make);
      take(model.toLowerCase());
    }
  }
  for (const make of ALL_MAKES) {
    if (q.includes(` ${make.toLowerCase()} `)) {
      pushUnique(out.makes, make);
      take(make.toLowerCase());
    }
  }

  for (const city of CITIES) {
    if (q.includes(` ${city} `)) {
      pushUnique(out.cities, normaliseCity(city));
      take(city);
    }
  }

  // Whatever the parser did not claim stays as free text.
  let remainder = q;
  for (const phrase of consumed) remainder = remainder.replace(new RegExp(escape(phrase), "g"), " ");
  out.freeText = remainder
    .split(/\s+/)
    .map((t) => t.trim())
    .filter((t) => t.length > 2 && !STOP_WORDS.has(t));

  return out;
}

const STOP_WORDS = new Set(["the", "for", "with", "and", "car", "cars", "used", "buy", "want", "need", "show", "near", "me", "in", "at", "lakh", "lac"]);

function escape(s: string) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function pushUnique<T>(arr: T[], v: T) {
  if (!arr.includes(v)) arr.push(v);
}

function toRupees(amount: string, unitHint: string): number {
  const n = Number(amount);
  const hint = unitHint.toLowerCase();
  if (hint.includes("cr")) return n * 1_00_00_000;
  if (hint.trim() === "k") return n * 1000;
  // Bare numbers in an Indian car search mean lakh.
  return n * 1_00_000;
}

function normaliseCity(city: string): string {
  const map: Record<string, string> = {
    gurgaon: "Gurugram",
    bangalore: "Bengaluru",
    "new delhi": "New Delhi",
    ncr: "Delhi NCR",
    "delhi ncr": "Delhi NCR",
  };
  return map[city] ?? city.replace(/\b\w/g, (c) => c.toUpperCase());
}

/** Applies a parsed query to the inventory. */
export function runQuery(listings: Listing[], parsed: ParsedQuery): Listing[] {
  return listings.filter((l) => {
    if (parsed.makes.length && !parsed.makes.some((m) => m.toLowerCase() === l.make.toLowerCase())) return false;
    if (parsed.models.length && !parsed.models.some((m) => m.toLowerCase() === l.model.toLowerCase())) return false;
    if (parsed.maxPrice != null && (l.price == null || l.price > parsed.maxPrice)) return false;
    if (parsed.minPrice != null && (l.price == null || l.price < parsed.minPrice)) return false;
    if (parsed.fuels.length && (!l.fuel || !parsed.fuels.includes(l.fuel))) return false;
    if (parsed.transmissions.length && !matchesTransmission(l.transmission, parsed.transmissions)) return false;
    if (parsed.bodyTypes.length && (!l.bodyType || !parsed.bodyTypes.includes(l.bodyType))) return false;
    if (parsed.drivetrains.length && (!l.drivetrain || !parsed.drivetrains.includes(l.drivetrain))) return false;
    if (parsed.cities.length && !parsed.cities.some((c) => cityMatches(c, l))) return false;
    if (parsed.maxOwners != null && (l.owners == null || l.owners > parsed.maxOwners)) return false;
    if (parsed.maxKm != null && (l.km == null || l.km > parsed.maxKm)) return false;
    if (parsed.minYear != null && l.year < parsed.minYear) return false;

    if (parsed.freeText.length) {
      const hay = `${l.make} ${l.model} ${l.variant ?? ""} ${l.bodyType ?? ""} ${l.city} ${l.colour ?? ""} ${(l.modifications ?? [])
        .map((m) => `${m.name} ${m.value}`)
        .join(" ")}`.toLowerCase();
      if (!parsed.freeText.every((t) => hay.includes(t))) return false;
    }
    return true;
  });
}

/** "Automatic" should also return AMT, CVT, DCT and AT cars. */
function matchesTransmission(actual: Transmission | null, wanted: Transmission[]): boolean {
  if (!actual) return false;
  if (wanted.includes(actual)) return true;
  const autos: Transmission[] = ["Automatic", "AMT", "CVT", "DCT", "AT"];
  return wanted.includes("Automatic") && autos.includes(actual);
}

const NCR = ["delhi", "new delhi", "gurugram", "noida", "ghaziabad", "faridabad"];

function cityMatches(query: string, l: Listing): boolean {
  const city = l.city.toLowerCase();
  if (query === "Delhi NCR") return NCR.includes(city);
  return city === query.toLowerCase();
}

export const SEARCH_EXAMPLES = [
  "Thar under 15 lakh",
  "Fortuner diesel automatic Delhi",
  "BMW under 40 lakh Gurugram",
  "1st owner SUV under 10 lakh",
  "4x4 under 20 lakh",
  "Creta petrol automatic under 40000 km",
];
