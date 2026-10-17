import type { Metadata } from "next";
import { AccountShell } from "@/components/account/AccountShell";
import { HelpForm } from "@/components/account/HelpForm";
import { customerPage, listCustomerTickets } from "@/lib/server/customers";
import { TICKET_TOPICS } from "@/lib/account/schemas";
import { fmtDay } from "@/lib/account/types";

export const metadata: Metadata = { title: "Help", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

type Search = { searchParams: Promise<{ order?: string | string[] }> };

const STATUS = { open: "Waiting for our reply", answered: "Answered", closed: "Closed" } as const;

export default async function HelpPage({ searchParams }: Search) {
  const me = await customerPage("/account/help");
  const raw = (await searchParams).order;
  const order = (Array.isArray(raw) ? raw[0] : raw)?.toUpperCase() ?? "";
  const tickets = await listCustomerTickets(me.id);
  return (
    <AccountShell me={me} title="Help">
      <div className="grid gap-8 lg:grid-cols-[1fr_1fr]">
        <HelpForm orderNumber={/^RZP-[A-Z0-9]{6}$/.test(order) ? order : ""} />
        <div>
          <h2 className="font-display text-lg font-extrabold uppercase tracking-tight text-chalk">Your messages</h2>
          {tickets.length === 0 ? (
            <p className="mt-3 text-sm text-ash">No messages yet.</p>
          ) : (
            <ul className="mt-3 space-y-3">
              {tickets.map((t) => (
                <li key={t.id} className="card p-4 text-sm">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="font-semibold text-chalk">
                      {TICKET_TOPICS.find((x) => x.value === t.topic)?.label}
                      {t.orderNumber && <span className="ml-2 text-xs text-dim tnum">{t.orderNumber}</span>}
                    </p>
                    <span className={`text-xs font-bold ${t.status === "answered" ? "text-accent" : "text-dim"}`}>{STATUS[t.status]}</span>
                  </div>
                  <p className="mt-2 whitespace-pre-line text-ash">{t.body}</p>
                  <p className="mt-1 text-xs text-dim">{fmtDay(t.createdAt)}</p>
                  {t.reply && (
                    <div className="mt-3 border-l-2 border-accent pl-3">
                      <p className="text-xs font-bold uppercase tracking-[0.12em] text-chalk">Riderzpro replied{t.repliedAt ? ` · ${fmtDay(t.repliedAt)}` : ""}</p>
                      <p className="mt-1 whitespace-pre-line text-ash">{t.reply}</p>
                    </div>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </AccountShell>
  );
}
