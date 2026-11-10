import type { Metadata } from "next";
import Link from "next/link";
import { adminPage } from "@/lib/server/admin-auth";
import { listLeadsAdmin } from "@/lib/server/leads";
import { LEAD_KINDS } from "@/lib/leads/types";
import { LeadCard } from "@/components/admin/leads/LeadCard";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Requests", robots: { index: false, follow: false, nocache: true } };

const TABS = [["new", "New"], ["contacted", "Contacted"], ["closed", "Closed"]] as const;

export default async function AdminLeadsPage({ searchParams }: { searchParams: Promise<{ status?: string; kind?: string }> }) {
  await adminPage("support", "/admin/leads");
  const sp = await searchParams;
  const status = sp.status === "contacted" || sp.status === "closed" ? sp.status : "new";
  const { items, counts } = await listLeadsAdmin({ status, kind: sp.kind });
  return (
    <section className="section pt-24 md:pt-32">
      <div className="shell max-w-5xl">
        <Link href="/admin" className="text-xs text-ash underline underline-offset-4 hover:text-accent">Admin</Link>
        <p className="eyebrow mb-3 mt-4">Internal · not indexed</p>
        <h1 className="display-2">REQUESTS</h1>
        <p className="mt-3 text-sm text-ash">
          Everything sent from the site&apos;s WhatsApp forms (garage bookings, inspections, partner sign-ups, the BE 6 waitlist, selling a
          car, quotes), saved before WhatsApp opens, so none is lost if the message is never sent.
        </p>
        <form method="get" className="mt-5 flex flex-wrap items-center gap-4 text-sm">
          {TABS.map(([s, label]) => (
            <Link key={s} href={`/admin/leads?status=${s}${sp.kind ? `&kind=${sp.kind}` : ""}`} className={s === status ? "font-bold text-chalk" : "text-accent underline underline-offset-4"}>
              {label} ({counts[s] ?? 0})
            </Link>
          ))}
          <input type="hidden" name="status" value={status} />
          <select name="kind" aria-label="Type" className="field h-9 w-auto" defaultValue={sp.kind ?? ""}>
            <option value="">All types</option>
            {Object.entries(LEAD_KINDS).map(([k, label]) => <option key={k} value={k}>{label}</option>)}
          </select>
          <button type="submit" className="btn btn-outline btn-sm">Show</button>
        </form>
        <div className="mt-6 space-y-3">
          {items.length === 0 ? <p className="text-sm text-ash">Nothing here.</p> : items.map((l) => <LeadCard key={l.id} lead={l} />)}
        </div>
      </div>
    </section>
  );
}
