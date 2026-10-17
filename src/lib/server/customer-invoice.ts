import "server-only";

import { sqlOne, transaction, type Query } from "@/lib/db/client";
import { getProductDetail } from "@/lib/store/products";
import { parseLineId } from "@/lib/shopify/variants";
import {
  GST_STATE_CODES,
  SUPPLIER,
  TAX_CODES,
  computeInvoice,
  financialYear,
  formatInvoiceNumber,
  goodsTax,
  rupeesInWords,
  type CustomerInvoiceSnapshot,
  type InvoiceInputLine,
} from "@/lib/invoice/gst";
import { newId } from "./security";

/**
 * CUSTOMER TAX INVOICES (Riderzpro's own sales)
 *
 * One invoice per order, for what Riderzpro itself supplies: its own products, their installation and
 * the delivery charge. Marketplace items are sold and invoiced by their sellers (seller portal), so they
 * are listed on this invoice for reference only, outside its totals. An order with only seller items
 * and free delivery gets no Riderzpro invoice.
 *
 * Numbers run RZP/<financial year>/<5 digits>, from 00001 each April (India time). The next number is
 * taken from invoice_series inside the same transaction that writes the invoice, holding the order's
 * row lock: the series row stays locked until commit, so two invoices never share a number, and a
 * rollback gives the number back (no gaps).
 */

type OrderRow = {
  id: string;
  number: string;
  status: string;
  customer_name: string;
  customer_phone: string;
  customer_email: string | null;
  address: string;
  city: string;
  state: string;
  pincode: string;
  shipping: number;
  total: number;
  created_at: Date;
};

type ItemRow = {
  vendor_order_id: string | null;
  product_kind: "house" | "vendor";
  product_ref: string;
  title: string;
  variant: string | null;
  unit_price: number;
  install_price: number;
  qty: number;
  store_name: string | null;
};

/** Takes the next number of the financial year `at` falls in. Call inside a transaction. */
export async function allocateInvoiceNumber(q: Query, at: Date): Promise<{ fy: string; seq: number; number: string }> {
  const fy = financialYear(at);
  const rows = await q<{ last_no: number }>(
    `INSERT INTO invoice_series (fy, last_no) VALUES ($1, 1)
     ON CONFLICT (fy) DO UPDATE SET last_no = invoice_series.last_no + 1
     RETURNING last_no`,
    [fy],
  );
  const seq = Number(rows[0].last_no);
  return { fy, seq, number: formatInvoiceNumber(fy, seq) };
}

function departmentOf(productRef: string): string | null {
  const slug = parseLineId(productRef)?.slug;
  return (slug && getProductDetail(slug)?.department) || null;
}

function buildSnapshot(o: OrderRow, items: ItemRow[], number: string, issuedAt: Date): CustomerInvoiceSnapshot | null {
  const input: InvoiceInputLine[] = [];
  for (const i of items.filter((i) => i.product_kind === "house" && !i.vendor_order_id)) {
    const tax = goodsTax(departmentOf(i.product_ref));
    input.push({ kind: "goods", title: i.title, variant: i.variant, qty: i.qty, unitPrice: i.unit_price, ...tax });
    if (i.install_price > 0) {
      input.push({ kind: "installation", title: `Installation: ${i.title}`, variant: null, qty: i.qty, unitPrice: i.install_price, ...TAX_CODES.installation });
    }
  }
  if (o.shipping > 0) {
    input.push({ kind: "delivery", title: "Delivery charge", variant: null, qty: 1, unitPrice: o.shipping, ...TAX_CODES.delivery });
  }
  if (input.length === 0) return null;

  const { intraState, lines, totals } = computeInvoice(input, { supplierState: SUPPLIER.state, buyerState: o.state });
  return {
    version: 1,
    number,
    issuedAt: issuedAt.toISOString(),
    order: { number: o.number, placedAt: new Date(o.created_at).toISOString(), total: o.total },
    supplier: { ...SUPPLIER },
    buyer: {
      name: o.customer_name,
      phone: o.customer_phone,
      email: o.customer_email,
      address: o.address,
      city: o.city,
      state: o.state,
      pincode: o.pincode,
    },
    placeOfSupply: { state: o.state, code: GST_STATE_CODES[o.state] ?? null },
    intraState,
    lines,
    totals,
    amountInWords: rupeesInWords(totals.amount),
    sellerItems: items
      .filter((i) => i.vendor_order_id)
      .map((i) => ({ title: i.title, variant: i.variant, qty: i.qty, amount: i.unit_price * i.qty, seller: i.store_name ?? "Riderzpro seller" })),
  };
}

