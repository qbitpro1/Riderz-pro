import "server-only";

import { serviceCity } from "@/lib/rider/types";
import type { DetectedLocation, LatLng } from "@/lib/tracking/geo";

/**
 * Outside map services, called from the server only (never from the browser):
 *
 *   geocoding   OpenStreetMap Nominatim (https://nominatim.org). Its usage policy asks for at most
 *               one request a second per application, an identifying User-Agent with a contact,
 *               and caching. Calls queue here so this server instance never sends more than one a
 *               second; results are cached on the order (delivery_lat/lng). Several server
 *               instances could together exceed the limit; at real volume use a paid geocoder
 *               or a self-hosted Nominatim.
 *   routing     OSRM (ROUTING_BASE_URL, default the public demo server router.project-osrm.org,
 *               which is for light use only and has a car profile). Short timeout; the callers fall
 *               back to straight lines.
 *
 * Every function returns null on any failure. Nothing here throws.
 */

const NOMINATIM = "https://nominatim.openstreetmap.org";
const USER_AGENT = "Riderzpro/1.0 (contact: TBD)";
const ROUTING = (process.env.ROUTING_BASE_URL || "https://router.project-osrm.org").replace(/\/+$/, "");
const GEOCODE_TIMEOUT_MS = 6_000;
const ROUTE_TIMEOUT_MS = 2_500;
const GAP_MS = 1_100;

/* ------------------------------------------------------- one a second */

let queue: Promise<unknown> = Promise.resolve();
let lastCall = 0;

/** Runs `fn` after the previous Nominatim call, at least GAP_MS after it started. */
function politely<T>(fn: () => Promise<T>): Promise<T> {
  const run = queue.then(async () => {
    const wait = lastCall + GAP_MS - Date.now();
    if (wait > 0) await new Promise((r) => setTimeout(r, wait));
    lastCall = Date.now();
    return fn();
  });
  queue = run.catch(() => undefined);
  return run;
}

