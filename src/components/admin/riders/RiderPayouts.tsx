"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { AdminRider } from "@/lib/server/riders";
import { api, ApiFailure } from "@/lib/vendor/client";
import { rupees } from "@/lib/format";
import { Notice } from "@/components/admin/vendors/ui";

function Row({ r }: { r: AdminRider }) {
  const router = useRouter();
  const [ref, setRef] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ tone: "ok" | "error"; text: string } | null>(null);
  async function pay() {
    if (!window.confirm(`Record a payment of ${rupees(r.unpaid)} to ${r.name}? Make the bank or UPI transfer first.`)) return;
    setBusy(true);
    setMsg(null);
    try {
      const res = await api<{ payout: { amount: number; jobs: number } }>("/api/admin/rider-payouts", { body: { riderId: r.id, reference: ref } });
      setMsg({ tone: "ok", text: `Recorded ${rupees(res.payout.amount)} for ${res.payout.jobs} deliveries.` });
      router.refresh();
    } catch (e) {
      setMsg({ tone: "error", text: e instanceof ApiFailure ? (e.fields.reference ?? e.message) : "Something went wrong." });
    } finally {
      setBusy(false);
    }
  }
  return (
    <li className="card p-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="font-semibold text-chalk">{r.name}</p>
          <p className="text-xs text-dim tnum">+91 {r.mobile} · {r.delivered} delivered</p>
        </div>
        <p className="font-display text-xl font-extrabold text-chalk tnum">{rupees(r.unpaid)}</p>
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        <input className="field max-w-xs" placeholder="Bank / UPI reference" value={ref} onChange={(e) => setRef(e.target.value)} maxLength={60} />
        <button type="button" className="btn btn-primary btn-sm" disabled={busy || ref.trim().length < 4} onClick={pay}>Record payment</button>
      </div>
      {msg ? <div className="mt-3"><Notice tone={msg.tone}>{msg.text}</Notice></div> : null}
    </li>
  );
}

export default function RiderPayouts({ riders }: { riders: AdminRider[] }) {
  const due = riders.filter((r) => r.unpaid > 0);
  if (due.length === 0) return <div className="card mt-8 p-8 text-center text-sm text-ash">Nothing due to riders.</div>;
  return <ul className="mt-6 space-y-3">{due.map((r) => <Row key={r.id} r={r} />)}</ul>;
}
