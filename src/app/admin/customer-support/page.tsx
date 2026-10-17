import type { Metadata } from "next";
import Link from "next/link";
import CustomerInbox from "@/components/admin/customer-support/CustomerInbox";
import { listCustomerTicketsAdmin } from "@/lib/server/admin-customers";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Customer messages",
  robots: { index: false, follow: false, nocache: true },
};

const TABS = ["open", "answered", "closed", "all"] as const;

export default async function CustomerSupportPage({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  const sp = await searchParams;
  const filter = (TABS as readonly string[]).includes(sp.status ?? "") ? (sp.status as (typeof TABS)[number]) : "open";
  const { items, counts } = await listCustomerTicketsAdmin(filter);
  return (
    <section className="section pt-24 md:pt-32">
      <div className="shell">
        <p className="eyebrow mb-3">Internal · not indexed</p>
        <h1 className="display-2">CUSTOMER MESSAGES</h1>
        <p className="mt-2 max-w-2xl text-sm text-ash">From the contact page and customers&apos; accounts. Customers with an account see your reply under Help; reply to guests on WhatsApp or by phone.</p>
        <nav aria-label="Filter messages" className="mt-6 flex flex-wrap gap-2">
          {TABS.map((t) => (
            <Link key={t} href={`/admin/customer-support?status=${t}`} aria-current={filter === t ? "page" : undefined} className={`chip ${filter === t ? "chip-active" : ""}`}>
              {t[0].toUpperCase() + t.slice(1)} {t !== "all" ? <span className="tnum opacity-80">{counts[t] ?? 0}</span> : null}
            </Link>
          ))}
        </nav>
        <CustomerInbox items={items} />
      </div>
    </section>
  );
}
