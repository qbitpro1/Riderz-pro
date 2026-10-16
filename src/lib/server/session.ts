import "server-only";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { sql, sqlOne } from "@/lib/db/client";
import { ApiError } from "./http";
import { newToken, sha256 } from "./security";
import { toVendorSelf, type VendorRow } from "./vendors";
import { vendorHome, type VendorSelf, type VendorStatus } from "@/lib/vendor/types";

/**
 * VENDOR SESSIONS
 *
 * A random token in an HttpOnly, SameSite=Lax cookie; the database stores only
 * its SHA-256. Sessions last 30 days and are revoked on sign-out, on a password
 * reset and when an admin rejects the application. A suspended vendor can still
 * sign in, read-only (CAN_SELL excludes them).
 *
 * Use `currentVendor()` in server components (returns null when signed out) and
 * `requireVendor()` in API routes (throws 401/403).
 */

export const SESSION_COOKIE = "rzp_vendor";
const SESSION_DAYS = 30;

export async function startSession(vendorId: string, userAgent: string | null): Promise<void> {
  const token = newToken();
  await sql(
    `INSERT INTO vendor_sessions (token_hash, vendor_id, expires_at, user_agent)
     VALUES ($1, $2, now() + make_interval(days => $3), $4)`,
    [sha256(token), vendorId, SESSION_DAYS, (userAgent ?? "").slice(0, 200)],
  );
  (await cookies()).set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_DAYS * 24 * 60 * 60,
  });
}

export async function endSession(): Promise<void> {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (token) await sql("DELETE FROM vendor_sessions WHERE token_hash = $1", [sha256(token)]);
  jar.delete(SESSION_COOKIE);
}

/** Revoke every session of a vendor (sign-out everywhere, suspension, password change). */
export async function endAllSessions(vendorId: string): Promise<void> {
  await sql("DELETE FROM vendor_sessions WHERE vendor_id = $1", [vendorId]);
}

async function sessionVendorRow(): Promise<VendorRow | null> {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token || token.length > 100) return null;
  const row = await sqlOne<VendorRow & { last_seen_at: Date }>(
    `SELECT v.*, s.last_seen_at FROM vendor_sessions s JOIN vendors v ON v.id = s.vendor_id
     WHERE s.token_hash = $1 AND s.expires_at > now()`,
    [sha256(token)],
  );
  if (!row) return null;
  // Touch at most every 10 minutes.
  if (Date.now() - new Date(row.last_seen_at).getTime() > 10 * 60 * 1000) {
    await sql("UPDATE vendor_sessions SET last_seen_at = now() WHERE token_hash = $1", [sha256(token)]);
  }
  return row;
}

/** The signed-in vendor, or null. Safe for server components. */
export async function currentVendor(): Promise<VendorSelf | null> {
  const row = await sessionVendorRow();
  return row ? toVendorSelf(row) : null;
}

/**
 * The signed-in vendor for an API route.
 *   allow: which statuses may use this route (default: any signed-in vendor)
 */
export async function requireVendor(allow?: readonly VendorStatus[]): Promise<VendorSelf> {
  const vendor = await currentVendor();
  if (!vendor) throw new ApiError(401, "signed_out", "Please sign in to your seller account.");
  if (allow && !allow.includes(vendor.status)) {
    throw new ApiError(
      403,
      "not_allowed",
      vendor.status === "suspended"
        ? "Your store is suspended. Contact seller support."
        : "This is available once your seller account is approved.",
    );
  }
  return vendor;
}

/** Statuses that may edit onboarding answers. */
export const CAN_EDIT_ONBOARDING: readonly VendorStatus[] = ["draft", "changes_requested"];
/** Statuses that may manage products, stock and orders. */
export const CAN_SELL: readonly VendorStatus[] = ["approved"];

/**
 * For vendor pages (server components): the signed-in vendor, or a redirect —
 * to /vendor/auth when signed out, to the vendor's own home when their status
 * does not allow this page.
 */
export async function vendorPage(allow?: readonly VendorStatus[], here = "/vendor/dashboard"): Promise<VendorSelf> {
  const vendor = await currentVendor();
  if (!vendor) redirect(`/vendor/auth?next=${encodeURIComponent(here)}`);
  if (allow && !allow.includes(vendor.status)) redirect(vendorHome(vendor.status));
  return vendor;
}
