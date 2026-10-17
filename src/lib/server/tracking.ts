import "server-only";

import { sql, sqlOne, transaction, type Query } from "@/lib/db/client";
import type { JobStatus, RiderSelf } from "@/lib/rider/types";
import {
  ARRIVED_M,
  ARRIVING_M,
  FALLBACK_KMH,
  GEOFENCE_ACCURACY_M,
  OFF_ROUTE_AFTER_MS,
  OFF_ROUTE_BACKTRACK_M,
  OFF_ROUTE_MIN_M,
  OFF_ROUTE_SHARE,
  PING_MIN_GAP_MS,
  distanceToSegment,
  haversine,
  type CustomerTracking,
  type CustomerTrackingJob,
  type DispatchRiderPosition,
  type LatLng,
  type PingInput,
  type TrackingStep,
} from "@/lib/tracking/geo";
import { ApiError } from "./http";
import { geocodeAddress, roadRoute } from "./tracking-geo";
import { smsRiderArrived, smsRiderArriving } from "./messaging";

/**
 * LIVE TRACKING — the rider's position while they deliver, shown to the customer and to dispatch.
 *
 *   consent     the rider agrees once (riders.location_consent_at) before their phone sends anything;
 *               they can withdraw it, and pings are refused without it
 *   pings       POST /api/rider/location about every 10 s, only for the rider's own accepted or
 *               picked-up jobs; the latest point per job (rider_locations) plus a 30-minute trail
 *   geofence    on each precise ping of a picked-up job: "arriving" at 500 m and "arrived" at 50 m
 *               from the delivery point, each recorded once (tracking_events) → notifyTracking
 *   off route   see OFF_ROUTE_* in src/lib/tracking/geo.ts; an open alert shows on the dispatch board
 *               until the rider is back in the corridor
 *   delivery    the order's delivery_lat/lng: the customer's GPS at checkout, or the address
 *               geocoded once (Nominatim) and cached; no point means status only, no map
 *   customer    the rider's position only while they carry this customer's parcel (picked up),
 *               the road route and ETA (OSRM, cached per job, straight-line fallback at 20 km/h)
 *   retention   when a job closes its trail is deleted; a delivered job keeps its last point for
 *               30 days, a declined or cancelled one keeps nothing (closeTracking, trackingHousekeeping)
 *
 * Identity always comes from the session; the rider's mobile number is never returned to customers.
 */

const TRAIL_MINUTES = 30;
const KEEP_DELIVERED_DAYS = 30;
/** Implied speeds above this between two points are GPS jumps, not riding. */
const MAX_PLAUSIBLE_MS = 55; // ≈ 200 km/h
/** Fixes at least this precise are believed even when they imply a jump. */
const JUMP_TRUST_M = 30;
/** Recompute the cached road route when the rider has moved this far from where it started, or it is this old. */
const ROUTE_REFRESH_M = 150;
const ROUTE_REFRESH_S = 60;
const ROUTE_MAX_AGE_S = 300;

const iso = (d: Date | string | null | undefined) => (d ? new Date(d).toISOString() : null);
const PRECISE = ["device", "address"];

/* ---------------------------------------------------------------- consent */

export async function setLocationConsent(riderId: string, consent: boolean): Promise<void> {
  await sql("UPDATE riders SET location_consent_at = CASE WHEN $2 THEN now() ELSE NULL END, updated_at = now() WHERE id = $1", [riderId, consent]);
  if (!consent) {
    // Withdrawing consent also removes what was shared so far for the rider's live jobs.
    await sql(
      `DELETE FROM rider_location_trail WHERE job_id IN (SELECT id FROM rider_jobs WHERE rider_id = $1 AND status IN ('accepted','picked_up'))`,
      [riderId],
    );
    await sql(
      `DELETE FROM rider_locations WHERE rider_id = $1 AND job_id IN (SELECT id FROM rider_jobs WHERE rider_id = $1 AND status IN ('accepted','picked_up'))`,
      [riderId],
    );
    await sql(
      `UPDATE tracking_events SET resolved_at = now()
        WHERE kind = 'off_route' AND resolved_at IS NULL AND job_id IN (SELECT id FROM rider_jobs WHERE rider_id = $1)`,
      [riderId],
    );
  }
}

/* ---------------------------------------------------------- notifications */

export type TrackingKind = "arriving" | "arrived" | "off_route";

