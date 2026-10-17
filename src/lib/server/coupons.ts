import "server-only";

import { sql, sqlOne, type Query } from "@/lib/db/client";
import type { AdminCoupon, CouponInput, CouponKind, CouponQuote, PublicCoupon } from "@/lib/coupons/types";
import { ApiError } from "./http";
import { newId } from "./security";
import { audit } from "./vendors";

/**
 * COUPONS
 *
 * A coupon lowers Riderzpro's own part of an order only:
 *   percent / flat   off Riderzpro's products and installation (house items), never off a
 *                    marketplace seller's items, so seller invoices and payouts don't change
 *   free_shipping    the delivery charge (Riderzpro's)
 * The minimum order is checked against the whole cart (all items, before the coupon).
 *
 * `quoteCoupon` answers checkout's "Apply" (no reservation). `applyCoupon` runs inside the order's
 * transaction: it locks the coupon row, checks the limits again and records the redemption, so two
 * orders can't both take the last use. Cancelled orders don't count towards the limits.
 */

/** What the coupon rules need to know about a priced cart. Integer rupees. */
export type CartForCoupon = { houseItems: number; subtotal: number; shipping: number };

type CouponRow = {
  id: string;
  code: string;
  title: string;
  description: string | null;
  kind: CouponKind;
  value: number;
  max_discount: number | null;
  min_order: number;
  starts_at: Date | null;
  ends_at: Date | null;
  usage_limit: number | null;
  per_customer: number;
  public: boolean;
  status: "active" | "paused" | "ended";
  created_by: string;
  created_at: Date;
};

const iso = (d: Date | null) => (d ? new Date(d).toISOString() : null);
const inr = (n: number) => `₹${n.toLocaleString("en-IN")}`;
const refuse = (message: string) => new ApiError(409, "coupon_invalid", message, { couponCode: message });

/** Status, dates and the cart's minimum. */
function checkUsable(c: CouponRow, cart: CartForCoupon, now = new Date()) {
  if (c.status !== "active" || (c.ends_at && new Date(c.ends_at) <= now)) throw refuse("This code has ended.");
  if (c.starts_at && new Date(c.starts_at) > now) throw refuse("This code isn't active yet.");
  if (cart.subtotal < c.min_order) throw refuse(`This code needs an order of at least ${inr(c.min_order)}.`);
}

/** The rupees off this cart (free delivery: the delivery charge waived). */
function discountFor(c: CouponRow, cart: CartForCoupon): { discount: number; freeShipping: boolean } {
  if (c.kind === "free_shipping") {
    if (cart.shipping === 0) throw refuse("Delivery is already free for this order.");
    return { discount: 0, freeShipping: true };
  }
  if (cart.houseItems === 0) throw refuse("This code works on Riderzpro's own products, not marketplace sellers' items.");
  const raw = c.kind === "percent" ? Math.floor((cart.houseItems * c.value) / 100) : c.value;
  const capped = Math.min(raw, c.max_discount ?? raw, cart.houseItems);
  if (capped <= 0) throw refuse("This code doesn't take anything off this order.");
  return { discount: capped, freeShipping: false };
}

async function checkLimits(q: Query, c: CouponRow, phone: string | null) {
  const rows = await q<{ total: number; mine: number }>(
    `SELECT count(*)::int AS total, count(*) FILTER (WHERE r.customer_phone = $2)::int AS mine
       FROM coupon_redemptions r JOIN orders o ON o.id = r.order_id
      WHERE r.coupon_id = $1 AND o.status <> 'cancelled'`,
    [c.id, phone ?? ""],
  );
  const { total, mine } = rows[0] ?? { total: 0, mine: 0 };
  if (c.usage_limit !== null && total >= c.usage_limit) throw refuse("This code has been fully used.");
  if (phone && mine >= c.per_customer) throw refuse(c.per_customer === 1 ? "You've already used this code." : `You've used this code ${c.per_customer} times already.`);
}

const COLS = "id, code, title, description, kind, value, max_discount, min_order, starts_at, ends_at, usage_limit, per_customer, public, status, created_by, created_at";

/** Checkout preview: what the code takes off this cart. Throws 409 with a message for people. */
export async function quoteCoupon(code: string, cart: CartForCoupon, phone: string | null): Promise<CouponQuote> {
  const c = await sqlOne<CouponRow>(`SELECT ${COLS} FROM coupons WHERE code = $1`, [code]);
  if (!c) throw refuse("That code isn't valid.");
  checkUsable(c, cart);
  const { discount, freeShipping } = discountFor(c, cart);
  await checkLimits(sql, c, phone);
  const shipping = freeShipping ? 0 : cart.shipping;
  return { code: c.code, title: c.title, discount, freeShipping, subtotal: cart.subtotal, shipping, total: cart.subtotal + shipping - discount };
}

/**
 * Inside the order transaction: locks the coupon, checks everything again, and returns the
 * discount and delivery charge to store. Call `recordRedemption` once the order row exists.
 */
