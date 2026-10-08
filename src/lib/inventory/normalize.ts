import { lakh, number as fmtNumber } from "@/lib/format";
import type { DataConfidence, Listing } from "./types";

/**
 * Turning source facts into a Motorbotz listing.
 *
 * The description is generated from fields we actually hold, in our own words.
 * The source's marketing copy is never reproduced, and no quality claim is ever
 * made — no "excellent condition", no "accident-free", no "well maintained" —
 * because none of that is a fact until somebody inspects the car.
 */

const BANNED = /\b(excellent|immaculate|pristine|perfect|mint|flawless|showroom condition|accident[- ]free|unmarked|as new)\b/i;

/** Guard so a future edit cannot slip an unverifiable adjective into copy. */
export function assertNoQualityClaims(text: string): void {
  const hit = text.match(BANNED);
  if (hit) throw new Error(`Listing copy may not claim "${hit[0]}" — that is an inspection finding, not a fact.`);
}

export function listingTitle(l: Pick<Listing, "year" | "make" | "model" | "variant">): string {
  return [l.year, l.make, l.model, l.variant].filter(Boolean).join(" ");
}

/** Facts only, in Motorbotz's voice, hedged where the source is the only witness. */
export function buildDescription(l: Listing): string {
  const title = listingTitle(l);
  const parts: string[] = [];

  const powertrain = [l.fuel?.toLowerCase(), l.transmission ? transmissionWords(l.transmission) : null]
    .filter(Boolean)
    .join(" ");

  parts.push(
    `A ${l.year} ${l.make} ${l.model}${l.variant ? ` ${l.variant}` : ""}${
      powertrain ? ` with a ${powertrain} powertrain` : ""
    }${l.km != null ? ` and approximately ${fmtNumber(l.km)} km on the odometer` : ""}.`,
  );

  const place = [l.locality, l.city].filter(Boolean).join(", ");
  const ownerPhrase =
    l.owners === 1
      ? " and is presented as a first-owner example"
      : l.owners != null
        ? ` and is presented as a ${ordinal(l.owners)}-owner example`
        : "";

  if (l.sellerType === "motorbotz") {
    parts.push(`The car is held in Motorbotz stock at ${place}${ownerPhrase}.`);
  } else {
    parts.push(`The vehicle is listed in ${place}${ownerPhrase}.`);
  }

  if (l.drivetrain === "4WD" || l.drivetrain === "AWD") {
    parts.push(`It is a ${l.drivetrain} car.`);
  }

  if (l.modifications?.length) {
    parts.push(
      `The seller reports ${l.modifications.length} modification${l.modifications.length === 1 ? "" : "s"}; each is itemised below.`,
    );
  }

  parts.push(
    l.verification === "MOTORBOTZ_VERIFIED"
      ? "Motorbotz has inspected this car; the report is published on this page."
      : "Motorbotz has not inspected this car. The details below are as supplied by the source and are shown unverified — request an inspection and we will check them for you.",
  );

  const text = parts.join(" ");
  assertNoQualityClaims(text);
  return text;
}

function transmissionWords(t: NonNullable<Listing["transmission"]>): string {
  switch (t) {
    case "AMT":
      return "automated manual";
    case "CVT":
      return "CVT automatic";
    case "DCT":
      return "dual-clutch automatic";
    case "AT":
      return "torque-converter automatic";
    default:
      return t.toLowerCase();
  }
}

function ordinal(n: number): string {
  if (n === 1) return "first";
  if (n === 2) return "second";
  if (n === 3) return "third";
  return `${n}th`;
}

/** Key details block — every line is a stated fact or it is omitted. */
export function keyDetails(l: Listing): { label: string; value: string }[] {
  const rows: { label: string; value: string }[] = [{ label: "Model year", value: String(l.year) }];
  if (l.registrationYear) rows.push({ label: "Registration year", value: String(l.registrationYear) });
  if (l.fuel) rows.push({ label: "Fuel", value: l.fuel });
  if (l.transmission) rows.push({ label: "Transmission", value: l.transmission });
  if (l.km != null) rows.push({ label: "Kilometres", value: `${fmtNumber(l.km)} km` });
  if (l.owners != null) rows.push({ label: "Owners", value: `${ordinal(l.owners)} owner` });
  if (l.engine) rows.push({ label: "Engine", value: l.engine });
  if (l.power) rows.push({ label: "Power", value: l.power });
  if (l.drivetrain) rows.push({ label: "Drivetrain", value: l.drivetrain });
  if (l.colour) rows.push({ label: "Colour", value: l.colour });
  if (l.seats) rows.push({ label: "Seating", value: `${l.seats} seats` });
  rows.push({ label: "Location", value: [l.locality, l.city, l.state].filter(Boolean).join(", ") });
  if (l.price != null) rows.push({ label: "Asking price", value: lakh(l.price) });
  return rows;
}

/**
 * Data confidence, used internally to decide what needs a human. Customers are
 * shown "Not specified" for gaps rather than a score.
 */
export function scoreConfidence(l: Listing): DataConfidence {
  const core = [l.variant, l.fuel, l.transmission, l.km, l.owners, l.price, l.registrationYear];
  const known = core.filter((v) => v != null && v !== "").length;
  const hasImages = l.images.length > 0;
  const multiSource = l.sources.length > 1;

  if (known === core.length && hasImages) return "HIGH";
  if (known >= core.length - 2 && (hasImages || multiSource)) return "MEDIUM";
  return known >= 4 ? "MEDIUM" : "LOW";
}

export function slugFor(l: Pick<Listing, "year" | "make" | "model" | "variant" | "city" | "id">): string {
  return [l.year, l.make, l.model, l.variant, l.city, l.id.slice(-4)]
    .filter(Boolean)
    .join(" ")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/** "Not specified" is the honest default everywhere a value is missing. */
export function orNotSpecified(value: string | number | null | undefined): string {
  return value == null || value === "" ? "Not specified" : String(value);
}

export function orNotVerified(value: string | null | undefined): string {
  return value == null || value === "" ? "Not verified" : value;
}
