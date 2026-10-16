import "server-only";

import { sql, type Query } from "@/lib/db/client";
import type { VendorProduct, VendorProductContent } from "@/lib/vendor/types";

/**
 * Vendor product rows → `VendorProduct`, and the one rule for what shoppers see.
 *
 * VISIBILITY GATE — a vendor product is on sale only when ALL hold:
 *   the product is `live`
 *   its vendor is `approved` (not suspended, rejected, or back under review)
 * Use `LIVE_PRODUCT_WHERE` (with the table aliases `p` and `v`) in every
 * customer-facing query, and `isOnSale` when you already have both rows.
 * Out-of-stock products stay visible but cannot be added to the cart.
 */

export type VendorProductRow = {
  id: string;
  vendor_id: string;
  slug: string;
  status: VendorProduct["status"];
  title: string;
  brand: string;
  department: VendorProduct["department"];
  group_slug: string;
  sku: string;
  hsn: string | null;
  gst_rate: VendorProduct["gstRate"];
  mrp: number;
  price: number;
  stock: number;
  low_stock_at: number;
  part_type: VendorProduct["partType"];
  warranty_months: number | null;
  summary: string | null;
  highlights: string[];
  specs: { label: string; value: string }[];
  fitment: string[];
  images: string[];
  pending_revision: VendorProductContent | null;
  review_notes: VendorProduct["reviewNotes"];
  rejection_reason: string | null;
  submitted_at: Date | null;
  approved_at: Date | null;
  approved_by: string | null;
  created_at: Date;
  updated_at: Date;
};

const iso = (d: Date | string | null) => (d ? new Date(d).toISOString() : null);

export function toVendorProduct(r: VendorProductRow): VendorProduct {
  return {
    id: r.id,
    vendorId: r.vendor_id,
    slug: r.slug,
    status: r.status,
    title: r.title,
    brand: r.brand,
    department: r.department,
    groupSlug: r.group_slug,
    sku: r.sku,
    hsn: r.hsn,
    gstRate: r.gst_rate,
    mrp: r.mrp,
    price: r.price,
    stock: r.stock,
    lowStockAt: r.low_stock_at,
    partType: r.part_type,
    warrantyMonths: r.warranty_months,
    summary: r.summary,
    highlights: r.highlights ?? [],
    specs: r.specs ?? [],
    fitment: r.fitment ?? [],
    images: r.images ?? [],
    pendingRevision: r.pending_revision,
    reviewNotes: r.review_notes,
    rejectionReason: r.rejection_reason,
    submittedAt: iso(r.submitted_at),
    approvedAt: iso(r.approved_at),
    createdAt: iso(r.created_at)!,
    updatedAt: iso(r.updated_at)!,
  };
}

/** SQL condition for "on sale to shoppers". Requires aliases p (vendor_products) and v (vendors). */
export const LIVE_PRODUCT_WHERE = "p.status = 'live' AND v.status = 'approved'";

export function isOnSale(product: { status: string }, vendor: { status: string }) {
  return product.status === "live" && vendor.status === "approved";
}

/** A vendor's own product (any status), or null if it is not theirs. */
export async function ownProduct(vendorId: string, productId: string, q: Query = sql): Promise<VendorProductRow | null> {
  return (
    (await q<VendorProductRow>("SELECT * FROM vendor_products WHERE id = $1 AND vendor_id = $2", [productId, vendorId]))[0] ?? null
  );
}
