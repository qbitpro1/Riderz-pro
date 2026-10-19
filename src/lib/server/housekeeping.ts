import "server-only";

import { after } from "next/server";
import { sql } from "@/lib/db/client";
import { releaseUnpaidOrders } from "./payments";
import { trackingHousekeeping } from "./tracking";
import { SALESMAN_LOG_DAYS } from "./salesman-log";
import { releaseStaleCounterOrders } from "./store-sales";

/**
 * HOUSEKEEPING
 *
 * Releases what was held and deletes what nobody needs any more:
 *   - online orders unpaid after 30 minutes and shop counter orders not collected in 12 hours
 *     (stock goes back);
 *   - rider location trails of closed deliveries (tracking.ts retention);
 *   - expired seller, customer, rider and admin sessions; admin links a month past expiry;
 *   - sign-in codes and rate-limit windows older than a day; unused shop offers older than a week.
 *
 * Two ways in:
 *   - the scheduler calls /api/cron/housekeeping (hourly; see docs/DEPLOY.md). This is the one
 *     to rely on in production.
 *   - busy routes call `housekeeping()`, which runs it after the response at most once an hour per
 *     server instance, a safety net when no scheduler is set up.
 * Each step runs on its own, so one failing step never stops the others.
 */

type Step = { name: string; run: () => Promise<unknown> };

const STEPS: Step[] = [
  { name: "unpaid online orders", run: () => releaseUnpaidOrders() },
  { name: "uncollected counter orders", run: () => releaseStaleCounterOrders() },
  { name: "tracking trails", run: () => trackingHousekeeping() },
  { name: "vendor sessions", run: () => sql("DELETE FROM vendor_sessions WHERE expires_at < now()") },
  { name: "customer sessions", run: () => sql("DELETE FROM customer_sessions WHERE expires_at < now()") },
  { name: "rider sessions", run: () => sql("DELETE FROM rider_sessions WHERE expires_at < now()") },
  { name: "admin sessions", run: () => sql("DELETE FROM admin_sessions WHERE expires_at < now()") },
  { name: "admin links", run: () => sql("DELETE FROM admin_invites WHERE expires_at < now() - interval '30 days'") },
  { name: "sign-in codes", run: () => sql("DELETE FROM vendor_otps WHERE created_at < now() - interval '1 day'") },
  { name: "rate limits", run: () => sql("DELETE FROM rate_limits WHERE window_start < now() - interval '1 day'") },
  { name: "salesman log", run: () => sql(`DELETE FROM salesman_turns WHERE created_at < now() - make_interval(days => ${SALESMAN_LOG_DAYS})`) },
  { name: "shop offers", run: () => sql("DELETE FROM store_offers WHERE used_order_id IS NULL AND expires_at < now() - interval '7 days'") },
];

/** Runs every step now and reports which failed. Never throws. */
export async function runHousekeeping(): Promise<{ ok: boolean; failed: string[] }> {
  const failed: string[] = [];
  for (const step of STEPS) {
    try {
      await step.run();
    } catch (err) {
      failed.push(step.name);
      console.error(`[housekeeping] ${step.name}:`, err instanceof Error ? err.message : err);
    }
  }
  return { ok: failed.length === 0, failed };
}

const EVERY_MS = 60 * 60 * 1000;
let last = 0;

/** Safety net from busy routes: at most hourly per instance, after the response is sent. */
export function housekeeping(): void {
  const now = Date.now();
  if (now - last < EVERY_MS) return;
  last = now;
  const task = async () => {
    await runHousekeeping();
  };
  try {
    after(task); // keeps a serverless function alive until it finishes
  } catch {
    void task(); // outside a request (scripts): just start it
  }
}
