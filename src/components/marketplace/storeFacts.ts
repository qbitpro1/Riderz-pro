import type { PublicStore } from "@/lib/server/marketplace";

/** "June 2026" — the month a store was approved. */
export function sinceLabel(iso: string | null): string | null {
  if (!iso) return null;
  return new Date(iso).toLocaleDateString("en-IN", { month: "long", year: "numeric", timeZone: "Asia/Kolkata" });
}

/** The seller's shipping and returns terms as plain statements, only for what they actually declared. */
export function policyFacts(s: PublicStore): string[] {
  const out: string[] = [];
  if (s.handlingDays !== null) {
    out.push(
      s.handlingDays <= 0 ? "Dispatches the same working day" : `Dispatches in ${s.handlingDays} working day${s.handlingDays === 1 ? "" : "s"}`,
    );
  }
  if (s.shipsTo === "pan_india") out.push("Ships across India");
  else if (s.shipsTo === "own_state") out.push(`Ships within ${s.pickupState ?? "its own state"} only`);
  if (s.acceptsReturns === true) {
    out.push(s.returnWindowDays ? `${s.returnWindowDays}-day returns` : "Accepts returns");
  } else if (s.acceptsReturns === false) out.push("Returns not accepted");
  return out;
}
