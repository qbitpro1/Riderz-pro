import "server-only";

import { randomInt } from "node:crypto";
import { sql, transaction, type Query } from "@/lib/db/client";
import { checkBuyable, parseLineId } from "@/lib/shopify/variants";
import { shippingFor } from "@/lib/store/shipping";
import { VENDOR_LINE_PREFIX, VENDOR_ORDER_MOVES, DEFAULT_COMMISSION_RATE, isVendorLineSlug, type VendorOrderStatus } from "@/lib/vendor/types";
import type { PlaceOrderInput } from "@/components/cart/orderSchema";
import type { OrderItemView, VendorOrderDetail, VendorOrderListItem } from "@/components/vendor/orders/types";
import type { AdminOrder, AdminOrderPart, OrderStatus } from "@/components/admin/orders/types";
import { ApiError } from "./http";
import { newId, sha256 } from "./security";
import { LIVE_PRODUCT_WHERE } from "./vendor-products";
import { audit, notifyVendor, type Actor } from "./vendors";

/**
 * ORDERS
 *
 * Checkout capture, the vendor's view of their own orders, and the admin's
 * view of all of them. Money is integer rupees, GST inclusive. Prices are
 * always recomputed here from the catalogue / database — the browser only
 * names products and quantities.
 */

const iso = (d: Date | string | null | undefined) => (d ? new Date(d).toISOString() : null);

/* ------------------------------------------------------------ place order */

/** Unambiguous: no 0/O, 1/I/L. */
const NUMBER_ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
const newOrderNumber = () =>
  "RZP-" + Array.from({ length: 6 }, () => NUMBER_ALPHABET[randomInt(0, NUMBER_ALPHABET.length)]).join("");

type PricedItem = {
  kind: "house" | "vendor";
  ref: string;
  vendorId: string | null;
  title: string;
  variant: string | null;
  unit: number;
  install: number;
  qty: number;
};

type VendorProductLookup = {
  id: string;
  vendor_id: string;
  slug: string;
  title: string;
  price: number;
  stock: number;
  commission_rate: string | null;
};

