import "server-only";

import { sql } from "@/lib/db/client";

/**
 * Deletes rows nobody needs any more: expired seller, customer and rider sessions, sign-in codes
 * older than a day, and rate-limit windows older than a day. Runs at most once an hour per server
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
      await sql("DELETE FROM vendor_otps WHERE created_at < now() - interval '1 day'");
      await sql("DELETE FROM rate_limits WHERE window_start < now() - interval '1 day'");
    } catch (err) {
      console.error("[housekeeping]", err instanceof Error ? err.message : err);
    }
  })();
}
