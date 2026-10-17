import type { Metadata } from "next";
import Link from "next/link";
import { adminPage } from "@/lib/server/admin-auth";
import { listCustomersAdmin } from "@/lib/server/admin-reports";
import { rupees } from "@/lib/format";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Customers", robots: { index: false, follow: false, nocache: true } };

const day = (iso: string | null) => (iso ? new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric", timeZone: "Asia/Kolkata" }) : "—");

/** Customer accounts, newest first, 50 at a time. Read only. */
export default async function AdminCustomersPage({ searchParams }: { searchParams: Promise<{ q?: string; before?: string }> }) {
  await adminPage("customers", "/admin/customers");
  const sp = await searchParams;
  const before = sp.before && !Number.isNaN(Date.parse(sp.before)) ? sp.before : undefined;
  const { rows, next } = await listCustomersAdmin(sp.q, before);
  const older = next ? `/admin/customers?${new URLSearchParams({ ...(sp.q ? { q: sp.q } : {}), before: next })}` : null;

  return (
    <section className="section pt-24 md:pt-32">
      <div className="shell">
        <Link href="/admin" className="text-xs text-ash underline underline-offset-4 hover:text-accent">Admin</Link>
        <p className="eyebrow mb-3 mt-4">Internal · not indexed</p>
        <h1 className="display-2">CUSTOMERS</h1>
        <p className="mt-3 text-sm text-ash">Shopper accounts. Guest orders that never joined an account are on the Orders page.</p>

        <form method="get" className="mt-6 flex flex-wrap items-end gap-3" role="search">
          <div className="min-w-0 flex-1 sm:max-w-sm">
            <label className="label" htmlFor="cust-q">Name, mobile or email</label>
            <input id="cust-q" name="q" className="field" defaultValue={sp.q ?? ""} maxLength={80} />
          </div>
          <button type="submit" className="btn btn-outline btn-sm">Search</button>
        </form>

        {rows.length === 0 ? (
          <p className="mt-8 text-sm text-ash">No customers match.</p>
        ) : (
          <ul className="mt-6 space-y-2">
            {rows.map((c) => (
              <li key={c.id}>
                <Link href={`/admin/customers/${c.id}`} className="card card-hover flex flex-wrap items-center justify-between gap-3 p-4 text-sm hover:border-accent/40">
                  <span className="min-w-0">
                    <span className="block font-semibold text-chalk">{c.name ?? "No name yet"}</span>
                    <span className="block break-all text-xs text-ash">
                      {c.mobile ? `+91 ${c.mobile}${c.mobileVerified ? " ✓" : ""}` : ""}
                      {c.mobile && c.email ? " · " : ""}
                      {c.email ? `${c.email}${c.emailVerified ? " ✓" : ""}` : ""}
                    </span>
                    <span className="block text-xs text-dim">Joined {day(c.createdAt)}{c.lastOrderAt ? ` · last order ${day(c.lastOrderAt)}` : ""}</span>
                  </span>
                  <span className="text-right text-xs text-ash tnum">
                    <span className="block font-display text-base font-bold text-chalk">{rupees(c.spent)}</span>
                    {c.orders} order{c.orders === 1 ? "" : "s"}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
        {older && <Link href={older} className="btn btn-outline btn-sm mt-6">Older accounts</Link>}
      </div>
    </section>
  );
}
