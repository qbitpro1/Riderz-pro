import "server-only";

import { sql, sqlOne, transaction } from "@/lib/db/client";
import type { VendorSelf } from "@/lib/vendor/types";
import { ApiError } from "./http";
import { newId, sha256 } from "./security";
import { audit, notifyVendor } from "./vendors";
import { newOrderNumber, restoreStock, settleOrderStatus, type PlacedOrderRecord } from "./orders";
import { onlinePaymentsEnabled } from "./payments";

/**
 * SELLING FROM THE OFFLINE STORE SCREEN
 *
 * A customer in the seller's shop builds an order on the screen (alone, or with the AI
 * salesperson) and places it there:
 *   pay on screen    Razorpay (UPI / card) like the website; Riderzpro collects and pays the seller
 *                    out as usual
 *   pay at counter   the seller takes the money; the part is marked collected_by = 'seller', so
 *                    it is never paid out again
 * The order lands in the seller's dashboard as "accepted"; staff hand the goods over and press
 * "Paid and handed over" (counter) or "Handed over" (paid on screen). Counter orders not handed
 * over within COUNTER_HOLD_HOURS are cancelled and their stock goes back.
 *
 * Discounts: the seller decides (store_settings): bargaining on/off, the most % off and the most
 * rupees off one order. The AI can only create an offer within those limits (createOffer); the
 * checkout checks the offer again against the limits in force at that moment. The discount is
 * the seller's own: it lowers the item prices on the order, so the seller's invoice, commission
 * and payout follow the price actually paid.
 */

export const OFFER_MINUTES = 20;
export const COUNTER_HOLD_HOURS = 12;

export type StoreSettings = {
  aiEnabled: boolean;
  bargainEnabled: boolean;
  maxDiscountPct: number;
  maxDiscountRupees: number | null;
  payOnScreen: boolean;
  payAtCounter: boolean;
};

const DEFAULTS: StoreSettings = { aiEnabled: true, bargainEnabled: false, maxDiscountPct: 5, maxDiscountRupees: null, payOnScreen: true, payAtCounter: true };

export async function storeSettings(vendorId: string): Promise<StoreSettings> {
  const r = await sqlOne<{ ai_enabled: boolean; bargain_enabled: boolean; max_discount_pct: number; max_discount_rupees: number | null; pay_on_screen: boolean; pay_at_counter: boolean }>(
    "SELECT ai_enabled, bargain_enabled, max_discount_pct, max_discount_rupees, pay_on_screen, pay_at_counter FROM store_settings WHERE vendor_id = $1",
    [vendorId],
  );
  if (!r) return { ...DEFAULTS };
  return {
    aiEnabled: r.ai_enabled,
    bargainEnabled: r.bargain_enabled,
    maxDiscountPct: r.max_discount_pct,
    maxDiscountRupees: r.max_discount_rupees,
    payOnScreen: r.pay_on_screen,
    payAtCounter: r.pay_at_counter,
  };
}

export async function saveStoreSettings(vendorId: string, s: StoreSettings, ip: string): Promise<void> {
  if (!s.payOnScreen && !s.payAtCounter) throw new ApiError(400, "invalid", "Keep at least one way to pay.", { payAtCounter: "Keep at least one way to pay" });
  await sql(
    `INSERT INTO store_settings (vendor_id, ai_enabled, bargain_enabled, max_discount_pct, max_discount_rupees, pay_on_screen, pay_at_counter)
     VALUES ($1,$2,$3,$4,$5,$6,$7)
     ON CONFLICT (vendor_id) DO UPDATE SET ai_enabled = $2, bargain_enabled = $3, max_discount_pct = $4, max_discount_rupees = $5,
       pay_on_screen = $6, pay_at_counter = $7, updated_at = now()`,
    [vendorId, s.aiEnabled, s.bargainEnabled, s.maxDiscountPct, s.maxDiscountRupees, s.payOnScreen, s.payAtCounter],
  );
  await audit({ type: "vendor", id: vendorId }, "store_screen.settings", { vendorId, ip, detail: { ...s } });
}

/** What the screen may offer: ways to pay that actually work right now. */
export function payOptions(s: StoreSettings) {
  return { onScreen: s.payOnScreen && onlinePaymentsEnabled(), atCounter: s.payAtCounter || !(s.payOnScreen && onlinePaymentsEnabled()) };
}

/* ------------------------------------------------------------------ pricing */

type CartLine = { id: string; qty: number };
type Priced = { id: string; title: string; price: number; qty: number; stock: number };

