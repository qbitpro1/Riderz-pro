"use client";

import { useId, useState } from "react";
import Link from "next/link";
import { api, ApiFailure } from "@/lib/vendor/client";

export type StoreSettingsValue = {
  aiEnabled: boolean;
  bargainEnabled: boolean;
  maxDiscountPct: number;
  maxDiscountRupees: number | null;
  payOnScreen: boolean;
  payAtCounter: boolean;
};

/** The Offline Store screen: AI salesperson, bargaining limits, ways to pay. */
export function StoreSettingsForm({ initial, fullAi, onlineAvailable }: { initial: StoreSettingsValue; fullAi: boolean; onlineAvailable: boolean }) {
  const uid = useId();
  const [v, setV] = useState(initial);
  const [cap, setCap] = useState(initial.maxDiscountRupees ? String(initial.maxDiscountRupees) : "");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  const box = (k: keyof StoreSettingsValue, title: string, text: string, disabled = false) => (
    <label className={`flex items-start gap-3 rounded-sm border border-tint/15 p-4 ${disabled ? "opacity-60" : "cursor-pointer"}`}>
      <input type="checkbox" className="mt-1 h-4 w-4 accent-[var(--accent)]" checked={Boolean(v[k])} disabled={disabled} onChange={(e) => setV((s) => ({ ...s, [k]: e.target.checked }))} />
      <span>
        <span className="block text-sm font-semibold text-chalk">{title}</span>
        <span className="block text-xs text-ash">{text}</span>
      </span>
    </label>
  );

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setMsg(null);
    try {
      const capN = cap.trim() ? Number(cap.replace(/\D/g, "")) : null;
      const r = await api<{ settings: StoreSettingsValue }>("/api/vendor/store-settings", { method: "PUT", body: { ...v, maxDiscountRupees: capN || null } });
      setV(r.settings);
      setMsg({ ok: true, text: "Saved. Reopen the Offline Store screen to use the new settings." });
    } catch (err) {
      setMsg({ ok: false, text: err instanceof ApiFailure ? err.message : "Couldn't save. Please try again." });
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={save} className="mt-6 max-w-2xl space-y-6">
      <section className="space-y-3">
        <h2 className="eyebrow">Salesman AI</h2>
        {box("aiEnabled", "Show Salesman AI on the screen", "Customers talk or type; it finds your products, compares them, adds them to the order and opens checkout.")}
        {!fullAi && <p className="text-xs text-gold">Salesman AI runs in Basic mode for your shop: it finds, compares and adds products, bargains on the steps below, and opens checkout. The full Salesman AI talks more naturally; Riderzpro is switching it on shop by shop.</p>}
        <Link href="/vendor/dashboard/salesman-ai" className="inline-block text-xs text-ash underline underline-offset-4 hover:text-accent">Practise with Salesman AI</Link>
      </section>

      <section className="space-y-3">
        <h2 className="eyebrow">Bargaining</h2>
        {box("bargainEnabled", "Let the AI give a special price when a customer asks", "Each time the customer asks again it goes one step: 5%, then 7%, then 8% as its “last price”, and 10% only if the customer keeps pushing. It never goes past your limits below. Every price is checked again at checkout. The discount comes off your price.")}
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className="label" htmlFor={`${uid}-pct`}>Most % off one order (0–30)</label>
            <input id={`${uid}-pct`} className="field" inputMode="numeric" value={v.maxDiscountPct} disabled={!v.bargainEnabled}
              onChange={(e) => setV((s) => ({ ...s, maxDiscountPct: Math.min(30, Number(e.target.value.replace(/\D/g, "")) || 0) }))} />
          </div>
          <div>
            <label className="label" htmlFor={`${uid}-cap`}>Most rupees off one order (optional)</label>
            <input id={`${uid}-cap`} className="field" inputMode="numeric" value={cap} disabled={!v.bargainEnabled} onChange={(e) => setCap(e.target.value.replace(/\D/g, "").slice(0, 7))} placeholder="No limit" />
          </div>
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="eyebrow">How customers pay</h2>
        {box("payOnScreen", "Pay on the screen (UPI or card)", "Paid through Riderzpro and settled to you with your usual payouts.", !onlineAvailable)}
        {!onlineAvailable && <p className="text-xs text-gold">Online payment isn&apos;t switched on for Riderzpro yet, so customers pay at your counter for now.</p>}
        {box("payAtCounter", "Pay at my counter", "The order shows on your dashboard; take the money, hand over and press “Paid and handed over”. Not collected in 12 hours: cancelled, stock back.")}
      </section>

      {msg && <p role="status" className={`text-sm ${msg.ok ? "text-accent" : "text-danger"}`}>{msg.text}</p>}
      <button type="submit" className="btn btn-primary" disabled={busy}>{busy ? "Saving…" : "Save"}</button>
    </form>
  );
}
