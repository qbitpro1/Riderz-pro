import type { Metadata } from "next";
import Link from "next/link";
import { CheckCircle2, CircleAlert } from "lucide-react";
import { listVendors, parseVendorFilter, type VendorFilter } from "@/lib/server/admin-vendors";
import { fmtDate } from "@/components/admin/vendors/format";
import { StatusBadge } from "@/components/admin/vendors/ui";
import { DemoStorePanel } from "@/components/admin/vendors/DemoStorePanel";
import { sqlOne } from "@/lib/db/client";
import { DEMO_SLUG } from "@/lib/server/demo-store";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Seller KYC queue",
  description: "Internal review queue for seller applications.",
  robots: { index: false, follow: false, nocache: true },
};

const TABS: { id: VendorFilter; label: string }[] = [
  { id: "queue", label: "Needs action" },
  { id: "submitted", label: "Submitted" },
  { id: "under_review", label: "Under review" },
  { id: "changes_requested", label: "Changes requested" },
  { id: "approved", label: "Approved" },
  { id: "suspended", label: "Suspended" },
  { id: "rejected", label: "Rejected" },
  { id: "all", label: "All" },
];

export default async function VendorsAdminPage({ searchParams }: { searchParams: Promise<{ status?: string; q?: string }> }) {
  const sp = await searchParams;
  const filter = parseVendorFilter(sp.status);
  const q = (sp.q ?? "").slice(0, 80);
  const [{ items, counts }, demo] = await Promise.all([
    listVendors(filter, q),
    sqlOne("SELECT 1 FROM vendors WHERE slug = ANY($1)", [[DEMO_SLUG, "asha-accessories"]]),
  ]);
  const href = (status: string) => `/admin/vendors?status=${status}${q ? `&q=${encodeURIComponent(q)}` : ""}`;

  return (
    <section className="section pt-24 md:pt-32">
      <div className="shell">
        <p className="eyebrow mb-3">Internal · not indexed</p>
        <h1 className="display-2">SELLER KYC QUEUE</h1>
        <p className="mt-4 max-w-2xl text-sm leading-relaxed text-ash">
          Review each application, check the documents, then approve, ask for changes or reject. Every decision is recorded and the seller is notified.
        </p>

        <nav aria-label="Filter by status" className="mt-6 flex flex-wrap gap-2">
          {TABS.map((t) => (
            <Link
              key={t.id}
              href={href(t.id)}
              aria-current={filter === t.id ? "page" : undefined}
              className={`chip ${filter === t.id ? "chip-active" : ""}`}
            >
              {t.label} <span className="tnum opacity-80">{counts[t.id] ?? 0}</span>
            </Link>
          ))}
        </nav>

        <DemoStorePanel exists={Boolean(demo)} />

        <form action="/admin/vendors" className="mt-4 flex max-w-lg gap-2" role="search">
          <input type="hidden" name="status" value={filter} />
          <label className="sr-only" htmlFor="vq">Search sellers</label>
          <input id="vq" name="q" defaultValue={q} className="field" placeholder="Store, owner, email or mobile" />
          <button className="btn btn-outline btn-sm self-stretch" type="submit">Search</button>
        </form>

        {items.length === 0 ? (
          <div className="card mt-8 p-8 text-center text-sm text-ash">Nothing here. {filter === "queue" ? "The queue is clear." : "Try another filter."}</div>
        ) : (
          <ul className="mt-6 space-y-3">
            {items.map((v) => (
              <li key={v.id}>
                <Link href={`/admin/vendors/${v.id}`} className="card card-hover block p-4 hover:border-accent/40">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="break-words font-display text-base font-extrabold uppercase">{v.storeName ?? "(no store name yet)"}</p>
                      <p className="mt-0.5 text-sm text-ash">{v.fullName} · {v.businessType}</p>
                    </div>
                    <StatusBadge status={v.status} />
                  </div>
                  <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-xs text-dim">
                    <span>{v.email}</span>
                    <span>{v.mobile}</span>
                    <span>{v.submittedAt ? `Submitted ${fmtDate(v.submittedAt)}` : `Joined ${fmtDate(v.createdAt, false)}`}</span>
                    <span>{v.liveProducts} live product{v.liveProducts === 1 ? "" : "s"}</span>
                    <span className="inline-flex items-center gap-1">
                      {v.emailVerified ? <CheckCircle2 size={12} aria-hidden /> : <CircleAlert size={12} className="text-gold" aria-hidden />}
                      email {v.emailVerified ? "verified" : "unverified"}
                    </span>
                    <span className="inline-flex items-center gap-1">
                      {v.mobileVerified ? <CheckCircle2 size={12} aria-hidden /> : <CircleAlert size={12} className="text-gold" aria-hidden />}
                      mobile {v.mobileVerified ? "verified" : "unverified"}
                    </span>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
