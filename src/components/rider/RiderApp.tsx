"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { MapPin, Navigation, Package, Phone } from "lucide-react";
import { ApiFailure, api } from "@/lib/vendor/client";
import { rupees } from "@/lib/format";
import { JOB_LABELS, type RiderEarnings, type RiderJobView, type RiderSelf } from "@/lib/rider/types";
import { Notice } from "@/components/vendor/auth/fields";
import { LocationShare } from "./LocationShare";

type Jobs = { live: RiderJobView[]; done: RiderJobView[] };
const POLL_MS = 15_000;
const mapsHref = (address: string) => `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`;
const time = (iso: string | null) => (iso ? new Date(iso).toLocaleString("en-IN", { day: "numeric", month: "short", hour: "numeric", minute: "2-digit", timeZone: "Asia/Kolkata" }) : "");

/** The rider's working screen. Polls for new jobs while open. */
export function RiderApp({ rider, initialJobs, initialEarnings }: { rider: RiderSelf; initialJobs: Jobs; initialEarnings: RiderEarnings }) {
  const router = useRouter();
  const [jobs, setJobs] = useState(initialJobs);
  const [earnings, setEarnings] = useState(initialEarnings);
  const [online, setOnline] = useState(rider.online);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const r = await api<Jobs & { earnings: RiderEarnings }>("/api/rider/jobs");
      setJobs({ live: r.live, done: r.done });
      setEarnings(r.earnings);
    } catch (err) {
      if (err instanceof ApiFailure && (err.status === 401 || err.status === 403)) router.replace("/rider");
    }
  }, [router]);

  useEffect(() => {
    const tick = () => document.visibilityState === "visible" && void load();
    const t = window.setInterval(tick, POLL_MS);
    document.addEventListener("visibilitychange", tick);
    return () => {
      window.clearInterval(t);
      document.removeEventListener("visibilitychange", tick);
    };
  }, [load]);

  async function toggleOnline() {
    setError(null);
    try {
      await api("/api/rider/online", { body: { online: !online } });
      setOnline(!online);
    } catch (err) {
      setError(err instanceof ApiFailure ? err.message : "Couldn't change that. Try again.");
    }
  }

  const offers = jobs.live.filter((j) => j.status === "offered");
  const active = jobs.live.filter((j) => j.status !== "offered");
  // Live tracking: the phone shares its position only for these (accepted or picked up).
  const tracked = active.filter((j) => j.status === "accepted" || j.status === "picked_up").map((j) => j.id);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="eyebrow">Hi {rider.name.split(/\s+/)[0]}</p>
          <h1 className="font-display text-2xl font-extrabold tracking-tight text-chalk">Your deliveries</h1>
        </div>
        <button
          type="button"
          onClick={toggleOnline}
          aria-pressed={online}
          className={`inline-flex min-h-11 items-center gap-2 rounded-full px-4 text-sm font-bold ${online ? "bg-accent text-on-accent" : "border border-tint/20 text-ash"}`}
        >
          <span aria-hidden className={`h-2.5 w-2.5 rounded-full ${online ? "bg-on-accent" : "bg-tint/30"}`} />
          {online ? "Online: taking jobs" : "Offline"}
        </button>
      </div>
      {error && <Notice tone="error">{error}</Notice>}

      <dl className="grid grid-cols-3 gap-2">
        {[
          ["Today", rupees(earnings.today)],
          ["To be paid", rupees(earnings.unpaid)],
          ["Paid so far", rupees(earnings.paid)],
        ].map(([k, val]) => (
          <div key={k} className="card p-3">
            <dt className="text-[11px] font-bold uppercase tracking-[0.12em] text-dim">{k}</dt>
            <dd className="mt-1 font-display text-lg font-extrabold text-chalk tnum">{val}</dd>
          </div>
        ))}
      </dl>

      {offers.length > 0 && (
        <section aria-label="New offers" className="space-y-3">
          <h2 className="text-xs font-bold uppercase tracking-[0.14em] text-accent">New offers</h2>
          {offers.map((j) => (
            <JobCard key={j.id} job={j} onDone={load} />
          ))}
        </section>
      )}

      <section aria-label="Active deliveries" className="space-y-3">
        <h2 className="text-xs font-bold uppercase tracking-[0.14em] text-dim">Active</h2>
        <LocationShare jobIds={tracked} initialConsent={rider.locationConsent} onStale={load} />
        {active.length === 0 ? (
          <p className="card p-5 text-sm text-ash">{online ? "No active deliveries. New offers appear here." : "Go online to receive delivery offers."}</p>
        ) : (
          active.map((j) => <JobCard key={j.id} job={j} onDone={load} />)
        )}
      </section>

      {jobs.done.length > 0 && (
        <section aria-label="Recent deliveries">
          <h2 className="text-xs font-bold uppercase tracking-[0.14em] text-dim">Recent</h2>
          <ul className="mt-3 divide-y divide-tint/10 border-y border-tint/10 text-sm">
            {jobs.done.map((j) => (
              <li key={j.id} className="flex items-center justify-between gap-3 py-3">
                <span className="min-w-0 truncate text-ash">
                  <span className="font-semibold text-chalk tnum">{j.orderNumber}</span> · {j.pickupName} → {j.dropArea}
                </span>
                <span className={`shrink-0 text-xs font-bold ${j.status === "delivered" ? "text-chalk" : "text-dim"}`}>
                  {j.status === "delivered" ? rupees(j.earning) : JOB_LABELS[j.status]}
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {earnings.payouts.length > 0 && (
        <section aria-label="Payouts">
          <h2 className="text-xs font-bold uppercase tracking-[0.14em] text-dim">Payouts</h2>
          <ul className="mt-3 space-y-2 text-sm">
            {earnings.payouts.map((p) => (
              <li key={p.id} className="card flex justify-between gap-3 p-3">
                <span className="text-ash">
                  {time(p.createdAt)} · {p.jobs} {p.jobs === 1 ? "delivery" : "deliveries"} · ref {p.reference}
                </span>
                <span className="font-semibold text-chalk tnum">{rupees(p.amount)}</span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}

function JobCard({ job: j, onDone }: { job: RiderJobView; onDone: () => Promise<void> }) {
  const [busy, setBusy] = useState(false);
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);

  async function act(body: Record<string, unknown>) {
    setBusy(true);
    setError(null);
    try {
      await api(`/api/rider/jobs/${j.id}`, { body });
      setCode("");
      await onDone();
    } catch (err) {
      setError(err instanceof ApiFailure ? err.message : "Something went wrong. Try again.");
      await onDone();
    } finally {
      setBusy(false);
    }
  }

  const step = j.status === "offered" ? null : j.status === "accepted" ? "pickup" : "drop";
  return (
    <article className={`card space-y-3 p-4 ${j.status === "offered" ? "border-accent" : ""}`}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.12em] text-dim">
            {JOB_LABELS[j.status]} · <span className="tnum">{j.orderNumber}</span>
          </p>
          <p className="mt-1 text-sm text-ash">
            <Package size={14} className="mr-1 inline text-dim" aria-hidden />
            {j.items.map((i) => `${i.qty} × ${i.title}`).join(", ")}
          </p>
        </div>
        <p className="shrink-0 font-display text-2xl font-extrabold text-chalk tnum">{rupees(j.earning)}</p>
      </div>

      <ol className="space-y-2 text-sm">
        <li className={`rounded-sm border p-3 ${step === "pickup" ? "border-accent" : "border-tint/10"}`}>
          <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-dim">Pick up from</p>
          <p className="mt-1 font-semibold text-chalk">{j.pickupName}</p>
          <p className="text-ash">{j.pickupAddress}</p>
          {step === "pickup" && (
            <div className="mt-2 flex flex-wrap gap-2">
              <a className="btn btn-outline btn-sm" href={mapsHref(j.pickupAddress)} target="_blank" rel="noreferrer noopener"><Navigation size={14} aria-hidden /> Directions</a>
              {j.pickupPhone && <a className="btn btn-outline btn-sm" href={`tel:+91${j.pickupPhone}`}><Phone size={14} aria-hidden /> Call seller</a>}
            </div>
          )}
        </li>
        <li className={`rounded-sm border p-3 ${step === "drop" ? "border-accent" : "border-tint/10"}`}>
          <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-dim">Deliver to</p>
          <p className="mt-1 font-semibold text-chalk">{j.dropName}</p>
          <p className="text-ash">
            <MapPin size={13} className="mr-1 inline text-dim" aria-hidden />
            {j.dropAddress ?? `${j.dropArea} (full address after you accept)`}
          </p>
          {step === "drop" && j.dropAddress && (
            <div className="mt-2 flex flex-wrap gap-2">
              <a className="btn btn-outline btn-sm" href={mapsHref(j.dropAddress)} target="_blank" rel="noreferrer noopener"><Navigation size={14} aria-hidden /> Directions</a>
              {j.dropPhone && <a className="btn btn-outline btn-sm" href={`tel:+91${j.dropPhone}`}><Phone size={14} aria-hidden /> Call customer</a>}
            </div>
          )}
        </li>
      </ol>
      {j.note && <p className="text-sm text-ash"><span className="font-semibold text-chalk">Note:</span> {j.note}</p>}
      {error && <Notice tone="error">{error}</Notice>}

      {j.status === "offered" && (
        <div className="grid grid-cols-2 gap-2">
          <button type="button" className="btn btn-outline" disabled={busy} onClick={() => act({ action: "decline" })}>Decline</button>
          <button type="button" className="btn btn-primary" disabled={busy} onClick={() => act({ action: "accept" })}>Accept</button>
        </div>
      )}
      {j.status === "accepted" && (
        <div className="grid grid-cols-[auto_1fr] gap-2">
          <button type="button" className="btn btn-outline" disabled={busy} onClick={() => window.confirm("Give this delivery back? It will be offered to another rider.") && act({ action: "decline", reason: "Given back after accepting" })}>Give back</button>
          <button type="button" className="btn btn-primary" disabled={busy} onClick={() => act({ action: "pickup" })}>I&apos;ve picked it up</button>
        </div>
      )}
      {j.status === "picked_up" && (
        j.codeLocked ? (
          <Notice tone="warn">Too many wrong codes. Call rider support to finish this delivery.</Notice>
        ) : (
          <form
            className="flex flex-wrap items-end gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              void act({ action: "deliver", code });
            }}
          >
            <label className="min-w-40 flex-1">
              <span className="label">Customer&apos;s 4-digit code</span>
              <input className="field tracking-[0.4em] tnum" inputMode="numeric" autoComplete="off" maxLength={4} value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 4))} />
            </label>
            <button type="submit" className="btn btn-primary" disabled={busy || code.length !== 4}>Delivered</button>
          </form>
        )
      )}
    </article>
  );
}
