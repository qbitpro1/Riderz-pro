import "server-only";

import { z } from "zod";
import { sql, type Query } from "@/lib/db/client";
import { BRANDS, LIVE_BRANDS, itemFits, tierFor, type BrandSlug, type CatalogItem } from "@/lib/catalog";
import { CATEGORIES } from "@/lib/data/products";
import type { ProductDetail } from "@/lib/store/types";
import { ApiError } from "./http";
import { audit } from "./vendors";

/**
 * THE PRODUCT CATALOGUE (database)
 *
 * Every product the site sells (Riderzpro's own range, RECOIL, Autoform, Blaupunkt) is a row in
 * catalog_products. Pages, search, checkout, invoices and the assistant all read it through this
 * module. The brand price lists in the repo are only the import source: any product in them that
 * is not in the database yet is added (on start-up and on the first read); rows already there are
 * never overwritten, so the admin's price, MRP, stock and live/hidden choices stay.
 *
 * Reads go through a snapshot held in memory (the catalogue is read on almost every page). It is
 * rebuilt when the database says something changed (checked at most once a second), so an edit
 * shows everywhere, on every server, within a second.
 *
 *   stock NULL  not counted: made to order, or the supplier's stock (the price list's availability)
 *   stock n     units on hand: orders take them, cancellations put them back; 0 shows "Out of stock"
 *   hidden      off the shop, search and product pages, and can't be ordered
 */

type Row = {
  slug: string;
  item_id: string | null;
  brand: string;
  status: "live" | "hidden";
  item: CatalogItem | null;
  detail: ProductDetail;
  price: number | null;
  mrp: number | null;
  stock: number | null;
  sort: number;
  updated_at: Date;
  updated_by: string | null;
};

export type CatalogSnapshot = {
  /** Live products that are listed in the shop, in catalogue order. */
  items: CatalogItem[];
  byBrand: Record<BrandSlug, CatalogItem[]>;
  /** Product pages: every live product, listed or not (a held-back RECOIL row keeps a page). */
  details: Map<string, ProductDetail>;
  totals: { products: number; brands: number; categories: number; subcategories: number };
  /** Shelf groups that hold at least one product, by department (the menus hide empty groups). */
  liveGroups: Record<string, string[]>;
};

/** How often (at most) the snapshot asks the database whether anything changed. */
const CHECK_MS = 1_000;

// Next.js can load this module more than once in one server (pages and API routes are bundled apart),
// so the snapshot lives on globalThis. Other processes and server instances notice a change through
// the version stamp (the latest product or review change), checked at most once a second.
type Cached = { version: string; checkedAt: number; snap: Promise<CatalogSnapshot> };
type Shared = { cached: Cached | null; importedOnce: boolean };
const shared: Shared = ((globalThis as { __riderzproCatalog?: Shared }).__riderzproCatalog ??= { cached: null, importedOnce: false });

/** Changes whenever a product row or a review decision changes. */
async function catalogVersion(): Promise<string> {
  const r = await sql<{ v: string }>(
    `SELECT concat((SELECT max(updated_at) FROM catalog_products), '|', (SELECT count(*) FROM catalog_products), '|',
                   (SELECT max(decided_at) FROM reviews)) AS v`,
  );
  return r[0]?.v ?? "";
}

/** Forget the snapshot (after any change to catalog_products or reviews). */
export function invalidateCatalog() {
  shared.cached = null;
}

/* ------------------------------------------------------------- import */

let importing: Promise<number> | null = null;

