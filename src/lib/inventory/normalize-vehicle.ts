import { BRANDS } from "@/lib/data/vehicles";
import type { BodyType, Drivetrain, Fuel, Transmission } from "./types";

/**
 * NORMALIZATION ENGINE
 *
 * Dealer A writes "Hyundai Creta SX(O) 1.5 Diesel AT".
 * Dealer B writes "Creta SXO Diesel Automatic".
 * Dealer C writes "Hyundai Creta SXO 2023 D AT".
 *
 * All three are the same car. This turns them into one canonical record while
 * keeping every original string, because when a dealer disputes a listing the
 * answer has to be "here is exactly what you sent us".
 */

export type RawVehicle = Record<string, string | number | null | undefined>;

export type NormalizedVehicle = {
  make: string | null;
  model: string | null;
  variant: string | null;
  year: number | null;
  registrationYear: number | null;
  fuel: Fuel | null;
  transmission: Transmission | null;
  bodyType: BodyType | null;
  drivetrain: Drivetrain | null;
  km: number | null;
  owners: number | null;
  price: number | null;
  colour: string | null;
  city: string | null;
  vin: string | null;
  registration: string | null;
  stockId: string | null;
  description: string | null;
  images: string[];
  status: "AVAILABLE" | "SOLD" | "RESERVED" | null;
  /** Everything the supplier wrote, concatenated — checked for claims we cannot verify. */
  supplierText: string;
  /** Exactly what the supplier sent, field by field. Never discarded. */
  original: RawVehicle;
  /** What the engine had to infer, so a human can audit it. */
  inferences: string[];
};

/* ------------------------------------------------------------ dictionaries */

const FUEL_MAP: Record<string, Fuel> = {
  p: "Petrol", petrol: "Petrol", pet: "Petrol", gasoline: "Petrol", mpfi: "Petrol",
  d: "Diesel", diesel: "Diesel", dsl: "Diesel", crdi: "Diesel",
  cng: "CNG", "petrol+cng": "CNG", "cng+petrol": "CNG", lpg: "CNG",
  e: "Electric", ev: "Electric", electric: "Electric", bev: "Electric",
  hybrid: "Hybrid", hev: "Hybrid", "strong hybrid": "Hybrid", "mild hybrid": "Hybrid",
};

const TRANSMISSION_MAP: Record<string, Transmission> = {
  m: "Manual", mt: "Manual", manual: "Manual", "5mt": "Manual", "6mt": "Manual", stick: "Manual",
  a: "Automatic", at: "AT", auto: "Automatic", automatic: "Automatic", tc: "AT", torque: "AT",
  amt: "AMT", imt: "Manual",
  cvt: "CVT", ivt: "CVT", evt: "CVT",
  dct: "DCT", dsg: "DCT", "dual clutch": "DCT", pdk: "DCT", tct: "DCT",
};

const BODY_MAP: Record<string, BodyType> = {
  hatch: "Hatchback", hatchback: "Hatchback",
  sedan: "Sedan", saloon: "Sedan", notchback: "Sedan",
  suv: "SUV", crossover: "SUV",
  muv: "MUV", mpv: "MPV", van: "MPV",
  coupe: "Coupe", convertible: "Convertible", cabrio: "Convertible", roadster: "Convertible",
  pickup: "Pickup", "pick up": "Pickup", truck: "Pickup",
  offroader: "Off-Roader", "off roader": "Off-Roader", jeep: "Off-Roader",
};

const DRIVETRAIN_MAP: Record<string, Drivetrain> = {
  "4x4": "4WD", "4wd": "4WD", awd: "AWD", "all wheel": "AWD", quattro: "AWD", "4matic": "AWD",
  xdrive: "AWD", allgrip: "AWD", "4xplor": "4WD",
  "4x2": "2WD", "2wd": "2WD", fwd: "2WD", rwd: "2WD",
};

/**
 * Variant spellings dealers actually use. Canonical form on the right, matching
 * how the manufacturer writes it.
 */
// A trailing \b will not match after ")", so these use a negative lookahead —
// otherwise "SX(O)" normalises to "SX(O) )" and drags the bracket along.
const VARIANT_TOKENS: [RegExp, string][] = [
  [/\bsx\s*\(?\s*o\s*\)?(?![a-z0-9])/i, "SX(O)"],
  [/\bzx\s*\(?\s*o\s*\)?(?![a-z0-9])/i, "ZX(O)"],
  [/\basta\s*\(?\s*o\s*\)?(?![a-z0-9])/i, "Asta(O)"],
  [/\bvx\s*\(?\s*o\s*\)?(?![a-z0-9])/i, "VX(O)"],
  [/\bax\s*7\s*l\b/i, "AX7L"],
  [/\bz\s*8\s*l\b/i, "Z8L"],
  [/\bgtx\s*\+/i, "GTX+"],
  [/\bhtx\s*\+/i, "HTX+"],
  [/\bzxi\s*\+/i, "ZXi+"],
  [/\bvxi\s*\+/i, "VXi+"],
  [/\bxz\s*\+/i, "XZ+"],
  [/\btop\s*model\b/i, ""],
  [/\bfully\s*loaded\b/i, ""],
];

