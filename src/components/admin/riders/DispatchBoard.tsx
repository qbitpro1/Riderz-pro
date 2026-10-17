"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { AdminJob, AdminRider, DispatchCandidate } from "@/lib/server/riders";
import { JOB_LABELS, RIDER_DEFAULT_PAY, RIDER_PAY_MAX, vehicleLabel } from "@/lib/rider/types";
import { api, ApiFailure } from "@/lib/vendor/client";
import { rupees } from "@/lib/format";
import { fmtDate, Notice, StatusBadge } from "@/components/admin/vendors/ui";

const failure = (e: unknown) => (e instanceof ApiFailure ? (Object.values(e.fields)[0] ?? e.message) : "Something went wrong.");

function Candidate({ c, riders }: { c: DispatchCandidate; riders: AdminRider[] }) {
  const router = useRouter();
  const [riderId, setRiderId] = useState("");
  const [pay, setPay] = useState(String(RIDER_DEFAULT_PAY));
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ tone: "ok" | "error"; text: string } | null>(null);

  async function offer() {
    const earning = Number(pay);
    if (!riderId) return setMsg({ tone: "error", text: "Pick a rider." });
    if (!Number.isInteger(earning) || earning < 0 || earning > RIDER_PAY_MAX) return setMsg({ tone: "error", text: `Pay must be a whole number from 0 to ${RIDER_PAY_MAX}.` });
    setBusy(true);
    setMsg(null);
    try {
      await api("/api/admin/rider-jobs", { body: { vendorOrderId: c.vendorOrderId, riderId, earning, note: note || undefined } });
      router.refresh();
    } catch (e) {
      setMsg({ tone: "error", text: failure(e) });
      if (e instanceof ApiFailure && e.status === 409) router.refresh();
    } finally {
      setBusy(false);
    }
  }

  return (
    <li className="card p-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="font-semibold text-chalk tnum">{c.orderNumber}</p>
          <p className="text-xs text-dim">
            {c.storeName} ({c.pickupCity || "no pickup city"}) → {c.dropCity} {c.dropPincode} · {c.itemCount} item{c.itemCount === 1 ? "" : "s"} · {rupees(c.subtotal)} · {fmtDate(c.createdAt)}
          </p>
        </div>
        <StatusBadge status={c.partStatus} label={c.partStatus === "packed" ? "Packed, ready" : "Accepted, not packed yet"} />
      </div>
      {!c.inArea ? (
        <p className="mt-2 text-sm text-ash">Outside Delhi NCR: the seller ships this by courier.</p>
      ) : riders.length === 0 ? (
        <p className="mt-2 text-sm text-ash">No approved riders yet.</p>
      ) : (
        <div className="mt-3 grid gap-2 sm:grid-cols-[1fr_7rem_1fr_auto] sm:items-end">
          <label>
            <span className="label">Rider</span>
            <select className="field" value={riderId} onChange={(e) => setRiderId(e.target.value)}>
              <option value="">Choose a rider</option>
              {riders.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.online ? "● " : ""}
                  {r.name} · {r.city} · {vehicleLabel(r.vehicleType)} · {r.liveJobs} live
                </option>
              ))}
            </select>
          </label>
          <label>
            <span className="label">Pay (₹)</span>
            <input className="field tnum" inputMode="numeric" value={pay} onChange={(e) => setPay(e.target.value.replace(/\D/g, "").slice(0, 4))} />
          </label>
          <label>
            <span className="label">Note for rider (optional)</span>
            <input className="field" value={note} onChange={(e) => setNote(e.target.value)} maxLength={300} />
          </label>
          <button type="button" className="btn btn-primary" disabled={busy} onClick={offer}>Offer</button>
        </div>
      )}
      {msg ? <div className="mt-3"><Notice tone={msg.tone}>{msg.text}</Notice></div> : null}
    </li>
  );
}

function LiveJob({ j }: { j: AdminJob }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  async function act(body: Record<string, unknown>) {
    setBusy(true);
    setMsg(null);
    try {
      await api(`/api/admin/rider-jobs/${j.id}`, { body });
      router.refresh();
    } catch (e) {
      setMsg(failure(e));
    } finally {
      setBusy(false);
    }
  }
  return (
    <li className="card flex flex-wrap items-center justify-between gap-3 p-4">
      <div className="min-w-0 text-sm">
        <p className="font-semibold text-chalk">
          <span className="tnum">{j.orderNumber}</span> · {j.riderName} <a href={`tel:+91${j.riderMobile}`} className="text-xs text-accent tnum">+91 {j.riderMobile}</a>
        </p>
        <p className="text-xs text-dim">
          {j.pickupName} → {j.dropName}, {j.city} · {rupees(j.earning)} · {fmtDate(j.updatedAt)}
          {j.cancelReason ? ` · ${j.cancelReason}` : ""}
        </p>
        {msg && <p className="mt-1 text-xs text-danger">{msg}</p>}
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <StatusBadge status={j.status} label={j.codeLocked ? "Code locked" : JOB_LABELS[j.status]} />
        {j.codeLocked && <button type="button" className="btn btn-outline btn-sm" disabled={busy} onClick={() => act({ action: "unlock_code" })}>Reset code tries</button>}
        {(j.status === "offered" || j.status === "accepted") && (
          <button
            type="button"
            className="btn btn-outline btn-sm"
            disabled={busy}
            onClick={() => {
              const reason = window.prompt("Why cancel this rider job?");
              if (reason) void act({ action: "cancel", reason });
            }}
          >
            Cancel job
          </button>
        )}
      </div>
    </li>
  );
}

export default function DispatchBoard({ candidates, riders, live, recent }: { candidates: DispatchCandidate[]; riders: AdminRider[]; live: AdminJob[]; recent: AdminJob[] }) {
  const finished = recent.filter((j) => !["offered", "accepted", "picked_up"].includes(j.status));
  return (
    <div className="mt-8 space-y-10">
      <section>
        <h2 className="font-display text-lg font-extrabold uppercase">Ready for a rider</h2>
        {candidates.length === 0 ? <p className="card mt-3 p-6 text-sm text-ash">Nothing waiting. Accepted and packed seller orders appear here.</p> : <ul className="mt-3 space-y-3">{candidates.map((c) => <Candidate key={c.vendorOrderId} c={c} riders={riders} />)}</ul>}
      </section>
      <section>
        <h2 className="font-display text-lg font-extrabold uppercase">On the road</h2>
        {live.length === 0 ? <p className="card mt-3 p-6 text-sm text-ash">No live rider jobs.</p> : <ul className="mt-3 space-y-3">{live.map((j) => <LiveJob key={j.id} j={j} />)}</ul>}
      </section>
      {finished.length > 0 && (
        <section>
          <h2 className="font-display text-lg font-extrabold uppercase">Last 14 days</h2>
          <ul className="mt-3 space-y-3">{finished.map((j) => <LiveJob key={j.id} j={j} />)}</ul>
        </section>
      )}
    </div>
  );
}
