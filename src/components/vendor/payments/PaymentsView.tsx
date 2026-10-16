"use client";

import Link from "next/link";
import { Banknote, Clock, Download, Landmark, Wallet } from "lucide-react";
import { rupees } from "@/lib/format";
import { csvCell, fmtDate } from "@/components/vendor/orders/format";
import type { PayoutOverview, SettlementRow } from "./types";

const STATE_LABEL: Record<SettlementRow["state"], string> = {
  in_window: "In return window",
  due: "Due",
  paid: "Paid",
};
const STATE_TONE: Record<SettlementRow["state"], string> = {
  in_window: "text-gold border-gold/40",
  due: "text-accent border-accent/40",
  paid: "text-ash border-tint/20",
};

function downloadCsv(data: PayoutOverview) {
  const head = ["Order", "Delivered", "Status", "Gross", "Commission", "GST on commission", "Net", "Payout reference"];
  const rows = data.settlements.map((s) => [
    s.number, fmtDate(s.deliveredAt), STATE_LABEL[s.state], s.gross, s.commission, s.commissionGst, s.net, s.reference ?? "",
  ]);
  const csv = [head, ...rows].map((r) => r.map(csvCell).join(",")).join("\r\n");
  const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
  const a = document.createElement("a");
  a.href = url;
  a.download = `riderzpro-settlements-${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export function PaymentsView({ data }: { data: PayoutOverview }) {
  const { summary, settlements, payouts, bank, delayDays } = data;
  const cards = [
    { label: "In return window", value: summary.inWindow.net, note: `${summary.inWindow.count} order${summary.inWindow.count === 1 ? "" : "s"} · due ${delayDays} days after delivery`, icon: Clock, tone: "text-gold" },
    { label: "Due for payout", value: summary.due.net, note: `${summary.due.count} order${summary.due.count === 1 ? "" : "s"} · paid in the next payout run`, icon: Wallet, tone: "text-accent" },
    { label: "Paid to date", value: summary.paid.net, note: `${summary.paid.count} payout${summary.paid.count === 1 ? "" : "s"}`, icon: Banknote, tone: "text-chalk" },
  ];

  return (
    <div className="space-y-8">
      <ul className="grid gap-3 sm:grid-cols-3">
        {cards.map((c) => (
          <li key={c.label} className="card p-5">
            <p className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.14em] text-dim">
              <c.icon size={14} className={c.tone} aria-hidden /> {c.label}
            </p>
            <p className="mt-2 font-display text-3xl font-extrabold tnum">{rupees(c.value)}</p>
            <p className="mt-1 text-xs text-ash">{c.note}</p>
          </li>
        ))}
      </ul>

      <section className="card flex flex-wrap items-center justify-between gap-4 p-5" aria-labelledby="bank-h">
        <div className="flex items-start gap-3">
          <Landmark size={20} className="mt-0.5 text-accent" aria-hidden />
          <div>
            <h2 id="bank-h" className="eyebrow">Payouts go to</h2>
            {bank ? (
              <p className="mt-1 text-sm">
                {bank.holder} · account <span className="tnum">XXXXXX{bank.last4}</span> · IFSC <span className="tnum">{bank.ifsc}</span>
              </p>
            ) : (
              <p className="mt-1 text-sm text-ash">No bank account on file.</p>
            )}
          </div>
        </div>
        <Link href="/vendor/dashboard/settings" className="btn btn-outline btn-sm">
          Change bank details
        </Link>
      </section>

      <section aria-labelledby="settle-h">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
          <h2 id="settle-h" className="font-display text-xl font-extrabold uppercase">Settlement by order</h2>
          <button type="button" className="btn btn-outline btn-sm" onClick={() => downloadCsv(data)} disabled={settlements.length === 0}>
            <Download size={14} aria-hidden /> Download CSV
          </button>
        </div>
        {settlements.length === 0 ? (
          <div className="card p-8 text-center text-sm text-ash">Delivered orders show up here with their commission and what you earn.</div>
        ) : (
          <>
            <div className="card hidden overflow-x-auto md:block">
              <table className="w-full text-left text-sm">
                <caption className="sr-only">Settlement for each delivered order</caption>
                <thead>
                  <tr className="border-b border-tint/10 text-[11px] uppercase tracking-[0.12em] text-dim">
                    <th scope="col" className="px-4 py-3 font-bold">Order</th>
                    <th scope="col" className="px-4 py-3 font-bold">Status</th>
                    <th scope="col" className="px-4 py-3 text-right font-bold">Gross</th>
                    <th scope="col" className="px-4 py-3 text-right font-bold">Commission</th>
                    <th scope="col" className="px-4 py-3 text-right font-bold">GST on commission</th>
                    <th scope="col" className="px-4 py-3 text-right font-bold">Net</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-tint/8">
                  {settlements.map((s) => (
                    <tr key={s.id}>
                      <td className="px-4 py-3">
                        <Link href={`/vendor/dashboard/orders/${s.id}`} className="font-display font-bold hover:text-accent">{s.number}</Link>
                        <p className="text-xs text-dim">Delivered {fmtDate(s.deliveredAt)}</p>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`chip bg-transparent ${STATE_TONE[s.state]}`}>{STATE_LABEL[s.state]}</span>
                        {s.reference && <p className="mt-1 text-xs text-dim">Ref {s.reference}</p>}
                      </td>
                      <td className="px-4 py-3 text-right tnum">{rupees(s.gross)}</td>
                      <td className="px-4 py-3 text-right tnum">−{rupees(s.commission)}</td>
                      <td className="px-4 py-3 text-right tnum">−{rupees(s.commissionGst)}</td>
                      <td className="px-4 py-3 text-right font-display font-bold tnum">{rupees(s.net)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <ul className="space-y-3 md:hidden">
              {settlements.map((s) => (
                <li key={s.id} className="card p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <Link href={`/vendor/dashboard/orders/${s.id}`} className="font-display font-bold hover:text-accent">{s.number}</Link>
                      <p className="text-xs text-dim">Delivered {fmtDate(s.deliveredAt)}</p>
                    </div>
                    <span className={`chip bg-transparent ${STATE_TONE[s.state]}`}>{STATE_LABEL[s.state]}</span>
                  </div>
                  <dl className="mt-3 space-y-1 text-sm">
                    <div className="flex justify-between"><dt className="text-ash">Gross</dt><dd className="tnum">{rupees(s.gross)}</dd></div>
                    <div className="flex justify-between"><dt className="text-ash">Commission</dt><dd className="tnum">−{rupees(s.commission)}</dd></div>
                    <div className="flex justify-between"><dt className="text-ash">GST on commission</dt><dd className="tnum">−{rupees(s.commissionGst)}</dd></div>
                    <div className="flex justify-between border-t border-tint/8 pt-2"><dt className="font-bold">Net</dt><dd className="font-display font-bold tnum">{rupees(s.net)}</dd></div>
                  </dl>
                  {s.reference && <p className="mt-2 text-xs text-dim">Payout ref {s.reference}</p>}
                </li>
              ))}
            </ul>
          </>
        )}
      </section>

      <section aria-labelledby="hist-h">
        <h2 id="hist-h" className="mb-3 font-display text-xl font-extrabold uppercase">Payout history</h2>
        {payouts.length === 0 ? (
          <div className="card p-8 text-center text-sm text-ash">No payouts yet. Orders become payable {delayDays} days after delivery.</div>
        ) : (
          <ul className="card divide-y divide-tint/8">
            {payouts.map((p) => (
              <li key={p.id} className="flex flex-wrap items-center justify-between gap-3 px-5 py-4">
                <div>
                  <p className="text-sm font-semibold">{fmtDate(p.paidAt)}</p>
                  <p className="text-xs text-dim">
                    {p.orders} order{p.orders === 1 ? "" : "s"} · Ref <span className="tnum">{p.reference ?? "—"}</span>
                  </p>
                </div>
                <p className="font-display text-lg font-extrabold tnum">{rupees(p.net)}</p>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
