import "server-only";

import { sql } from "@/lib/db/client";
import { DEPARTMENT_BY_SLUG, type DepartmentSlug } from "@/lib/data/taxonomy";
import { BRANDS, findModelBySlug } from "@/lib/data/vehicles";
import { PART_TYPE_LABELS, type VendorSelf } from "@/lib/vendor/types";
import type { ScreenFitBrand, ScreenProduct, ScreenStore } from "@/components/vendor/store-screen/types";
import type { VendorProductRow } from "./vendor-products";

/**
 * THE OFFLINE STORE SCREEN
 *
 * What a seller shows customers in their own shop, on a signed-in tablet or TV:
 * their admin-approved (`live`) products that have stock. Seller products are not
 * on the main Riderzpro website; this screen is the only place they appear.
 *
 * Public product fields only: no SKU, HSN, review notes, dealer prices or vendor data.
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

const offFraction = (p: { mrp: number; price: number }) => (p.mrp > p.price ? (p.mrp - p.price) / p.mrp : 0);

/** Live, in-stock products of one approved seller, most showable first (has photos, then biggest saving). */
export async function screenProducts(vendorId: string): Promise<ScreenProduct[]> {
  const rows = await sql<VendorProductRow>(
    `SELECT p.* FROM vendor_products p JOIN vendors v ON v.id = p.vendor_id
      WHERE p.vendor_id = $1 AND p.status = 'live' AND v.status = 'approved' AND p.stock > 0
      ORDER BY p.department, p.group_slug, p.title
      LIMIT 1000`,
    [vendorId],
  );
  const products = rows.map((r): ScreenProduct => {
    const fitment = r.fitment ?? [];
    const fitSlugs = fitment.filter((s) => s !== "universal");
    return {
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
      universal: fitment.includes("universal"),
      fitSlugs,
      fitLabels: fitSlugs.map((s) => {
        const m = findModelBySlug(s);
        return m ? `${m.brand} ${m.name}` : s;
      }),
      warrantyMonths: r.warranty_months,
      summary: r.summary,
      highlights: r.highlights ?? [],
      specs: r.specs ?? [],
      images: r.images ?? [],
    };
  });
  const score = (p: ScreenProduct) =>
    (p.images.length > 0 ? 1000 : 0) + Math.round(offFraction(p) * 100) * 10 + Math.min(p.images.length, 5);
  return products.sort((a, b) => score(b) - score(a) || a.title.localeCompare(b.title));
}

/**
 * The "Find for my car" data: every brand and model of the vehicle catalogue (plain names and
 * slugs), with how many of this seller's products are listed for each. Brands with matches first.
 */
export function screenFitment(products: ScreenProduct[]): ScreenFitBrand[] {
  const count = new Map<string, number>();
  for (const p of products) for (const s of p.fitSlugs) count.set(s, (count.get(s) ?? 0) + 1);
  return BRANDS.map((b) => {
    const models = b.models
      .map((m) => ({ slug: m.slug, name: m.name, n: count.get(m.slug) ?? 0 }))
      .sort((x, y) => y.n - x.n || x.name.localeCompare(y.name));
    return { slug: b.slug, name: b.name, n: models.reduce((t, m) => t + m.n, 0), models };
  }).sort((x, y) => Number(y.n > 0) - Number(x.n > 0) || x.name.localeCompare(y.name));
}
