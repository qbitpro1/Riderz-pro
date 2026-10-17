import "server-only";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { DatabaseNotConfigured, sql, sqlOne, transaction } from "@/lib/db/client";
import { MEDIA } from "@/lib/media";
import { getProductDetail } from "@/lib/store/products";
import { productHref } from "@/lib/store/types";
import { vendorProductHref } from "@/lib/vendor/types";
import { parseLineId } from "@/lib/shopify/variants";
import type { AddressInput, Identifier, TicketInput } from "@/lib/account/schemas";
import {
  ADDRESS_MAX,
  type AccountOrder,
  type AccountOrderItem,
  type AccountOrderPart,
  type AccountOrderSummary,
  type AddressView,
  type CustomerSelf,
  type SavedCar,
  type TicketView,
} from "@/lib/account/types";
import type { WishlistItem } from "@/components/wishlist/wishlistStore";
import type { OrderStatus } from "@/components/admin/orders/types";
import type { VendorOrderStatus } from "@/lib/vendor/types";
import { ApiError } from "./http";
import { checkOtp } from "./otp";
import { newId, newToken, sha256 } from "./security";
import { audit } from "./vendors";
import { riderInfoForOrder } from "./riders";
import { vehicleLabel } from "@/lib/rider/types";

/**
 * CUSTOMER ACCOUNTS
 *
 * Sign-in is a one-time code sent to a mobile number or an email address; there is no password.
 * The first verified code creates the account. A session is a random token in the HttpOnly,
 * SameSite=Lax cookie `rzp_customer`; the database stores only its SHA-256. Sessions last 60 days
 * and end on sign-out, "sign out everywhere" and account deletion.
 *
 * Orders: checkout links an order to the signed-in account (server side, from the session). Guest
 * orders placed with the account's verified mobile join the account at sign-in and whenever its
 * order list loads. Email is not used for this: it is optional and unverified at checkout.
 *
 * Use `currentCustomer()` in server components and route handlers that also serve guests,
 * `requireCustomer()` in account API routes (throws 401), `customerPage()` in account pages
 * (redirects to sign-in).
 */

export const CUSTOMER_COOKIE = "rzp_customer";
const SESSION_DAYS = 60;

type CustomerRow = {
  id: string;
  name: string | null;
  mobile: string | null;
  email: string | null;
  mobile_verified_at: Date | null;
  email_verified_at: Date | null;
  car: SavedCar | null;
};

const toSelf = (r: CustomerRow): CustomerSelf => ({
  id: r.id,
  name: r.name,
  mobile: r.mobile,
  email: r.email,
  mobileVerified: r.mobile_verified_at !== null,
  emailVerified: r.email_verified_at !== null,
  car: r.car,
});

const iso = (d: Date | string | null | undefined) => (d ? new Date(d).toISOString() : null);
const actor = (customerId: string) => ({ type: "customer" as const, id: customerId });

/* --------------------------------------------------------------- sessions */

async function sessionToken(): Promise<string | null> {
  const token = (await cookies()).get(CUSTOMER_COOKIE)?.value;
  return token && token.length <= 100 ? token : null;
}

async function startSession(customerId: string, userAgent: string | null): Promise<void> {
  const token = newToken();
  await sql(
    `INSERT INTO customer_sessions (token_hash, customer_id, expires_at, user_agent)
     VALUES ($1, $2, now() + make_interval(days => $3), $4)`,
    [sha256(token), customerId, SESSION_DAYS, (userAgent ?? "").slice(0, 200)],
  );
  (await cookies()).set(CUSTOMER_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_DAYS * 24 * 60 * 60,
  });
}

export async function endCustomerSession(): Promise<void> {
  const jar = await cookies();
  const token = jar.get(CUSTOMER_COOKIE)?.value;
  if (token) await sql("DELETE FROM customer_sessions WHERE token_hash = $1", [sha256(token)]);
  jar.delete(CUSTOMER_COOKIE);
}

/** Ends every session of this customer, this one included. */
export async function endAllCustomerSessions(customerId: string): Promise<void> {
  await sql("DELETE FROM customer_sessions WHERE customer_id = $1", [customerId]);
  (await cookies()).delete(CUSTOMER_COOKIE);
}