export async function placeOrder(input: PlaceOrderInput): Promise<{ number: string; total: number }> {
  const { customer } = input;

  /* ---- 1. price every line from the server's own data ---- */
  const seen = new Set<string>();
  const items: PricedItem[] = [];
  const commissions = new Map<string, number>();
  const vendorWanted: { slug: string; qty: number }[] = [];

  for (const line of input.lines) {
    if (seen.has(line.id)) throw new ApiError(400, "invalid", "The same item appears twice in your cart.");
    seen.add(line.id);

    if (isVendorLineSlug(line.id)) {
      const slug = line.id.slice(VENDOR_LINE_PREFIX.length);
      if (!/^[a-z0-9][a-z0-9-]*$/.test(slug)) throw new ApiError(400, "invalid", "An item in your cart is not valid.");
      if (line.install) throw new ApiError(400, "invalid", "Installation is not offered for marketplace items.");
      vendorWanted.push({ slug, qty: line.qty });
      continue;
    }

    const buyable = checkBuyable(line.id);
    if (!buyable.ok) throw new ApiError(400, "invalid", buyable.reason);
    const parsed = parseLineId(line.id);
    if (!parsed) throw new ApiError(400, "invalid", "An item in your cart is not valid.");
    const { detail } = buyable;

    let unit = detail.price as number; // checkBuyable guarantees a price
    const labels: string[] = [];
    for (const opt of detail.options) {
      const value = opt.values.find((v) => v.id === parsed.choices[opt.id]);
      if (!value) throw new ApiError(400, "invalid", "An item option is not valid.");
      unit += value.priceDelta;
      labels.push(value.label);
    }
    let install = 0;
    if (line.install) {
      const price = detail.installation?.price ?? null;
      if (price === null) throw new ApiError(400, "invalid", `Installation is not available for ${detail.title}.`);
      install = price;
    }
    items.push({
      kind: "house",
      ref: line.id,
      vendorId: null,
      title: detail.title,
      variant: labels.length ? labels.join(" · ") : null,
      unit,
      install,
      qty: line.qty,
    });
  }

  if (vendorWanted.length > 0) {
    const rows = await sql<VendorProductLookup>(
      `SELECT p.id, p.vendor_id, p.slug, p.title, p.price, p.stock, v.commission_rate
         FROM vendor_products p JOIN vendors v ON v.id = p.vendor_id
        WHERE p.slug = ANY($1) AND ${LIVE_PRODUCT_WHERE}`,
      [vendorWanted.map((w) => w.slug)],
    );
    for (const w of vendorWanted) {
      const p = rows.find((r) => r.slug === w.slug);
      if (!p) throw new ApiError(409, "unavailable_item", "An item in your cart is no longer available.");
      if (p.stock < w.qty) {
        throw new ApiError(409, "sold_out", p.stock === 0 ? `${p.title} just sold out.` : `Only ${p.stock} of ${p.title} left.`);
      }
      commissions.set(p.vendor_id, p.commission_rate === null ? DEFAULT_COMMISSION_RATE : Number(p.commission_rate));
      items.push({
        kind: "vendor",
        ref: p.id,
        vendorId: p.vendor_id,
        title: p.title,
        variant: null,
        unit: p.price,
        install: 0,
        qty: w.qty,
      });
    }
  }

  const merchandise = items.reduce((n, i) => n + i.unit * i.qty, 0);
  const installTotal = items.reduce((n, i) => n + i.install * i.qty, 0);
  const shipping = shippingFor(merchandise);
  const subtotal = merchandise + installTotal;
  const total = subtotal + shipping;

  /* ---- 2. write everything at once ---- */
  const orderId = newId("ord");
  type Placed = { vendorId: string; vendorOrderId: string; count: number };
  type Low = { vendorId: string; title: string; stock: number };

  const { number, placed, low } = await transaction(async (q) => {
    let number = "";
    for (let attempt = 0; attempt < 8 && !number; attempt++) {
      const candidate = newOrderNumber();
      const rows = await q<{ number: string }>(
        `INSERT INTO orders (id, number, customer_name, customer_phone, customer_email, address, city, state, pincode, notes, subtotal, shipping, total)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)
         ON CONFLICT (number) DO NOTHING RETURNING number`,
        [
          orderId, candidate, customer.name, customer.mobile, customer.email, customer.address, customer.city,
          customer.state, customer.pincode, customer.notes, subtotal, shipping, total,
        ],
      );
      if (rows[0]) number = rows[0].number;
    }
    if (!number) throw new ApiError(503, "busy", "We couldn't create your order just now. Please try again.");

    // One part per vendor.
    const parts = new Map<string, { id: string; subtotal: number; count: number }>();
    for (const i of items) {
      if (!i.vendorId) continue;
      const p = parts.get(i.vendorId) ?? { id: newId("vor"), subtotal: 0, count: 0 };
      p.subtotal += i.unit * i.qty;
      p.count += 1;
      parts.set(i.vendorId, p);
    }
    for (const [vendorId, p] of parts) {
      await q(
        "INSERT INTO vendor_orders (id, order_id, vendor_id, subtotal, commission_rate) VALUES ($1,$2,$3,$4,$5)",
        [p.id, orderId, vendorId, p.subtotal, commissions.get(vendorId) ?? DEFAULT_COMMISSION_RATE],
      );
    }

    for (const i of items) {
      await q(
        `INSERT INTO order_items (id, order_id, vendor_order_id, product_kind, product_ref, title, variant, unit_price, install_price, qty, line_total)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)`,
        [
          newId("itm"), orderId, i.vendorId ? parts.get(i.vendorId)!.id : null, i.kind, i.ref, i.title, i.variant,
          i.unit, i.install, i.qty, (i.unit + i.install) * i.qty,
        ],
      );
    }

    // Take the stock; a lost race rolls everything back. Fixed order avoids deadlocks.
    const low: Low[] = [];
    const vendorItems = items.filter((i) => i.kind === "vendor").sort((a, b) => (a.ref < b.ref ? -1 : 1));
    for (const i of vendorItems) {
      const rows = await q<{ stock: number; low_stock_at: number }>(
        "UPDATE vendor_products SET stock = stock - $2, updated_at = now() WHERE id = $1 AND stock >= $2 RETURNING stock, low_stock_at",
        [i.ref, i.qty],
      );
      if (!rows[0]) throw new ApiError(409, "sold_out", `${i.title} just sold out.`);
      if (rows[0].stock <= rows[0].low_stock_at) low.push({ vendorId: i.vendorId!, title: i.title, stock: rows[0].stock });
    }

    const placed: Placed[] = [...parts].map(([vendorId, p]) => ({ vendorId, vendorOrderId: p.id, count: p.count }));
    return { number, placed, low };
  });

  /* ---- 3. after commit: tell the sellers; failures here must not undo the order ---- */
  try {
    for (const p of placed) {
      await notifyVendor(p.vendorId, {
        type: "order",
        title: `New order ${number}`,
        body: `${p.count} item${p.count === 1 ? "" : "s"} to pack and ship.`,
        link: `/vendor/dashboard/orders/${p.vendorOrderId}`,
      });
    }
    for (const l of low) {
      await notifyVendor(l.vendorId, {
        type: "stock",
        title: l.stock === 0 ? `Out of stock: ${l.title}` : `Low stock: ${l.title}`,
        body: `${l.stock} left.`,
        link: "/vendor/dashboard/inventory",
      });
    }
    await audit({ type: "customer", id: sha256(customer.mobile).slice(0, 12) }, "order.place", {
      detail: { number, total, vendorParts: placed.length },
    });
  } catch (err) {
    console.error("[orders] post-commit step failed", err instanceof Error ? err.message : err);
  }

  return { number, total };
}