/** Adds every product from the price lists that isn't in the database yet. Returns how many. */
export function importCatalogFromFiles(): Promise<number> {
  importing ??= (async () => {
    // Loaded only here: the price lists are the import source, not something pages read.
    const { fileProducts } = await import("@/lib/store/file-source");
    const all = fileProducts();
    const have = new Set((await sql<{ slug: string }>("SELECT slug FROM catalog_products")).map((r) => r.slug));
    const fresh = all
      .map((p, sort) => ({ ...p, sort }))
      .filter((p) => !have.has(p.detail.slug))
      .map(({ detail, item, sort }) => ({
        slug: detail.slug,
        item_id: item?.id ?? null,
        brand: detail.brand,
        item,
        detail,
        price: detail.price,
        mrp: detail.mrp,
        // A positive count in the source starts the count; anything else is not counted.
        stock: detail.stock !== null && detail.stock > 0 ? detail.stock : null,
        sort,
      }));
    if (fresh.length === 0) return 0;
    await sql(
      `INSERT INTO catalog_products (slug, item_id, brand, item, detail, price, mrp, stock, sort)
       SELECT slug, item_id, brand, item, detail, price, mrp, stock, sort
         FROM jsonb_to_recordset($1::jsonb)
           AS x(slug text, item_id text, brand text, item jsonb, detail jsonb, price int, mrp int, stock int, sort int)
       ON CONFLICT DO NOTHING`,
      // Some price-list text carries stray NUL characters, which Postgres JSON refuses; they are dropped.
      [JSON.stringify(fresh, (_k, v: unknown) => (typeof v === "string" ? v.replace(/\u0000/g, "") : v))],
    );
    console.info(`[catalog] imported ${fresh.length} product(s) from the price lists`);
    invalidateCatalog();
    return fresh.length;
  })().finally(() => {
    importing = null;
  });
  return importing;
}


/* ------------------------------------------------------------- reading */

/** The database row with the admin's price, MRP and stock and the real review ratings laid over the imported record. */
function present(r: Row, rating: { rating: number; count: number } | undefined): { item: CatalogItem | null; detail: ProductDetail } {
  const soldOut = r.stock === 0;
  const comingSoon = r.detail.availability === "coming-soon";
  const availability = soldOut ? "out-of-stock" : r.detail.availability === "out-of-stock" ? "in-stock" : r.detail.availability;
  const stars = rating ? Math.round(rating.rating * 10) / 10 : null;
  const detail: ProductDetail = {
    ...r.detail,
    price: r.price,
    mrp: r.mrp,
    stock: r.stock,
    availability,
    rating: stars,
    reviews: rating?.count ?? null,
  };
  if (!r.item) return { item: null, detail };
  const item: CatalogItem = {
    ...r.item,
    price: r.price,
    mrp: r.mrp,
    tier: r.price === r.item.price ? r.item.tier : tierFor(r.price),
    availability,
    buyable: r.price !== null && !comingSoon && !soldOut && r.detail.indexable,
    rating: stars,
    reviews: rating?.count ?? null,
    badges: soldOut ? [...r.item.badges.filter((b) => b !== "Made to order"), "Out of stock"] : r.item.badges,
  };
  return { item, detail };
}

async function load(): Promise<CatalogSnapshot> {
  if (!shared.importedOnce) {
    await importCatalogFromFiles();
    shared.importedOnce = true;
  }
  const [rows, ratings] = await Promise.all([
    sql<Row>(
      "SELECT slug, item_id, brand, status, item, detail, price, mrp, stock, sort, updated_at, updated_by FROM catalog_products WHERE status = 'live' ORDER BY sort, slug",
    ),
    sql<{ slug: string; rating: string; n: number }>(
      "SELECT product_slug AS slug, avg(rating) AS rating, count(*)::int AS n FROM reviews WHERE status = 'approved' AND product_slug IS NOT NULL GROUP BY 1",
    ),
  ]);
  const byRating = new Map(ratings.map((r) => [r.slug, { rating: Number(r.rating), count: r.n }]));
  const items: CatalogItem[] = [];
  const details = new Map<string, ProductDetail>();
  for (const r of rows) {
    const p = present(r, byRating.get(r.slug));
    details.set(r.slug, p.detail);
    if (p.item) items.push(p.item);
  }
  const byBrand = Object.fromEntries(BRANDS.map((b) => [b.slug, items.filter((i) => i.brand === b.slug)])) as Record<BrandSlug, CatalogItem[]>;
  const groups = new Map<string, Set<string>>();
  for (const i of items) {
    if (!groups.has(i.category)) groups.set(i.category, new Set());
    groups.get(i.category)!.add(i.group);
  }
  return {
    items,
    byBrand,
    details,
    totals: { products: items.length, brands: LIVE_BRANDS.length, categories: CATEGORIES.length, subcategories: new Set(items.map((i) => i.sub)).size },
    liveGroups: Object.fromEntries([...groups].map(([d, g]) => [d, [...g]])),
  };
}

export async function catalogSnapshot(): Promise<CatalogSnapshot> {
  const now = Date.now();
  const c = shared.cached;
  if (c && now - c.checkedAt < CHECK_MS) return c.snap;
  const version = await catalogVersion();
  if (shared.cached && shared.cached.version === version) {
    shared.cached.checkedAt = now;
    return shared.cached.snap;
  }
  const snap = load();
  shared.cached = { version, checkedAt: now, snap };
  snap.catch(() => {
    if (shared.cached?.snap === snap) shared.cached = null;
  });
  return snap;
}