/** The signed-in customer, or null. Never throws for a missing database (guests keep shopping). */
export async function currentCustomer(): Promise<CustomerSelf | null> {
  const token = await sessionToken();
  if (!token) return null;
  let row: (CustomerRow & { last_seen_at: Date }) | null;
  try {
    row = await sqlOne<CustomerRow & { last_seen_at: Date }>(
      `SELECT c.id, c.name, c.mobile, c.email, c.mobile_verified_at, c.email_verified_at, c.car, s.last_seen_at
         FROM customer_sessions s JOIN customers c ON c.id = s.customer_id
        WHERE s.token_hash = $1 AND s.expires_at > now()`,
      [sha256(token)],
    );
  } catch (err) {
    if (err instanceof DatabaseNotConfigured) return null;
    throw err;
  }
  if (!row) return null;
  if (Date.now() - new Date(row.last_seen_at).getTime() > 10 * 60 * 1000) {
    await sql("UPDATE customer_sessions SET last_seen_at = now() WHERE token_hash = $1", [sha256(token)]);
  }
  return toSelf(row);
}

export async function requireCustomer(): Promise<CustomerSelf> {
  const me = await currentCustomer();
  if (!me) throw new ApiError(401, "signed_out", "Please sign in to your Riderzpro account.");
  return me;
}

/** For account pages: the signed-in customer, or a redirect to sign-in that comes back here. */
export async function customerPage(here: string): Promise<CustomerSelf> {
  const me = await currentCustomer();
  if (!me) redirect(`/account/sign-in?next=${encodeURIComponent(here)}`);
  return me;
}

/* ---------------------------------------------------------------- sign-in */

/**
 * Checks the code and signs in, creating the account on first use. Returns whether the account is
 * new (the page then asks for a name).
 */
export async function signInWithCode(id: Identifier, code: string, userAgent: string | null): Promise<{ created: boolean }> {
  await checkOtp({ target: id.target, purpose: "customer_login", code });

  const { customerId, created } = await transaction(async (q) => {
    const column = id.channel === "mobile" ? "mobile" : "email";
    const where = id.channel === "mobile" ? "mobile = $1" : "lower(email) = $1";
    const existing = (await q<{ id: string }>(`SELECT id FROM customers WHERE ${where} FOR UPDATE`, [id.target]))[0];
    if (existing) {
      await q(
        `UPDATE customers SET ${column}_verified_at = COALESCE(${column}_verified_at, now()), last_login_at = now(), updated_at = now() WHERE id = $1`,
        [existing.id],
      );
      return { customerId: existing.id, created: false };
    }
    const newIdValue = newId("cus");
    // A simultaneous first sign-in with the same contact loses here on the unique index; retrying signs in.
    const rows = await q<{ id: string }>(
      `INSERT INTO customers (id, ${column}, ${column}_verified_at, last_login_at) VALUES ($1, $2, now(), now())
       ON CONFLICT DO NOTHING RETURNING id`,
      [newIdValue, id.target],
    );
    if (!rows[0]) throw new ApiError(409, "retry", "Please try signing in again.");
    return { customerId: newIdValue, created: true };
  });

  if (id.channel === "mobile") await claimGuestOrders(customerId, id.target);
  await startSession(customerId, userAgent);
  await audit(actor(customerId), created ? "customer.signup" : "customer.signin", { detail: { channel: id.channel } }).catch(() => {});
  return { created };
}

/** Guest orders placed with this (now verified) mobile join the account. */
async function claimGuestOrders(customerId: string, mobile: string): Promise<void> {
  await sql("UPDATE orders SET customer_id = $1 WHERE customer_id IS NULL AND customer_phone = $2", [customerId, mobile]);
}

/* --------------------------------------------------------------- profile */

export async function updateName(customerId: string, name: string): Promise<void> {
  await sql("UPDATE customers SET name = $2, updated_at = now() WHERE id = $1", [customerId, name]);
}