/* ----------------------------------------------------------- shared bits */

type ItemRow = {
  id: string;
  order_id?: string;
  vendor_order_id: string | null;
  product_kind: "house" | "vendor";
  product_ref: string;
  title: string;
  variant: string | null;
  unit_price: number;
  install_price: number;
  qty: number;
  line_total: number;
  hsn?: string | null;
  gst_rate?: number | null;
};

const toItem = (r: ItemRow, withTax = false): OrderItemView => ({
  id: r.id,
  productKind: r.product_kind,
  productRef: r.product_ref,
  title: r.title,
  variant: r.variant,
  unitPrice: r.unit_price,
  installPrice: r.install_price,
  qty: r.qty,
  lineTotal: r.line_total,
  ...(withTax ? { hsn: r.hsn ?? null, gstRate: r.gst_rate ?? null } : {}),
});

/** Put a vendor order's products back on the shelf (cancelled or returned). */
async function restoreStock(q: Query, vendorOrderId: string) {
  await q(
    `UPDATE vendor_products p SET stock = p.stock + i.qty, updated_at = now()
       FROM order_items i
      WHERE i.vendor_order_id = $1 AND i.product_kind = 'vendor' AND p.id = i.product_ref`,
    [vendorOrderId],
  );
}

const TERMINAL: VendorOrderStatus[] = ["delivered", "cancelled", "returned"];

/** When every seller part is finished and the house sells nothing in the order, close the order. */
async function settleOrderStatus(q: Query, orderId: string) {
  const parts = await q<{ status: VendorOrderStatus }>("SELECT status FROM vendor_orders WHERE order_id = $1", [orderId]);
  if (parts.length === 0 || !parts.every((p) => TERMINAL.includes(p.status))) return;
  const house = await q<{ n: number }>(
    "SELECT count(*)::int AS n FROM order_items WHERE order_id = $1 AND vendor_order_id IS NULL",
    [orderId],
  );
  if ((house[0]?.n ?? 0) > 0) return;
  const next: OrderStatus = parts.every((p) => p.status === "cancelled") ? "cancelled" : "completed";
  await q("UPDATE orders SET status = $2, updated_at = now() WHERE id = $1 AND status <> $2", [orderId, next]);
}

