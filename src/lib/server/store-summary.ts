import "server-only";

import { sql, transaction } from "@/lib/db/client";
import { rupees } from "@/lib/format";
import { COUNTER_HOLD_HOURS } from "./store-sales";
import { notifyVendor } from "./vendors";

/**
 * TODAY AT THE SHOP SCREEN
 *
 * A seller's Offline Store sales for one India day (Asia/Kolkata, midnight to midnight):
 *   sold      screen orders paid and not cancelled: paid on the screen, or paid at the counter
 *             (staff pressed "Paid and handed over")
 *   waiting   counter orders placed today and not collected yet
 * Shown on the dashboard overview, and sent once a day as a notification after SUMMARY_AFTER
 * (20:30 IST) to sellers whose screen had any order that day. store_daily_summaries records each
 * one sent, so it never repeats.
 */

const IST_OFFSET_MS = 330 * 60 * 1000; // India has no daylight saving: always UTC+05:30
const DAY_MS = 24 * 60 * 60 * 1000;
/** Minutes after India midnight when the daily notice may go (20:30). */
export const SUMMARY_AFTER = 20 * 60 + 30;

/** The India day containing `now`: its date, its start and end as instants, and the IST time of day in minutes. */
export function indiaDay(now = new Date()) {
  const local = new Date(now.getTime() + IST_OFFSET_MS);
  const day = local.toISOString().slice(0, 10);
  const start = new Date(Date.parse(`${day}T00:00:00Z`) - IST_OFFSET_MS);
  return { day, start, end: new Date(start.getTime() + DAY_MS), minutes: local.getUTCHours() * 60 + local.getUTCMinutes() };
}

type Money = { count: number; amount: number };

export type ShopDaySummary = {
  day: string;
  /** Every screen order placed today, whatever became of it. */
  activity: number;
  sold: Money;
  items: number;
  discount: number;
  /** Sold orders that used a special price. */
  offersUsed: number;
  paidOnScreen: Money;
  paidAtCounter: Money;
  waiting: Money;
  cancelled: number;
  top: { title: string; qty: number; amount: number }[];
};

export async function shopDaySummary(vendorId: string, now = new Date()): Promise<ShopDaySummary> {
  const d = indiaDay(now);
  const orders = await sql<{ payment_method: string; payment_status: string; part_status: string; total: number; discount: number }>(
    `SELECT o.payment_method, o.payment_status, vo.status AS part_status, o.total, o.discount
       FROM orders o JOIN vendor_orders vo ON vo.order_id = o.id
      WHERE vo.vendor_id = $1 AND o.channel = 'store' AND o.created_at >= $2 AND o.created_at < $3`,
    [vendorId, d.start, d.end],
  );
  const zero = (): Money => ({ count: 0, amount: 0 });
  const s: ShopDaySummary = {
    day: d.day, activity: orders.length, sold: zero(), items: 0, discount: 0, offersUsed: 0,
    paidOnScreen: zero(), paidAtCounter: zero(), waiting: zero(), cancelled: 0, top: [],
  };
  const add = (m: Money, amount: number) => {
    m.count += 1;
    m.amount += amount;
  };
  for (const o of orders) {
    if (o.part_status === "cancelled") s.cancelled += 1;
    else if (o.payment_status === "paid") {
      add(s.sold, o.total);
      add(o.payment_method === "counter" ? s.paidAtCounter : s.paidOnScreen, o.total);
      s.discount += o.discount;
      if (o.discount > 0) s.offersUsed += 1;
    } else if (o.payment_method === "counter") add(s.waiting, o.total);
  }
  if (s.sold.count > 0) {
    const products = await sql<{ title: string; qty: number; amount: number }>(
      `SELECT max(i.title) AS title, sum(i.qty)::int AS qty, sum(i.line_total)::int AS amount
         FROM order_items i JOIN vendor_orders vo ON vo.id = i.vendor_order_id JOIN orders o ON o.id = i.order_id
        WHERE vo.vendor_id = $1 AND o.channel = 'store' AND o.created_at >= $2 AND o.created_at < $3
          AND o.payment_status = 'paid' AND vo.status <> 'cancelled'
        GROUP BY i.product_ref ORDER BY qty DESC, amount DESC, title`,
      [vendorId, d.start, d.end],
    );
    s.items = products.reduce((n, p) => n + p.qty, 0);
    s.top = products.slice(0, 3);
  }
  return s;
}

const plural = (n: number, one: string, many = `${one}s`) => `${n} ${n === 1 ? one : many}`;

/** The daily notification's text. */
export function summaryNotice(s: ShopDaySummary): { title: string; body: string } {
  const parts: string[] = [];
  if (s.sold.count === 0) parts.push("No completed sales on your shop screen today.");
  else {
    parts.push(`${plural(s.sold.count, "sale")}, ${plural(s.items, "item")} sold.`);
    parts.push(`Paid on the screen ${rupees(s.paidOnScreen.amount)} (${s.paidOnScreen.count}), at the counter ${rupees(s.paidAtCounter.amount)} (${s.paidAtCounter.count}).`);
    if (s.discount > 0) parts.push(`Special prices gave ${rupees(s.discount)} off on ${plural(s.offersUsed, "order")}.`);
    if (s.top.length) parts.push(`Top: ${s.top.map((p) => `${p.title} (${p.qty})`).join(", ")}.`);
  }
  if (s.waiting.count > 0)
    parts.push(`${plural(s.waiting.count, "counter order")} (${rupees(s.waiting.amount)}) still waiting: hand over and mark paid, or ${s.waiting.count === 1 ? "it cancels" : "they cancel"} after ${COUNTER_HOLD_HOURS} hours.`);
  return { title: `Today at your shop screen: ${rupees(s.sold.amount)}`, body: parts.join(" ") };
}

/**
 * The daily notice, from housekeeping: after 20:30 IST, once per seller per India day, only to
 * approved sellers whose screen had an order today. Returns how many were sent.
 */
export async function sendDailyShopSummaries(now = new Date()): Promise<number> {
  const d = indiaDay(now);
  if (d.minutes < SUMMARY_AFTER) return 0;
  const sellers = await sql<{ vendor_id: string }>(
    `SELECT DISTINCT vo.vendor_id FROM orders o JOIN vendor_orders vo ON vo.order_id = o.id JOIN vendors v ON v.id = vo.vendor_id
      WHERE o.channel = 'store' AND o.created_at >= $1 AND o.created_at < $2 AND v.status = 'approved'
        AND NOT EXISTS (SELECT 1 FROM store_daily_summaries s WHERE s.vendor_id = vo.vendor_id AND s.day = $3)`,
    [d.start, d.end, d.day],
  );
  let sent = 0;
  for (const { vendor_id } of sellers) {
    const notice = summaryNotice(await shopDaySummary(vendor_id, now));
    const done = await transaction(async (q) => {
      const claimed = await q("INSERT INTO store_daily_summaries (vendor_id, day) VALUES ($1, $2) ON CONFLICT DO NOTHING RETURNING vendor_id", [vendor_id, d.day]);
      if (!claimed[0]) return false;
      await notifyVendor(vendor_id, { type: "order", ...notice, link: "/vendor/dashboard/orders" }, q);
      return true;
    });
    if (done) sent += 1;
  }
  return sent;
}