/** Adds or changes the account's mobile or email, after a code sent to the new one. */
export async function changeContact(customerId: string, id: Identifier, code: string): Promise<void> {
  await checkOtp({ target: id.target, purpose: "customer_contact", code });
  const column = id.channel === "mobile" ? "mobile" : "email";
  const where = id.channel === "mobile" ? "mobile = $1" : "lower(email) = $1";
  await transaction(async (q) => {
    const taken = (await q<{ id: string }>(`SELECT id FROM customers WHERE ${where} AND id <> $2`, [id.target, customerId]))[0];
    if (taken) {
      throw new ApiError(409, "taken", `That ${id.channel === "mobile" ? "mobile number" : "email"} belongs to another Riderzpro account.`);
    }
    await q(`UPDATE customers SET ${column} = $2, ${column}_verified_at = now(), updated_at = now() WHERE id = $1`, [customerId, id.target]);
  });
  if (id.channel === "mobile") await claimGuestOrders(customerId, id.target);
  await audit(actor(customerId), "customer.contact_change", { detail: { channel: id.channel } }).catch(() => {});
}

/** Is this mobile/email free for this customer to add? (Checked before a code is sent.) */
export async function contactFree(customerId: string, id: Identifier): Promise<boolean> {
  const where = id.channel === "mobile" ? "mobile = $1" : "lower(email) = $1";
  return !(await sqlOne(`SELECT 1 FROM customers WHERE ${where} AND id <> $2`, [id.target, customerId]));
}

/**
 * Deletes the account: profile, sessions, addresses, wishlist and saved car go. Orders stay (sellers,
 * invoices and tax records need them) but are no longer linked to an account.
 */
export async function deleteAccount(customerId: string): Promise<void> {
  await transaction(async (q) => {
    await q("UPDATE orders SET customer_id = NULL WHERE customer_id = $1", [customerId]);
    await q("UPDATE customer_tickets SET customer_id = NULL WHERE customer_id = $1", [customerId]);
    await q("DELETE FROM customers WHERE id = $1", [customerId]);
  });
  (await cookies()).delete(CUSTOMER_COOKIE);
  await audit(actor(customerId), "customer.delete").catch(() => {});
}

/* ------------------------------------------------------------- addresses */

type AddressRow = {
  id: string;
  label: string;
  name: string;
  mobile: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  is_default: boolean;
};
const toAddress = (r: AddressRow): AddressView => ({
  id: r.id,
  label: r.label,
  name: r.name,
  mobile: r.mobile,
  address: r.address,
  city: r.city,
  state: r.state,
  pincode: r.pincode,
  isDefault: r.is_default,
});

export async function listAddresses(customerId: string): Promise<AddressView[]> {
  const rows = await sql<AddressRow>(
    "SELECT * FROM customer_addresses WHERE customer_id = $1 ORDER BY is_default DESC, created_at ASC",
    [customerId],
  );
  return rows.map(toAddress);
}

export async function saveAddress(customerId: string, input: AddressInput, id?: string): Promise<AddressView> {
  return transaction(async (q) => {
    // Lock the customer row so two saves cannot both pass the limit or both become default.
    await q("SELECT id FROM customers WHERE id = $1 FOR UPDATE", [customerId]);
    const count = Number((await q<{ n: string }>("SELECT count(*) AS n FROM customer_addresses WHERE customer_id = $1", [customerId]))[0]?.n ?? 0);
    if (!id && count >= ADDRESS_MAX) throw new ApiError(409, "limit", `You can keep up to ${ADDRESS_MAX} addresses. Delete one first.`);
    const makeDefault = input.isDefault || count === 0 || (id !== undefined && count === 1);
    if (makeDefault) await q("UPDATE customer_addresses SET is_default = false WHERE customer_id = $1 AND is_default", [customerId]);

    const values = [input.label, input.name, input.mobile, input.address, input.city, input.state, input.pincode, makeDefault];
    let rows: AddressRow[];
    if (id) {
      rows = await q<AddressRow>(
        `UPDATE customer_addresses SET label=$3, name=$4, mobile=$5, address=$6, city=$7, state=$8, pincode=$9,
                is_default = CASE WHEN $10 THEN true ELSE is_default END, updated_at = now()
          WHERE id = $1 AND customer_id = $2 RETURNING *`,
        [id, customerId, ...values],
      );
      if (!rows[0]) throw new ApiError(404, "not_found", "That address was not found.");
    } else {
      rows = await q<AddressRow>(
        `INSERT INTO customer_addresses (id, customer_id, label, name, mobile, address, city, state, pincode, is_default)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING *`,
        [newId("adr"), customerId, ...values],
      );
    }
    return toAddress(rows[0]);
  });
}