/* ------------------------------------------------------------- vendor side */

type ListRow = {
  id: string;
  status: VendorOrderStatus;
  subtotal: number;
  courier: string | null;
  tracking_number: string | null;
  created_at: Date;
  number: string;
  customer_name: string;
  city: string;
  state: string;
  pincode: string;
  item_count: number;
  first_title: string | null;
};

export async function listVendorOrders(vendorId: string, status?: VendorOrderStatus): Promise<VendorOrderListItem[]> {
  const rows = await sql<ListRow>(
    `SELECT vo.id, vo.status, vo.subtotal, vo.courier, vo.tracking_number, vo.created_at,
            o.number, o.customer_name, o.city, o.state, o.pincode,
            COALESCE((SELECT sum(i.qty) FROM order_items i WHERE i.vendor_order_id = vo.id), 0)::int AS item_count,
            (SELECT i.title FROM order_items i WHERE i.vendor_order_id = vo.id ORDER BY i.title LIMIT 1) AS first_title
       FROM vendor_orders vo JOIN orders o ON o.id = vo.order_id
      WHERE vo.vendor_id = $1 AND ($2::text IS NULL OR vo.status = $2)
      ORDER BY vo.created_at DESC LIMIT 300`,
    [vendorId, status ?? null],
  );
  return rows.map((r) => ({
    id: r.id,
    number: r.number,
    createdAt: iso(r.created_at)!,
    status: r.status,
    customerName: r.customer_name,
    city: r.city,
    state: r.state,
    pincode: r.pincode,
    itemCount: r.item_count,
    firstTitle: r.first_title ?? "",
    subtotal: r.subtotal,
    courier: r.courier,
    trackingNumber: r.tracking_number,
  }));
}

type DetailRow = ListRow & {
  customer_phone: string;
  address: string;
  notes: string | null;
  cancel_reason: string | null;
  commission_rate: string;
  accepted_at: Date | null;
  packed_at: Date | null;
  shipped_at: Date | null;
  delivered_at: Date | null;
  cancelled_at: Date | null;
  returned_at: Date | null;
};

/** One of THIS vendor's orders, or null. Only this vendor's items are included. */
export async function vendorOrderDetail(vendorId: string, id: string): Promise<VendorOrderDetail | null> {
  const r = (
    await sql<DetailRow>(
      `SELECT vo.id, vo.status, vo.subtotal, vo.courier, vo.tracking_number, vo.created_at, vo.cancel_reason, vo.commission_rate,
              vo.accepted_at, vo.packed_at, vo.shipped_at, vo.delivered_at, vo.cancelled_at, vo.returned_at,
              o.number, o.customer_name, o.customer_phone, o.address, o.city, o.state, o.pincode, o.notes,
              0 AS item_count, NULL AS first_title
         FROM vendor_orders vo JOIN orders o ON o.id = vo.order_id
        WHERE vo.id = $1 AND vo.vendor_id = $2`,
      [id, vendorId],
    )
  )[0];
  if (!r) return null;
  const items = await sql<ItemRow>(
    `SELECT i.id, i.vendor_order_id, i.product_kind, i.product_ref, i.title, i.variant, i.unit_price, i.install_price, i.qty, i.line_total,
            p.hsn, p.gst_rate
       FROM order_items i LEFT JOIN vendor_products p ON p.id = i.product_ref AND i.product_kind = 'vendor'
      WHERE i.vendor_order_id = $1 ORDER BY i.title, i.variant`,
    [id],
  );
  return {
    id: r.id,
    number: r.number,
    createdAt: iso(r.created_at)!,
    status: r.status,
    customerName: r.customer_name,
    customerPhone: r.customer_phone,
    address: r.address,
    city: r.city,
    state: r.state,
    pincode: r.pincode,
    notes: r.notes,
    itemCount: items.reduce((n, i) => n + i.qty, 0),
    firstTitle: items[0]?.title ?? "",
    subtotal: r.subtotal,
    courier: r.courier,
    trackingNumber: r.tracking_number,
    items: items.map((i) => toItem(i, true)),
    cancelReason: r.cancel_reason,
    commissionRate: Number(r.commission_rate),
    acceptedAt: iso(r.accepted_at),
    packedAt: iso(r.packed_at),
    shippedAt: iso(r.shipped_at),
    deliveredAt: iso(r.delivered_at),
    cancelledAt: iso(r.cancelled_at),
    returnedAt: iso(r.returned_at),
  };
}

