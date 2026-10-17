"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useMemo, useState } from "react";
import { api } from "@/lib/vendor/client";
import { STALE_AFTER_S, TRACK_POLL_MS, fmtAge, fmtDistance, type DispatchRiderPosition } from "@/lib/tracking/geo";
import type { MapMarker } from "@/components/tracking/TrackingMap";

const TrackingMap = dynamic(() => import("@/components/tracking/TrackingMap").then((m) => m.TrackingMap), {
  ssr: false,
  loading: () => <div className="h-80 w-full animate-pulse rounded-sm bg-tint/5" aria-hidden />,
});

/** Live riders' last positions and off-route alerts for the dispatch board (polls while visible). */
export default function LiveRiders() {
  const [riders, setRiders] = useState<DispatchRiderPosition[] | null>(null);
  const [error, setError] = useState(false);

  const load = useCallback(async () => {
    try {
      setRiders((await api<{ riders: DispatchRiderPosition[] }>("/api/admin/rider-locations")).riders);
      setError(false);
    } catch {
      setError(true);
    }
  }, []);

  useEffect(() => {
    void load();
    const tick = () => document.visibilityState === "visible" && void load();
    const t = window.setInterval(tick, TRACK_POLL_MS);
    document.addEventListener("visibilitychange", tick);
    return () => {
      window.clearInterval(t);
      document.removeEventListener("visibilitychange", tick);
    };
  }, [load]);

  const markers = useMemo<MapMarker[]>(() => {
    const out: MapMarker[] = [];
    for (const r of riders ?? []) {
      if (r.point) {
        out.push({
          id: r.jobId,
          lat: r.point.lat,
          lng: r.point.lng,
          kind: r.offRoute ? "alert" : r.point.ageS > STALE_AFTER_S ? "rider-stale" : "rider",
          label: `${r.riderName} · ${r.orderNumber}`,
        });
        if (r.deliveryPoint && r.status === "picked_up") out.push({ id: `${r.jobId}-drop`, ...r.deliveryPoint, kind: "home", label: `${r.dropName} · ${r.orderNumber}` });
      }
    }
    return out;
  }, [riders]);

  if (riders === null) return error ? <p className="mt-3 text-sm text-danger">Couldn&apos;t load rider positions.</p> : null;
  if (riders.length === 0) return null;
  const alerts = riders.filter((r) => r.offRoute);

  return (
    <div className="mt-3 space-y-3">
      {alerts.length > 0 && (
        <ul className="space-y-2" aria-label="Off-route alerts">
          {alerts.map((r) => (
            <li key={r.jobId} role="alert" className="rounded-sm border border-gold/40 bg-gold/10 px-3 py-2 text-sm text-chalk">
              <span className="font-semibold">Off route:</span> {r.riderName} · <span className="tnum">{r.orderNumber}</span>
              {r.offRoute?.detail ? ` · ${r.offRoute.detail}` : ""} · since {new Date(r.offRoute!.since).toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit", timeZone: "Asia/Kolkata" })}
            </li>
          ))}
        </ul>
      )}
      {markers.length > 0 && <TrackingMap markers={markers} className="h-80" label="Live rider positions" />}
      <ul className="divide-y divide-tint/10 border-y border-tint/10 text-sm">
        {riders.map((r) => (
          <li key={r.jobId} className="flex flex-wrap items-center justify-between gap-2 py-2">
            <span className="min-w-0 text-ash">
              <span className="font-semibold text-chalk">{r.riderName}</span> · <span className="tnum">{r.orderNumber}</span> · {r.status === "picked_up" ? "to customer" : "to seller"}
            </span>
            <span className={`shrink-0 text-xs tnum ${!r.point || r.point.ageS > STALE_AFTER_S ? "text-danger" : "text-ash"}`}>
              {r.point ? `seen ${fmtAge(r.point.ageS)}` : "no location yet"}
              {r.distanceM !== null && r.status === "picked_up" ? ` · ${fmtDistance(r.distanceM)} from customer` : ""}
              {r.arrived ? " · arrived" : r.arriving ? " · arriving" : ""}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