/**
 * The map point of a saved address ("Detect my location"), or null to clear it. Only the owner's
 * address changes; checkout can copy it to the order (setOrderDeliveryPoint) for live tracking.
 */
export async function setAddressPoint(customerId: string, id: string, point: { lat: number; lng: number } | null): Promise<void> {
  const row = await sqlOne(
    "UPDATE customer_addresses SET lat = $3, lng = $4, updated_at = now() WHERE id = $1 AND customer_id = $2 RETURNING id",
    [id, customerId, point?.lat ?? null, point?.lng ?? null],
  );
  if (!row) throw new ApiError(404, "not_found", "That address was not found.");
}

export async function deleteAddress(customerId: string, id: string): Promise<void> {
  await transaction(async (q) => {
    const rows = await q<{ is_default: boolean }>(
      "DELETE FROM customer_addresses WHERE id = $1 AND customer_id = $2 RETURNING is_default",
      [id, customerId],
    );
    if (!rows[0]) throw new ApiError(404, "not_found", "That address was not found.");
    // The oldest remaining address takes over as default.
    if (rows[0].is_default) {
      await q(
        `UPDATE customer_addresses SET is_default = true
          WHERE id = (SELECT id FROM customer_addresses WHERE customer_id = $1 ORDER BY created_at ASC LIMIT 1)`,
        [customerId],
      );
    }
  });
}

/* ------------------------------------------------- wishlist and saved car */

/** Drops a picture whose stock-photo key no longer exists, so the page never renders a broken one. */
function cleanItem(item: WishlistItem): WishlistItem {
  if (item.image?.kind === "media" && !(item.image.key in MEDIA)) {
    const { image: _drop, ...rest } = item;
    return rest;
  }
  return item;
}

export async function getWishlist(customerId: string): Promise<WishlistItem[]> {
  const rows = await sql<{ item: WishlistItem }>(
    "SELECT item FROM customer_wishlist WHERE customer_id = $1 ORDER BY saved_at DESC LIMIT 50",
    [customerId],
  );
  return rows.map((r) => cleanItem(r.item));
}

/**
 * Adds items to the saved list (a newer copy of an item wins), keeping the 50 most recently saved.
 * Never removes anything: removal is one item at a time (`removeWishlistItem`), so a device holding
 * an older list can't wipe what another device saved.
 */
export async function mergeWishlist(customerId: string, items: WishlistItem[]): Promise<WishlistItem[]> {
  const unique = new Map<string, WishlistItem>();
  for (const i of items) {
    const had = unique.get(i.slug);
    if (!had || i.savedAt > had.savedAt) unique.set(i.slug, cleanItem(i));
  }
  await transaction(async (q) => {
    for (const i of unique.values()) {
      await q(
        `INSERT INTO customer_wishlist (customer_id, slug, item, saved_at) VALUES ($1, $2, $3, to_timestamp($4 / 1000.0))
         ON CONFLICT (customer_id, slug) DO UPDATE SET item = EXCLUDED.item, saved_at = EXCLUDED.saved_at
          WHERE EXCLUDED.saved_at > customer_wishlist.saved_at`,
        [customerId, i.slug, JSON.stringify(i), Math.min(i.savedAt, Date.now())],
      );
    }
    await q(
      `DELETE FROM customer_wishlist WHERE customer_id = $1 AND slug NOT IN
         (SELECT slug FROM customer_wishlist WHERE customer_id = $1 ORDER BY saved_at DESC LIMIT 50)`,
      [customerId],
    );
  });
  return getWishlist(customerId);
}

export async function removeWishlistItem(customerId: string, slug: string): Promise<void> {
  await sql("DELETE FROM customer_wishlist WHERE customer_id = $1 AND slug = $2", [customerId, slug]);
}