/** A vendor moves their own order along. Identity (`vendorId`) comes from the session. */
export async function vendorChangeStatus(
  vendorId: string,
  id: string,
  input: { to: VendorOrderStatus; courier?: string; trackingNumber?: string; reason?: string },
): Promise<VendorOrderStatus> {
  const { to } = input;
  const courier = input.courier?.trim();
  const tracking = input.trackingNumber?.trim();
  const reason = input.reason?.trim();
  if (to === "shipped" && (!courier || !tracking)) {
    throw new ApiError(400, "invalid", "Enter the courier and tracking number.", {
      ...(courier ? {} : { courier: "Courier is required" }),
      ...(tracking ? {} : { trackingNumber: "Tracking number is required" }),
    });
  }
  if (to === "cancelled" && !reason) {
    throw new ApiError(400, "invalid", "Say why you are cancelling.", { reason: "A reason is required" });
  }

  const actor: Actor = { type: "vendor", id: vendorId };
  return transaction(async (q) => {
    const row = (
      await q<{ status: VendorOrderStatus; order_id: string; number: string }>(
        `SELECT vo.status, vo.order_id, o.number FROM vendor_orders vo JOIN orders o ON o.id = vo.order_id
          WHERE vo.id = $1 AND vo.vendor_id = $2 FOR UPDATE OF vo`,
        [id, vendorId],
      )
    )[0];
    if (!row) throw new ApiError(404, "not_found", "Order not found.");
    if (!VENDOR_ORDER_MOVES[row.status]?.includes(to)) {
      throw new ApiError(409, "bad_transition", `This order is ${row.status.replace("_", " ")}; it can't move to ${to}.`);
    }

    switch (to) {
      case "accepted":
        await q("UPDATE vendor_orders SET status='accepted', accepted_at=now(), updated_at=now() WHERE id=$1", [id]);
        break;
      case "packed":
        await q("UPDATE vendor_orders SET status='packed', packed_at=now(), updated_at=now() WHERE id=$1", [id]);
        break;
      case "shipped":
        await q(
          "UPDATE vendor_orders SET status='shipped', shipped_at=now(), courier=$2, tracking_number=$3, updated_at=now() WHERE id=$1",
          [id, courier, tracking],
        );
        break;
      case "delivered":
        await q("UPDATE vendor_orders SET status='delivered', delivered_at=now(), updated_at=now() WHERE id=$1", [id]);
        break;
      case "cancelled":
        await q(
          "UPDATE vendor_orders SET status='cancelled', cancelled_at=now(), cancel_reason=$2, updated_at=now() WHERE id=$1",
          [id, reason],
        );
        await restoreStock(q, id);
        break;
      default:
        throw new ApiError(409, "bad_transition", "That move isn't allowed.");
    }
    await settleOrderStatus(q, row.order_id);
    await audit(actor, `order.${to}`, { vendorId, detail: { vendorOrderId: id, number: row.number, from: row.status, courier, tracking, reason } }, q);
    return to;
  });
}

/* -------------------------------------------------------------- admin side */

type AdminOrderRow = {
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
  total: number;
  channel: string;
  created_at: Date;
};