/**
 * Noise that shows up in dealer variant strings. Two kinds: harmless clutter
 * ("BS6", "negotiable"), and unverifiable quality claims that must never end up
 * in a canonical variant name — a car is not "accident-free" because the person
 * selling it typed that into a spreadsheet cell.
 */
const VARIANT_NOISE =
  /\b(bs\s*4|bs\s*6|bs\s*vi|bs\s*iv|single owner|1st owner|first owner|2nd owner|second owner|company maintained|showroom condition|mint condition|excellent condition|excellent|good condition|well maintained|well kept|urgent sale|fixed price|negotiable|neg|scratchless|scratch less|accident[\s-]*free|accidental[\s-]*free|non[\s-]*accidental|no accident|insurance valid|new tyres|genuine km|genuine|top condition|showroom)\b/gi;

/* -------------------------------------------------------------- field maps */

/** Header aliases, so a dealer's own column names just work. */
const HEADER_ALIASES: Record<string, string[]> = {
  stockId: ["stock id", "stockid", "stock no", "stock number", "sr no", "srno", "id", "ref", "reference", "vehicle id"],
  make: ["make", "brand", "manufacturer", "company", "oem"],
  model: ["model", "car model", "vehicle model", "model name"],
  variant: ["variant", "trim", "version", "grade", "spec", "model variant"],
  year: ["year", "model year", "mfg year", "manufacturing year", "make year", "yom"],
  registrationYear: ["registration year", "reg year", "regn year", "registered", "reg yr"],
  fuel: ["fuel", "fuel type", "fueltype"],
  transmission: ["transmission", "gearbox", "trans", "gear"],
  km: ["km", "kms", "kilometers", "kilometres", "km driven", "odometer", "mileage", "run"],
  owners: ["owners", "owner", "no of owners", "ownership", "owner count", "no. of owners"],
  price: ["price", "asking price", "selling price", "amount", "cost", "rate", "sale price"],
  city: ["city", "location", "place", "branch", "showroom"],
  colour: ["colour", "color", "exterior colour", "exterior color", "paint"],
  vin: ["vin", "chassis", "chassis no", "chassis number", "vin number"],
  registration: ["registration", "reg no", "regn no", "registration number", "number plate", "vehicle number", "rc number"],
  bodyType: ["body", "body type", "bodytype", "segment", "category"],
  drivetrain: ["drivetrain", "drive", "drive type", "4x4", "wheel drive"],
  description: ["description", "remarks", "notes", "comments", "details"],
  images: ["images", "image", "photos", "photo", "image urls", "picture", "pictures"],
  status: ["status", "availability", "available", "sold"],
};

/** Maps a supplier's header row onto our field names. */
export function mapHeaders(headers: string[]): Record<number, string> {
  const out: Record<number, string> = {};
  headers.forEach((header, i) => {
    const clean = header.toLowerCase().trim().replace(/[_-]+/g, " ").replace(/\s+/g, " ");
    for (const [field, aliases] of Object.entries(HEADER_ALIASES)) {
      if (aliases.includes(clean)) {
        out[i] = field;
        return;
      }
    }
    // Fall back to a loose contains match, longest alias first.
    for (const [field, aliases] of Object.entries(HEADER_ALIASES)) {
      if ([...aliases].sort((a, b) => b.length - a.length).some((a) => clean.includes(a))) {
        out[i] = field;
        return;
      }
    }
  });
  return out;
}

/* ---------------------------------------------------------------- helpers */

const clean = (v: unknown): string => String(v ?? "").trim();

/** "12,75,000", "12.75 lakh", "₹1275000", "12.75L" all mean the same thing. */
export function parsePrice(input: unknown): { value: number | null; assumed: string | null } {
  if (input == null || input === "") return { value: null, assumed: null };
  if (typeof input === "number") return normaliseMagnitude(input);
  const raw = String(input).toLowerCase().replace(/[₹,\s]/g, "");
  const lakhMatch = raw.match(/^(\d+(?:\.\d+)?)(l|lakh|lac|lacs)$/);
  if (lakhMatch) return { value: Math.round(Number(lakhMatch[1]) * 1_00_000), assumed: null };
  const croreMatch = raw.match(/^(\d+(?:\.\d+)?)(cr|crore)$/);
  if (croreMatch) return { value: Math.round(Number(croreMatch[1]) * 1_00_00_000), assumed: null };
  const n = Number(raw.replace(/[^\d.]/g, ""));
  return Number.isFinite(n) && n > 0 ? normaliseMagnitude(n) : { value: null, assumed: null };
}

