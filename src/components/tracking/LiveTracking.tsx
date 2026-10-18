"use client";

import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { useCallback, useMemo, useRef, useState } from "react";
import { usePoll } from "@/lib/client/hooks";
import { MapPin } from "lucide-react";
import { ApiFailure, api } from "@/lib/vendor/client";
import { STALE_AFTER_S, TRACK_POLL_MS, fmtAge, fmtDistance, type CustomerTracking, type CustomerTrackingJob } from "@/lib/tracking/geo";
import type { MapMarker } from "./TrackingMap";

const TrackingMap = dynamic(() => import("./TrackingMap").then((m) => m.TrackingMap), {
  ssr: false,
  loading: () => <div className="h-72 w-full animate-pulse rounded-sm bg-tint/5" aria-hidden />,
});

const timeOf = (iso: string) => new Date(iso).toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit", timeZone: "Asia/Kolkata" });

/**
 * Live rider tracking on the customer's order page. Polls every 10 s while a rider job is live
 * and the tab is visible; stops (and refreshes the page) once nothing is live any more.
 */
export function LiveTracking({ number, sellers = {} }: { number: string; sellers?: Record<string, string> }) {
  const router = useRouter();
  const [data, setData] = useState<CustomerTracking | null>(null);
  const [failed, setFailed] = useState(false);
  const live = useRef(true);

  const load = useCallback(async () => {
    if (!live.current) return;
    try {
      const r = await api<{ tracking: CustomerTracking }>(`/api/account/orders/${encodeURIComponent(number)}/tracking`);
      setData(r.tracking);
      setFailed(false);
      if (!r.tracking.live) {
        live.current = false;
        router.refresh(); // the order page shows "Delivered" and drops the code
      }
    } catch (err) {
      if (err instanceof ApiFailure && (err.status === 401 || err.status === 404)) live.current = false;
      setFailed(true);
    }
  }, [number, router]);

  usePoll(load, TRACK_POLL_MS);

  const moving = data?.jobs.filter((j) => j.status === "picked_up") ?? [];
  const markers = useMemo<MapMarker[]>(() => {
    if (!data?.deliveryPoint) return [];
    const out: MapMarker[] = [
      { id: "home", lat: data.deliveryPoint.lat, lng: data.deliveryPoint.lng, kind: data.deliveryPoint.approximate ? "home-approx" : "home", label: data.deliveryPoint.approximate ? "Your area (approximate)" : "Delivery address" },
    ];
    for (const j of data.jobs) {
      if (j.rider) out.push({ id: j.key, lat: j.rider.lat, lng: j.rider.lng, kind: j.rider.ageS > STALE_AFTER_S ? "rider-stale" : "rider", label: `${j.riderFirstName} (rider)` });
    }
    return out;
  }, [data]);
  const route = moving.find((j) => j.route)?.route ?? null;

  if (!data) {
    return failed ? null : <div className="card h-24 animate-pulse p-4" aria-hidden />;
  }
  const jobs = data.jobs.filter((j) => j.status !== "offered");
  if (jobs.length === 0) return null;
  const arrived = moving.find((j) => j.arrived);
  const arriving = moving.find((j) => j.arriving && !j.arrived);

  return (
    <section className="card space-y-4 p-4 sm:p-5" aria-label="Live delivery tracking">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs font-bold uppercase tracking-[0.12em] text-dim">Live tracking</p>
        {data.live && (
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-accent">
            <span aria-hidden className="h-2 w-2 animate-pulse rounded-full bg-accent" /> Updating
          </span>
        )}
      </div>

      <div aria-live="polite">
        {arrived ? (
          <p className="rounded-sm border border-accent/40 bg-accent/10 px-3 py-2 text-sm font-semibold text-chalk">
            {arrived.riderFirstName} has arrived. Keep your 4-digit code ready.
          </p>
        ) : arriving ? (
          <p className="rounded-sm border border-gold/40 bg-gold/10 px-3 py-2 text-sm font-semibold text-chalk">
            {arriving.riderFirstName} is arriving, less than 500 m away.
          </p>
        ) : null}
      </div>

      {moving.length > 0 && data.deliveryPoint && <TrackingMap markers={markers} route={route} label={`Map of your delivery for order ${number}`} />}
      {moving.length > 0 && !data.deliveryPoint && (
        <p className="flex items-start gap-2 rounded-sm bg-tint/5 px-3 py-2 text-sm text-ash">
          <MapPin size={15} className="mt-0.5 shrink-0 text-dim" aria-hidden />
          We couldn&apos;t place your address on the map, so you&apos;ll see the rider&apos;s progress here instead.
        </p>
      )}
      {data.deliveryPoint?.approximate && moving.length > 0 && (
        <p className="text-xs text-dim">Your address is shown approximately (by area), so &quot;arriving&quot; alerts are not sent.</p>
      )}

      <ul className="space-y-4">
        {jobs.map((j) => (
          <JobLine key={j.key} job={j} seller={jobs.length > 1 ? sellers[j.key] : undefined} />
        ))}
      </ul>
    </section>
  );
}

function JobLine({ job: j, seller }: { job: CustomerTrackingJob; seller?: string }) {
  const reached = j.steps.reduce((n, s, i) => (s.at ? i : n), -1);
  const headline =
    j.status === "delivered"
      ? "Delivered"
      : j.status === "accepted"
        ? `${j.riderFirstName} is collecting your order from the seller`
        : j.arrived
          ? `${j.riderFirstName} is at your address`
          : `${j.riderFirstName} is on the way`;
  return (
    <li className="min-w-0">
      {seller && <p className="text-xs text-dim">From {seller}</p>}
      <p className="font-semibold text-chalk">{headline}</p>
      {j.status === "picked_up" && (
        <p className="mt-0.5 text-sm text-ash tnum">
          {j.etaMin !== null && !j.arrived && (
            <>
              About <span className="font-semibold text-chalk">{j.etaMin} min</span>
              {j.etaSource === "line" ? " (estimate)" : ""}
            </>
          )}
          {j.distanceM !== null && !j.arrived && ` · ${fmtDistance(j.distanceM)} away`}
          {j.rider && j.rider.ageS > STALE_AFTER_S && ` · last seen ${fmtAge(j.rider.ageS)}`}
          {!j.rider && "Waiting for the rider's location"}
        </p>
      )}
      <ol className="mt-3 grid grid-cols-5 gap-1" aria-label="Delivery progress">
        {j.steps.map((s, i) => (
          <li key={s.key} className="min-w-0">
            <span className={`block h-1.5 rounded-full ${i <= reached ? "bg-accent" : "bg-tint/10"}`} />
            <span className={`mt-1.5 block truncate text-[11px] ${i <= reached ? "font-semibold text-chalk" : "text-dim"}`}>{s.label}</span>
            {s.at && <span className="block truncate text-[10px] text-dim tnum">{timeOf(s.at)}</span>}
          </li>
        ))}
      </ol>
    </li>
  );
}
