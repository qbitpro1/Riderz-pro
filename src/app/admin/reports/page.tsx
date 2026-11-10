import type { Metadata } from "next";
import Link from "next/link";
import { adminPage } from "@/lib/server/admin-auth";
import { reportSellerOptions, salesReport, sellerReport } from "@/lib/server/admin-reports";
import { rupees } from "@/lib/format";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Reports", robots: { index: false, follow: false, nocache: true } };

const DAY = /^\d{4}-\d{2}-\d{2}$/;
/** Today in India as YYYY-MM-DD, moved by `days`. */
const istDay = (days = 0) => new Date(Date.now() + 5.5 * 3600 * 1000 + days * 86400 * 1000).toISOString().slice(0, 10);
const PRESETS = [
  ["Today", 0],
  ["7 days", 6],
  ["30 days", 29],
  ["90 days", 89],
] as const;

function Stat({ label, value, note }: { label: string; value: string; note?: string }) {
  return (
    <div className="card p-4">
      <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-dim">{label}</p>
      <p className="mt-1 font-display text-xl font-extrabold tnum text-chalk">{value}</p>
      {note && <p className="mt-1 text-xs text-ash">{note}</p>}
    </div>
  );
}

export default async function ReportsPage({ searchParams }: { searchParams: Promise<{ from?: string; to?: string; vendor?: string }> }) {
  await adminPage("reports", "/admin/reports");
  const sp = await searchParams;
  const to = sp.to && DAY.test(sp.to) ? sp.to : istDay();
  let from = sp.from && DAY.test(sp.from) ? sp.from : istDay(-29);
  if (from > to) from = to;
  const options = await reportSellerOptions();
  const vendor = options.find((o) => o.id === sp.vendor) ?? null;
  const [r, s] = await Promise.all([vendor ? null : salesReport({ from, to }), sellerReport({ from, to }, vendor?.id ?? null)]);
  const csv = `/api/admin/reports/orders?${new URLSearchParams({ from, to })}`;
  const keep = (extra: Record<string, string>) => `/admin/reports?${new URLSearchParams({ ...(vendor ? { vendor: vendor.id } : {}), ...extra })}`;

  return (
    <section className="section pt-24 md:pt-32">
      <div className="shell">
        <Link href="/admin" className="text-xs text-ash underline underline-offset-4 hover:text-accent">Admin</Link>
        <p className="eyebrow mb-3 mt-4">Internal · not indexed</p>
        <h1 className="display-2">REPORTS</h1>

        <form method="get" className="mt-6 flex flex-wrap items-end gap-3">
          <div>
            <label className="label" htmlFor="rep-from">From</label>
            <input id="rep-from" name="from" type="date" className="field" defaultValue={from} max={istDay()} />
          </div>
          <div>
            <label className="label" htmlFor="rep-to">To</label>
            <input id="rep-to" name="to" type="date" className="field" defaultValue={to} max={istDay()} />
          </div>
          <div>
            <label className="label" htmlFor="rep-vendor">Seller</label>
            <select id="rep-vendor" name="vendor" className="field" defaultValue={vendor?.id ?? ""}>
              <option value="">All sellers and Riderzpro</option>
              {options.map((o) => (
                <option key={o.id} value={o.id}>{o.storeName}{o.status === "suspended" ? " (frozen)" : o.status !== "approved" ? ` (${o.status})` : ""}</option>
              ))}
            </select>
          </div>
          <button type="submit" className="btn btn-outline btn-sm">Show</button>
          {!vendor && <a href={csv} className="btn btn-outline btn-sm" download>Orders CSV</a>}
        </form>
        <p className="mt-3 flex flex-wrap gap-3 text-xs">
          {PRESETS.map(([label, back]) => (
            <Link key={label} href={keep({ from: istDay(-back), to: istDay() })} className="text-accent underline underline-offset-4">{label}</Link>
          ))}
          {vendor && <Link href={`/admin/reports?from=${from}&to=${to}`} className="text-accent underline underline-offset-4">Back to all sellers</Link>}
        </p>

        <SellerSection s={s} vendor={vendor} from={from} to={to} />
        {r && <WholeShop r={r} from={from} to={to} />}
      </div>
    </section>
  );
}

type Sellers = Awaited<ReturnType<typeof sellerReport>>;