export type IssuedInvoice = { number: string; issuedAt: string; snapshot: CustomerInvoiceSnapshot };

const toIssued = (r: { number: string; issued_at: Date; snapshot: CustomerInvoiceSnapshot }): IssuedInvoice => ({
  number: r.number,
  issuedAt: new Date(r.issued_at).toISOString(),
  snapshot: r.snapshot,
});

/**
 * Issues the order's invoice, once. A repeat call answers the invoice already issued. Answers null
 * for an unknown or cancelled order, or one with nothing Riderzpro invoices. Call when the order is
 * confirmed or paid. `opts.at` is for tests only (the issue time decides the financial year).
 */
export async function issueCustomerInvoice(orderId: string, opts: { at?: Date } = {}): Promise<IssuedInvoice | null> {
  return transaction(async (q) => {
    // The order's row lock serialises two issues of the same order.
    const o = (
      await q<OrderRow>(
        `SELECT id, number, status, customer_name, customer_phone, customer_email, address, city, state, pincode,
                shipping, total, created_at
           FROM orders WHERE id = $1 FOR UPDATE`,
        [orderId],
      )
    )[0];
    if (!o) return null;
    const existing = (
      await q<{ number: string; issued_at: Date; snapshot: CustomerInvoiceSnapshot }>(
        "SELECT number, issued_at, snapshot FROM customer_invoices WHERE order_id = $1",
        [orderId],
      )
    )[0];
    if (existing) return toIssued(existing);
    if (o.status === "cancelled") return null;

    const items = await q<ItemRow>(
      `SELECT i.vendor_order_id, i.product_kind, i.product_ref, i.title, i.variant, i.unit_price, i.install_price, i.qty,
              v.store_name
         FROM order_items i
         LEFT JOIN vendor_orders vo ON vo.id = i.vendor_order_id
         LEFT JOIN vendors v ON v.id = vo.vendor_id
        WHERE i.order_id = $1 ORDER BY i.id`,
      [orderId],
    );
    const at = opts.at ?? new Date();
    // Check there is something to invoice before taking a number.
    if (!buildSnapshot(o, items, "", at)) return null;
    const { fy, seq, number } = await allocateInvoiceNumber(q, at);
    const snapshot = buildSnapshot(o, items, number, at)!;
    await q(
      `INSERT INTO customer_invoices (id, order_id, number, fy, seq, issued_at, total, snapshot)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [newId("inv"), orderId, number, fy, seq, at.toISOString(), snapshot.totals.amount, JSON.stringify(snapshot)],
    );
    return { number, issuedAt: at.toISOString(), snapshot };
  });
}

/** Statuses at which an invoice is due (it is issued on first view if the hook has not run yet). */
const INVOICEABLE = new Set(["confirmed", "completed"]);

type Found = { state: "issued"; invoice: IssuedInvoice } | { state: "pending" | "none"; orderNumber: string };

async function findFor(o: { id: string; number: string; status: string } | null): Promise<Found | null> {
  if (!o) return null;
  const row = await sqlOne<{ number: string; issued_at: Date; snapshot: CustomerInvoiceSnapshot }>(
    "SELECT number, issued_at, snapshot FROM customer_invoices WHERE order_id = $1",
    [o.id],
  );
  if (row) return { state: "issued", invoice: toIssued(row) };
  if (INVOICEABLE.has(o.status)) {
    const issued = await issueCustomerInvoice(o.id);
    return issued ? { state: "issued", invoice: issued } : { state: "none", orderNumber: o.number };
  }
  return { state: o.status === "cancelled" ? "none" : "pending", orderNumber: o.number };
}

/** The invoice of one of the customer's own orders (by order number). Another customer's order answers null. */
export async function customerInvoiceFor(customerId: string, orderNumber: string): Promise<Found | null> {
  return findFor(
    await sqlOne<{ id: string; number: string; status: string }>(
      "SELECT id, number, status FROM orders WHERE number = $1 AND customer_id = $2",
      [orderNumber, customerId],
    ),
  );
}

/** For the admin area (by order id). */
export async function adminInvoiceFor(orderId: string): Promise<Found | null> {
  return findFor(await sqlOne<{ id: string; number: string; status: string }>("SELECT id, number, status FROM orders WHERE id = $1", [orderId]));
}