/**
 * Records a tracking event and tells people about it. "arriving" and "arrived" are recorded once
 * per job and off-route once per open alert, so a repeat call does nothing and returns false.
 *
 * For now this only logs to the server console. Customer SMS for "arriving" / "arrived" is wired
 * here later (the messaging module); "off_route" is for dispatch only and shows on the board.
 */
export async function notifyTracking(
  kind: TrackingKind,
  e: { jobId: string; orderId: string; orderNumber: string; distanceM: number | null; detail?: string | null },
): Promise<boolean> {
  const row = await sqlOne<{ id: string }>(
    `INSERT INTO tracking_events (job_id, order_id, kind, distance_m, detail) VALUES ($1,$2,$3,$4,$5)
     ON CONFLICT DO NOTHING RETURNING id`,
    [e.jobId, e.orderId, kind, e.distanceM, e.detail ?? null],
  );
  if (!row) return false;
  // No phone numbers or coordinates in the log.
  console.info(`[tracking] ${kind} · order ${e.orderNumber} · job ${e.jobId}${e.distanceM !== null ? ` · ${e.distanceM} m` : ""}${e.detail ? ` · ${e.detail}` : ""}`);
  // The customer's SMS, once per job (messaging.ts). Off-route alerts are for dispatch only.
  try {
    if (kind === "arriving") await smsRiderArriving(e.jobId, { minutes: (e.distanceM ?? 500) / ((FALLBACK_KMH * 1000) / 60) });
    if (kind === "arrived") await smsRiderArrived(e.jobId);
  } catch (err) {
    console.error("[tracking] sms:", err instanceof Error ? err.message : err);
  }
  return true;
}

/* -------------------------------------------------------- delivery point */

type OrderPoint = { delivery_lat: number | null; delivery_lng: number | null; delivery_geo: string | null };
const pointOf = (o: OrderPoint): (LatLng & { precise: boolean }) | null =>
  o.delivery_lat !== null && o.delivery_lng !== null ? { lat: o.delivery_lat, lng: o.delivery_lng, precise: PRECISE.includes(o.delivery_geo ?? "") } : null;

/**
 * Stores the delivery point given at checkout ("Detect my location" or a saved address with a
 * point). Call it after the order row exists. Source "device" is trusted for the geofence.
 */
export async function setOrderDeliveryPoint(orderId: string, p: LatLng, source: "device" | "address" = "device"): Promise<void> {
  await sql("UPDATE orders SET delivery_lat = $2, delivery_lng = $3, delivery_geo = $4, delivery_geo_at = now() WHERE id = $1", [orderId, p.lat, p.lng, source]);
}

/**
 * The order's delivery point, geocoding the address the first time it is needed. One caller claims
 * the geocode (delivery_geo = 'pending'); others see null until it is done. A failure is recorded
 * and not retried, so the order page just shows status. Never throws.
 */
export async function ensureDeliveryPoint(orderId: string): Promise<(LatLng & { precise: boolean }) | null> {
  try {
    const claim = await sqlOne<OrderPoint & { address: string; city: string; state: string; pincode: string }>(
      `UPDATE orders SET delivery_geo = 'pending', delivery_geo_at = now()
        WHERE id = $1 AND delivery_lat IS NULL
          AND (delivery_geo IS NULL OR (delivery_geo = 'pending' AND delivery_geo_at < now() - interval '2 minutes'))
        RETURNING delivery_lat, delivery_lng, delivery_geo, address, city, state, pincode`,
      [orderId],
    );
    if (!claim) {
      const o = await sqlOne<OrderPoint>("SELECT delivery_lat, delivery_lng, delivery_geo FROM orders WHERE id = $1", [orderId]);
      return o ? pointOf(o) : null;
    }
    const hit = await geocodeAddress(claim);
    if (!hit) {
      await sql("UPDATE orders SET delivery_geo = 'failed', delivery_geo_at = now() WHERE id = $1 AND delivery_lat IS NULL", [orderId]);
      return null;
    }
    await sql(
      "UPDATE orders SET delivery_lat = $2, delivery_lng = $3, delivery_geo = $4, delivery_geo_at = now() WHERE id = $1 AND delivery_lat IS NULL",
      [orderId, hit.lat, hit.lng, hit.precision],
    );
    return { lat: hit.lat, lng: hit.lng, precise: hit.precision === "address" };
  } catch (err) {
    console.error("[tracking] delivery point:", err instanceof Error ? err.message : err);
    return null;
  }
}