export const getCatalog = async () => (await catalogSnapshot()).items;
export const catalogFor = async (brand: BrandSlug) => (await catalogSnapshot()).byBrand[brand] ?? [];
export const catalogTotals = async () => (await catalogSnapshot()).totals;
export const liveGroups = async () => (await catalogSnapshot()).liveGroups;
export const itemsForModel = async (modelSlug: string) => (await getCatalog()).filter((i) => itemFits(i, modelSlug));
export const getProductDetail = async (slug: string) => (await catalogSnapshot()).details.get(slug);
export const productDetails = async () => [...(await catalogSnapshot()).details.values()];

/** Same department+group first, then the rest of the department; never itself, never coming-soon. */
export async function relatedProducts(slug: string, limit = 8): Promise<CatalogItem[]> {
  const snap = await catalogSnapshot();
  const detail = snap.details.get(slug);
  if (!detail) return [];
  const pool = snap.items.filter((i) => i.slug !== slug && i.availability !== "coming-soon" && i.category === detail.department);
  return [...pool.filter((i) => i.group === detail.group), ...pool.filter((i) => i.group !== detail.group)].slice(0, limit);
}

/* ------------------------------------------------------------- stock (inside the order's transaction) */

/** The product slug of a house cart line id ("slug?rows=3" → "slug"). */
export const lineSlug = (ref: string) => ref.split("?")[0];

/**
 * Takes counted stock for the house lines of an order, inside its transaction. Lines whose product
 * is not counted pass. A line the shop can't cover throws 409 and the whole order rolls back.
 */
export async function takeHouseStock(q: Query, lines: { ref: string; title: string; qty: number }[]): Promise<void> {
  const want = new Map<string, { qty: number; title: string }>();
  for (const l of lines) {
    const slug = lineSlug(l.ref);
    const w = want.get(slug) ?? { qty: 0, title: l.title };
    w.qty += l.qty;
    want.set(slug, w);
  }
  // Fixed order avoids deadlocks between two orders.
  for (const [slug, w] of [...want].sort(([a], [b]) => (a < b ? -1 : 1))) {
    const row = (await q<{ stock: number | null }>("SELECT stock FROM catalog_products WHERE slug = $1 FOR UPDATE", [slug]))[0];
    if (!row || row.stock === null) continue;
    if (row.stock < w.qty) throw new ApiError(409, "sold_out", row.stock === 0 ? `${w.title} just sold out.` : `Only ${row.stock} of ${w.title} left.`);
    await q("UPDATE catalog_products SET stock = stock - $2, updated_at = now() WHERE slug = $1", [slug, w.qty]);
  }
}

/** Puts an order's counted house stock back (the order was cancelled). Call once per cancellation. */
export async function restoreHouseStock(q: Query, orderId: string): Promise<void> {
  await q(
    `UPDATE catalog_products c SET stock = c.stock + s.qty, updated_at = now()
       FROM (SELECT split_part(product_ref, '?', 1) AS slug, sum(qty)::int AS qty
               FROM order_items WHERE order_id = $1 AND product_kind = 'house' GROUP BY 1) s
      WHERE c.slug = s.slug AND c.stock IS NOT NULL`,
    [orderId],
  );
}

/* ------------------------------------------------------------- admin */

export type AdminCatalogRow = {
  slug: string;
  brand: string;
  title: string;
  code: string | null;
  department: string;
  status: "live" | "hidden";
  listed: boolean;
  price: number | null;
  mrp: number | null;
  stock: number | null;
  image: string | null;
  updatedAt: string;
  updatedBy: string | null;
};

const ADMIN_PAGE = 50;