/**
 * A used car priced at "12.75" means ₹12.75 lakh, not ₹12.75 — but that is an
 * assumption, and a mistyped cell can sail through it. Whenever we scale a
 * number we say so, so the dealer sees how we read it before it goes live.
 */
function normaliseMagnitude(n: number): { value: number | null; assumed: string | null } {
  if (n > 0 && n < 500) {
    return { value: Math.round(n * 1_00_000), assumed: `read "${n}" as ₹${(n).toFixed(2)} lakh` };
  }
  if (n >= 500 && n < 10_000) {
    return { value: Math.round(n * 1000), assumed: `read "${n}" as ₹${n} thousand` };
  }
  return { value: Math.round(n), assumed: null };
}

/** "42,000", "42000 km", "42k", "0.42 lakh km". */
export function parseKm(input: unknown): number | null {
  if (input == null || input === "") return null;
  if (typeof input === "number") return Math.round(input);
  const raw = String(input).toLowerCase().replace(/[,\s]/g, "");
  const k = raw.match(/^(\d+(?:\.\d+)?)k(m|ms)?$/);
  if (k) return Math.round(Number(k[1]) * 1000);
  const lakh = raw.match(/^(\d+(?:\.\d+)?)(l|lakh)/);
  if (lakh) return Math.round(Number(lakh[1]) * 1_00_000);
  const n = Number(raw.replace(/[^\d.]/g, ""));
  return Number.isFinite(n) && n >= 0 ? Math.round(n) : null;
}

export function parseYear(input: unknown): number | null {
  const m = clean(input).match(/(19|20)\d{2}/);
  if (!m) return null;
  const y = Number(m[0]);
  return y >= 1980 && y <= new Date().getFullYear() + 1 ? y : null;
}

export function parseOwners(input: unknown): number | null {
  const raw = clean(input).toLowerCase();
  if (!raw) return null;
  if (/first|1st|single|one/.test(raw)) return 1;
  if (/second|2nd|two/.test(raw)) return 2;
  if (/third|3rd|three/.test(raw)) return 3;
  const m = raw.match(/\d+/);
  const n = m ? Number(m[0]) : null;
  return n && n > 0 && n < 10 ? n : null;
}

function lookup<T>(map: Record<string, T>, input: unknown): T | null {
  const raw = clean(input).toLowerCase().replace(/[._]/g, " ").trim();
  if (!raw) return null;
  if (map[raw]) return map[raw];
  // Longest key first, so "dual clutch" beats "a".
  for (const key of Object.keys(map).sort((a, b) => b.length - a.length)) {
    if (key.length < 3) continue;
    if (new RegExp(`\\b${key.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`).test(raw)) return map[key];
  }
  return null;
}

export const parseFuel = (v: unknown) => lookup(FUEL_MAP, v);
export const parseTransmission = (v: unknown) => lookup(TRANSMISSION_MAP, v);
export const parseBodyType = (v: unknown) => lookup(BODY_MAP, v);
export const parseDrivetrain = (v: unknown) => lookup(DRIVETRAIN_MAP, v);

/* ------------------------------------------------------- make/model/variant */

const CATALOGUE = BRANDS.flatMap((b) =>
  b.models.map((m) => ({ make: b.name, model: m.name, variants: m.variants, body: m.body })),
);

/**
 * Pulls make, model and variant out of whatever the dealer wrote, using the
 * vehicle catalogue as the authority. A model name alone is enough — "Creta"
 * implies Hyundai.
 */