async function getJson(url: string, timeoutMs: number): Promise<unknown> {
  const res = await fetch(url, {
    headers: { "User-Agent": USER_AGENT, Accept: "application/json", "Accept-Language": "en-IN,en" },
    signal: AbortSignal.timeout(timeoutMs),
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

const inIndia = (p: LatLng) => p.lat >= 6 && p.lat <= 37.5 && p.lng >= 68 && p.lng <= 97.5;

/* ------------------------------------------------------------- forward */

type SearchHit = { lat: string; lon: string; addresstype?: string; type?: string; category?: string; class?: string };
/** Nominatim place types precise enough for a doorstep geofence. */
const STREET_LEVEL = new Set(["house", "building", "residential", "apartments", "road", "street", "amenity", "shop", "office", "place", "commercial", "retail", "hamlet", "isolated_dwelling"]);

/**
 * The map point of a delivery address. "address" when Nominatim matched the street or a building,
 * "area" when only the locality or pincode matched (shown on the map as approximate; no geofence).
 */
export async function geocodeAddress(a: { address: string; city: string; state: string; pincode: string }): Promise<(LatLng & { precision: "address" | "area" }) | null> {
  const attempts: { params: Record<string, string>; precision: "address" | "area" }[] = [
    { params: { q: `${a.address}, ${a.city}, ${a.state} ${a.pincode}, India` }, precision: "address" },
    { params: { postalcode: a.pincode, city: a.city, country: "India" }, precision: "area" },
    { params: { postalcode: a.pincode, country: "India" }, precision: "area" },
  ];
  for (const attempt of attempts) {
    const params = new URLSearchParams({ ...attempt.params, format: "jsonv2", limit: "1", countrycodes: "in", addressdetails: "0" });
    try {
      const hits = (await politely(() => getJson(`${NOMINATIM}/search?${params}`, GEOCODE_TIMEOUT_MS))) as SearchHit[];
      const hit = Array.isArray(hits) ? hits[0] : undefined;
      if (!hit) continue;
      const p = { lat: Number(hit.lat), lng: Number(hit.lon) };
      if (!Number.isFinite(p.lat) || !Number.isFinite(p.lng) || !inIndia(p)) continue;
      const kind = hit.addresstype ?? hit.type ?? "";
      const group = hit.category ?? hit.class ?? ""; // jsonv2 says "category", older formats "class"
      const precise = attempt.precision === "address" && (STREET_LEVEL.has(kind) || group === "building" || group === "highway");
      return { ...p, precision: precise ? "address" : "area" };
    } catch (err) {
      console.warn("[geo] geocode failed:", err instanceof Error ? err.message : err);
      return null; // the service is down or slow: don't hammer it with the fallbacks
    }
  }
  return null;
}

/* ------------------------------------------------------------- reverse */

type ReverseHit = {
  address?: Record<string, string | undefined>;
  error?: string;
};

/** The address at a point, for "Detect my location". */
export async function reverseGeocode(p: LatLng): Promise<DetectedLocation["address"]> {
  const params = new URLSearchParams({ lat: p.lat.toFixed(6), lon: p.lng.toFixed(6), format: "jsonv2", zoom: "18", addressdetails: "1" });
  try {
    const r = (await politely(() => getJson(`${NOMINATIM}/reverse?${params}`, GEOCODE_TIMEOUT_MS))) as ReverseHit;
    const a = r.address;
    if (!a || r.error) return null;
    const pick = (...keys: string[]) => keys.map((k) => a[k]).find((v) => typeof v === "string" && v.trim()) ?? "";
    const line = [pick("house_number", "house_name"), pick("building", "amenity"), pick("road", "pedestrian", "footway")].filter(Boolean).join(", ");
    const area = pick("neighbourhood", "suburb", "quarter", "city_district", "residential", "hamlet", "village");
    const city = pick("city", "town", "municipality", "county", "state_district");
    return {
      line: line.slice(0, 200),
      area: area.slice(0, 120),
      city: city.slice(0, 80),
      state: pick("state").slice(0, 80),
      pincode: /^\d{6}$/.test((a.postcode ?? "").replace(/\s/g, "")) ? (a.postcode ?? "").replace(/\s/g, "") : "",
    };
  } catch (err) {
    console.warn("[geo] reverse geocode failed:", err instanceof Error ? err.message : err);
    return null;
  }
}

/** The Delhi NCR rider city for a reverse-geocoded address (Nominatim's city or its district). */
export function serviceCityFor(address: DetectedLocation["address"]): string | null {
  if (!address) return null;
  return serviceCity(address.city) ?? serviceCity(address.area) ?? (/delhi/i.test(address.state) ? "Delhi" : null);
}

/* ------------------------------------------------------------- routing */

type OsrmResponse = { code?: string; routes?: { distance: number; duration: number; geometry?: { coordinates?: [number, number][] } }[] };
const MAX_ROUTE_POINTS = 200;

/** Road route from `a` to `b`: metres, seconds and the line as [lat, lng] pairs (thinned). */
export async function roadRoute(a: LatLng, b: LatLng): Promise<{ m: number; s: number; line: [number, number][] } | null> {
  const coords = `${a.lng.toFixed(6)},${a.lat.toFixed(6)};${b.lng.toFixed(6)},${b.lat.toFixed(6)}`;
  try {
    const r = (await getJson(`${ROUTING}/route/v1/driving/${coords}?overview=simplified&geometries=geojson&alternatives=false&steps=false`, ROUTE_TIMEOUT_MS)) as OsrmResponse;
    const route = r.code === "Ok" ? r.routes?.[0] : undefined;
    const pts = route?.geometry?.coordinates;
    if (!route || !pts?.length || !Number.isFinite(route.distance) || !Number.isFinite(route.duration)) return null;
    const step = Math.max(1, Math.ceil(pts.length / MAX_ROUTE_POINTS));
    const line = pts.filter((_, i) => i % step === 0 || i === pts.length - 1).map(([lng, lat]) => [Number(lat.toFixed(6)), Number(lng.toFixed(6))] as [number, number]);
    return { m: Math.round(route.distance), s: Math.round(route.duration), line };
  } catch (err) {
    console.warn("[geo] route failed:", err instanceof Error ? err.message : err);
    return null;
  }
}
