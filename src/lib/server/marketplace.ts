import "server-only";

import { DatabaseNotConfigured, sql } from "@/lib/db/client";
import { slugify } from "@/lib/format";
import { DEPARTMENT_BY_SLUG, type DepartmentSlug } from "@/lib/data/taxonomy";
import { tierFor, type MarketplaceBrandKey, type ShopItem } from "@/lib/catalog/types";
import {
  fileHref,
  storeHref,
  vendorProductHref,
  type PartType,
  type SellerType,
  type VendorOnboarding,
} from "@/lib/vendor/types";
import { LIVE_PRODUCT_WHERE, type VendorProductRow } from "./vendor-products";

/**
 * THE MARKETPLACE READ SIDE
 *
 * What shoppers see of approved sellers: live products projected into the shop's
 * `CatalogItem` shape, vendor product pages and public storefronts. Every product
 * query goes through `LIVE_PRODUCT_WHERE`. Every function degrades to empty/null
 * when there is no database, so the house shop keeps working without one.
 *
 * Only public fields leave this file. Never email, mobile, legal or tax ids,
 * bank details or address lines.
 */

/* ------------------------------------------------------------------ types */

export type SellerRef = { id: string; name: string; slug: string };

export type PublicStore = {
  id: string;
  name: string;
  slug: string;
  description: string;
  logo: string | null;
  banner: string | null;
  departments: DepartmentSlug[];
  brands: string[];
  sellerType: SellerType | null;
  pickupCity: string | null;
  pickupState: string | null;
  handlingDays: number | null;
  shipsTo: "pan_india" | "own_state" | null;
  acceptsReturns: boolean | null;
  returnWindowDays: number | null;
  gstRegistered: boolean;
  /** ISO date the store was approved. */
  approvedAt: string | null;
};

export type PublicVendorProduct = {
  id: string;
  slug: string;
  title: string;
  brand: string;
  department: DepartmentSlug;
  groupSlug: string;
  groupName: string;
  partType: PartType;
  sku: string;
  mrp: number;
  price: number;
  stock: number;
  warrantyMonths: number | null;
  summary: string | null;
  highlights: string[];
  specs: { label: string; value: string }[];
  fitment: string[];
  /** Image file ids (use `fileHref`). */
  images: string[];
  approvedAt: string | null;
  updatedAt: string;
};

export type LiveVendorProductPage = { product: PublicVendorProduct; seller: PublicStore };

/* --------------------------------------------------------------- plumbing */

/** Runs a read; a missing or unreachable database means "no marketplace", never an error page. */
async function safely<T>(fallback: T, run: () => Promise<T>): Promise<T> {
  try {
    return await run();
  } catch (err) {
    if (!(err instanceof DatabaseNotConfigured)) {
      console.error("[marketplace] read failed:", err instanceof Error ? err.message : "unknown error");
    }
    return fallback;
  }
}

type JoinedRow = VendorProductRow & {
  v_id: string;
  v_store_name: string | null;
  v_slug: string | null;
  v_approved_at: Date | null;
  v_onboarding: VendorOnboarding | null;
};

const JOINED_COLUMNS = `p.*, v.id AS v_id, v.store_name AS v_store_name, v.slug AS v_slug,
  v.approved_at AS v_approved_at, v.onboarding AS v_onboarding`;

const iso = (d: Date | string | null) => (d ? new Date(d).toISOString() : null);

function groupName(department: DepartmentSlug, group: string): string {
  return DEPARTMENT_BY_SLUG[department]?.groups.find((g) => g.slug === group)?.name ?? group;
}

function toPublicStore(r: {
  id: string;
  store_name: string | null;
  slug: string | null;
  approved_at: Date | null;
  onboarding: VendorOnboarding | null;
}): PublicStore | null {
  if (!r.slug || !r.store_name) return null;
  const o = r.onboarding ?? {};
  const store = o.store;
  const ship = o.shipping;
  return {
    id: r.id,
    name: r.store_name,
    slug: r.slug,
    description: store?.description ?? "",
    logo: store?.logoFileId ?? null,
    banner: store?.bannerFileId ?? null,
    departments: store?.departments ?? [],
    brands: (store?.brands ?? []).map((b) => b.name),
    sellerType: store?.sellerType ?? null,
    pickupCity: ship?.pickup.city ?? null,
    pickupState: ship?.pickup.state ?? null,
    handlingDays: ship?.handlingDays ?? null,
    shipsTo: ship?.shipsTo ?? null,
    acceptsReturns: ship ? ship.acceptsReturns : null,
    returnWindowDays: ship?.acceptsReturns ? ship.returnWindowDays : null,
    gstRegistered: Boolean(o.tax && !o.tax.gstExempt && o.tax.gstin),
    approvedAt: iso(r.approved_at),
  };
}

function toPublicProduct(r: VendorProductRow): PublicVendorProduct {
  return {
    id: r.id,
    slug: r.slug,
    title: r.title,
    brand: r.brand,
    department: r.department,
    groupSlug: r.group_slug,
    groupName: groupName(r.department, r.group_slug),
    partType: r.part_type,
    sku: r.sku,
    mrp: r.mrp,
    price: r.price,
    stock: r.stock,
    warrantyMonths: r.warranty_months,
    summary: r.summary,
    highlights: r.highlights ?? [],
    specs: r.specs ?? [],
    fitment: r.fitment ?? [],
    images: r.images ?? [],
    approvedAt: iso(r.approved_at),
    updatedAt: iso(r.updated_at)!,
  };
}

