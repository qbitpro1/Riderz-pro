"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import type { TicketItem } from "@/lib/server/admin-vendors";
import { api, ApiFailure } from "@/lib/vendor/client";
import { fmtDate, Notice, StatusBadge } from "@/components/admin/vendors/ui";

function Ticket({ t }: { t: TicketItem }) {
  const router = useRouter();
  const [reply, setReply] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ tone: "ok" | "error"; text: string } | null>(null);

  async function act(body: { action: "reply"; reply: string } | { action: "close" }): Promise<boolean> {
    setBusy(true);
    setMsg(null);
    try {
      await api(`/api/admin/support/${t.id}`, { body });
      setMsg({ tone: "ok", text: body.action === "reply" ? "Reply sent." : "Ticket closed." });
      router.refresh();
      return true;
    } catch (e) {
      setMsg({ tone: "error", text: e instanceof ApiFailure ? (e.fields.reply ?? e.message) : "Something went wrong." });
      if (e instanceof ApiFailure && e.status === 409) router.refresh();
      return false;
    } finally {
      setBusy(false);
    }
  }

  return (
    <li className="card p-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="break-words font-semibold text-chalk">{t.subject}</p>
          <p className="text-xs text-dim">
            <Link href={`/admin/vendors/${t.vendorId}`} className="text-accent hover:underline">{t.storeName ?? "Seller"}</Link> · {t.email} · {fmtDate(t.createdAt)}
          </p>
        </div>
        <StatusBadge status={t.status} />
      </div>
      <p className="mt-3 whitespace-pre-wrap break-words text-sm text-ash">{t.body}</p>
      {t.adminReply ? (
        <div className="mt-3 rounded-[2px] border border-tint/10 bg-steel p-3 text-sm">
          <p className="text-xs uppercase tracking-[0.1em] text-dim">Reply by {t.repliedBy} · {fmtDate(t.repliedAt)}</p>
          <p className="mt-1 whitespace-pre-wrap break-words text-chalk">{t.adminReply}</p>
        </div>
      ) : null}
      {t.status !== "closed" ? (
        <div className="mt-3">
          <label className="label" htmlFor={`reply-${t.id}`}>{t.adminReply ? "Send another reply" : "Reply"}</label>
          <textarea id={`reply-${t.id}`} className="field min-h-20 py-2" value={reply} onChange={(e) => setReply(e.target.value)} maxLength={3000} />
          <div className="mt-2 flex flex-wrap gap-2">
            <button type="button" className="btn btn-primary btn-sm" disabled={busy || reply.trim().length < 2} onClick={() => act({ action: "reply", reply }).then((done) => done && setReply(""))}>Send reply</button>
            <button type="button" className="btn btn-outline btn-sm" disabled={busy} onClick={() => act({ action: "close" })}>Close ticket</button>
          </div>
        </div>
      ) : null}
      {msg ? <div className="mt-3"><Notice tone={msg.tone}>{msg.text}</Notice></div> : null}
    </li>
  );
}

export default function SupportInbox({ items }: { items: TicketItem[] }) {
  if (items.length === 0) return <div className="card mt-8 p-8 text-center text-sm text-ash">No tickets here.</div>;
  return <ul className="mt-6 space-y-3">{items.map((t) => <Ticket key={t.id} t={t} />)}</ul>;
}