export async function ensureDeliveryPointForJob(jobId: string): Promise<void> {
  const j = await sqlOne<{ order_id: string }>("SELECT order_id FROM rider_jobs WHERE id = $1", [jobId]).catch(() => null);
  if (j) await ensureDeliveryPoint(j.order_id);
}

/* ------------------------------------------------------------------ pings */

type LiveRow = OrderPoint & {
  id: string;
  status: JobStatus;
  order_id: string;
  number: string;
  l_at: Date | null;
  l_lat: number | null;
  l_lng: number | null;
  start_lat: number | null;
  start_lng: number | null;
  min_distance_m: number | null;
  off_route_since: Date | null;
};

export type PingResult = { jobs: { id: string; stored: boolean; reason?: "too_soon" | "jump" }[]; needsDeliveryPoint: string[] };

/**
 * One position from the rider's phone, for each listed job that is theirs and live. Jobs that are
 * not (closed meanwhile, or someone else's) are left out; if none is left the phone is told to stop.
 */
export async function recordPing(rider: RiderSelf, input: PingInput): Promise<PingResult> {
  if (!rider.locationConsent) throw new ApiError(409, "consent_needed", "Allow location sharing first.");
  const at = new Date(Date.now() - input.ageMs);
  const here = { lat: input.lat, lng: input.lng };
  const accuracy = Math.round(input.accuracy);
  const heading = input.heading === null || input.heading === undefined ? null : Math.round(input.heading) % 360;
  const speed = input.speed === null || input.speed === undefined ? null : Math.round(input.speed * 3.6);

  const out: PingResult = { jobs: [], needsDeliveryPoint: [] };
  const alerts: { kind: TrackingKind; jobId: string; orderId: string; number: string; distanceM: number | null; detail?: string }[] = [];

  for (const jobId of [...new Set(input.jobIds)]) {
    const result = await transaction(async (q) => {
      const j = (
        await q<LiveRow>(
          `SELECT j.id, j.status, j.order_id, o.number, o.delivery_lat, o.delivery_lng, o.delivery_geo,
                  l.at AS l_at, l.lat AS l_lat, l.lng AS l_lng, l.start_lat, l.start_lng, l.min_distance_m, l.off_route_since
             FROM rider_jobs j JOIN orders o ON o.id = j.order_id LEFT JOIN rider_locations l ON l.job_id = j.id
            WHERE j.id = $1 AND j.rider_id = $2 AND j.status IN ('accepted','picked_up')
            FOR UPDATE OF j`,
          [jobId, rider.id],
        )
      )[0];
      if (!j) return null;

      // Too soon after the last stored point, or an impossible jump from a poor fix: keep the old point.
      // A precise fix is always taken, so a rider is never stuck on a stale point after a GPS gap.
      if (j.l_at && j.l_lat !== null && j.l_lng !== null) {
        const dt = (at.getTime() - new Date(j.l_at).getTime()) / 1000;
        if (dt * 1000 < PING_MIN_GAP_MS) return { id: j.id, stored: false, reason: "too_soon" as const };
        const moved = haversine({ lat: j.l_lat, lng: j.l_lng }, here);
        if (accuracy > JUMP_TRUST_M && moved > 500 && moved / dt > MAX_PLAUSIBLE_MS) return { id: j.id, stored: false, reason: "jump" as const };
      }

      const dest = pointOf(j);
      if (!dest && (j.delivery_geo === null || j.delivery_geo === "pending")) out.needsDeliveryPoint.push(j.order_id);
      const distance = dest ? Math.round(haversine(here, dest)) : null;
      const usable = accuracy <= GEOFENCE_ACCURACY_M;
      const carrying = j.status === "picked_up";

      // Off-route state (picked-up jobs with a delivery point and a usable fix only).
      let start = j.start_lat !== null && j.start_lng !== null ? { lat: j.start_lat, lng: j.start_lng } : null;
      let minDistance = j.min_distance_m;
      let offSince: Date | null = j.off_route_since ? new Date(j.off_route_since) : null;
      if (carrying && dest && distance !== null && usable) {
        start ??= here;
        minDistance = Math.min(minDistance ?? distance, distance);
        const trip = haversine(start, dest);
        const side = Math.round(distanceToSegment(here, start, dest));
        const back = distance - minDistance;
        const off = side > Math.max(OFF_ROUTE_MIN_M, OFF_ROUTE_SHARE * trip) || back > OFF_ROUTE_BACKTRACK_M;
        if (off) {
          offSince ??= at;
          if (at.getTime() - offSince.getTime() >= OFF_ROUTE_AFTER_MS) {
            alerts.push({
              kind: "off_route", jobId: j.id, orderId: j.order_id, number: j.number, distanceM: distance,
              detail: back > OFF_ROUTE_BACKTRACK_M ? `${Math.round(back / 100) / 10} km further from the customer than earlier` : `${Math.round(side / 100) / 10} km off the direct line`,
            });
          }
        } else {
          offSince = null;
          await q("UPDATE tracking_events SET resolved_at = now() WHERE job_id = $1 AND kind = 'off_route' AND resolved_at IS NULL", [j.id]);
        }
      }

      await q(
        `INSERT INTO rider_locations (job_id, rider_id, lat, lng, accuracy_m, heading, speed_kmh, at, distance_m, start_lat, start_lng, min_distance_m, off_route_since, updated_at)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13, now())
         ON CONFLICT (job_id) DO UPDATE SET lat = EXCLUDED.lat, lng = EXCLUDED.lng, accuracy_m = EXCLUDED.accuracy_m, heading = EXCLUDED.heading,
           speed_kmh = EXCLUDED.speed_kmh, at = EXCLUDED.at, distance_m = EXCLUDED.distance_m, start_lat = EXCLUDED.start_lat,
           start_lng = EXCLUDED.start_lng, min_distance_m = EXCLUDED.min_distance_m, off_route_since = EXCLUDED.off_route_since, updated_at = now()`,
        [j.id, rider.id, here.lat, here.lng, accuracy, heading, speed, at, distance, start?.lat ?? null, start?.lng ?? null, minDistance, offSince],
      );
      await q("INSERT INTO rider_location_trail (job_id, lat, lng, accuracy_m, at) VALUES ($1,$2,$3,$4,$5)", [j.id, here.lat, here.lng, accuracy, at]);
      await q(`DELETE FROM rider_location_trail WHERE job_id = $1 AND at < now() - make_interval(mins => $2)`, [j.id, TRAIL_MINUTES]);

      // Geofence: only a precise delivery point, a usable fix and a parcel on board.
      if (carrying && dest?.precise && distance !== null && usable) {
        if (distance <= ARRIVING_M) alerts.push({ kind: "arriving", jobId: j.id, orderId: j.order_id, number: j.number, distanceM: distance });
        if (distance <= ARRIVED_M) alerts.push({ kind: "arrived", jobId: j.id, orderId: j.order_id, number: j.number, distanceM: distance });
      }
      return { id: j.id, stored: true };
    });
    if (result) out.jobs.push(result);
  }

  if (out.jobs.length === 0) throw new ApiError(409, "no_live_job", "You have no delivery in progress. Location sharing has stopped.");
  // After the points are saved: each event is recorded once (unique index), repeats do nothing.
  for (const a of alerts) await notifyTracking(a.kind, { jobId: a.jobId, orderId: a.orderId, orderNumber: a.number, distanceM: a.distanceM, detail: a.detail });
  return out;
}

