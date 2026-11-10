import type { Metadata } from "next";
import Link from "next/link";
import { adminPage } from "@/lib/server/admin-auth";
import { listCatalogAdmin } from "@/lib/server/catalog";
import { BRANDS } from "@/lib/catalog/brands";
import { ProductRow } from "@/components/admin/products/ProductRow";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Products", robots: { index: false, follow: false, nocache: true } };

const FILTERS = [
  ["", "All", "all"],
  ["counted", "Stock counted", "counted"],
  ["low", "Low (3 or fewer)", "low"],
  ["out", "Out of stock", "out"],
  ["noprice", "No price", "noprice"],
  ["hidden", "Hidden", "hidden"],
] as const;

export default async function AdminProductsPage({ searchParams }: { searchParams: Promise<{ q?: string; brand?: string; filter?: string; page?: string }> }) {
  await adminPage("catalog", "/admin/products");
  const sp = await searchParams;
  const page = Math.max(1, Number(sp.page) || 1);
  const { rows, total, counts } = await listCatalogAdmin({ q: sp.q, brand: sp.brand, filter: sp.filter, page });
  const pages = Math.max(1, Math.ceil(total / 50));
  const link = (extra: Record<string, string | undefined>) => {
    const p = new URLSearchParams();
    for (const [k, v] of Object.entries({ q: sp.q, brand: sp.brand, filter: sp.filter, ...extra })) if (v) p.set(k, v);
    return `/admin/products?${p}`;
  };

  return (
    <section className="section pt-24 md:pt-32">
      <div className="shell">
        <Link href="/admin" className="text-xs text-ash underline underline-offset-4 hover:text-accent">Admin</Link>
        <p className="eyebrow mb-3 mt-4">Internal · not indexed</p>
        <h1 className="display-2">PRODUCTS</h1>
        <p className="mt-3 max-w-3xl text-sm text-ash">
          Riderzpro&apos;s catalogue as stored in the database. Changes show on the site straight away. Stock left empty is not counted
          (made to order or the supplier&apos;s stock); a number goes down with each order and back up when an order is cancelled, and 0
          shows &quot;Out of stock&quot;. Hidden products leave the shop, search and their page. Marketplace sellers&apos; products are
          reviewed under <Link href="/admin/vendor-products" className="text-accent underline underline-offset-4">Seller products</Link>.
        </p>

        <form method="get" className="mt-6 flex flex-wrap items-end gap-3">
          <div>
            <label className="label" htmlFor="p-q">Search</label>
            <input id="p-q" name="q" className="field" defaultValue={sp.q ?? ""} placeholder="Title, code or slug" />
          </div>
          <div>
            <label className="label" htmlFor="p-brand">Brand</label>
            <select id="p-brand" name="brand" className="field" defaultValue={sp.brand ?? ""}>
              <option value="">All brands</option>
              {BRANDS.map((b) => <option key={b.slug} value={b.slug}>{b.name}</option>)}
            </select>
          </div>
          {sp.filter && <input type="hidden" name="filter" value={sp.filter} />}
          <button type="submit" className="btn btn-outline btn-sm">Show</button>
        </form>
        <p className="mt-3 flex flex-wrap gap-3 text-xs">
          {FILTERS.map(([value, label, key]) => (
            <Link key={key} href={link({ filter: value || undefined, page: undefined })} className={(sp.filter ?? "") === value ? "font-bold text-chalk" : "text-accent underline underline-offset-4"}>
              {label} ({counts[key] ?? 0})
            </Link>
          ))}
        </p>

        <div className="card mt-6 overflow-x-auto p-0">
          <table className="w-full min-w-[52rem] text-left text-xs">
            <thead className="border-b border-tint/10 text-[11px] uppercase tracking-[0.08em] text-dim">
              <tr>
                <th className="px-4 py-3 font-bold">Product</th>
                <th className="px-2 py-3 text-right font-bold">Price</th>
                <th className="px-2 py-3 text-right font-bold">MRP</th>
                <th className="px-2 py-3 text-right font-bold">Stock</th>
                <th className="px-2 py-3 font-bold">Shown</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-tint/10">
              {rows.map((p) => <ProductRow key={p.slug} p={p} />)}
            </tbody>
          </table>
          {rows.length === 0 && <p className="p-5 text-sm text-ash">No products match.</p>}
        </div>
        <p className="mt-4 flex items-center gap-4 text-xs text-ash">
          {total} product{total === 1 ? "" : "s"} · page {page} of {pages}
          {page > 1 && <Link href={link({ page: String(page - 1) })} className="text-accent underline underline-offset-4">Previous</Link>}
          {page < pages && <Link href={link({ page: String(page + 1) })} className="text-accent underline underline-offset-4">Next</Link>}
        </p>
      </div>
    </section>
  );
}
