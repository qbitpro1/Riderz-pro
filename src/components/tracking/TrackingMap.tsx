"use client";

import "leaflet/dist/leaflet.css";
import { useEffect, useRef, useState } from "react";
import type * as Leaflet from "leaflet";

/**
 * A small OpenStreetMap map (Leaflet) with markers and an optional route line. Leaflet is loaded
 * in the browser only. Tiles come from NEXT_PUBLIC_MAP_TILES_URL (default: the OpenStreetMap
 * tile servers, whose policy requires the attribution shown in the corner).
 *
 * The map fits all markers on first show and keeps following them until the viewer pans or zooms;
 * "Recentre" goes back to following.
 */

const TILES = process.env.NEXT_PUBLIC_MAP_TILES_URL || "https://tile.openstreetmap.org/{z}/{x}/{y}.png";
const ATTRIBUTION = '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer noopener">OpenStreetMap</a> contributors';

export type MapMarker = {
  id: string;
  lat: number;
  lng: number;
  kind: "rider" | "rider-stale" | "home" | "home-approx" | "alert";
  label: string;
};

const COLORS: Record<MapMarker["kind"], string> = {
  rider: "var(--accent)",
  "rider-stale": "var(--dim)",
  home: "var(--verified)",
  "home-approx": "var(--verified)",
  alert: "var(--gold)",
};

function icon(L: typeof Leaflet, m: MapMarker): Leaflet.DivIcon {
  const ring = m.kind === "home-approx" ? "border:2px dashed var(--verified);background:color-mix(in oklab, var(--verified) 25%, transparent);" : `background:${COLORS[m.kind]};border:3px solid #fff;`;
  const size = m.kind === "home-approx" ? 34 : 22;
  return L.divIcon({
    className: "",
    html: `<span style="display:block;width:${size}px;height:${size}px;border-radius:9999px;${ring}box-shadow:0 1px 6px rgba(0,0,0,.45)"></span>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  });
}

export function TrackingMap({
  markers,
  route,
  className = "h-72",
  label = "Delivery map",
}: {
  markers: MapMarker[];
  /** [lat, lng] pairs. */
  route?: [number, number][] | null;
  className?: string;
  label?: string;
}) {
  const box = useRef<HTMLDivElement>(null);
  const map = useRef<{ L: typeof Leaflet; map: Leaflet.Map; layer: Leaflet.LayerGroup } | null>(null);
  const follow = useRef(true);
  const [ready, setReady] = useState(false);
  const [following, setFollowing] = useState(true);

  // Create the map once.
  useEffect(() => {
    let cancelled = false;
    void import("leaflet").then((mod) => {
      const L = (mod as unknown as { default?: typeof Leaflet }).default ?? (mod as unknown as typeof Leaflet);
      if (cancelled || !box.current || map.current) return;
      const m = L.map(box.current, { zoomControl: true, attributionControl: true, scrollWheelZoom: false });
      L.tileLayer(TILES, { maxZoom: 19, attribution: ATTRIBUTION }).addTo(m);
      m.setView([28.6139, 77.209], 11); // Delhi until the first markers arrive
      const stopFollowing = () => {
        follow.current = false;
        setFollowing(false);
      };
      m.on("dragstart", stopFollowing);
      m.on("zoomstart", (e: Leaflet.LeafletEvent) => {
        // Only the viewer's own zooms (fitBounds sets this flag on its own moves).
        if (!(e.target as Leaflet.Map & { _fitting?: boolean })._fitting) stopFollowing();
      });
      map.current = { L, map: m, layer: L.layerGroup().addTo(m) };
      setReady(true);
    });
    return () => {
      cancelled = true;
      map.current?.map.remove();
      map.current = null;
    };
  }, []);

  const fit = () => {
    const c = map.current;
    if (!c || markers.length === 0) return;
    const pts = [...markers.map((x) => [x.lat, x.lng] as [number, number]), ...(route ?? [])];
    const m = c.map as Leaflet.Map & { _fitting?: boolean };
    m._fitting = true;
    if (pts.length === 1) m.setView(pts[0], 16, { animate: false });
    else m.fitBounds(c.L.latLngBounds(pts), { padding: [36, 36], maxZoom: 17, animate: false });
    m._fitting = false;
  };

  // Redraw markers and the route whenever they change.
  useEffect(() => {
    const c = map.current;
    if (!c || !ready) return;
    c.layer.clearLayers();
    if (route && route.length > 1) {
      c.L.polyline(route, { color: "#ff4d4d", weight: 5, opacity: 0.85 }).addTo(c.layer);
    }
    for (const m of markers) {
      c.L.marker([m.lat, m.lng], { icon: icon(c.L, m), title: m.label, alt: m.label, keyboard: false }).bindTooltip(m.label).addTo(c.layer);
    }
    if (follow.current) fit();
    // fit reads the latest markers/route; it is not a dependency on purpose.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [markers, route, ready]);

  return (
    <div className="relative">
      <div ref={box} role="region" aria-label={label} className={`w-full overflow-hidden rounded-sm border border-tint/10 bg-steel ${className}`} />
      {!following && (
        <button
          type="button"
          className="btn btn-outline btn-sm absolute bottom-7 right-2 z-[500] bg-carbon"
          onClick={() => {
            follow.current = true;
            setFollowing(true);
            fit();
          }}
        >
          Recentre
        </button>
      )}
    </div>
  );
}
