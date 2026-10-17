"use client";

import { useState } from "react";
import { LocateFixed } from "lucide-react";
import { ApiFailure, api } from "@/lib/vendor/client";
import type { DetectedLocation } from "@/lib/tracking/geo";

export type { DetectedLocation };

export type DetectLocationProps = {
  /**
   * Called with the GPS point and, when the lookup worked, the address parts (line, area, city,
   * state, pincode) and the Delhi NCR rider city. Fill the form from it and keep { lat, lng } to
   * store on the order (setOrderDeliveryPoint in src/lib/server/tracking.ts).
   */
  onDetect: (location: DetectedLocation) => void;
  /** Called with a message for people when location is blocked, unavailable or the lookup fails. */
  onError?: (message: string) => void;
  /** Button text. Default "Detect my location". */
  label?: string;
  className?: string;
  disabled?: boolean;
};

/**
 * "Detect my location": the browser's GPS, then the address at that point from our server
 * (POST /api/geo/reverse). Nothing is stored; the parent decides what to keep.
 */
export function DetectLocation({ onDetect, onError, label = "Detect my location", className = "btn btn-outline btn-sm", disabled = false }: DetectLocationProps) {
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const failWith = (text: string) => {
    setMessage(text);
    onError?.(text);
  };

  function detect() {
    setMessage(null);
    if (!("geolocation" in navigator)) return failWith("This browser can't share your location. Please type the address.");
    setBusy(true);
    navigator.geolocation.getCurrentPosition(
      async (p) => {
        try {
          const r = await api<{ location: DetectedLocation }>("/api/geo/reverse", {
            body: { lat: p.coords.latitude, lng: p.coords.longitude, accuracy: Math.round(p.coords.accuracy) },
          });
          onDetect(r.location);
          if (!r.location.address) failWith("We found your location but not the street address. Please type it in.");
        } catch (err) {
          failWith(err instanceof ApiFailure ? err.message : "Couldn't look up your address. Please type it in.");
        } finally {
          setBusy(false);
        }
      },
      (e) => {
        setBusy(false);
        failWith(
          e.code === e.PERMISSION_DENIED
            ? "Location is blocked for this site. Allow it in your browser settings, or type the address."
            : "Couldn't find your location. Please try again or type the address.",
        );
      },
      { enableHighAccuracy: true, timeout: 15_000, maximumAge: 60_000 },
    );
  }

  return (
    <div>
      <button type="button" className={className} onClick={detect} disabled={disabled || busy} aria-busy={busy}>
        <LocateFixed size={14} aria-hidden /> {busy ? "Finding you…" : label}
      </button>
      {message && !onError && (
        <p className="mt-1.5 text-xs text-ash" role="status">
          {message}
        </p>
      )}
    </div>
  );
}