type PartRow = {
  id: string;
  order_id: string;
  vendor_id: string;
  store_name: string | null;
  status: VendorOrderStatus;
  subtotal: number;
  commission_rate: string;
  courier: string | null;
  tracking_number: string | null;
  cancel_reason: string | null;
  payout_id: string | null;
  delivered_at: Date | null;
};

async function assembleAdminOrders(rows: AdminOrderRow[]): Promise<AdminOrder[]> {
  if (rows.length === 0) return [];
  const ids = rows.map((r) => r.id);
  const parts = await sql<PartRow>(
    `SELECT vo.id, vo.order_id, vo.vendor_id, v.store_name, vo.status, vo.subtotal, vo.commission_rate, vo.courier,
            vo.tracking_number, vo.cancel_reason, vo.payout_id, vo.delivered_at
       FROM vendor_orders vo JOIN vendors v ON v.id = vo.vendor_id
      WHERE vo.order_id = ANY($1) ORDER BY vo.created_at`,
    [ids],
  );
  const items = await sql<ItemRow>(
    `SELECT id, order_id, vendor_order_id, product_kind, product_ref, title, variant, unit_price, install_price, qty, line_total
       FROM order_items WHERE order_id = ANY($1) ORDER BY title, variant`,
    [ids],
  );
  return rows.map((r) => {
    const mine = items.filter((i) => i.order_id === r.id);
    const adminParts: AdminOrderPart[] = parts
      .filter((p) => p.order_id === r.id)
      .map((p) => ({
        id: p.id,
        vendorId: p.vendor_id,
        storeName: p.store_name ?? "Seller",
        status: p.status,
        subtotal: p.subtotal,
        commissionRate: Number(p.commission_rate),
        courier: p.courier,
        trackingNumber: p.tracking_number,
        cancelReason: p.cancel_reason,
        paidOut: Boolean(p.payout_id),
        deliveredAt: iso(p.delivered_at),
        items: mine.filter((i) => i.vendor_order_id === p.id).map((i) => toItem(i)),
      }));
    return {
      id: r.id,
      number: r.number,
      status: r.status,
      customerName: r.customer_name,
      customerPhone: r.customer_phone,
      customerEmail: r.customer_email,
      address: r.address,
      city: r.city,
      state: r.state,
      pincode: r.pincode,
      notes: r.notes,
      subtotal: r.subtotal,
      shipping: r.shipping,
      total: r.total,
      channel: r.channel,
      createdAt: iso(r.created_at)!,
      parts: adminParts,
      houseItems: mine.filter((i) => !i.vendor_order_id).map((i) => toItem(i)),
    };
  });
}

const ORDER_COLS =
  "id, number, status, customer_name, customer_phone, customer_email, address, city, state, pincode, notes, subtotal, shipping, total, channel, created_at";

export async function listAdminOrders(opts: { status?: OrderStatus; q?: string } = {}): Promise<AdminOrder[]> {
  const q = opts.q?.trim().slice(0, 80) || null;
  const rows = await sql<AdminOrderRow>(
    `SELECT ${ORDER_COLS} FROM orders
      WHERE ($1::text IS NULL OR status = $1)
        AND ($2::text IS NULL OR number ILIKE $3 OR customer_name ILIKE $3 OR customer_phone LIKE $3)
      ORDER BY created_at DESC LIMIT 100`,
    [opts.status ?? null, q, q ? `%${q.replace(/[\\%_]/g, (c) => `\\${c}`)}%` : null],
  );
  return assembleAdminOrders(rows);
}

export async function adminOrderDetail(id: string): Promise<AdminOrder | null> {
  const rows = await sql<AdminOrderRow>(`SELECT ${ORDER_COLS} FROM orders WHERE id = $1`, [id]);
  return (await assembleAdminOrders(rows))[0] ?? null;
}

const ADMIN_MOVES: Partial<Record<VendorOrderStatus, VendorOrderStatus[]>> = {
  new: ["cancelled"],
  accepted: ["cancelled"],
  packed: ["cancelled"],
  shipped: ["cancelled"],
  delivered: ["return_requested", "returned"],
  return_requested: ["returned"],
};

