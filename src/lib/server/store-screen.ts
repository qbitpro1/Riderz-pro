import "server-only";

import { sql } from "@/lib/db/client";
import { DEPARTMENT_BY_SLUG, type DepartmentSlug } from "@/lib/data/taxonomy";
import { BRANDS, findModelBySlug } from "@/lib/data/vehicles";
import { PART_TYPE_LABELS, type VendorSelf } from "@/lib/vendor/types";
import { SCREEN_HOURS_DEFAULT, type ScreenCategory, type ScreenFitBrand, type ScreenProduct, type ScreenStore } from "@/components/vendor/store-screen/types";
import { categoryTree, suggestedCategoryIds } from "@/lib/vendor/store-categories";
import { listStoreCategories } from "./store-categories";
import type { VendorProductRow } from "./vendor-products";

/**
 * THE OFFLINE STORE SCREEN
 *
 * What a seller shows customers in their own shop, on a signed-in tablet or TV.
 * The shop owner controls it: every product they have saved (any status but archived or
 * rejected) that has stock shows straight away, with no Riderzpro review, and edits waiting for
 * review on a live product show in their new form. Seller products are not on the main
 * Riderzpro website; this screen is the only place they appear.
 *
 * Public product fields only: no SKU, HSN, review notes, dealer prices or vendor data.
 */

/** A draft may not have a category yet: it shows under "Other products". */
const NO_GROUP = { slug: "other", name: "Other products" };

function groupName(department: DepartmentSlug, group: string): string {
  if (!group) return NO_GROUP.name;
  return DEPARTMENT_BY_SLUG[department]?.groups.find((g) => g.slug === group)?.name ?? group;
}

/** `settings`: the seller's own address line, hours and today's offer from Offline Store settings, if set. */
export function screenStore(
  vendor: VendorSelf,
  settings: { screenAddress: string | null; screenHours: string | null; screenOffer: string | null } = { screenAddress: null, screenHours: null, screenOffer: null },
): ScreenStore {
  const store = vendor.onboarding.store;
  const pickup = vendor.onboarding.shipping?.pickup;
  const pickupLine = pickup ? [pickup.line1, pickup.line2, pickup.city].map((s) => s?.trim()).filter(Boolean).join(", ") : "";
  return {
    name: vendor.storeName ?? "Our store",
    slug: vendor.slug ?? "",
    logo: store?.logoFileId ?? null,
    city: pickup?.city ?? null,
    address: settings.screenAddress?.trim() || pickupLine || null,
    hours: settings.screenHours?.trim() || SCREEN_HOURS_DEFAULT,
    offer: settings.screenOffer?.trim() || null,
  };
}

function revisionColumns(c: NonNullable<VendorProductRow["pending_revision"]>): Partial<VendorProductRow> {
  return {
    title: c.title,
    brand: c.brand,
    department: c.department,
    group_slug: c.groupSlug,
    part_type: c.partType,
    warranty_months: c.warrantyMonths,
    summary: c.summary,
    highlights: c.highlights,
    specs: c.specs,
    fitment: c.fitment,
    images: c.images,
  };
}

const offFraction = (p: { mrp: number; price: number }) => (p.mrp > p.price ? (p.mrp - p.price) / p.mrp : 0);

/**
 * Which of a seller's products are for sale on their own screen (aliases p = vendor_products,
 * v = vendors). Used for showing, pricing and placing screen orders alike.
 */
// Rejected products are left out too: Riderzpro turned them down, so the screen doesn't show them,
// Salesman AI doesn't offer them, and checkout (store-sales.ts uses this same rule) refuses them.
export const SCREEN_PRODUCT_WHERE = "p.status NOT IN ('archived', 'rejected') AND v.status = 'approved'";

/** The seller's latest wording of a product: an edit waiting for review on a live product, else the row. */
export const SCREEN_TITLE_SQL = "coalesce(p.pending_revision->>'title', p.title)";

/** In-stock products of one approved seller (see SCREEN_PRODUCT_WHERE), most showable first (has photos, then biggest saving). */
export async function screenProducts(vendorId: string): Promise<ScreenProduct[]> {
  // The seller's own shop category, when set, decides where a product shows (top-level + sub-category).
  type Row = VendorProductRow & {
    sc_id: string | null;
    sc_name: string | null;
    sc_pos: number | null;
    top_id: string | null;
    top_name: string | null;
    top_pos: number | null;
    best: boolean | null;
  };
  const rows = await sql<Row>(
    `SELECT p.*, sc.id AS sc_id, sc.name AS sc_name, sc.position AS sc_pos,
            top.id AS top_id, top.name AS top_name, top.position AS top_pos,
            (coalesce(sc.bestseller, false) OR coalesce(top.bestseller, false)) AS best
       FROM vendor_products p JOIN vendors v ON v.id = p.vendor_id
       LEFT JOIN store_categories sc ON sc.id = p.store_category_id
       LEFT JOIN store_categories top ON top.id = coalesce(sc.parent_id, sc.id)
      WHERE p.vendor_id = $1 AND ${SCREEN_PRODUCT_WHERE} AND p.stock > 0
      ORDER BY p.department, p.group_slug, p.title
      LIMIT 1000`,
    [vendorId],
  );
  const products = rows.map((row): ScreenProduct => {
    // The seller's own latest version: an edit of a live product waiting for review shows at once.
    const r = row.status === "live" && row.pending_revision ? { ...row, ...revisionColumns(row.pending_revision) } : row;
    const fitment = r.fitment ?? [];
    const fitSlugs = fitment.filter((s) => s !== "universal");
    const isSub = Boolean(r.sc_id && r.top_id && r.sc_id !== r.top_id);
    return {
      id: r.id,
      title: r.title,
      brand: r.brand,
      department: r.department,
      group: r.top_id ?? (r.group_slug || NO_GROUP.slug),
      groupName: r.top_name ?? groupName(r.department, r.group_slug),
      // Shop categories first, in the seller's order; marketplace groups after them.
      groupPos: r.top_pos ?? 10_000,
      sub: isSub ? r.sc_id : null,
      subName: isSub ? r.sc_name : null,
      subPos: isSub ? (r.sc_pos ?? 0) : 0,
      typeName: groupName(r.department, r.group_slug),
      bestseller: Boolean(row.best),
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

/** The seller's main shop categories with their sub-categories and suggestion pairs, for the screen. */
export async function screenCategories(vendorId: string): Promise<ScreenCategory[]> {
  const tree = categoryTree(await listStoreCategories(vendorId));
  return tree.map((c) => ({
    id: c.id,
    name: c.name,
    pos: c.position,
    bestseller: c.bestseller,
    suggest: suggestedCategoryIds(c, tree),
    subs: c.subs.map((s) => ({ id: s.id, name: s.name, pos: s.position })),
  }));
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
