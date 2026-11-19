/**
 * WHAT CAN BE BOUGHT ON THE WEBSITE RIGHT NOW (owner, 19 Nov 2026)
 *
 * Only car covers are in stock. Every other product, Riderzpro's own and sellers' listings alike,
 * shows "Coming soon" on the website and can't be bought: no add-to-cart or buy button, and the
 * server refuses it in an order. Prices and pages stay visible.
 *
 * When more stock arrives, set ONLY_CAR_COVERS_ON_SALE to false (everything goes back to its own
 * stock and availability). Sellers' Offline Store screens are not affected by this.
 */
export const ONLY_CAR_COVERS_ON_SALE = true;

/** A car or body cover: Covers & Guards → Exterior, named or typed as a car/body cover. */
export function isCarCover(p: { department: string; group: string; sub?: string | null; title: string }): boolean {
  if (p.department !== "covers-guards" || p.group !== "exterior") return false;
  return /\b(car|body)[\s-]*covers?\b/i.test(`${p.sub ?? ""} ${p.title}`);
}

/** False for a product held back as "Coming soon" by the rule above. */
export function onSaleNow(p: { department: string; group: string; sub?: string | null; title: string }): boolean {
  return !ONLY_CAR_COVERS_ON_SALE || isCarCover(p);
}