/* -------------------------------------------------------------- retention */

/**
 * Called inside the transaction that closes a job. The trail goes; a delivered job keeps its last
 * point (for 30 days, see trackingHousekeeping) without the cached route; any other close keeps
 * nothing. Open off-route alerts are closed.
 */
export async function closeTracking(q: Query, jobId: string, to: JobStatus): Promise<void> {
  await q("DELETE FROM rider_location_trail WHERE job_id = $1", [jobId]);
  if (to === "delivered") {
    await q(
      `UPDATE rider_locations SET route = NULL, route_m = NULL, route_s = NULL, route_from_lat = NULL, route_from_lng = NULL, route_at = NULL,
              start_lat = NULL, start_lng = NULL, off_route_since = NULL, updated_at = now() WHERE job_id = $1`,
      [jobId],
    );
  } else {
    await q("DELETE FROM rider_locations WHERE job_id = $1", [jobId]);
  }
  await q("UPDATE tracking_events SET resolved_at = now() WHERE job_id = $1 AND kind = 'off_route' AND resolved_at IS NULL", [jobId]);
}

/**
 * Hourly clean-up (call from housekeeping): trails of jobs no longer live (a safety net for jobs
 * closed by other paths), latest points of declined or cancelled jobs, delivered points older
 * than 30 days, and trail points older than 30 minutes. Never throws.
 */
