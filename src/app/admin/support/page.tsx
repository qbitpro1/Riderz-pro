import type { Metadata } from "next";
import Link from "next/link";
import SupportInbox from "@/components/admin/support/SupportInbox";
import { listTickets } from "@/lib/server/admin-vendors";
import { adminPage } from "@/lib/server/admin-auth";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Seller support",
  robots: { index: false, follow: false, nocache: true },
};

const TABS = ["open", "answered", "closed", "all"] as const;

export default async function SupportAdminPage({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  await adminPage("support", "/admin/support");
  const sp = await searchParams;
  const filter = (TABS as readonly string[]).includes(sp.status ?? "") ? (sp.status as (typeof TABS)[number]) : "open";
  const { items, counts } = await listTickets(filter);
  return (
    <section className="section pt-24 md:pt-32">
      <div className="shell">
        <p className="eyebrow mb-3">Internal · not indexed</p>
        <h1 className="display-2">SELLER SUPPORT</h1>
        <nav aria-label="Filter tickets" className="mt-6 flex flex-wrap gap-2">
          {TABS.map((t) => (
            <Link key={t} href={`/admin/support?status=${t}`} aria-current={filter === t ? "page" : undefined} className={`chip ${filter === t ? "chip-active" : ""}`}>
              {t[0].toUpperCase() + t.slice(1)} {t !== "all" ? <span className="tnum opacity-80">{counts[t] ?? 0}</span> : null}
            </Link>
          ))}
        </nav>
        <SupportInbox items={items} />
      </div>
    </section>
  );
}