/** The shop item for one live product. `buyable` means "has stock"; out-of-stock items stay listed. */
function toShopItem(r: JoinedRow): ShopItem | null {
  if (!r.v_slug || !r.v_store_name) return null;
  const inStock = r.stock > 0;
  const href = vendorProductHref(r.v_slug, r.slug);
  const sub = groupName(r.department, r.group_slug);
  const first = r.images?.[0];
  const brandKey = `mp-${slugify(r.brand).slice(0, 60) || "brand"}` as MarketplaceBrandKey;
  return {
    id: `mp:${r.slug}`,
    // A seller's own brand text is not in the house registry; it is keyed `mp-…`. See `ShopItem`.
    brand: brandKey,
    brandName: r.brand,
    slug: r.slug,
    href,
    hasOptions: false,
    title: r.title,
    code: r.sku,
    category: r.department,
    group: r.group_slug,
    oe: r.part_type === "oem",
    sub,
    price: r.price,
    mrp: r.mrp > r.price ? r.mrp : null,
    priceFrom: false,
    tier: tierFor(r.price),
    image: first
      ? { kind: "remote", src: fileHref(first), alt: r.title, fit: "contain", tone: "light" }
      : { kind: "none" },
    rating: null,
    reviews: null,
    fitment: r.fitment ?? [],
    availability: inStock ? "in-stock" : "out-of-stock",
    buyable: inStock,
    installation: false,
    bestseller: false,
    badges: ["Marketplace"],
    keywords: `${r.brand} ${r.v_store_name} ${r.sku} ${sub} ${r.summary ?? ""}`.toLowerCase(),
    seller: { id: r.v_id, name: r.v_store_name, slug: r.v_slug },
  };
}

/* ---------------------------------------------------------------- queries */

/**
 * Every live product of every approved seller, as shop items.
 * Newest approvals first (the shop's "popular" sort keeps this order after the house items).
 */
export async function liveVendorItems(opts: { department?: DepartmentSlug; vendorId?: string } = {}): Promise<ShopItem[]> {
  return safely<ShopItem[]>([], async () => {
    const params: unknown[] = [];
    let where = `${LIVE_PRODUCT_WHERE} AND v.slug IS NOT NULL`;
    if (opts.department) {
      params.push(opts.department);
      where += ` AND p.department = $${params.length}`;
    }
    if (opts.vendorId) {
      params.push(opts.vendorId);
      where += ` AND p.vendor_id = $${params.length}`;
    }
    const rows = await sql<JoinedRow>(
      `SELECT ${JOINED_COLUMNS} FROM vendor_products p JOIN vendors v ON v.id = p.vendor_id
       WHERE ${where} ORDER BY p.approved_at DESC NULLS LAST, p.created_at DESC LIMIT 500`,
      params,
    );
    return rows.map(toShopItem).filter((i): i is NonNullable<typeof i> => i !== null);
  });
}

/** One live product on a seller's page, or null unless the visibility gate passes and the seller matches. */
export async function liveVendorProduct(vendorSlug: string, productSlug: string): Promise<LiveVendorProductPage | null> {
  return safely<LiveVendorProductPage | null>(null, async () => {
    const r = (
      await sql<JoinedRow & { v_status: string }>(
        `SELECT ${JOINED_COLUMNS}, v.status AS v_status FROM vendor_products p JOIN vendors v ON v.id = p.vendor_id
         WHERE ${LIVE_PRODUCT_WHERE} AND v.slug = $1 AND p.slug = $2`,
        [vendorSlug, productSlug],
      )
    )[0];
    if (!r) return null;
    const seller = toPublicStore({
      id: r.v_id,
      store_name: r.v_store_name,
      slug: r.v_slug,
      approved_at: r.v_approved_at,
      onboarding: r.v_onboarding,
    });
    return seller ? { product: toPublicProduct(r), seller } : null;
  });
}

/** A storefront a shopper may see: the seller is approved. Public fields only. */
export async function publicStore(slug: string): Promise<PublicStore | null> {
  return safely<PublicStore | null>(null, async () => {
    const r = (
      await sql<{
        id: string;
        store_name: string | null;
        slug: string | null;
        approved_at: Date | null;
              onboarding: VendorOnboarding | null;
      }>(
        "SELECT id, store_name, slug, approved_at, onboarding FROM vendors WHERE slug = $1 AND status = 'approved'",
        [slug],
      )
    )[0];
    return r ? toPublicStore(r) : null;
  });
}

/** Sitemap feed: storefronts and live product URLs. */
export async function marketplaceUrls(): Promise<{ path: string; lastModified: Date | null }[]> {
  return safely([], async () => {
    const stores = await sql<{ slug: string; approved_at: Date | null }>(
      "SELECT slug, approved_at FROM vendors WHERE status = 'approved' AND slug IS NOT NULL",
    );
    const products = await sql<{ vslug: string; slug: string; updated_at: Date }>(
      `SELECT v.slug AS vslug, p.slug, p.updated_at FROM vendor_products p JOIN vendors v ON v.id = p.vendor_id
       WHERE ${LIVE_PRODUCT_WHERE} AND v.slug IS NOT NULL LIMIT 5000`,
    );
    return [
      ...stores.map((s) => ({ path: storeHref(s.slug), lastModified: s.approved_at })),
      ...products.map((p) => ({ path: vendorProductHref(p.vslug, p.slug), lastModified: p.updated_at })),
    ];
  });
}