export function resolveVehicle(
  makeInput: unknown,
  modelInput: unknown,
  variantInput: unknown,
): { make: string | null; model: string | null; variant: string | null; body: BodyType | null; inferences: string[] } {
  const inferences: string[] = [];
  const blob = [clean(makeInput), clean(modelInput), clean(variantInput)].filter(Boolean).join(" ");
  if (!blob) return { make: null, model: null, variant: null, body: null, inferences };

  const haystack = ` ${blob.toLowerCase().replace(/[^a-z0-9()+\s.]/g, " ").replace(/\s+/g, " ")} `;

  // Longest model name first, so "Thar Roxx" is not read as "Thar".
  const match = [...CATALOGUE]
    .sort((a, b) => b.model.length - a.model.length)
    .find((entry) => haystack.includes(` ${entry.model.toLowerCase()} `));

  const make = match?.make ?? titleCase(clean(makeInput)) ?? null;
  const model = match?.model ?? titleCase(clean(modelInput)) ?? null;

  if (match && !clean(makeInput)) inferences.push(`make "${match.make}" inferred from model "${match.model}"`);

  // Strip make and model out of the variant, then clean up what is left.
  let variant = clean(variantInput) || blob;
  if (make) variant = variant.replace(new RegExp(escapeRe(make), "ig"), " ");
  if (model) variant = variant.replace(new RegExp(escapeRe(model), "ig"), " ");
  variant = variant.replace(VARIANT_NOISE, " ");
  variant = variant.replace(/\b(19|20)\d{2}\b/g, " ");

  for (const [pattern, canonical] of VARIANT_TOKENS) variant = variant.replace(pattern, ` ${canonical} `);

  variant = variant.replace(/\s+/g, " ").trim();

  // Prefer the catalogue's own spelling when we can recognise the trim.
  if (match && variant) {
    const known = match.variants.find((v) => {
      const a = v.toLowerCase().replace(/[^a-z0-9]/g, "");
      const b = variant.toLowerCase().replace(/[^a-z0-9]/g, "");
      return a === b || (b.length > 2 && a.includes(b)) || (a.length > 2 && b.includes(a));
    });
    if (known && known !== variant) {
      inferences.push(`variant "${variant}" matched to catalogue trim "${known}"`);
      variant = known;
    }
  }

  return { make, model, variant: variant || null, body: match?.body ?? null, inferences };
}

function escapeRe(s: string) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function titleCase(s: string): string | null {
  if (!s) return null;
  return s
    .toLowerCase()
    .split(/\s+/)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

/* ------------------------------------------------------------- the engine */

export function normalizeVehicle(raw: RawVehicle): NormalizedVehicle {
  const inferences: string[] = [];
  const resolved = resolveVehicle(raw.make, raw.model, raw.variant);
  inferences.push(...resolved.inferences);

  // Powertrain is often only stated inside the variant string.
  const blob = [raw.make, raw.model, raw.variant, raw.description].filter(Boolean).join(" ");
  let fuel = parseFuel(raw.fuel);
  if (!fuel) {
    fuel = parseFuel(blob);
    if (fuel) inferences.push(`fuel "${fuel}" read from the vehicle description`);
  }
  let transmission = parseTransmission(raw.transmission);
  if (!transmission) {
    transmission = parseTransmission(blob);
    if (transmission) inferences.push(`transmission "${transmission}" read from the vehicle description`);
  }
  let drivetrain = parseDrivetrain(raw.drivetrain);
  if (!drivetrain) drivetrain = parseDrivetrain(blob);

  let bodyType = parseBodyType(raw.bodyType);
  if (!bodyType && resolved.body) {
    bodyType = resolved.body;
    inferences.push(`body type "${resolved.body}" taken from the model catalogue`);
  }

  const year = parseYear(raw.year) ?? parseYear(blob);
  const registrationYear = parseYear(raw.registrationYear);

  const price = parsePrice(raw.price);
  if (price.assumed) inferences.push(price.assumed);

  const images = String(raw.images ?? "")
    .split(/[|,\n;]+/)
    .map((s) => s.trim())
    .filter((s) => /^https?:\/\//i.test(s));

  const statusRaw = clean(raw.status).toLowerCase();
  const status = statusRaw
    ? /sold|unavailable|delivered|booked out/.test(statusRaw)
      ? "SOLD"
      : /reserved|hold|booked/.test(statusRaw)
        ? "RESERVED"
        : "AVAILABLE"
    : null;

  return {
    make: resolved.make,
    model: resolved.model,
    variant: resolved.variant,
    year,
    registrationYear,
    fuel,
    transmission,
    bodyType,
    drivetrain,
    km: parseKm(raw.km),
    owners: parseOwners(raw.owners),
    price: price.value,
    colour: titleCase(clean(raw.colour)),
    city: titleCase(clean(raw.city)),
    vin: clean(raw.vin).toUpperCase() || null,
    registration: clean(raw.registration).toUpperCase().replace(/\s+/g, "") || null,
    stockId: clean(raw.stockId) || null,
    description: clean(raw.description) || null,
    images,
    status,
    supplierText: Object.values(raw)
      .filter((v) => typeof v === "string")
      .join(" "),
    original: raw,
    inferences,
  };
}

/** "Hyundai Creta SX(O) Diesel Automatic" — the canonical display string. */
export function canonicalTitle(v: NormalizedVehicle): string {
  return [v.make, v.model, v.variant, v.fuel, v.transmission].filter(Boolean).join(" ");
}
