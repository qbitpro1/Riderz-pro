"use client";

import { useState } from "react";
import { FileText, Lock, Paperclip, Send, X } from "lucide-react";
import { api, uploadFile } from "@/lib/vendor/client";

/** One message in a frozen seller's conversation (src/lib/server/vendor-hold.ts). */
export type HoldMessageView = {
  id: string;
  from: "admin" | "vendor";
  author: string;
  body: string;
  files: { id: string; name: string; mime: string; size: number }[];
  createdAt: string;
};

const when = (iso: string) =>
  new Date(iso).toLocaleString("en-IN", { timeZone: "Asia/Kolkata", day: "numeric", month: "short", hour: "numeric", minute: "2-digit" });
const kb = (n: number) => (n > 1024 * 1024 ? `${(n / 1024 / 1024).toFixed(1)} MB` : `${Math.max(1, Math.round(n / 1024))} KB`);
const failure = (err: unknown) => (err instanceof Error ? err.message : "Something went wrong. Please try again.");

/** The messages, oldest first. `fileBase` is where documents open (seller: /api/files, admin: /api/admin/files). */
export function HoldMessages({ messages, fileBase, viewer }: { messages: HoldMessageView[]; fileBase: string; viewer: "admin" | "vendor" }) {
  if (messages.length === 0) return <p className="text-sm text-ash">No messages yet.</p>;
  return (
    <ol className="space-y-3">
      {messages.map((m) => {
        const mine = m.from === viewer;
        return (
          <li key={m.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
            <div className={`max-w-[90%] rounded-[2px] border px-3.5 py-2.5 text-sm ${m.from === "admin" ? "border-danger/30 bg-danger/5" : "border-tint/15 bg-tint/5"}`}>
              <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-dim">
                {m.from === "admin" ? (viewer === "admin" ? `Riderzpro · ${m.author}` : m.author) : `Seller · ${m.author}`} · {when(m.createdAt)}
              </p>
              <p className="mt-1 whitespace-pre-wrap text-chalk">{m.body}</p>
              {m.files.length > 0 && (
                <ul className="mt-2 flex flex-wrap gap-2">
                  {m.files.map((f) => (
                    <li key={f.id}>
                      <a
                        href={`${fileBase}/${f.id}`}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 rounded-[2px] border border-tint/15 px-2 py-1 text-xs text-accent hover:border-accent"
                      >
                        <FileText size={13} aria-hidden /> {f.name} · {kb(f.size)}
                      </a>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </li>
        );
      })}
    </ol>
  );
}

/**
 * The seller's dashboard while their account is frozen: the admin's message, the conversation,
 * and a reply box with supporting documents. Shown in place of every dashboard page.
 */
export function FrozenAccountLock({ initialMessages }: { initialMessages: HoldMessageView[] }) {
  const [messages, setMessages] = useState(initialMessages);
  const [body, setBody] = useState("");
  const [files, setFiles] = useState<{ id: string; name: string; size: number }[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const reason = [...messages].reverse().find((m) => m.from === "admin");

  const attach = async (list: FileList | null) => {
    if (!list?.length) return;
    setError(null);
    setBusy(true);
    try {
      for (const f of Array.from(list).slice(0, 5 - files.length)) {
        const up = await uploadFile("doc_hold_reply", f);
        setFiles((cur) => [...cur, { id: up.id, name: f.name, size: up.size }]);
      }
    } catch (err) {
      setError(failure(err));
    } finally {
      setBusy(false);
    }
  };

  const send = async () => {
    setError(null);
    setSent(false);
    setBusy(true);
    try {
      const r = await api<{ messages: HoldMessageView[] }>("/api/vendor/hold", { body: { body, fileIds: files.map((f) => f.id) } });
      setMessages(r.messages);
      setBody("");
      setFiles([]);
      setSent(true);
    } catch (err) {
      setError(failure(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <section aria-labelledby="frozen-title" className="mx-auto max-w-3xl">
      <div role="alert" className="rounded-[2px] border border-danger/50 bg-danger/10 p-5">
        <div className="flex items-start gap-3">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-danger/15 text-danger">
            <Lock size={20} aria-hidden />
          </span>
          <div className="min-w-0">
            <h1 id="frozen-title" className="font-display text-xl font-extrabold text-danger">Your account is frozen</h1>
            <p className="mt-1 text-sm text-ash">
              Your products are hidden from the Riderzpro website, the Offline Store screen is closed and your dashboard is locked
              until our team lifts the freeze.
            </p>
            {reason && (
              <div className="mt-3 rounded-[2px] border border-danger/30 bg-void/40 p-3">
                <p className="text-[11px] font-bold uppercase tracking-[0.1em] text-danger">Message from Riderzpro</p>
                <p className="mt-1 whitespace-pre-wrap text-sm font-semibold text-chalk">{reason.body}</p>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="card mt-5 p-5">
        <h2 className="eyebrow mb-3">Conversation with Riderzpro</h2>
        <HoldMessages messages={messages} fileBase="/api/files" viewer="vendor" />
      </div>

      <div className="card mt-5 p-5">
        <h2 className="eyebrow mb-3">Reply</h2>
        <label className="label" htmlFor="hold-reply">Your message</label>
        <textarea
          id="hold-reply"
          className="field min-h-28 py-2"
          value={body}
          onChange={(e) => setBody(e.target.value)}
          maxLength={2000}
          placeholder="Explain, and attach any documents that support it."
        />
        {files.length > 0 && (
          <ul className="mt-3 flex flex-wrap gap-2">
            {files.map((f) => (
              <li key={f.id} className="inline-flex items-center gap-1.5 rounded-[2px] border border-tint/15 px-2 py-1 text-xs text-chalk">
                <FileText size={13} aria-hidden /> {f.name} · {kb(f.size)}
                <button type="button" aria-label={`Remove ${f.name}`} className="text-ash hover:text-danger" onClick={() => setFiles((cur) => cur.filter((x) => x.id !== f.id))}>
                  <X size={13} aria-hidden />
                </button>
              </li>
            ))}
          </ul>
        )}
        {error && <p role="alert" className="mt-3 text-sm text-danger">{error}</p>}
        {sent && <p role="status" className="mt-3 text-sm text-accent">Sent. Our team will reply here.</p>}
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <label className={`btn btn-outline btn-sm gap-1.5 ${busy || files.length >= 5 ? "pointer-events-none opacity-60" : "cursor-pointer"}`}>
            <Paperclip size={14} aria-hidden /> Attach document
            <input
              type="file"
              className="sr-only"
              accept="application/pdf,image/jpeg,image/png,image/webp"
              multiple
              disabled={busy || files.length >= 5}
              onChange={(e) => {
                void attach(e.target.files);
                e.target.value = "";
              }}
            />
          </label>
          <button type="button" className="btn btn-primary btn-sm gap-1.5" disabled={busy || body.trim().length < 2} onClick={send}>
            <Send size={14} aria-hidden /> {busy ? "Working…" : "Send reply"}
          </button>
          <span className="text-xs text-dim">PDF, JPG, PNG or WebP, up to 5 MB each, 5 per reply.</span>
        </div>
      </div>
    </section>
  );
}

/** Admin seller page: the freeze conversation and, while frozen, a reply box. */
export function AdminHoldPanel({ vendorId, frozen, initialMessages }: { vendorId: string; frozen: boolean; initialMessages: HoldMessageView[] }) {
  const [messages, setMessages] = useState(initialMessages);
  const [body, setBody] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  if (!frozen && messages.length === 0) return null;

  const send = async () => {
    setError(null);
    setBusy(true);
    try {
      const r = await api<{ messages: HoldMessageView[] }>(`/api/admin/vendors/${vendorId}/hold`, { body: { body } });
      setMessages(r.messages);
      setBody("");
    } catch (err) {
      setError(failure(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <section aria-labelledby="hold-title" className={`card p-4 md:p-5 ${frozen ? "border-danger/40" : ""}`}>
      <h2 id="hold-title" className="mb-3 flex items-center gap-2 font-display text-sm font-extrabold uppercase tracking-[0.06em]">
        <Lock size={14} aria-hidden /> Account freeze · messages
        {frozen ? <span className="text-[10px] text-danger">frozen now</span> : <span className="text-[10px] text-dim">history</span>}
      </h2>
      <HoldMessages messages={messages} fileBase="/api/admin/files" viewer="admin" />
      {frozen && (
        <div className="mt-4">
          <label className="label" htmlFor="hold-admin-reply">Reply to the seller</label>
          <textarea id="hold-admin-reply" className="field min-h-20 py-2" value={body} onChange={(e) => setBody(e.target.value)} maxLength={2000} />
          {error && <p role="alert" className="mt-2 text-sm text-danger">{error}</p>}
          <button type="button" className="btn btn-outline btn-sm mt-3 gap-1.5" disabled={busy || body.trim().length < 2} onClick={send}>
            <Send size={14} aria-hidden /> {busy ? "Sending…" : "Send to seller"}
          </button>
        </div>
      )}
    </section>
  );
}
