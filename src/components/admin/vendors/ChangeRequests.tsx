"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import type { ChangeRequestItem } from "@/lib/server/admin-vendors";
import { api, ApiFailure } from "@/lib/vendor/client";
import { Field, fmtDate, Modal, Notice, StatusBadge } from "./ui";

export default function ChangeRequests({ items }: { items: ChangeRequestItem[] }) {
  const router = useRouter();
  const [target, setTarget] = useState<{ item: ChangeRequestItem; action: "approve" | "reject" } | null>(null);
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ tone: "ok" | "error"; text: string } | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  function close() {
    setTarget(null);
    setNote("");
    setErrors({});
  }

  async function submit() {
    if (!target) return;
    setBusy(true);
    setErrors({});
    try {
      await api(`/api/admin/change-requests/${target.item.id}`, { body: { action: target.action, note } });
      setMsg({ tone: "ok", text: target.action === "approve" ? "Bank details updated. The seller has been notified." : "Request declined. The seller has been notified." });
      close();
      router.refresh();
    } catch (e) {
      if (e instanceof ApiFailure) {
        setErrors(e.fields);
        setMsg({ tone: "error", text: e.message });
        if (e.status === 409) {
          close();
          router.refresh();
        }
      } else setMsg({ tone: "error", text: "Something went wrong." });
    } finally {
      setBusy(false);
    }
  }

  if (items.length === 0) return <div className="card mt-8 p-8 text-center text-sm text-ash">No change requests yet.</div>;

  return (
    <div className="mt-6">
      {msg ? <div className="mb-3"><Notice tone={msg.tone}>{msg.text}</Notice></div> : null}
      <ul className="space-y-3">
        {items.map((c) => (
          <li key={c.id} className="card p-4">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div className="min-w-0">
                <Link href={`/admin/vendors/${c.vendorId}`} className="font-display text-base font-extrabold uppercase hover:text-accent">{c.storeName ?? c.vendorId}</Link>
                <p className="mt-1 text-sm text-chalk">{c.summary}</p>
                <p className="mt-1 text-xs text-dim">Current: {c.currentBank ?? "none on file"}</p>
                <p className="text-xs text-dim">Requested {fmtDate(c.createdAt)}{c.decidedAt ? ` · decided ${fmtDate(c.decidedAt)} by ${c.decidedBy}` : ""}</p>
              </div>
              <StatusBadge status={c.status} />
            </div>
            {c.status === "pending" ? (
              <div className="mt-3 flex flex-wrap gap-2">
                <button type="button" className="btn btn-primary btn-sm" onClick={() => setTarget({ item: c, action: "approve" })}>Approve</button>
                <button type="button" className="btn btn-outline btn-sm border-danger/50 text-danger" onClick={() => setTarget({ item: c, action: "reject" })}>Reject</button>
              </div>
            ) : null}
          </li>
        ))}
      </ul>

      <Modal open={Boolean(target)} title={target?.action === "approve" ? "Approve bank change" : "Reject bank change"} onClose={close}>
        {target ? (
          <>
            <p className="mb-3 text-sm text-ash">
              {target.action === "approve"
                ? "The new account replaces the current one for all future payouts. Compare it with the cancelled cheque the seller has on file before approving."
                : "The seller keeps the current account and sees your reason."}
            </p>
            <p className="mb-3 rounded-[2px] border border-tint/10 bg-steel p-2 text-sm">{target.item.summary}</p>
            <Field label={target.action === "approve" ? "Note (optional)" : "Reason"} error={errors.note}>
              <textarea data-autofocus className="field min-h-20 py-2" value={note} onChange={(e) => setNote(e.target.value)} maxLength={500} />
            </Field>
            <div className="mt-5 flex justify-end gap-2">
              <button type="button" className="btn btn-outline btn-sm" onClick={close}>Cancel</button>
              <button type="button" className="btn btn-primary btn-sm" disabled={busy} onClick={submit}>{target.action === "approve" ? "Approve" : "Reject"}</button>
            </div>
          </>
        ) : null}
      </Modal>
    </div>
  );
}
