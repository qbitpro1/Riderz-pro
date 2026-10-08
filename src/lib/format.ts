/** Indian currency + number formatting helpers. */

const inr = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
});

const plain = new Intl.NumberFormat("en-IN");

/** ₹1,24,900 */
export function rupees(value: number): string {
  return inr.format(Math.round(value));
}

/** 1,24,900 */
export function number(value: number): string {
  return plain.format(Math.round(value));
}

/**
 * Vehicle pricing in India is quoted in lakh / crore, not in full rupees.
 * 1575000 -> "₹15.75 Lakh"; 12500000 -> "₹1.25 Cr"
 */
export function lakh(value: number): string {
  if (value >= 1_00_00_000) {
    const cr = value / 1_00_00_000;
    return `₹${cr.toFixed(2).replace(/\.00$/, "")} Cr`;
  }
  const l = value / 1_00_000;
  return `₹${l.toFixed(2).replace(/\.00$/, "")} Lakh`;
}

/** 32000 -> "32,000 km" */
export function km(value: number): string {
  return `${plain.format(value)} km`;
}

/** Reducing-balance EMI. */
export function emi(principal: number, annualRatePct: number, months: number): number {
  if (principal <= 0 || months <= 0) return 0;
  const r = annualRatePct / 12 / 100;
  if (r === 0) return principal / months;
  const f = Math.pow(1 + r, months);
  return (principal * r * f) / (f - 1);
}

/** Headline "EMI from ₹XX,XXX/mo" used on cards. */
export function emiFrom(price: number, downPct = 20, rate = 9.5, months = 60): string {
  const value = emi(price * (1 - downPct / 100), rate, months);
  return `${rupees(Math.ceil(value / 100) * 100)}/mo`;
}

export function slugify(input: string): string {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/** "₹1,299 – ₹4,999" for ranged service/product pricing. */
export function range(min: number, max: number): string {
  return `${rupees(min)} – ${rupees(max)}`;
}
