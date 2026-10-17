import type { Metadata } from "next";
import Link from "next/link";
import ProductQueue from "@/components/admin/vendor-products/ProductQueue";
import { listVendorProducts, parseProductState, type ProductState } from "@/lib/server/admin-vendors";
import { adminPage } from "@/lib/server/admin-auth";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Seller product approvals",
  description: "Internal review queue for seller products.",
  robots: { index: false, follow: false, nocache: true },
};

const TABS: { id: ProductState; label: string; count?: "pending" | "revisions" | "live" }[] = [
  { id: "pending", label: "New products", count: "pending" },
  { id: "revisions", label: "Edits to live", count: "revisions" },
  { id: "live", label: "Live", count: "live" },
  { id: "all", label: "All reviewed" },
];

export default async function VendorProductsAdminPage({ searchParams }: { searchParams: Promise<{ state?: string; q?: string }> }) {
  await adminPage("sellers", "/admin/vendor-products");
  const sp = await searchParams;
  const state = parseProductState(sp.state);
  const q = (sp.q ?? "").slice(0, 80);
  const { items, counts } = await listVendorProducts(state, q);

  return (
    <section className="section pt-24 md:pt-32">
      <div className="shell">
        <p className="eyebrow mb-3">Internal · not indexed</p>
        <h1 className="display-2">PRODUCT APPROVALS</h1>
        <p className="mt-4 max-w-2xl text-sm leading-relaxed text-ash">
          New seller products and edits to live ones wait here. Nothing reaches the shop until it is approved.
        </p>

        <nav aria-label="Filter products" className="mt-6 flex flex-wrap gap-2">
          {TABS.map((t) => (
            <Link
              key={t.id}
              href={`/admin/vendor-products?state=${t.id}${q ? `&q=${encodeURIComponent(q)}` : ""}`}
              aria-current={state === t.id ? "page" : undefined}
              className={`chip ${state === t.id ? "chip-active" : ""}`}
            >
              {t.label} {t.count ? <span className="tnum opacity-80">{counts[t.count]}</span> : null}
            </Link>
          ))}
        </nav>

        <form action="/admin/vendor-products" className="mt-4 flex max-w-lg gap-2" role="search">
          <input type="hidden" name="state" value={state} />
          <label className="sr-only" htmlFor="pq">Search products</label>
          <input id="pq" name="q" defaultValue={q} className="field" placeholder="Title, SKU, brand or store" />
          <button className="btn btn-outline btn-sm self-stretch" type="submit">Search</button>
        </form>

        <ProductQueue items={items} canBulk={state === "pending" || state === "revisions"} />
      </div>
    </section>
  );
}