export async function applyCoupon(q: Query, code: string, cart: CartForCoupon, phone: string) {
  const c = (await q<CouponRow>(`SELECT ${COLS} FROM coupons WHERE code = $1 FOR UPDATE`, [code]))[0];
  if (!c) throw refuse("That code isn't valid.");
  checkUsable(c, cart);
  const { discount, freeShipping } = discountFor(c, cart);
  await checkLimits(q, c, phone);
  return { couponId: c.id, code: c.code, discount, shipping: freeShipping ? 0 : cart.shipping, saved: freeShipping ? cart.shipping : discount };
}

export async function recordRedemption(q: Query, r: { couponId: string; orderId: string; phone: string; saved: number }) {
  await q("INSERT INTO coupon_redemptions (id, coupon_id, order_id, customer_phone, amount) VALUES ($1,$2,$3,$4,$5)", [
    newId("crd"),
    r.couponId,
    r.orderId,
    r.phone,
    r.saved,
  ]);
}

/* ---------------------------------------------------------------- public */

const toPublic = (c: CouponRow): PublicCoupon => ({
  code: c.code,
  title: c.title,
  description: c.description,
  kind: c.kind,
  value: c.value,
  maxDiscount: c.max_discount,
  minOrder: c.min_order,
  endsAt: iso(c.ends_at),
});

/** Live public coupons for /offers, ending soonest first. Empty when the database isn't set up. */
export async function publicCoupons(): Promise<PublicCoupon[]> {
  const rows = await sql<CouponRow>(
    `SELECT ${COLS} FROM coupons
      WHERE public AND status = 'active' AND (starts_at IS NULL OR starts_at <= now()) AND (ends_at IS NULL OR ends_at > now())
        AND (usage_limit IS NULL OR usage_limit > (SELECT count(*) FROM coupon_redemptions r JOIN orders o ON o.id = r.order_id
                                                    WHERE r.coupon_id = coupons.id AND o.status <> 'cancelled'))
      ORDER BY ends_at NULLS LAST, created_at DESC LIMIT 50`,
  );
  return rows.map(toPublic);
}

/* ----------------------------------------------------------------- admin */

export async function listCoupons(): Promise<AdminCoupon[]> {
  const rows = await sql<CouponRow & { used: number; given: number }>(
    `SELECT ${COLS.split(", ").map((k) => `c.${k}`).join(", ")},
            count(o.id)::int AS used, COALESCE(sum(r.amount) FILTER (WHERE o.id IS NOT NULL), 0)::int AS given
       FROM coupons c
       LEFT JOIN coupon_redemptions r ON r.coupon_id = c.id
       LEFT JOIN orders o ON o.id = r.order_id AND o.status <> 'cancelled'
      GROUP BY c.id ORDER BY (c.status = 'active') DESC, c.created_at DESC`,
  );
  return rows.map((c) => ({
    ...toPublic(c),
    id: c.id,
    startsAt: iso(c.starts_at),
    usageLimit: c.usage_limit,
    perCustomer: c.per_customer,
    public: c.public,
    status: c.status,
    used: c.used,
    discountGiven: c.given,
    createdBy: c.created_by,
    createdAt: iso(c.created_at) as string,
  }));
}

export async function createCoupon(actor: string, v: CouponInput): Promise<{ id: string }> {
  const id = newId("cpn");
  const row = await sqlOne<{ id: string }>(
    `INSERT INTO coupons (id, code, title, description, kind, value, max_discount, min_order, starts_at, ends_at, usage_limit, per_customer, public, created_by)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14) ON CONFLICT (code) DO NOTHING RETURNING id`,
    [
      id, v.code, v.title, v.description, v.kind, v.kind === "free_shipping" ? 0 : v.value,
      v.kind === "percent" ? v.maxDiscount : null, v.minOrder, v.startsAt, v.endsAt, v.usageLimit, v.perCustomer, v.public, actor,
    ],
  );
  if (!row) throw new ApiError(409, "code_taken", "That code is already used by another coupon.", { code: "Already taken" });
  await audit({ type: "admin", id: actor }, "coupon.create", { detail: { code: v.code, kind: v.kind, value: v.value } });
  return row;
}

export async function couponAction(actor: string, id: string, action: "pause" | "resume" | "end" | "public" | "private"): Promise<void> {
  const set =
    action === "pause" ? "status = 'paused'"
    : action === "resume" ? "status = 'active'"
    : action === "end" ? "status = 'ended'"
    : action === "public" ? "public = true"
    : "public = false";
  // An ended coupon stays ended.
  const guard = action === "resume" || action === "pause" ? " AND status <> 'ended'" : "";
  const row = await sqlOne<{ code: string }>(`UPDATE coupons SET ${set}, updated_at = now() WHERE id = $1${guard} RETURNING code`, [id]);
  if (!row) throw new ApiError(409, "not_changed", "That coupon can't be changed that way (it may have ended).");
  await audit({ type: "admin", id: actor }, `coupon.${action}`, { detail: { code: row.code } });
}