/** Products for /admin/products: search by title, code or slug; filter by brand and stock. */
export async function listCatalogAdmin(opts: { q?: string; brand?: string; filter?: string; page?: number }): Promise<{ rows: AdminCatalogRow[]; total: number; counts: Record<string, number> }> {
  if (!shared.importedOnce) {
    await importCatalogFromFiles();
    shared.importedOnce = true;
  }
  const term = opts.q?.trim().toLowerCase().slice(0, 80) || null;
  const where = `($1::text IS NULL OR lower(detail->>'title') LIKE '%' || $1 || '%' OR lower(COALESCE(detail->>'code','')) LIKE '%' || $1 || '%' OR slug LIKE '%' || $1 || '%')
     AND ($2::text IS NULL OR brand = $2)
     AND (CASE $3::text WHEN 'hidden' THEN status = 'hidden' WHEN 'counted' THEN stock IS NOT NULL WHEN 'out' THEN stock = 0
                        WHEN 'low' THEN stock IS NOT NULL AND stock <= 3 WHEN 'noprice' THEN price IS NULL ELSE true END)`;
  const params = [term, opts.brand || null, opts.filter || null];
  const page = Math.max(0, (opts.page ?? 1) - 1);
  const [rows, total, counts] = await Promise.all([
    sql<Row>(`SELECT slug, item_id, brand, status, item, detail, price, mrp, stock, sort, updated_at, updated_by FROM catalog_products WHERE ${where} ORDER BY sort, slug LIMIT ${ADMIN_PAGE} OFFSET ${page * ADMIN_PAGE}`, params),
    sql<{ n: number }>(`SELECT count(*)::int AS n FROM catalog_products WHERE ${where}`, params),
    sql<{ k: string; n: number }>(
      `SELECT 'all' AS k, count(*)::int AS n FROM catalog_products
       UNION ALL SELECT 'hidden', count(*)::int FROM catalog_products WHERE status = 'hidden'
       UNION ALL SELECT 'counted', count(*)::int FROM catalog_products WHERE stock IS NOT NULL
       UNION ALL SELECT 'out', count(*)::int FROM catalog_products WHERE stock = 0
       UNION ALL SELECT 'low', count(*)::int FROM catalog_products WHERE stock IS NOT NULL AND stock <= 3
       UNION ALL SELECT 'noprice', count(*)::int FROM catalog_products WHERE price IS NULL`,
    ),
  ]);
  return {
    rows: rows.map((r) => {
      const img = r.detail.images[0];
      return {
        slug: r.slug,
        brand: r.brand,
        title: r.detail.title,
        code: r.detail.code,
        department: r.detail.department,
        status: r.status,
        listed: r.item !== null,
        price: r.price,
        mrp: r.mrp,
        stock: r.stock,
        image: img?.kind === "remote" ? img.src : null,
        updatedAt: new Date(r.updated_at).toISOString(),
        updatedBy: r.updated_by,
      };
    }),
    total: total[0]?.n ?? 0,
    counts: Object.fromEntries(counts.map((c) => [c.k, c.n])),
  };
}

const money = z.number().int().min(0).max(10_000_000).nullable();
export const catalogEditSchema = z
  .object({
    price: money,
    mrp: money,
    stock: z.number().int().min(0).max(1_000_000).nullable(),
    status: z.enum(["live", "hidden"]),
  })
  .refine((v) => v.price === null || v.mrp === null || v.price <= v.mrp, { path: ["price"], message: "The price can't be above the MRP" });

/** The admin changes a product's price, MRP, stock count or live/hidden. */
export async function updateCatalogProduct(slug: string, input: z.infer<typeof catalogEditSchema>, actor: string, ip: string): Promise<void> {
  const before = (await sql<{ price: number | null; mrp: number | null; stock: number | null; status: string }>(
    "SELECT price, mrp, stock, status FROM catalog_products WHERE slug = $1",
    [slug],
  ))[0];
  if (!before) throw new ApiError(404, "not_found", "Product not found.");
  await sql("UPDATE catalog_products SET price = $2, mrp = $3, stock = $4, status = $5, updated_at = now(), updated_by = $6 WHERE slug = $1", [
    slug,
    input.price,
    input.mrp,
    input.stock,
    input.status,
    actor,
  ]);
  await audit({ type: "admin", id: actor }, "catalog.update", { ip, detail: { slug, before, after: input } });
  invalidateCatalog();
}

/** Department of each product slug, hidden ones too (an old order's invoice still needs its tax class). */
export async function departmentsFor(slugs: string[], q: Query = sql): Promise<Map<string, string>> {
  if (slugs.length === 0) return new Map();
  const rows = await q<{ slug: string; department: string }>(
    "SELECT slug, detail->>'department' AS department FROM catalog_products WHERE slug = ANY($1::text[])",
    [[...new Set(slugs)]],
  );
  return new Map(rows.map((r) => [r.slug, r.department]));
}