export async function trackingHousekeeping(): Promise<void> {
  try {
    await sql(
      `DELETE FROM rider_location_trail t USING rider_jobs j
        WHERE j.id = t.job_id AND (j.status NOT IN ('accepted','picked_up') OR t.at < now() - make_interval(mins => $1))`,
      [TRAIL_MINUTES],
    );
    await sql(
      `DELETE FROM rider_locations l USING rider_jobs j
        WHERE j.id = l.job_id AND j.status NOT IN ('accepted','picked_up')
          AND (j.status <> 'delivered' OR coalesce(j.delivered_at, j.updated_at) < now() - make_interval(days => $1))`,
      [KEEP_DELIVERED_DAYS],
    );
  } catch (err) {
    console.error("[tracking] housekeeping:", err instanceof Error ? err.message : err);
  }
}

/* --------------------------------------------------------------- customer */

type CustomerJobRow = {
  id: string;
  vendor_order_id: string | null;
  status: "offered" | "accepted" | "picked_up" | "delivered";
  accepted_at: Date | null;
  picked_up_at: Date | null;
  delivered_at: Date | null;
  name: string;
  lat: number | null;
  lng: number | null;
  accuracy_m: number | null;
  at: Date | null;
  route: [number, number][] | null;
  route_s: number | null;
  route_from_lat: number | null;
  route_from_lng: number | null;
  route_at: Date | null;
};

/** Road route and ETA for a picked-up job, from the cache or OSRM; straight line when that fails. */
async function routeFor(j: CustomerJobRow, from: LatLng, dest: LatLng): Promise<{ line: [number, number][]; s: number; source: "road" | "line" }> {
  const age = j.route_at ? (Date.now() - new Date(j.route_at).getTime()) / 1000 : Infinity;
  const movedSince = j.route_from_lat !== null && j.route_from_lng !== null ? haversine(from, { lat: j.route_from_lat, lng: j.route_from_lng }) : Infinity;
  const fresh = j.route && j.route_s !== null && age < ROUTE_MAX_AGE_S && (age < ROUTE_REFRESH_S || movedSince < ROUTE_REFRESH_M);
  if (fresh) return { line: j.route!, s: j.route_s!, source: "road" };

  const road = await roadRoute(from, dest);
  if (road) {
    await sql(
      `UPDATE rider_locations SET route = $2::jsonb, route_m = $3, route_s = $4, route_from_lat = $5, route_from_lng = $6, route_at = now() WHERE job_id = $1`,
      [j.id, JSON.stringify(road.line), road.m, road.s, from.lat, from.lng],
    );
    return { line: road.line, s: road.s, source: "road" };
  }
  const m = haversine(from, dest);
  return { line: [[from.lat, from.lng], [dest.lat, dest.lng]], s: (m / 1000 / FALLBACK_KMH) * 3600, source: "line" };
}

/**
 * Tracking for one of the customer's own orders (null for anyone else's): each rider job's status
 * steps, and, while a parcel is on its way, the rider's position, route and ETA.
 */