/** Admin cancels a seller part or records a return. Restores stock; a returned order never pays out. */
export async function adminChangePartStatus(
  actor: string,
  vendorOrderId: string,
  to: "cancelled" | "return_requested" | "returned",
  reason: string,
): Promise<void> {
  await transaction(async (q) => {
    const row = (
      await q<{ status: VendorOrderStatus; order_id: string; vendor_id: string; payout_id: string | null; number: string }>(
        `SELECT vo.status, vo.order_id, vo.vendor_id, vo.payout_id, o.number
           FROM vendor_orders vo JOIN orders o ON o.id = vo.order_id WHERE vo.id = $1 FOR UPDATE OF vo`,
        [vendorOrderId],
      )
    )[0];
    if (!row) throw new ApiError(404, "not_found", "Order not found.");
    if (!ADMIN_MOVES[row.status]?.includes(to)) {
      throw new ApiError(409, "bad_transition", `This part is ${row.status.replace("_", " ")}; it can't move to ${to.replace("_", " ")}.`);
    }
    if (to === "cancelled") {
      await q("UPDATE vendor_orders SET status='cancelled', cancelled_at=now(), cancel_reason=$2, updated_at=now() WHERE id=$1", [vendorOrderId, reason]);
      await restoreStock(q, vendorOrderId);
    } else if (to === "returned") {
      await q("UPDATE vendor_orders SET status='returned', returned_at=now(), cancel_reason=$2, updated_at=now() WHERE id=$1", [vendorOrderId, reason]);
      await restoreStock(q, vendorOrderId);
    } else {
      await q("UPDATE vendor_orders SET status='return_requested', cancel_reason=$2, updated_at=now() WHERE id=$1", [vendorOrderId, reason]);
    }
    await settleOrderStatus(q, row.order_id);
    await audit(
      { type: "admin", id: actor },
      `order.admin_${to}`,
      { vendorId: row.vendor_id, detail: { vendorOrderId, number: row.number, from: row.status, reason, alreadyPaidOut: Boolean(row.payout_id) } },
      q,
    );
    await notifyVendor(
      row.vendor_id,
      {
        type: "order",
        title: `Order ${row.number} ${to === "cancelled" ? "cancelled" : to === "returned" ? "returned" : "return requested"}`,
        body: reason,
        link: `/vendor/dashboard/orders/${vendorOrderId}`,
      },
      q,
    );
  });
}

const ORDER_MOVES: Record<OrderStatus, OrderStatus[]> = {
  placed: ["confirmed", "cancelled"],
  confirmed: ["completed", "cancelled"],
  completed: [],
  cancelled: [],
};

/** Order-level status for the house's own part of an order (placed → confirmed → completed / cancelled). */
export async function adminChangeOrderStatus(actor: string, orderId: string, to: OrderStatus): Promise<void> {
  await transaction(async (q) => {
    const row = (await q<{ status: OrderStatus; number: string }>("SELECT status, number FROM orders WHERE id = $1 FOR UPDATE", [orderId]))[0];
    if (!row) throw new ApiError(404, "not_found", "Order not found.");
    if (!ORDER_MOVES[row.status].includes(to)) {
      throw new ApiError(409, "bad_transition", `This order is ${row.status}; it can't move to ${to}.`);
    }
    if (to === "completed" || to === "cancelled") {
      const open = await q<{ n: number }>(
        "SELECT count(*)::int AS n FROM vendor_orders WHERE order_id = $1 AND status NOT IN ('delivered','cancelled','returned')",
        [orderId],
      );
      if ((open[0]?.n ?? 0) > 0) {
        throw new ApiError(409, "parts_open", "Finish or cancel each seller's part of this order first.");
      }
    }
    await q("UPDATE orders SET status = $2, updated_at = now() WHERE id = $1", [orderId, to]);
    await audit({ type: "admin", id: actor }, `order.status_${to}`, { detail: { orderId, number: row.number, from: row.status } }, q);
  });
}
