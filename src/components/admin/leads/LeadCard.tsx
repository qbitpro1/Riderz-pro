"use client";

import { useState } from "react";
import { api, ApiFailure } from "@/lib/vendor/client";
import type { AdminLead } from "@/lib/server/leads";

const NEXT: Record<AdminLead["status"], { to: AdminLead["status"]; label: string }[]> = {
  new: [{ to: "contacted", label: "Mark contacted" }, { to: "closed", label: "Close" }],
  contacted: [{ to: "closed", label: "Close" }, { to: "new", label: "Back to new" }],
  closed: [{ to: "new", label: "Reopen" }],
};

/** One request from a WhatsApp form, with its status buttons. */
export function LeadCard({ lead }: { lead: AdminLead }) {
  const [status, setStatus] = useState(lead.status);
  const [note, setNote] = useState(lead.note ?? "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const move = async (to: AdminLead["status"]) => {
    setBusy(true);
    setError(null);
    try {
      await api(`/api/admin/leads/${lead.id}`, { body: { status: to, note: note || undefined } });
      setStatus(to);
    } catch (e) {
      setError(e instanceof ApiFailure ? e.message : "Something went wrong.");
    } finally {
      setBusy(false);
    }
  };
  const when = new Date(lead.createdAt).toLocaleString("en-IN", { timeZone: "Asia/Kolkata", day: "numeric", month: "short", hour: "numeric", minute: "2-digit" });
  return (
    <article className="card p-4 text-sm">
      <div className="flex flex-wrap items-center gap-2">
        <span className="chip border-accent/35 bg-accent/10 text-accent">{lead.kindLabel}</span>
        <span className="font-semibold text-chalk">{lead.name ?? "No name given"}</span>
        {lead.phone && <a href={`tel:+91${lead.phone.replace(/\D/g, "").slice(-10)}`} className="text-accent underline underline-offset-4">{lead.phone}</a>}
        {lead.email && <span className="text-ash">{lead.email}</span>}
        {lead.city && <span className="text-ash">· {lead.city}</span>}
        {lead.signedIn && <span className="text-xs text-dim">· signed-in customer</span>}
        <span className="ml-auto text-xs text-dim">{when}</span>
        <span className={`text-[10px] font-bold uppercase ${status === "new" ? "text-gold" : status === "contacted" ? "text-accent" : "text-dim"}`}>{status}</span>
      </div>
      <pre className="mt-3 whitespace-pre-wrap break-words font-sans text-xs leading-relaxed text-chalk/85">{lead.message}</pre>
      {lead.page && <p className="mt-2 text-[11px] text-dim">From {lead.page}</p>}
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <input aria-label="Note" className="field h-9 max-w-xs flex-1" value={note} onChange={(e) => setNote(e.target.value)} placeholder="Note (optional)" maxLength={500} />
        {NEXT[status].map((n) => (
          <button key={n.to} type="button" className="btn btn-outline btn-sm" disabled={busy} onClick={() => move(n.to)}>{n.label}</button>
        ))}
      </div>
      {error && <p role="alert" className="mt-2 text-xs text-danger">{error}</p>}
    </article>
  );
}
