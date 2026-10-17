import type { Metadata } from "next";
import Link from "next/link";
import { adminPage, listAudit } from "@/lib/server/admin-auth";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Audit log", robots: { index: false, follow: false, nocache: true } };

const TYPES = [
  ["", "Everyone"],
  ["admin", "Team"],
  ["vendor", "Sellers"],
  ["customer", "Customers"],
  ["system", "System"],
] as const;

const when = (iso: string) =>
  new Date(iso).toLocaleString("en-IN", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit", second: "2-digit", timeZone: "Asia/Kolkata" });

/** Every recorded action, newest first, 100 at a time. Read only. */
export default async function AuditPage({ searchParams }: { searchParams: Promise<{ q?: string; type?: string; before?: string }> }) {
  await adminPage("audit", "/admin/audit");
  const sp = await searchParams;
  const before = sp.before && /^\d{1,18}$/.test(sp.before) ? Number(sp.before) : undefined;
  const { rows, next } = await listAudit({ q: sp.q, actorType: sp.type, before });
  const older = next ? `/admin/audit?${new URLSearchParams({ ...(sp.q ? { q: sp.q } : {}), ...(sp.type ? { type: sp.type } : {}), before: String(next) })}` : null;

  return (
    <section className="section pt-24 md:pt-32">
      <div className="shell">
        <Link href="/admin" className="text-xs text-ash underline underline-offset-4 hover:text-accent">Admin</Link>
        <p className="eyebrow mb-3 mt-4">Internal · not indexed</p>
        <h1 className="display-2">AUDIT LOG</h1>

        <form method="get" className="mt-6 flex flex-wrap items-end gap-3" role="search">
          <div className="min-w-0 flex-1 sm:max-w-sm">
            <label className="label" htmlFor="audit-q">Search action, person or details</label>
            <input id="audit-q" name="q" className="field" defaultValue={sp.q ?? ""} maxLength={80} placeholder="e.g. refund, RZP-, sign_in" />
          </div>
          <div>
            <label className="label" htmlFor="audit-type">Who</label>
            <select id="audit-type" name="type" className="field" defaultValue={sp.type ?? ""}>
              {TYPES.map(([v, l]) => (
                <option key={v} value={v}>{l}</option>
              ))}
            </select>
          </div>
          <button type="submit" className="btn btn-outline btn-sm">Show</button>
        </form>

        {rows.length === 0 ? (
          <p className="mt-8 text-sm text-ash">Nothing recorded matches.</p>
        ) : (
          <ul className="mt-6 space-y-2">
            {rows.map((r) => (
              <li key={r.id} className="card p-3 text-xs">
                <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
                  <span className="font-mono font-semibold text-chalk">{r.action}</span>
                  <span className="tnum text-dim">{when(r.at)}</span>
                </div>
                <p className="mt-1 break-all text-ash">
                  {r.actorType} · {r.actor}
                  {r.vendorId ? ` · seller ${r.vendorId}` : ""}
                  {r.ip ? ` · ${r.ip}` : ""}
                </p>
                {r.detail && <pre className="mt-2 overflow-x-auto whitespace-pre-wrap break-all rounded-sm bg-tint/5 p-2 font-mono text-[11px] text-ash">{JSON.stringify(r.detail, null, 1)}</pre>}
              </li>
            ))}
          </ul>
        )}
        {older && (
          <Link href={older} className="btn btn-outline btn-sm mt-6">Older entries</Link>
        )}
      </div>
    </section>
  );
}
