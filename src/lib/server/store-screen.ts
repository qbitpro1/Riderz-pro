import "server-only";

import { sql } from "@/lib/db/client";
import { DEPARTMENT_BY_SLUG, type DepartmentSlug } from "@/lib/data/taxonomy";
import { PART_TYPE_LABELS, type VendorSelf } from "@/lib/vendor/types";
import type { ScreenProduct, ScreenStore } from "@/components/vendor/store-screen/types";
import type { VendorProductRow } from "./vendor-products";

/**
 * THE OFFLINE STORE SCREEN
 *
 * What a seller shows customers in their own shop, on a signed-in tablet or TV:
 * their admin-approved (`live`) products that have stock. Seller products are not
 * on the main Riderzpro website; this screen is the only place they appear.
 */

function groupName(department: DepartmentSlug, group: string): string {
  return DEPARTMENT_BY_SLUG[department]?.groups.find((g) => g.slug === group)?.name ?? group;
}

export function screenStore(vendor: VendorSelf): ScreenStore {
  const store = vendor.onboarding.store;
  return {
    name: vendor.storeName ?? "Our store",
    slug: vendor.slug ?? "",
    logo: store?.logoFileId ?? null,
    city: vendor.onboarding.shipping?.pickup.city ?? null,
  };
}

/** Live, in-stock products of one approved seller, grouped by category then title. */
export async function screenProducts(vendorId: string): Promise<ScreenProduct[]> {
  const rows = await sql<VendorProductRow>(
    `SELECT p.* FROM vendor_products p JOIN vendors v ON v.id = p.vendor_id
      WHERE p.vendor_id = $1 AND p.status = 'live' AND v.status = 'approved' AND p.stock > 0
      ORDER BY p.department, p.group_slug, p.title
      LIMIT 1000`,
    [vendorId],
  );
  return rows.map((r) => ({
    id: r.id,
    title: r.title,
    brand: r.brand,
    department: r.department,
    group: r.group_slug,
    groupName: groupName(r.department, r.group_slug),
    mrp: r.mrp,
    price: r.price,
    stock: r.stock,
    partType: PART_TYPE_LABELS[r.part_type] ?? r.part_type,
    fitment: r.fitment ?? [],
    warrantyMonths: r.warranty_months,
    summary: r.summary,
    highlights: r.highlights ?? [],
    specs: r.specs ?? [],
    images: r.images ?? [],
  }));
}