/** Prices the screen's cart from the database (live, in-stock products of this seller only). */
export async function priceStoreCart(vendorId: string, lines: CartLine[]): Promise<{ items: Priced[]; subtotal: number }> {
  if (lines.length === 0) throw new ApiError(400, "empty", "The order is empty.");
  const ids = [...new Set(lines.map((l) => l.id))];
  const rows = await sql<{ id: string; title: string; price: number; stock: number }>(
    `SELECT p.id, p.title, p.price, p.stock FROM vendor_products p JOIN vendors v ON v.id = p.vendor_id
      WHERE p.id = ANY($1) AND p.vendor_id = $2 AND p.status = 'live' AND v.status = 'approved'`,
    [ids, vendorId],
  );
  const items = lines.map((l) => {
    const r = rows.find((x) => x.id === l.id);
    if (!r) throw new ApiError(409, "unavailable_item", "An item in the order is no longer for sale here.");
    if (r.stock < l.qty) throw new ApiError(409, "sold_out", r.stock === 0 ? `${r.title} just sold out.` : `Only ${r.stock} of ${r.title} left.`);
    return { ...r, qty: l.qty };
  });
  return { items, subtotal: items.reduce((n, i) => n + i.price * i.qty, 0) };
}

/** Rupees off `subtotal` for `percent`, within the seller's limits (and the offer's own cap). */
function discountFor(subtotal: number, percent: number, s: StoreSettings, cap: number | null): number {
  if (!s.bargainEnabled || s.maxDiscountPct === 0) return 0;
  const pct = Math.min(percent, s.maxDiscountPct);
  let d = Math.floor((subtotal * pct) / 100);
  if (s.maxDiscountRupees !== null) d = Math.min(d, s.maxDiscountRupees);
  if (cap !== null) d = Math.min(d, cap);
  return Math.max(0, Math.min(d, subtotal - 1));
}

/**
 * The AI agreed a discount: record it for this cart. Refused above the seller's limit. The cap is
 * the rupees it gives on this cart; a bigger cart later doesn't make it worth more.
 */
export async function createOffer(vendorId: string, percent: number, lines: CartLine[], reason: string | null) {
  const s = await storeSettings(vendorId);
  if (!s.bargainEnabled) return { ok: false as const, why: "This shop doesn't offer bargains on the screen. The listed prices are final." };
  if (!Number.isInteger(percent) || percent < 1) return { ok: false as const, why: "Offer a whole percent, at least 1." };
  if (percent > s.maxDiscountPct) return { ok: false as const, why: `Too high: the most this shop allows is ${s.maxDiscountPct}% off.` };
  const { subtotal } = await priceStoreCart(vendorId, lines);
  const discount = discountFor(subtotal, percent, s, null);
  if (discount <= 0) return { ok: false as const, why: "That doesn't take anything off this order." };
  const id = newId("sof");
  await sql(
    `INSERT INTO store_offers (id, vendor_id, percent, cap, reason, expires_at) VALUES ($1,$2,$3,$4,$5, now() + make_interval(mins => $6))`,
    [id, vendorId, percent, discount, reason?.slice(0, 200) ?? null, OFFER_MINUTES],
  );
  await audit({ type: "system", id: "store-assistant" }, "store_screen.offer", { vendorId, detail: { offerId: id, percent, discount, subtotal } });
  return { ok: true as const, offer: { id, percent, discount, subtotal, total: subtotal - discount, validMinutes: OFFER_MINUTES } };
}

/** A live offer as the screen shows it (null when used, expired or another seller's). */
export async function liveOffer(vendorId: string, offerId: string) {
  return sqlOne<{ id: string; percent: number; cap: number; expires_at: Date }>(
    "SELECT id, percent, cap, expires_at FROM store_offers WHERE id = $1 AND vendor_id = $2 AND used_order_id IS NULL AND expires_at > now()",
    [offerId, vendorId],
  );
}

/* ----------------------------------------------------------------- checkout */

export type StoreCheckoutInput = {
  lines: CartLine[];
  customer: { name: string; mobile: string };
  offerId?: string | null;
  pay: "screen" | "counter";
};

/**
 * Places the screen's order. Prices, stock and the discount are all worked out here; the screen
 * only names products and quantities. Returns the order (and whether it waits for an online payment).
 */
