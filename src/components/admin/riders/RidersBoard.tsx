"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { AdminRider } from "@/lib/server/riders";
import { RIDER_STATUS_LABELS, needsLicence, vehicleLabel } from "@/lib/rider/types";
import { api, ApiFailure } from "@/lib/vendor/client";
import { rupees } from "@/lib/format";
import { fmtDate, Notice, StatusBadge } from "@/components/admin/vendors/ui";

type Action = "approve" | "request_changes" | "reject" | "suspend" | "reinstate";
const ACTIONS: Record<AdminRider["status"], { action: Action; label: string; primary?: boolean }[]> = {
  applied: [
    { action: "approve", label: "Approve", primary: true },
    { action: "request_changes", label: "Ask for changes" },
    { action: "reject", label: "Reject" },
  ],
  changes_requested: [{ action: "reject", label: "Reject" }],
  approved: [{ action: "suspend", label: "Suspend" }],
  suspended: [{ action: "reinstate", label: "Reinstate", primary: true }],
  rejected: [],
};

function RiderCard({ r }: { r: AdminRider }) {
  const router = useRouter();
  const [note, setNote] = useState("");
  const [checked, setChecked] = useState(false);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ tone: "ok" | "error"; text: string } | null>(null);

  async function act(action: Action) {
    setBusy(true);
    setMsg(null);
    try {
      await api(`/api/admin/riders/${r.id}`, { body: { action, note: note || undefined, checked } });
      setMsg({ tone: "ok", text: "Saved." });
      router.refresh();
    } catch (e) {
      setMsg({ tone: "error", text: e instanceof ApiFailure ? (e.fields.checked ?? e.fields.note ?? e.message) : "Something went wrong." });
      if (e instanceof ApiFailure && e.status === 409) router.refresh();
    } finally {
      setBusy(false);
    }
  }

  const actions = ACTIONS[r.status];
  return (
    <li className="card p-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="font-semibold text-chalk">
            {r.name} {r.online && r.status === "approved" ? <span className="ml-1 text-xs font-bold text-accent">● online</span> : null}
          </p>
          <p className="text-xs text-dim">
            <a href={`tel:+91${r.mobile}`} className="text-accent hover:underline tnum">+91 {r.mobile}</a> · {r.city} · {vehicleLabel(r.vehicleType)}
            {r.vehicleNumber ? ` · ${r.vehicleNumber}` : ""} · applied {fmtDate(r.createdAt)}
          </p>
          {r.status === "approved" || r.status === "suspended" ? (
            <p className="mt-1 text-xs text-ash">
              {r.delivered} delivered · {r.liveJobs} live · {rupees(r.unpaid)} unpaid
            </p>
          ) : null}
        </div>
        <StatusBadge status={r.status} label={RIDER_STATUS_LABELS[r.status]} />
      </div>
      {r.reviewNote ? <p className="mt-2 text-sm text-ash">Note: {r.reviewNote}{r.reviewedBy ? ` (${r.reviewedBy}, ${fmtDate(r.reviewedAt)})` : ""}</p> : null}
      {actions.length > 0 && (
        <div className="mt-3 space-y-2">
          {r.status === "applied" && (
            <label className="flex items-start gap-2 text-sm text-ash">
              <input type="checkbox" checked={checked} onChange={(e) => setChecked(e.target.checked)} className="mt-0.5 h-4 w-4 accent-[var(--accent)]" />
              {needsLicence(r.vehicleType)
                ? "I checked their driving licence, RC and insurance in person, and the name and vehicle number match."
                : "I met the rider and checked their identity and vehicle."}
            </label>
          )}
          <textarea className="field min-h-16 py-2" placeholder="Note for the rider (needed to ask for changes, reject or suspend)" value={note} onChange={(e) => setNote(e.target.value)} maxLength={500} />
          <div className="flex flex-wrap gap-2">
            {actions.map((a) => (
              <button key={a.action} type="button" className={`btn btn-sm ${a.primary ? "btn-primary" : "btn-outline"}`} disabled={busy} onClick={() => act(a.action)}>
                {a.label}
              </button>
            ))}
          </div>
        </div>
      )}
      {msg ? <div className="mt-3"><Notice tone={msg.tone}>{msg.text}</Notice></div> : null}
    </li>
  );
}

export default function RidersBoard({ items }: { items: AdminRider[] }) {
  if (items.length === 0) return <div className="card mt-8 p-8 text-center text-sm text-ash">No riders here.</div>;
  return <ul className="mt-6 space-y-3">{items.map((r) => <RiderCard key={r.id} r={r} />)}</ul>;
}