export async function customerTracking(customerId: string, number: string): Promise<CustomerTracking | null> {
  const o = await sqlOne<OrderPoint & { id: string }>(
    "SELECT id, delivery_lat, delivery_lng, delivery_geo FROM orders WHERE number = $1 AND customer_id = $2",
    [number, customerId],
  );
  if (!o) return null;
  const rows = await sql<CustomerJobRow>(
    `SELECT j.id, j.vendor_order_id, j.status, j.accepted_at, j.picked_up_at, j.delivered_at, r.name,
            l.lat, l.lng, l.accuracy_m, l.at, l.route, l.route_s, l.route_from_lat, l.route_from_lng, l.route_at
       FROM rider_jobs j JOIN riders r ON r.id = j.rider_id
       LEFT JOIN rider_locations l ON l.job_id = j.id AND j.status = 'picked_up'
      WHERE j.order_id = $1 AND j.status IN ('offered','accepted','picked_up','delivered')
      ORDER BY j.created_at`,
    [o.id],
  );
  const live = rows.some((r) => r.status === "accepted" || r.status === "picked_up");

  let dest = pointOf(o);
  if (!dest && live && (o.delivery_geo === null || o.delivery_geo === "pending")) dest = await ensureDeliveryPoint(o.id);

  const events = rows.length
    ? await sql<{ job_id: string; kind: string; at: Date }>("SELECT job_id, kind, at FROM tracking_events WHERE job_id = ANY($1) AND kind IN ('arriving','arrived')", [rows.map((r) => r.id)])
    : [];
  const eventAt = (jobId: string, kind: string) => iso(events.find((e) => e.job_id === jobId && e.kind === kind)?.at);

  const jobs: CustomerTrackingJob[] = [];
  for (const r of rows) {
    const arrivingAt = eventAt(r.id, "arriving");
    const arrivedAt = eventAt(r.id, "arrived");
    const steps: TrackingStep[] = [
      { key: "accepted", label: "Rider assigned", at: iso(r.accepted_at) },
      { key: "picked_up", label: "Picked up", at: iso(r.picked_up_at) },
      { key: "arriving", label: "Arriving", at: arrivingAt },
      { key: "arrived", label: "Arrived", at: arrivedAt },
      { key: "delivered", label: "Delivered", at: iso(r.delivered_at) },
    ];
    const job: CustomerTrackingJob = {
      key: r.vendor_order_id ?? "house",
      status: r.status,
      riderFirstName: r.name.trim().split(/\s+/)[0],
      rider: null,
      distanceM: null,
      etaMin: null,
      etaSource: null,
      route: null,
      arriving: arrivingAt !== null,
      arrived: arrivedAt !== null,
      steps,
    };
    if (r.status === "picked_up" && r.lat !== null && r.lng !== null && r.at) {
      const from = { lat: r.lat, lng: r.lng };
      job.rider = { ...from, accuracy: r.accuracy_m ?? 0, at: iso(r.at)!, ageS: Math.max(0, Math.round((Date.now() - new Date(r.at).getTime()) / 1000)) };
      if (dest) {
        job.distanceM = Math.round(haversine(from, dest));
        if (job.arrived) {
          job.etaMin = 0;
        } else {
          const route = await routeFor(r, from, dest);
          job.route = route.line;
          job.etaSource = route.source;
          job.etaMin = Math.max(1, Math.ceil(route.s / 60));
        }
      }
    }
    jobs.push(job);
  }

  return { live, deliveryPoint: dest ? { lat: dest.lat, lng: dest.lng, approximate: !dest.precise } : null, jobs };
}

/* --------------------------------------------------------------- dispatch */

/** Every live job's rider position, for the admin dispatch board. */
export async function dispatchPositions(): Promise<DispatchRiderPosition[]> {
  const rows = await sql<{
    id: string; number: string; status: "accepted" | "picked_up"; rider_id: string; name: string; drop_name: string;
    lat: number | null; lng: number | null; accuracy_m: number | null; at: Date | null; distance_m: number | null;
    delivery_lat: number | null; delivery_lng: number | null;
    off_at: Date | null; off_distance: number | null; off_detail: string | null; arriving: boolean; arrived: boolean;
  }>(
    `SELECT j.id, o.number, j.status, j.rider_id, r.name, j.drop_name, l.lat, l.lng, l.accuracy_m, l.at, l.distance_m,
            o.delivery_lat, o.delivery_lng,
            e.at AS off_at, e.distance_m AS off_distance, e.detail AS off_detail,
            EXISTS (SELECT 1 FROM tracking_events x WHERE x.job_id = j.id AND x.kind = 'arriving') AS arriving,
            EXISTS (SELECT 1 FROM tracking_events x WHERE x.job_id = j.id AND x.kind = 'arrived') AS arrived
       FROM rider_jobs j JOIN orders o ON o.id = j.order_id JOIN riders r ON r.id = j.rider_id
       LEFT JOIN rider_locations l ON l.job_id = j.id
       LEFT JOIN tracking_events e ON e.job_id = j.id AND e.kind = 'off_route' AND e.resolved_at IS NULL
      WHERE j.status IN ('accepted','picked_up')
      ORDER BY (e.id IS NULL), j.updated_at DESC LIMIT 200`,
  );
  return rows.map((r) => ({
    jobId: r.id,
    orderNumber: r.number,
    status: r.status,
    riderId: r.rider_id,
    riderName: r.name,
    dropName: r.drop_name,
    point:
      r.lat !== null && r.lng !== null && r.at
        ? { lat: r.lat, lng: r.lng, accuracy: r.accuracy_m ?? 0, at: iso(r.at)!, ageS: Math.max(0, Math.round((Date.now() - new Date(r.at).getTime()) / 1000)) }
        : null,
    distanceM: r.distance_m,
    deliveryPoint: r.delivery_lat !== null && r.delivery_lng !== null ? { lat: r.delivery_lat, lng: r.delivery_lng } : null,
    offRoute: r.off_at ? { since: iso(r.off_at)!, distanceM: r.off_distance, detail: r.off_detail } : null,
    arriving: r.arriving,
    arrived: r.arrived,
  }));
}