export async function setCar(customerId: string, car: SavedCar | null): Promise<void> {
  await sql("UPDATE customers SET car = $2, updated_at = now() WHERE id = $1", [customerId, car ? JSON.stringify(car) : null]);
}

/* ---------------------------------------------------------------- orders */

type OrderRow = {
  id: string;
  number: string;
  status: OrderStatus;
  customer_name: string;
  customer_phone: string;
  customer_email: string | null;
  address: string;
  city: string;
  state: string;
  pincode: string;
  notes: string | null;
  subtotal: number;
  shipping: number;
  discount: number;
  coupon_code: string | null;
  total: number;
  created_at: Date;
};

export async function listCustomerOrders(customerId: string): Promise<AccountOrderSummary[]> {
  // Guest orders placed since the last sign-in with the account's verified mobile join it now.
  await sql(
    `UPDATE orders SET customer_id = $1
      WHERE customer_id IS NULL
        AND customer_phone = (SELECT mobile FROM customers WHERE id = $1 AND mobile_verified_at IS NOT NULL)`,
    [customerId],
  );
  const rows = await sql<{ number: string; status: OrderStatus; created_at: Date; total: number; item_count: string; first_item: string | null }>(
    `SELECT o.number, o.status, o.created_at, o.total,
            (SELECT coalesce(sum(qty), 0) FROM order_items i WHERE i.order_id = o.id) AS item_count,
            (SELECT title FROM order_items i WHERE i.order_id = o.id ORDER BY i.id LIMIT 1) AS first_item
       FROM orders o WHERE o.customer_id = $1 ORDER BY o.created_at DESC LIMIT 100`,
    [customerId],
  );
  return rows.map((r) => ({
    number: r.number,
    status: r.status,
    createdAt: iso(r.created_at)!,
    total: r.total,
    itemCount: Number(r.item_count),
    firstItem: r.first_item ?? "",
  }));
}