function SellerSection({ s, vendor, from, to }: { s: Sellers; vendor: { id: string; storeName: string; status: string } | null; from: string; to: string }) {
  const t = s.summary;
  const peak = Math.max(1, ...s.daily.map((d) => d.total));
  const row = s.sellers[0];
  return (
    <>
      <h2 className="eyebrow mb-3 mt-10">
        {vendor ? `${vendor.storeName}${vendor.status === "suspended" ? " (frozen)" : ""}` : "Sellers"} · orders placed {from} to {to}
      </h2>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Seller sales" value={rupees(t.gross)} note={`${t.orders} orders · ${t.units} items · ${t.cancelled} cancelled/returned`} />
        <Stat label="Delivered (paid via Riderzpro)" value={rupees(t.delivered)} note="delivered in the range" />
        <Stat label="Commission + GST" value={rupees(t.commission + t.commissionGst)} note={`commission ${rupees(t.commission)} · GST ${rupees(t.commissionGst)}`} />
        <Stat label="Due to seller" value={rupees(t.net)} note={`paid out in range ${rupees(t.paidOut)}`} />
        {t.counter > 0 && <Stat label="Paid at seller's counter" value={rupees(t.counter)} note="Offline Store; the seller has the money" />}
        <Stat label="Live products" value={String(t.productsLive)} note={vendor ? `commission ${row?.commissionRate ?? "—"}%` : `${t.sellers} sellers`} />
      </div>

      {vendor ? (
        <div className="mt-6 grid gap-6 lg:grid-cols-2 lg:items-start">
          <div className="card p-5">
            <h3 className="eyebrow mb-3">By day</h3>
            {s.daily.length === 0 ? (
              <p className="text-sm text-ash">No orders in this range.</p>
            ) : (
              <ul className="space-y-1.5 text-xs">
                {s.daily.map((d) => (
                  <li key={d.day} className="grid grid-cols-[5.5rem_1fr_auto] items-center gap-2">
                    <span className="tnum text-ash">{d.day}</span>
                    <span className="h-2 rounded-full bg-tint/8">
                      <span className="block h-2 rounded-full bg-accent" style={{ width: `${Math.max(2, Math.round((d.total / peak) * 100))}%` }} />
                    </span>
                    <span className="tnum text-chalk">{rupees(d.total)} · {d.orders}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
          <div className="card p-5">
            <h3 className="eyebrow mb-3">Top products</h3>
            {s.topProducts.length === 0 ? (
              <p className="text-sm text-ash">No sales in this range.</p>
            ) : (
              <ol className="space-y-2 text-xs">
                {s.topProducts.map((p, i) => (
                  <li key={i} className="flex justify-between gap-3">
                    <span className="min-w-0 text-ash"><span className="text-chalk">{p.title}</span> · {p.qty} sold</span>
                    <span className="shrink-0 tnum text-chalk">{rupees(p.amount)}</span>
                  </li>
                ))}
              </ol>
            )}
          </div>
          <p className="text-xs lg:col-span-2">
            <Link href={`/admin/vendors/${vendor.id}`} className="text-accent underline underline-offset-4">Open seller profile</Link>
          </p>
        </div>
      ) : s.sellers.length === 0 ? (
        <p className="mt-4 text-sm text-ash">No sellers yet.</p>
      ) : (
        <div className="card mt-6 overflow-x-auto p-0">
          <table className="w-full min-w-[46rem] text-left text-xs">
            <thead className="border-b border-tint/10 text-[11px] uppercase tracking-[0.08em] text-dim">
              <tr>
                <th className="px-4 py-3 font-bold">Seller</th>
                <th className="px-3 py-3 text-right font-bold">Orders</th>
                <th className="px-3 py-3 text-right font-bold">Sales</th>
                <th className="px-3 py-3 text-right font-bold">Delivered</th>
                <th className="px-3 py-3 text-right font-bold">Commission + GST</th>
                <th className="px-3 py-3 text-right font-bold">Due</th>
                <th className="px-3 py-3 text-right font-bold">Paid out</th>
                <th className="px-4 py-3 text-right font-bold">Live</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-tint/10">
              {s.sellers.map((v) => (
                <tr key={v.id}>
                  <td className="px-4 py-2.5">
                    <Link href={`/admin/reports?${new URLSearchParams({ from, to, vendor: v.id })}`} className="font-semibold text-chalk hover:text-accent">{v.storeName}</Link>
                    {v.status !== "approved" && <span className={`ml-2 text-[10px] uppercase ${v.status === "suspended" ? "text-danger" : "text-dim"}`}>{v.status === "suspended" ? "frozen" : v.status}</span>}
                  </td>
                  <td className="px-3 py-2.5 text-right tnum">{v.orders}</td>
                  <td className="px-3 py-2.5 text-right tnum text-chalk">{rupees(v.gross)}</td>
                  <td className="px-3 py-2.5 text-right tnum">{rupees(v.delivered)}</td>
                  <td className="px-3 py-2.5 text-right tnum">{rupees(v.commission + v.commissionGst)}</td>
                  <td className="px-3 py-2.5 text-right tnum">{rupees(v.net)}</td>
                  <td className="px-3 py-2.5 text-right tnum">{rupees(v.paidOut)}</td>
                  <td className="px-4 py-2.5 text-right tnum">{v.productsLive}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}

function WholeShop({ r, from, to }: { r: Awaited<ReturnType<typeof salesReport>>; from: string; to: string }) {
  const peak = Math.max(1, ...r.daily.map((d) => d.total));
  return (
    <>

        <h2 className="eyebrow mb-3 mt-10">Sales (orders placed {from} to {to}, not cancelled)</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Stat label="Sales" value={rupees(r.sales.total)} note={`${r.orders.placed} orders · ${r.orders.cancelled} cancelled`} />
          <Stat label="Average order" value={rupees(r.sales.average)} />
          <Stat label="Riderzpro's own items" value={rupees(r.sales.ownItems)} note="products and installation" />
          <Stat label="Marketplace items" value={rupees(r.sales.marketplaceItems)} note={`${r.marketplace.sellers} seller${r.marketplace.sellers === 1 ? "" : "s"}`} />
          <Stat label="Delivery charged" value={rupees(r.sales.shipping)} />
          <Stat
            label="Discounts"
            value={rupees(r.sales.discounts)}
            note={`coupons ${rupees(r.sales.couponDiscounts)} (${r.coupons.orders} order${r.coupons.orders === 1 ? "" : "s"}) · shop special prices ${rupees(r.sales.shopDiscounts)}`}
          />
          <Stat label="Paid online" value={rupees(r.online.paid)} note={`${r.online.paidOrders} payments · refunds ${rupees(r.online.refunded)}`} />
          <Stat
            label="Payment method"
            value={`${r.orders.byMethod.online ?? 0} online`}
            note={`${r.orders.byMethod.whatsapp ?? 0} WhatsApp${r.orders.byMethod.cod ? ` · ${r.orders.byMethod.cod} cash` : ""}`}
          />
        </div>

        <h2 className="eyebrow mb-3 mt-10">Marketplace commission (parts delivered in the range, paid through Riderzpro)</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Stat label="Delivered seller sales" value={rupees(r.marketplace.deliveredGross)} />
          <Stat label="Commission" value={rupees(r.marketplace.commission)} />
          <Stat label="GST on commission" value={rupees(r.marketplace.commissionGst)} />
          <Stat label="Due to sellers" value={rupees(r.marketplace.deliveredGross - r.marketplace.commission - r.marketplace.commissionGst)} note="before payouts already made" />
        </div>
        {r.marketplace.counterGross > 0 && (
          <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <Stat label="Paid at sellers' counters" value={rupees(r.marketplace.counterGross)} note="shop screen orders; the seller has the money" />
            <Stat label="Commission on counter sales" value={rupees(r.marketplace.counterCommission)} note="not collected yet: billing rule to be decided" />
          </div>
        )}

        <h2 className="eyebrow mb-3 mt-10">Riders and customers</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Stat label="Rider deliveries" value={String(r.riders.delivered)} note={`${rupees(r.riders.earnings)} rider pay`} />
          <Stat label="New accounts" value={String(r.customers.newAccounts)} />
          <Stat label="Accounts that ordered" value={String(r.customers.buyingAccounts)} />
          <Stat label="Guest orders" value={String(r.customers.guestOrders)} />
        </div>

        <div className="mt-10 grid gap-6 lg:grid-cols-2 lg:items-start">
          <div className="card p-5">
            <h2 className="eyebrow mb-3">By day</h2>
            {r.daily.length === 0 ? (
              <p className="text-sm text-ash">No orders in this range.</p>
            ) : (
              <ul className="space-y-1.5 text-xs">
                {r.daily.map((d) => (
                  <li key={d.day} className="grid grid-cols-[5.5rem_1fr_auto] items-center gap-2">
                    <span className="tnum text-ash">{d.day}</span>
                    <span className="h-2 rounded-full bg-tint/8">
                      <span className="block h-2 rounded-full bg-accent" style={{ width: `${Math.max(2, Math.round((d.total / peak) * 100))}%` }} />
                    </span>
                    <span className="tnum text-chalk">{rupees(d.total)} · {d.orders}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
          <div className="card p-5">
            <h2 className="eyebrow mb-3">Top products</h2>
            {r.topProducts.length === 0 ? (
              <p className="text-sm text-ash">No sales in this range.</p>
            ) : (
              <ol className="space-y-2 text-xs">
                {r.topProducts.map((t, i) => (
                  <li key={i} className="flex justify-between gap-3">
                    <span className="min-w-0 text-ash">
                      <span className="text-chalk">{t.title}</span> · {t.seller ?? "Riderzpro"} · {t.qty} sold
                    </span>
                    <span className="shrink-0 tnum text-chalk">{rupees(t.amount)}</span>
                  </li>
                ))}
              </ol>
            )}
          </div>
        </div>

        <p className="mt-8 text-xs text-dim">
          Order statuses in the range: {Object.entries(r.orders.byStatus).map(([k, v]) => `${k} ${v}`).join(" · ") || "none"}.
        </p>
    </>
  );
}
