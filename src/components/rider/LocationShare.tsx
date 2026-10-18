"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { LocateFixed } from "lucide-react";
import { ApiFailure, api } from "@/lib/vendor/client";
import { LOCATION_CONSENT_TEXT, PING_EVERY_MS, fmtAge } from "@/lib/tracking/geo";
import { Notice } from "@/components/vendor/auth/fields";
import { useBrowserValue } from "@/lib/client/hooks";

/**
 * Shares the rider's position while they have an accepted or picked-up job: asks for consent once
 * (stored on the server), then sends the phone's position about every 10 s. Nothing is sent when
 * there is no live job, while paused, or without consent. Location problems never block the job.
 */
export function LocationShare({ jobIds, initialConsent, onStale }: { jobIds: string[]; initialConsent: boolean; onStale: () => void }) {
  const [consent, setConsent] = useState(initialConsent);
  const [notNow, setNotNow] = useState(false);
  const supported = useBrowserValue(() => "geolocation" in navigator, true);
  const [paused, setPaused] = useState(false);
  const [denied, setDenied] = useState(false);
  const [hasFix, setHasFix] = useState(false);
  const [lastSent, setLastSent] = useState<number | null>(null);
  /** Clock for "sent 20 s ago", moved on by the send beat (not read during render). */
  const [now, setNow] = useState(0);
  const [failures, setFailures] = useState(0);
  const [busy, setBusy] = useState(false);
  const latest = useRef<GeolocationPosition | null>(null);
  const sentAt = useRef(0);
  const sending = useRef(false);
  const key = jobIds.join(",");

  const send = useCallback(async () => {
    const p = latest.current;
    if (!p || sending.current || Date.now() - sentAt.current < PING_EVERY_MS - 500) return;
    const ageMs = Math.max(0, Math.round(Date.now() - p.timestamp));
    if (ageMs > 120_000) return; // a stale fix tells the customer nothing
    sending.current = true;
    sentAt.current = Date.now();
    try {
      await api("/api/rider/location", {
        body: {
          jobIds: key.split(","),
          lat: p.coords.latitude,
          lng: p.coords.longitude,
          accuracy: Math.min(p.coords.accuracy, 2000),
          heading: p.coords.heading !== null && Number.isFinite(p.coords.heading) ? p.coords.heading : null,
          speed: p.coords.speed !== null && Number.isFinite(p.coords.speed) ? Math.min(p.coords.speed, 100) : null,
          ageMs,
        },
      });
      const at = Date.now();
      setLastSent(at);
      setNow(at);
      setFailures(0);
    } catch (err) {
      if (err instanceof ApiFailure && err.code === "consent_needed") setConsent(false);
      else if (err instanceof ApiFailure && err.code === "no_live_job") onStale();
      else setFailures((n) => n + 1);
    } finally {
      sending.current = false;
    }
  }, [key, onStale]);

  const sharing = jobIds.length > 0 && consent && supported && !paused && !denied;

  useEffect(() => {
    if (!sharing) return;
    const watch = navigator.geolocation.watchPosition(
      (p) => {
        latest.current = p;
        setHasFix(true);
        void send();
      },
      (e) => {
        if (e.code === e.PERMISSION_DENIED) setDenied(true);
        // Unavailable or timed out: keep watching; the phone may find GPS again.
      },
      { enableHighAccuracy: true, maximumAge: 5_000, timeout: 30_000 },
    );
    // A rider standing still gets few position updates: resend the latest fix on the same beat.
    const beat = window.setInterval(() => {
      void send();
      setNow(Date.now());
    }, PING_EVERY_MS);
    return () => {
      navigator.geolocation.clearWatch(watch);
      window.clearInterval(beat);
    };
  }, [sharing, send]);

  async function setConsentOnServer(value: boolean) {
    setBusy(true);
    try {
      await api("/api/rider/location/consent", { body: { consent: value } });
      setConsent(value);
      if (!value) {
        setHasFix(false);
        setNotNow(true);
      }
    } catch {
      setFailures((n) => n + 1);
    } finally {
      setBusy(false);
    }
  }

  if (jobIds.length === 0) return null;

  if (!consent) {
    if (notNow) {
      return (
        <p className="flex flex-wrap items-center justify-between gap-2 rounded-sm bg-tint/5 px-3 py-2 text-xs text-ash">
          Location sharing is off, so the customer can&apos;t follow this delivery on a map.
          <button type="button" className="font-semibold text-accent" onClick={() => setNotNow(false)}>Turn on</button>
        </p>
      );
    }
    return (
      <div className="card space-y-3 border-accent/40 p-4">
        <p className="flex items-center gap-2 font-semibold text-chalk">
          <LocateFixed size={16} className="text-accent" aria-hidden /> Share your location while delivering?
        </p>
        <p className="text-sm text-ash">{LOCATION_CONSENT_TEXT} It stops when the delivery is finished, and the route trail is deleted.</p>
        <div className="grid grid-cols-2 gap-2">
          <button type="button" className="btn btn-outline" onClick={() => setNotNow(true)}>Not now</button>
          <button type="button" className="btn btn-primary" disabled={busy} onClick={() => setConsentOnServer(true)}>Share location</button>
        </div>
      </div>
    );
  }

  if (denied) {
    return (
      <Notice tone="warn">
        Location is blocked for this site. To let the customer follow the delivery, allow location for riderzpro.com in your browser or phone settings, then reload. You can still finish the delivery as usual.
      </Notice>
    );
  }
  if (!supported) {
    return <Notice tone="info">This browser can&apos;t share location. You can still finish the delivery as usual.</Notice>;
  }

  return (
    <div className="flex flex-wrap items-center justify-between gap-2 rounded-sm border border-tint/10 px-3 py-2 text-xs">
      <span className="flex items-center gap-2 text-ash" role="status">
        <span aria-hidden className={`h-2 w-2 rounded-full ${!paused && hasFix ? "animate-pulse bg-accent" : "bg-tint/30"}`} />
        {paused
          ? "Location sharing paused."
          : !hasFix
            ? "Finding your location…"
            : failures >= 3
              ? "Can't reach Riderzpro. Retrying…"
              : `Sharing your location with the customer${lastSent ? ` · sent ${fmtAge(Math.max(0, now - lastSent) / 1000)}` : ""}`}
      </span>
      <span className="flex gap-3">
        {paused ? (
          <button type="button" className="font-semibold text-accent" onClick={() => setPaused(false)}>Resume</button>
        ) : (
          <button type="button" className="font-semibold text-ash hover:text-chalk" onClick={() => setPaused(true)}>Pause</button>
        )}
        <button type="button" className="font-semibold text-dim hover:text-chalk" disabled={busy} onClick={() => setConsentOnServer(false)}>Withdraw consent</button>
      </span>
    </div>
  );
}
