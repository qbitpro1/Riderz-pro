import type { Metadata } from "next";
import Link from "next/link";
import { Icon } from "@/components/ui/Icon";
import {
  ALL_PRODUCTS,
  CATALOG_SUMMARY,
  type CatalogProduct,
  type VerificationStatus,
} from "@/lib/data/recoil";
import { rupees } from "@/lib/format";

export const metadata: Metadata = {
  title: "Catalogue Import Report",
  description: "Internal data-quality report for the RECOIL catalogue import.",
  robots: { index: false, follow: false, nocache: true },
};

const STATUS: Record<VerificationStatus, { dot: string; label: string; tone: string }> = {
  READY: { dot: "🟢", label: "Ready", tone: "text-accent" },
  NEEDS_REVIEW: { dot: "🟡", label: "Needs review", tone: "text-gold" },
  MISSING_DATA: { dot: "🔴", label: "Missing data", tone: "text-danger" },
  COMING_SOON: { dot: "🔵", label: "Coming soon", tone: "text-ash" },
};

const ORDER: VerificationStatus[] = ["NEEDS_REVIEW", "MISSING_DATA", "COMING_SOON", "READY"];

export default function CatalogAdminPage() {
  const groups = ORDER.map((status) => ({
    status,
    items: ALL_PRODUCTS.filter((p) => p.verification === status),
  })).filter((g) => g.items.length > 0);

  return (
    <section className="section pt-24 md:pt-32">
      <div className="shell">
        <p className="eyebrow mb-3">Internal · not indexed</p>
        <h1 className="display-2">CATALOGUE IMPORT REPORT</h1>
        <p className="mt-4 max-w-2xl text-sm leading-relaxed text-ash">
          RECOIL {CATALOG_SUMMARY.priceListEdition} price list, imported{" "}
          {new Date(CATALOG_SUMMARY.generatedAt).toLocaleString("en-IN")}. Manufacturer catalogue
          mirrored{" "}
          {CATALOG_SUMMARY.manufacturerMirrorFetchedAt
            ? new Date(CATALOG_SUMMARY.manufacturerMirrorFetchedAt).toLocaleString("en-IN")
            : "—"}
          .
        </p>

        <div className="card mt-6 border-gold/30 bg-gold/6 p-4">
          <p className="flex items-center gap-2 font-display text-sm font-extrabold uppercase text-gold">
            <Icon name="shield" size={16} />
            Dealer pricing is not rendered on this page
          </p>
          <p className="mt-2 text-xs leading-relaxed text-chalk/85">
            DP is held in the generated catalogue server-side but is deliberately not displayed here,
            because this route has no authentication yet. Put it behind a login before adding a cost
            column.
          </p>
        </div>

        {/* summary ------------------------------------------------- */}
        <ul className="mt-8 grid grid-cols-2 gap-3 md:grid-cols-4">
          {[
            { label: "SKUs imported", value: CATALOG_SUMMARY.totals.skus },
            { label: "Ready to publish", value: CATALOG_SUMMARY.totals.ready },
            { label: "In verification queue", value: CATALOG_SUMMARY.totals.needsReview + CATALOG_SUMMARY.totals.missingData },
            { label: "Coming soon", value: CATALOG_SUMMARY.totals.comingSoon },
            { label: "Matched to manufacturer", value: CATALOG_SUMMARY.totals.withManufacturerMatch },
            { label: "With verified images", value: CATALOG_SUMMARY.totals.withImages },
            { label: "Images tracked", value: CATALOG_SUMMARY.totals.images },
            { label: "No image match", value: CATALOG_SUMMARY.totals.skus - CATALOG_SUMMARY.totals.withImages },
          ].map((s) => (
            <li key={s.label} className="card p-4">
              <p className="font-display text-2xl font-extrabold tnum">{s.value}</p>
              <p className="mt-1 text-[11px] uppercase tracking-[0.12em] text-dim">{s.label}</p>
            </li>
          ))}
        </ul>

        {/* flags --------------------------------------------------- */}
        <h2 className="display-3 mt-12">FLAGS RAISED</h2>
        <ul className="mt-4 divide-y divide-white/8 border-y border-white/8">
          {Object.entries(CATALOG_SUMMARY.flagCounts)
            .sort((a, b) => b[1] - a[1])
            .map(([flag, count]) => (
              <li key={flag} className="flex flex-col gap-1 py-3 sm:flex-row sm:items-baseline sm:gap-5">
                <span className="w-16 shrink-0 font-display text-lg font-extrabold text-accent tnum">{count}</span>
                <span className="w-56 shrink-0 font-display text-[11px] font-bold uppercase tracking-[0.12em]">
                  {flag.replace(/_/g, " ")}
                </span>
                <span className="text-xs leading-relaxed text-ash">{CATALOG_SUMMARY.flagMeanings[flag]}</span>
              </li>
            ))}
        </ul>

        {/* per-status tables --------------------------------------- */}
        {groups.map((group) => (
          <section key={group.status} className="mt-12">
            <h2 className={`display-3 ${STATUS[group.status].tone}`}>
              {STATUS[group.status].dot} {STATUS[group.status].label.toUpperCase()}{" "}
              <span className="text-dim tnum">({group.items.length})</span>
            </h2>
            <div className="mt-4 overflow-x-auto">
              <table className="w-full min-w-[900px] border-collapse text-sm">
                <thead>
                  <tr className="border-b border-white/12 text-left text-[10px] uppercase tracking-[0.14em] text-dim">
                    <th className="p-2.5">SKU</th>
                    <th className="p-2.5">Product</th>
                    <th className="p-2.5">Category</th>
                    <th className="p-2.5 text-center">Image</th>
                    <th className="p-2.5 text-center">Specs</th>
                    <th className="p-2.5 text-right">MRP</th>
                    <th className="p-2.5 text-right">Sell</th>
                    <th className="p-2.5 text-center">Source</th>
                    <th className="p-2.5">Flags</th>
                  </tr>
                </thead>
                <tbody>
                  {group.items.map((p) => (
                    <Row key={p.slug} product={p} />
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        ))}

        <div className="card mt-12 p-5">
          <p className="font-display text-sm font-extrabold uppercase">Re-running the import</p>
          <ol className="mt-3 space-y-1.5 text-xs text-ash">
            <li>1. Drop the new price list into <code className="text-accent">data/recoil/</code> as a .psv.</li>
            <li>2. <code className="text-accent">npm run sync:recoil</code> — re-mirrors the manufacturer catalogue.</li>
            <li>3. <code className="text-accent">npm run verify:recoil</code> — checks every row against the source PDF text.</li>
            <li>4. <code className="text-accent">npm run import:recoil</code> — rebuilds the catalogue and this report.</li>
          </ol>
          <Link href="/recoil" className="btn btn-outline btn-sm mt-5">
            View the storefront catalogue
          </Link>
        </div>
      </div>
    </section>
  );
}

function Row({ product: p }: { product: CatalogProduct }) {
  const tick = (ok: boolean) => (
    <span className={ok ? "text-accent" : "text-danger"}>{ok ? "✓" : "✗"}</span>
  );
  return (
    <tr className="border-b border-white/8 align-top">
      <td className="p-2.5 font-display text-xs font-bold tracking-[0.06em] text-accent">
        <Link href={`/products/${p.slug}`} className="hover:underline">
          {p.printedSku}
        </Link>
      </td>
      <td className="max-w-xs p-2.5 text-xs">{p.priceListName}</td>
      <td className="p-2.5 text-xs text-ash">
        {p.category}
        <span className="block text-dim">{p.subcategory}</span>
      </td>
      <td className="p-2.5 text-center">{tick(p.images.length > 0)}</td>
      <td className="p-2.5 text-center">{tick(p.priceListSpecs.length > 0)}</td>
      <td className="p-2.5 text-right text-xs tnum">{p.mrp ? rupees(p.mrp) : "—"}</td>
      <td className="p-2.5 text-right text-xs tnum">{p.sellingPrice ? rupees(p.sellingPrice) : "—"}</td>
      <td className="p-2.5 text-center text-xs">
        {p.manufacturer ? (
          <a
            href={p.manufacturer.url}
            target="_blank"
            rel="noreferrer noopener"
            title={p.manufacturer.sourceLabel}
            className="text-accent hover:underline"
          >
            ✓
          </a>
        ) : (
          <span className="text-danger">✗</span>
        )}
      </td>
      <td className="p-2.5">
        <span className="flex flex-wrap gap-1">
          {p.flags.map((f) => (
            <span key={f} className="chip text-[9px]">
              {f.replace(/_/g, " ")}
            </span>
          ))}
        </span>
      </td>
    </tr>
  );
}