export async function placeStoreOrder(vendor: VendorSelf, input: StoreCheckoutInput, ip: string): Promise<PlacedOrderRecord & { discount: number; pay: "screen" | "counter" }> {
  const s = await storeSettings(vendor.id);
  const pays = payOptions(s);
  if (input.pay === "screen" && !pays.onScreen) throw new ApiError(409, "pay_unavailable", "Paying on the screen isn't available. Please pay at the counter.");
  if (input.pay === "counter" && !pays.atCounter) throw new ApiError(409, "pay_unavailable", "Please pay on the screen.");
  const pickup = vendor.onboarding.shipping?.pickup;
  const orderId = newId("ord");
  const vendorOrderId = newId("vor");

  const out = await transaction(async (q) => {
    // Lock and price every product (stock is taken below; a lost race rolls everything back).
    const ids = [...new Set(input.lines.map((l) => l.id))];
    const rows = await q<{ id: string; title: string; price: number; stock: number; commission_rate: string | null }>(
      `SELECT p.id, p.title, p.price, p.stock, v.commission_rate FROM vendor_products p JOIN vendors v ON v.id = p.vendor_id
        WHERE p.id = ANY($1) AND p.vendor_id = $2 AND p.status = 'live' AND v.status = 'approved' ORDER BY p.id FOR UPDATE OF p`,
      [ids, vendor.id],
    );
    const items = input.lines.map((l) => {
      const r = rows.find((x) => x.id === l.id);
      if (!r) throw new ApiError(409, "unavailable_item", "An item in the order is no longer for sale here.");
      if (r.stock < l.qty) throw new ApiError(409, "sold_out", r.stock === 0 ? `${r.title} just sold out.` : `Only ${r.stock} of ${r.title} left.`);
      return { ...r, qty: l.qty };
    });
    const list = items.reduce((n, i) => n + i.price * i.qty, 0);

    // The agreed discount, checked again now.
    let discount = 0;
    let offerId: string | null = null;
    if (input.offerId) {
      const o = (
        await q<{ id: string; percent: number; cap: number }>(
          "SELECT id, percent, cap FROM store_offers WHERE id = $1 AND vendor_id = $2 AND used_order_id IS NULL AND expires_at > now() FOR UPDATE",
          [input.offerId, vendor.id],
        )
      )[0];
      if (!o) throw new ApiError(409, "offer_expired", "That special price has expired. Ask the assistant again, or order at the listed price.");
      discount = discountFor(list, o.percent, s, o.cap);
      offerId = o.id;
    }

    // The seller's discount lowers the unit prices (in proportion; whole rupees per unit).
    const priced = items.map((i) => ({ ...i, unit: i.price }));
    if (discount > 0) {
      let given = 0;
      for (const i of priced) {
        const share = Math.floor((discount * i.price * i.qty) / list);
        const perUnit = Math.min(Math.floor(share / i.qty), i.price - 1);
        i.unit = i.price - perUnit;
        given += perUnit * i.qty;
      }
      discount = given;
    }
    const total = priced.reduce((n, i) => n + i.unit * i.qty, 0);

    let number = "";
    for (let attempt = 0; attempt < 8 && !number; attempt++) {
      const r = await q<{ number: string }>(
        `INSERT INTO orders (id, number, customer_name, customer_phone, customer_email, address, city, state, pincode, notes,
                             subtotal, shipping, total, discount, payment_method, channel)
         VALUES ($1,$2,$3,$4,NULL,$5,$6,$7,$8,$9,$10,0,$11,$12,$13,'store') ON CONFLICT (number) DO NOTHING RETURNING number`,
        [
          orderId, newOrderNumber(), input.customer.name, input.customer.mobile,
          `In store: ${vendor.storeName ?? "seller"}${pickup?.line1 ? `, ${pickup.line1}` : ""}`.slice(0, 240),
          pickup?.city ?? "In store", pickup?.state ?? "Delhi", pickup?.pincode ?? "000000",
          `Bought on the shop screen${discount ? ` · special price ${discount} off` : ""}`,
          list, total, discount, input.pay === "screen" ? "online" : "counter",
        ],
      );
      if (r[0]) number = r[0].number;
    }
    if (!number) throw new ApiError(503, "busy", "We couldn't create the order just now. Please try again.");

    await q(
      `INSERT INTO vendor_orders (id, order_id, vendor_id, status, subtotal, commission_rate, accepted_at, collected_by)
       VALUES ($1,$2,$3,'accepted',$4,$5, now(), $6)`,
      [vendorOrderId, orderId, vendor.id, total, rows[0]?.commission_rate === null || rows[0]?.commission_rate === undefined ? 10 : Number(rows[0].commission_rate), input.pay === "counter" ? "seller" : "platform"],
    );
    for (const i of priced) {
      await q(
        `INSERT INTO order_items (id, order_id, vendor_order_id, product_kind, product_ref, title, variant, unit_price, install_price, qty, line_total)
         VALUES ($1,$2,$3,'vendor',$4,$5,NULL,$6,0,$7,$8)`,
        [newId("itm"), orderId, vendorOrderId, i.id, i.title, i.unit, i.qty, i.unit * i.qty],
      );
      const left = await q("UPDATE vendor_products SET stock = stock - $2, updated_at = now() WHERE id = $1 AND stock >= $2 RETURNING stock", [i.id, i.qty]);
      if (!left[0]) throw new ApiError(409, "sold_out", `${i.title} just sold out.`);
    }
    if (offerId) await q("UPDATE store_offers SET used_order_id = $2 WHERE id = $1", [offerId, orderId]);
    await audit({ type: "customer", id: sha256(input.customer.mobile).slice(0, 12) }, "order.place_store", { vendorId: vendor.id, ip, detail: { number, total, discount, pay: input.pay } }, q);
    return { number, total, discount };
  });

  if (input.pay === "counter") {
    await notifyVendor(vendor.id, {
      type: "order",
      title: `Shop screen order ${out.number}`,
      body: `Collect ₹${out.total.toLocaleString("en-IN")} at the counter, then hand over and mark it done.`,
      link: `/vendor/dashboard/orders/${vendorOrderId}`,
    }).catch(() => undefined);
  }
  return { id: orderId, number: out.number, total: out.total, discount: out.discount, pay: input.pay };
}

