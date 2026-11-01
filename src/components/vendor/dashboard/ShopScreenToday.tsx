import Link from "next/link";
import { ArrowRight, Clock } from "lucide-react";
import { rupees } from "@/lib/format";
import type { ShopDaySummary } from "@/lib/server/store-summary";

/** "Today at your shop screen" on the seller's overview: today's Offline Store sales (India time). */
export function ShopScreenToday({ s }: { s: ShopDaySummary }) {
  const day = new Intl.DateTimeFormat("en-IN", { weekday: "long", day: "numeric", month: "short", timeZone: "UTC" }).format(new Date(`${s.day}T00:00:00Z`));
  const stats = [
    { label: "Sales", value: rupees(s.sold.amount), note: `${s.sold.count} order${s.sold.count === 1 ? "" : "s"}` },
    { label: "Items sold", value: String(s.items) },
    { label: "Paid on screen", value: rupees(s.paidOnScreen.amount), note: `${s.paidOnScreen.count} order${s.paidOnScreen.count === 1 ? "" : "s"}` },
    { label: "Paid at counter", value: rupees(s.paidAtCounter.amount), note: `${s.paidAtCounter.count} order${s.paidAtCounter.count === 1 ? "" : "s"}` },
    { label: "Discount given", value: rupees(s.discount), note: s.offersUsed ? `${s.offersUsed} special price${s.offersUsed === 1 ? "" : "s"}` : "No special prices" },
  ];

  return (
    <section aria-labelledby="shop-today" className="card p-5 md:p-6">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 id="shop-today" className="font-display text-xl font-extrabold uppercase text-chalk">Today at your shop screen</h2>
        <span className="text-xs font-semibold uppercase tracking-[0.1em] text-dim">{day}</span>
      </div>

      {s.activity === 0 ? (
        <p className="mt-3 text-sm leading-relaxed text-ash">
          No shop screen orders yet today. When customers order on your Offline Store screen, today&apos;s sales, top products and counter
          orders show up here, and you get a summary at 8:30 pm.
        </p>
      ) : (
        <>
          {s.waiting.count > 0 && (
            <Link href="/vendor/dashboard/orders" className="mt-4 flex min-h-11 items-center justify-between gap-3 rounded-[2px] border border-accent/50 bg-accent/10 px-3 py-2 text-sm font-semibold text-chalk hover:border-accent">
              <span className="flex items-center gap-2">
                <Clock size={16} aria-hidden className="text-accent" />
                {s.waiting.count} counter order{s.waiting.count === 1 ? "" : "s"} waiting to be collected ({rupees(s.waiting.amount)})
              </span>
              <ArrowRight size={16} aria-hidden className="shrink-0" />
            </Link>
          )}
          <dl className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-5">
            {stats.map((t) => (
              <div key={t.label} className="rounded-[2px] border border-tint/10 p-3">
                <dt className="text-[11px] font-bold uppercase tracking-[0.1em] text-ash">{t.label}</dt>
                <dd className="mt-2 font-display text-xl font-extrabold text-chalk tnum">{t.value}</dd>
                {t.note && <dd className="text-xs text-dim">{t.note}</dd>}
              </div>
            ))}
          </dl>
          <div className="mt-4">
            <h3 className="text-[11px] font-bold uppercase tracking-[0.1em] text-ash">Top products</h3>
            {s.top.length === 0 ? (
              <p className="mt-2 text-sm text-ash">Nothing paid for yet today.</p>
            ) : (
              <ol className="mt-2 divide-y divide-tint/10">
                {s.top.map((p, i) => (
                  <li key={`${p.title}-${i}`} className="flex items-center justify-between gap-3 py-2 text-sm">
                    <span className="min-w-0 truncate text-chalk">
                      <span className="mr-2 text-dim tnum">{i + 1}.</span>
                      {p.title}
                    </span>
                    <span className="shrink-0 text-ash tnum">
                      {p.qty} sold · {rupees(p.amount)}
                    </span>
                  </li>
                ))}
              </ol>
            )}
          </div>
          {s.cancelled > 0 && <p className="mt-3 text-xs text-dim">{s.cancelled} order{s.cancelled === 1 ? " was" : "s were"} cancelled today (not paid or not collected).</p>}
        </>
      )}
    </section>
  );
}
