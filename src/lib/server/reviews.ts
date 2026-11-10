import "server-only";

import { z } from "zod";
import { sql, sqlOne } from "@/lib/db/client";
import { ApiError, rateLimit } from "./http";
import { newId } from "./security";
import { audit } from "./vendors";
import { invalidateCatalog } from "./catalog";
import type { PublicReview } from "@/lib/reviews/types";

/**
 * CUSTOMER REVIEWS AND THE SITE'S NUMBERS
 *
 * Only real customers review, and only what they received: a signed-in customer reviews a
 * Riderzpro product from an order that was completed, or the order as a whole once any of it was
 * delivered. One review per product per order. Nothing is shown until an admin approves it
 * (/admin/reviews). Product star ratings (src/lib/server/catalog.ts) and the average rating below
 * come from approved reviews only.
 *
 * The site's headline numbers are counted from the database too; a number that is still 0 is
 * left out rather than shown.
 */

export type { PublicReview };

const month = (d: Date) => new Date(d).toLocaleDateString("en-IN", { month: "long", year: "numeric", timeZone: "Asia/Kolkata" });

type Row = {
  id: string;
  name: string;
  city: string | null;
  vehicle: string | null;
  product_slug: string | null;
  product_title: string | null;
  department: string | null;
  rating: number;
  title: string | null;
  body: string;
  status: "pending" | "approved" | "rejected";
  created_at: Date;
  order_number: string | null;
  decided_by: string | null;
};

const COLS = `r.id, r.name, r.city, r.vehicle, r.product_slug, c.detail->>'title' AS product_title, c.detail->>'department' AS department, r.rating, r.title, r.body,
              r.status, r.created_at, o.number AS order_number, r.decided_by`;
const FROM = `FROM reviews r LEFT JOIN catalog_products c ON c.slug = r.product_slug LEFT JOIN orders o ON o.id = r.order_id`;

const toPublic = (r: Row): PublicReview => ({
  id: r.id,
  name: r.name,
  city: r.city,
  vehicle: r.vehicle,
  about: r.product_title ?? "Riderzpro order",
  productSlug: r.product_slug,
  department: r.department,
  rating: r.rating,
  title: r.title,
  body: r.body,
  date: month(r.created_at),
});

/** Approved reviews, newest first (home page, Why Riderzpro). Empty without a database. */
export async function approvedReviews(limit = 12): Promise<PublicReview[]> {
  try {
    const rows = await sql<Row>(`SELECT ${COLS} ${FROM} WHERE r.status = 'approved' ORDER BY r.created_at DESC LIMIT ${Math.min(50, limit)}`);
    return rows.map(toPublic);
  } catch {
    return [];
  }
}

/** Approved reviews of one product (its page). */
export async function productReviews(slug: string, limit = 10): Promise<PublicReview[]> {
  const rows = await sql<Row>(`SELECT ${COLS} ${FROM} WHERE r.status = 'approved' AND r.product_slug = $1 ORDER BY r.created_at DESC LIMIT ${Math.min(50, limit)}`, [slug]);
  return rows.map(toPublic);
}

/* ------------------------------------------------------------- the site's numbers */

export type SiteStat = { value: string; label: string };

const fmt = (n: number) => n.toLocaleString("en-IN");

/** Headline numbers counted from the database; any that are 0 are left out. Empty without a database. */
export async function siteStats(): Promise<SiteStat[]> {
  try {
    const r = await sqlOne<{ delivered: number; customers: number; products: number; sellers: number; rating: string | null; reviews: number }>(
      `SELECT
         (SELECT count(*)::int FROM orders o WHERE o.status = 'completed'
             OR EXISTS (SELECT 1 FROM vendor_orders vo WHERE vo.order_id = o.id AND vo.status = 'delivered')) AS delivered,
         (SELECT count(DISTINCT COALESCE(customer_id, customer_phone))::int FROM orders WHERE status <> 'cancelled') AS customers,
         (SELECT count(*)::int FROM catalog_products WHERE status = 'live' AND item IS NOT NULL)
           + (SELECT count(*)::int FROM vendor_products p JOIN vendors v ON v.id = p.vendor_id WHERE p.status = 'live' AND v.status = 'approved') AS products,
         (SELECT count(*)::int FROM vendors WHERE status = 'approved') AS sellers,
         (SELECT avg(rating) FROM reviews WHERE status = 'approved') AS rating,
         (SELECT count(*)::int FROM reviews WHERE status = 'approved') AS reviews`,
    );
    if (!r) return [];
    const out: SiteStat[] = [];
    if (r.delivered > 0) out.push({ value: fmt(r.delivered), label: r.delivered === 1 ? "Order delivered" : "Orders delivered" });
    if (r.customers > 0) out.push({ value: fmt(r.customers), label: r.customers === 1 ? "Customer" : "Customers" });
    if (r.rating !== null && r.reviews > 0) out.push({ value: `${(Math.round(Number(r.rating) * 10) / 10).toFixed(1)} / 5`, label: `Average rating · ${fmt(r.reviews)} review${r.reviews === 1 ? "" : "s"}` });
    if (r.products > 0) out.push({ value: fmt(r.products), label: "Products listed" });
    if (r.sellers > 0 && out.length < 4) out.push({ value: fmt(r.sellers), label: r.sellers === 1 ? "Seller" : "Sellers" });
    return out.slice(0, 4);
  } catch {
    return [];
  }
}

/* ------------------------------------------------------------- writing a review */

export type ReviewTarget = { productSlug: string | null; title: string; reviewed: boolean; status: string | null };

