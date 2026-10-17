import "server-only";

import { sql } from "@/lib/db/client";
import { releaseUnpaidOrders } from "./payments";
import { trackingHousekeeping } from "./tracking";

/**
 * Deletes rows nobody needs any more: expired seller, customer, rider and admin sessions, admin links a month past expiry, sign-in codes
 * older than a day, rate-limit windows older than a day, rider location trails of closed deliveries
 * (tracking.ts), and online orders left unpaid for 30 minutes, whose stock goes back (payments.ts). Runs at most once an hour per server
 * instance, started from busy sign-in paths (no separate scheduler needed). Never throws.
 */
const EVERY_MS = 60 * 60 * 1000;
let last = 0;

export function housekeeping(): void {
  const now = Date.now();
  if (now - last < EVERY_MS) return;
  last = now;
  void (async () => {
    try {
      await sql("DELETE FROM vendor_sessions WHERE expires_at < now()");
      await sql("DELETE FROM customer_sessions WHERE expires_at < now()");
      await sql("DELETE FROM rider_sessions WHERE expires_at < now()");
      await sql("DELETE FROM admin_sessions WHERE expires_at < now()");
      await sql("DELETE FROM admin_invites WHERE expires_at < now() - interval '30 days'");
      await sql("DELETE FROM vendor_otps WHERE created_at < now() - interval '1 day'");
      await sql("DELETE FROM rate_limits WHERE window_start < now() - interval '1 day'");
      await trackingHousekeeping();
      await releaseUnpaidOrders();
    } catch (err) {
      console.error("[housekeeping]", err instanceof Error ? err.message : err);
    }
  })();
}
