import type { Metadata } from "next";
import Link from "next/link";
import RidersBoard from "@/components/admin/riders/RidersBoard";
import { listRidersAdmin } from "@/lib/server/riders";
import { RIDER_STATUS_LABELS, type RiderStatus } from "@/lib/rider/types";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Riders", robots: { index: false, follow: false, nocache: true } };

const TABS: (RiderStatus | "all")[] = ["applied", "approved", "changes_requested", "suspended", "rejected", "all"];

export default async function RidersAdminPage({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  const sp = await searchParams;
  const filter = (TABS as string[]).includes(sp.status ?? "") ? (sp.status as RiderStatus | "all") : "applied";
  const { items, counts } = await listRidersAdmin(filter);
  return (
    <section className="section pt-24 md:pt-32">
      <div className="shell">
        <p className="eyebrow mb-3">Internal · not indexed</p>
        <h1 className="display-2">RIDERS</h1>
        <p className="mt-2 max-w-2xl text-sm text-ash">
          Applications from <span className="text-chalk">/rider</span>. Meet each rider and check their licence, RC and insurance before approving; no documents are uploaded.{" "}
          <Link href="/admin/dispatch" className="text-accent hover:underline">Dispatch</Link> · <Link href="/admin/rider-payouts" className="text-accent hover:underline">Payouts</Link>
        </p>
        <nav aria-label="Filter riders" className="mt-6 flex flex-wrap gap-2">
          {TABS.map((t) => (
            <Link key={t} href={`/admin/riders?status=${t}`} aria-current={filter === t ? "page" : undefined} className={`chip ${filter === t ? "chip-active" : ""}`}>
              {t === "all" ? "All" : RIDER_STATUS_LABELS[t]} {t !== "all" ? <span className="tnum opacity-80">{counts[t] ?? 0}</span> : null}
            </Link>
          ))}
        </nav>
        <RidersBoard items={items} />
      </div>
    </section>
  );
}