/**
 * What the customer can review on one of their orders. The order as a whole once anything in it was
 * delivered; each Riderzpro product once the order is completed. Null when the order isn't theirs.
 */
export async function reviewTargets(customerId: string, orderNumber: string): Promise<{ orderId: string; targets: ReviewTarget[] } | null> {
  const o = await sqlOne<{ id: string; status: string; delivered: boolean }>(
    `SELECT o.id, o.status, EXISTS (SELECT 1 FROM vendor_orders vo WHERE vo.order_id = o.id AND vo.status = 'delivered') AS delivered
       FROM orders o WHERE o.number = $1 AND o.customer_id = $2`,
    [orderNumber, customerId],
  );
  if (!o) return null;
  const mine = await sql<{ product_slug: string | null; status: string }>("SELECT product_slug, status FROM reviews WHERE order_id = $1", [o.id]);
  const done = new Map(mine.map((m) => [m.product_slug ?? "", m.status]));
  const targets: ReviewTarget[] = [];
  if (o.status === "completed" || o.delivered) {
    targets.push({ productSlug: null, title: "Your order overall", reviewed: done.has(""), status: done.get("") ?? null });
  }
  if (o.status === "completed") {
    const items = await sql<{ slug: string; title: string }>(
      `SELECT DISTINCT split_part(i.product_ref, '?', 1) AS slug, i.title
         FROM order_items i JOIN catalog_products c ON c.slug = split_part(i.product_ref, '?', 1)
        WHERE i.order_id = $1 AND i.product_kind = 'house'`,
      [o.id],
    );
    for (const i of items) targets.push({ productSlug: i.slug, title: i.title, reviewed: done.has(i.slug), status: done.get(i.slug) ?? null });
  }
  return { orderId: o.id, targets };
}

const text = (max: number) => z.string().trim().max(max).optional().transform((v) => v || null);

export const reviewSchema = z.object({
  orderNumber: z.string().trim().toUpperCase().regex(/^RZP-[A-Z0-9]{6}$/, "Order numbers look like RZP-ABC234"),
  productSlug: z.string().trim().max(200).nullable(),
  rating: z.number().int().min(1, "Pick 1 to 5 stars").max(5, "Pick 1 to 5 stars"),
  title: text(80),
  body: z.string().trim().min(10, "Tell us a little more (10 characters or more)").max(1500, "Keep it under 1,500 characters"),
  name: z.string().trim().min(2, "Your name as it should appear").max(60),
  city: text(40),
  vehicle: text(60),
});

/** A customer's review. Waits for an admin before it is shown. */
export async function submitReview(customerId: string, input: z.infer<typeof reviewSchema>, ip: string): Promise<{ id: string }> {
  await rateLimit(`review:${customerId}`, 10, 24 * 60 * 60);
  const t = await reviewTargets(customerId, input.orderNumber);
  if (!t) throw new ApiError(404, "not_found", "Order not found.");
  const target = t.targets.find((x) => x.productSlug === input.productSlug);
  if (!target) {
    throw new ApiError(409, "not_reviewable", input.productSlug ? "You can review this product once your order is delivered." : "You can review this order once it's delivered.");
  }
  if (target.reviewed) throw new ApiError(409, "already_reviewed", "You've already reviewed this.");
  const id = newId("rev");
  try {
    await sql(
      `INSERT INTO reviews (id, customer_id, order_id, product_slug, name, city, vehicle, title, rating, body)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`,
      [id, customerId, t.orderId, input.productSlug, input.name, input.city, input.vehicle, input.title, input.rating, input.body],
    );
  } catch (err) {
    if ((err as { code?: string }).code === "23505") throw new ApiError(409, "already_reviewed", "You've already reviewed this.");
    throw err;
  }
  await audit({ type: "customer", id: customerId }, "review.submit", { ip, detail: { reviewId: id, order: input.orderNumber, product: input.productSlug } });
  return { id };
}

/* ------------------------------------------------------------- admin */

export type AdminReview = PublicReview & { status: Row["status"]; orderNumber: string | null; decidedBy: string | null; createdAt: string };

export async function listReviewsAdmin(status: "pending" | "approved" | "rejected"): Promise<{ items: AdminReview[]; counts: Record<string, number> }> {
  const [rows, counts] = await Promise.all([
    sql<Row>(`SELECT ${COLS} ${FROM} WHERE r.status = $1 ORDER BY r.created_at ${status === "pending" ? "ASC" : "DESC"} LIMIT 200`, [status]),
    sql<{ status: string; n: number }>("SELECT status, count(*)::int AS n FROM reviews GROUP BY 1"),
  ]);
  return {
    items: rows.map((r) => ({ ...toPublic(r), status: r.status, orderNumber: r.order_number, decidedBy: r.decided_by, createdAt: new Date(r.created_at).toISOString() })),
    counts: Object.fromEntries(counts.map((c) => [c.status, c.n])),
  };
}

export const reviewDecisionSchema = z.object({ action: z.enum(["approve", "reject"]) });

export async function decideReview(id: string, action: "approve" | "reject", actor: string, ip: string): Promise<void> {
  const rows = await sql<{ id: string }>(
    "UPDATE reviews SET status = $2, decided_by = $3, decided_at = now() WHERE id = $1 RETURNING id",
    [id, action === "approve" ? "approved" : "rejected", actor],
  );
  if (!rows[0]) throw new ApiError(404, "not_found", "Review not found.");
  await audit({ type: "admin", id: actor }, `review.${action}`, { ip, detail: { reviewId: id } });
  // Product ratings are part of the catalogue snapshot.
  invalidateCatalog();
}
