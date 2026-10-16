"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Accordion, type QA } from "@/components/ui/Accordion";
import type { VendorTicket } from "@/lib/server/vendor-account";
import { api, ApiFailure } from "@/lib/vendor/client";

const FAQ: QA[] = [
  {
    q: "How long does approval take?",
    a: "Seller applications are usually reviewed within 2 working days. New products and edits to live products are reviewed within 1 working day. You will get a notification as soon as a decision is made.",
  },
  {
    q: "What commission does Riderzpro charge?",
    a: "Your commission rate is set when your store is approved and shown on your Payments page. It is charged on the order value, and 18% GST applies on the commission itself.",
  },
  {
    q: "When do I get paid?",
    a: "Your money for an order becomes due 7 days after it is delivered, which covers the return window. Payouts are made to your verified bank account and appear on the Payments page.",
  },
  {
    q: "How do returns work?",
    a: "Shoppers can ask for a return within the window you set in Settings. You will be notified of the request. Returned orders are not paid out, or are adjusted against your next payout.",
  },
  {
    q: "How do I change my store name, GSTIN or bank account?",
    a: "Store name, URL and tax details need verification, so raise a ticket below. For your bank account, use Request a bank change in Settings; our team checks it before it applies.",
  },
];

const STATUS: Record<VendorTicket["status"], string> = { open: "Waiting for us", answered: "Answered", closed: "Closed" };
const date = (iso: string) => new Date(iso).toLocaleString("en-IN", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });

export default function SupportPanel({ initialTickets }: { initialTickets: VendorTicket[] }) {
  const router = useRouter();
  const [tickets, setTickets] = useState(initialTickets);
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ tone: "ok" | "error"; text: string } | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setMsg(null);
    setErrors({});
    try {
      const res = await api<{ ticket: VendorTicket }>("/api/vendor/support", { body: { subject, body } });
      setTickets((cur) => [res.ticket, ...cur]);
      setSubject("");
      setBody("");
      setMsg({ tone: "ok", text: "Ticket sent. We usually reply within one working day." });
      router.refresh();
    } catch (err) {
      if (err instanceof ApiFailure) {
        setErrors(err.fields);
        setMsg({ tone: "error", text: err.message });
      } else setMsg({ tone: "error", text: "Something went wrong. Please try again." });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mt-6 grid gap-8 lg:grid-cols-[1fr_24rem]">
      <div className="space-y-8">
        <section aria-labelledby="new-ticket" className="card p-4 md:p-5">
          <h2 id="new-ticket" className="font-display text-base font-extrabold uppercase tracking-[0.04em]">Ask for help</h2>
          <form onSubmit={submit} className="mt-4 space-y-4" noValidate>
            <label className="block">
              <span className="label">Subject</span>
              <input className="field" value={subject} onChange={(e) => setSubject(e.target.value)} maxLength={120} />
              {errors.subject ? <span className="mt-1 block text-xs text-danger">{errors.subject}</span> : null}
            </label>
            <label className="block">
              <span className="label">What do you need?</span>
              <textarea className="field min-h-28 py-2" value={body} onChange={(e) => setBody(e.target.value)} maxLength={2000} />
              {errors.body ? <span className="mt-1 block text-xs text-danger">{errors.body}</span> : null}
            </label>
            <button type="submit" className="btn btn-primary btn-sm" disabled={busy}>{busy ? "Sending…" : "Send ticket"}</button>
          </form>
          {msg ? (
            <p role={msg.tone === "error" ? "alert" : "status"} className={`mt-3 rounded-[2px] border px-3 py-2 text-sm ${msg.tone === "error" ? "border-danger/40 bg-danger/10 text-danger" : "border-accent/40 bg-accent/10 text-chalk"}`}>{msg.text}</p>
          ) : null}
        </section>

        <section aria-labelledby="tickets">
          <h2 id="tickets" className="font-display text-base font-extrabold uppercase tracking-[0.04em]">Your tickets</h2>
          {tickets.length === 0 ? (
            <p className="mt-3 text-sm text-dim">No tickets yet.</p>
          ) : (
            <ul className="mt-3 space-y-3">
              {tickets.map((t) => (
                <li key={t.id} className="card p-4">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <p className="min-w-0 break-words font-semibold text-chalk">{t.subject}</p>
                    <span className={`rounded-[2px] border px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.1em] ${t.status === "answered" ? "border-accent/40 bg-accent/10 text-accent" : t.status === "open" ? "border-gold/40 bg-gold/10 text-gold" : "border-tint/10 bg-steel text-ash"}`}>
                      {STATUS[t.status]}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-dim">{date(t.createdAt)}</p>
                  <p className="mt-2 whitespace-pre-wrap break-words text-sm text-ash">{t.body}</p>
                  {t.adminReply ? (
                    <div className="mt-3 rounded-[2px] border border-accent/30 bg-accent/6 p-3">
                      <p className="text-xs uppercase tracking-[0.1em] text-accent">Riderzpro support{t.repliedAt ? ` · ${date(t.repliedAt)}` : ""}</p>
                      <p className="mt-1 whitespace-pre-wrap break-words text-sm text-chalk">{t.adminReply}</p>
                    </div>
                  ) : null}
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      <section aria-labelledby="faq">
        <h2 id="faq" className="mb-3 font-display text-base font-extrabold uppercase tracking-[0.04em]">Common questions</h2>
        <Accordion items={FAQ} />
      </section>
    </div>
  );
}