/** Where a screen order stands (the screen polls this while it waits for the payment). */
export async function storeOrderStatus(vendorId: string, number: string) {
  return sqlOne<{ number: string; total: number; status: string; payment_method: string; payment_status: string; part_status: string }>(
    `SELECT o.number, o.total, o.status, o.payment_method, o.payment_status, vo.status AS part_status
       FROM orders o JOIN vendor_orders vo ON vo.order_id = o.id
      WHERE o.number = $1 AND vo.vendor_id = $2 AND o.channel = 'store'`,
    [number, vendorId],
  );
}

/* --------------------------------------------------------------- hand-over */

/** Staff gave the goods to the customer (and, at the counter, took the money). */
export async function handOverStoreOrder(vendorId: string, vendorOrderId: string, ip: string): Promise<void> {
  await transaction(async (q) => {
    const r = (
      await q<{ order_id: string; status: string; channel: string; payment_method: string; payment_status: string; number: string }>(
        `SELECT vo.order_id, vo.status, o.channel, o.payment_method, o.payment_status, o.number
           FROM vendor_orders vo JOIN orders o ON o.id = vo.order_id WHERE vo.id = $1 AND vo.vendor_id = $2 FOR UPDATE OF vo, o`,
        [vendorOrderId, vendorId],
      )
    )[0];
    if (!r || r.channel !== "store") throw new ApiError(404, "not_found", "Shop screen order not found.");
    if (r.status !== "accepted" && r.status !== "packed") throw new ApiError(409, "bad_transition", `This order is already ${r.status}.`);
    if (r.payment_method === "online" && r.payment_status !== "paid") throw new ApiError(409, "awaiting_payment", "The online payment hasn't arrived yet. Don't hand over until it shows as paid.");
    await q("UPDATE vendor_orders SET status = 'delivered', delivered_at = now(), updated_at = now() WHERE id = $1", [vendorOrderId]);
    if (r.payment_method === "counter") {
      await q("UPDATE orders SET payment_status = 'paid', paid_at = now(), status = 'confirmed', updated_at = now() WHERE id = $1", [r.order_id]);
    }
    await settleOrderStatus(q, r.order_id);
    await audit({ type: "vendor", id: vendorId }, "store_order.handed_over", { vendorId, ip, detail: { number: r.number, pay: r.payment_method } }, q);
  });
}

/** Counter orders never handed over (the customer left): cancel and put the stock back. */
export async function releaseStaleCounterOrders(): Promise<number> {
  const rows = await sql<{ vo_id: string; order_id: string }>(
    `SELECT vo.id AS vo_id, o.id AS order_id FROM orders o JOIN vendor_orders vo ON vo.order_id = o.id
      WHERE o.channel = 'store' AND o.payment_method = 'counter' AND o.payment_status = 'pending'
        AND vo.status IN ('accepted','packed') AND o.created_at < now() - make_interval(hours => $1) LIMIT 100`,
    [COUNTER_HOLD_HOURS],
  );
  for (const r of rows) {
    await transaction(async (q) => {
      const done = await q("UPDATE vendor_orders SET status = 'cancelled', cancelled_at = now(), cancel_reason = 'Not collected at the counter', updated_at = now() WHERE id = $1 AND status IN ('accepted','packed') RETURNING id", [r.vo_id]);
      if (!done[0]) return;
      await restoreStock(q, r.vo_id);
      await q("UPDATE orders SET status = 'cancelled', updated_at = now() WHERE id = $1", [r.order_id]);
    });
  }
  return rows.length;
}