/** One of the customer's own orders, by its number. Another customer's number answers null. */
export async function customerOrderDetail(customerId: string, number: string): Promise<AccountOrder | null> {
  const o = await sqlOne<OrderRow>(
    `SELECT id, number, status, customer_name, customer_phone, customer_email, address, city, state, pincode, notes,
            subtotal, shipping, discount, coupon_code, total, created_at
       FROM orders WHERE number = $1 AND customer_id = $2`,
    [number, customerId],
  );
  if (!o) return null;

  const parts = await sql<{
    id: string;
    status: VendorOrderStatus;
    courier: string | null;
    tracking_number: string | null;
    shipped_at: Date | null;
    delivered_at: Date | null;
    store_name: string | null;
  }>(
    `SELECT vo.id, vo.status, vo.courier, vo.tracking_number, vo.shipped_at, vo.delivered_at, v.store_name
       FROM vendor_orders vo JOIN vendors v ON v.id = vo.vendor_id
      WHERE vo.order_id = $1 ORDER BY vo.created_at`,
    [o.id],
  );
  const items = await sql<{
    id: string;
    vendor_order_id: string | null;
    product_kind: "house" | "vendor";
    product_ref: string;
    title: string;
    variant: string | null;
    unit_price: number;
    install_price: number;
    qty: number;
    line_total: number;
    product_slug: string | null;
    vendor_slug: string | null;
  }>(
    // Marketplace links only while the product is live and the seller approved (the public gate).
    `SELECT i.id, i.vendor_order_id, i.product_kind, i.product_ref, i.title, i.variant, i.unit_price, i.install_price,
            i.qty, i.line_total,
            CASE WHEN p.status = 'live' AND v.status = 'approved' THEN p.slug END AS product_slug,
            CASE WHEN p.status = 'live' AND v.status = 'approved' THEN v.slug END AS vendor_slug
       FROM order_items i
       LEFT JOIN vendor_products p ON i.product_kind = 'vendor' AND p.id = i.product_ref
       LEFT JOIN vendors v ON v.id = p.vendor_id
      WHERE i.order_id = $1 ORDER BY i.id`,
    [o.id],
  );

  const toItem = (i: (typeof items)[number]): AccountOrderItem => {
    let href: string | null = null;
    if (i.product_kind === "vendor") {
      href = i.product_slug && i.vendor_slug ? vendorProductHref(i.vendor_slug, i.product_slug) : null;
    } else {
      const slug = parseLineId(i.product_ref)?.slug;
      const detail = slug ? getProductDetail(slug) : null;
      href = detail?.indexable ? productHref(detail.slug) : null;
    }
    return {
      id: i.id,
      title: i.title,
      variant: i.variant,
      qty: i.qty,
      unitPrice: i.unit_price,
      installPrice: i.install_price,
      lineTotal: i.line_total,
      href,
    };
  };

  const riders = await riderInfoForOrder(o.id);
  const riderFor = (key: string): AccountOrderPart["rider"] => {
    const r = riders.get(key);
    return r ? { firstName: r.riderFirstName, vehicle: vehicleLabel(r.vehicle), status: r.status, code: r.code } : null;
  };

  const out: AccountOrderPart[] = [];
  const house = items.filter((i) => !i.vendor_order_id);
  if (house.length) {
    out.push({ key: "house", seller: "Riderzpro", status: null, courier: null, trackingNumber: null, shippedAt: null, deliveredAt: null, items: house.map(toItem), rider: riderFor("house") });
  }
  for (const p of parts) {
    out.push({
      key: p.id,
      seller: p.store_name ?? "Riderzpro seller",
      status: p.status,
      courier: p.courier,
      trackingNumber: p.tracking_number,
      shippedAt: iso(p.shipped_at),
      deliveredAt: iso(p.delivered_at),
      items: items.filter((i) => i.vendor_order_id === p.id).map(toItem),
      rider: riderFor(p.id),
    });
  }

  return {
    number: o.number,
    status: o.status,
    createdAt: iso(o.created_at)!,
    total: o.total,
    itemCount: items.reduce((n, i) => n + i.qty, 0),
    firstItem: items[0]?.title ?? "",
    subtotal: o.subtotal,
    shipping: o.shipping,
    discount: o.discount,
    couponCode: o.coupon_code,
    name: o.customer_name,
    phone: o.customer_phone,
    email: o.customer_email,
    address: o.address,
    city: o.city,
    state: o.state,
    pincode: o.pincode,
    notes: o.notes,
    parts: out,
  };
}

/* ----------------------------------------------------------- help desk */

const TICKETS_PER_DAY = 5;

export async function createTicket(input: TicketInput, customerId: string | null): Promise<{ id: string }> {
  if (customerId) {
    const n = await sqlOne<{ n: string }>(
      "SELECT count(*) AS n FROM customer_tickets WHERE customer_id = $1 AND created_at > now() - interval '1 day'",
      [customerId],
    );
    if (Number(n?.n ?? 0) >= TICKETS_PER_DAY) {
      throw new ApiError(429, "rate_limited", "You've sent several messages today. We'll reply to those first.");
    }
  }
  const id = newId("tkt");
  await sql(
    `INSERT INTO customer_tickets (id, customer_id, name, mobile, email, order_number, topic, body)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
    [id, customerId, input.name, input.mobile, input.email, input.orderNumber, input.topic, input.body],
  );
  return { id };
}

export async function listCustomerTickets(customerId: string): Promise<TicketView[]> {
  const rows = await sql<{
    id: string;
    topic: TicketView["topic"];
    order_number: string | null;
    body: string;
    status: TicketView["status"];
    admin_reply: string | null;
    replied_at: Date | null;
    created_at: Date;
  }>(
    `SELECT id, topic, order_number, body, status, admin_reply, replied_at, created_at
       FROM customer_tickets WHERE customer_id = $1 ORDER BY created_at DESC LIMIT 50`,
    [customerId],
  );
  return rows.map((r) => ({
    id: r.id,
    topic: r.topic,
    orderNumber: r.order_number,
    body: r.body,
    status: r.status,
    reply: r.admin_reply,
    repliedAt: iso(r.replied_at),
    createdAt: iso(r.created_at)!,
  }));
}
