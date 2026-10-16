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
 *
 * STORE SCREEN LOCK — a session showing the seller's offline store screen
 * (/store/[slug]) is locked to it (`vendor_sessions.kiosk_locked_at`): vendor
 * pages redirect back to the screen and vendor APIs answer 423, so a customer
 * using the shop's tablet cannot reach the dashboard. The seller unlocks with
 * their password (/api/vendor/store-screen). A new sign-in starts unlocked.
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

async function sessionToken(): Promise<string | null> {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  return token && token.length <= 100 ? token : null;
}

async function sessionVendorRow(): Promise<{ row: VendorRow; locked: boolean } | null> {
  const token = await sessionToken();
  if (!token) return null;
  const row = await sqlOne<VendorRow & { last_seen_at: Date; kiosk_locked_at: Date | null }>(
    `SELECT v.*, s.last_seen_at, s.kiosk_locked_at FROM vendor_sessions s JOIN vendors v ON v.id = s.vendor_id
     WHERE s.token_hash = $1 AND s.expires_at > now()`,
    [sha256(token)],
  );
  if (!row) return null;
  // Touch at most every 10 minutes.
  if (Date.now() - new Date(row.last_seen_at).getTime() > 10 * 60 * 1000) {
    await sql("UPDATE vendor_sessions SET last_seen_at = now() WHERE token_hash = $1", [sha256(token)]);
  }
  return { row, locked: row.kiosk_locked_at !== null };
}

/** The signed-in vendor, or null. Safe for server components. */
export async function currentVendor(): Promise<VendorSelf | null> {
  const s = await sessionVendorRow();
  return s ? toVendorSelf(s.row) : null;
}

/** The signed-in vendor and whether this session is locked to the store screen. */
export async function currentSession(): Promise<{ vendor: VendorSelf; locked: boolean } | null> {
  const s = await sessionVendorRow();
  return s ? { vendor: toVendorSelf(s.row), locked: s.locked } : null;
}

/** Lock (or unlock) this session to the store screen. */
export async function setStoreScreenLock(locked: boolean): Promise<void> {
  const token = await sessionToken();
  if (!token) return;
  await sql(
    `UPDATE vendor_sessions SET kiosk_locked_at = ${locked ? "now()" : "NULL"} WHERE token_hash = $1`,
    [sha256(token)],
  );
}

/** Where a locked session belongs. */
const storeScreenHref = (vendor: VendorSelf) => (vendor.slug ? `/store/${vendor.slug}` : "/vendor/dashboard");

/**
 * The signed-in vendor for an API route.
 *   allow: which statuses may use this route (default: any signed-in vendor)
 */
export async function requireVendor(
  allow?: readonly VendorStatus[],
  opts: { whileLocked?: boolean } = {},
): Promise<VendorSelf> {
  const session = await currentSession();
  if (!session) throw new ApiError(401, "signed_out", "Please sign in to your seller account.");
  const { vendor } = session;
  // Only an approved store has a screen; any other status falls through to the usual checks.
  if (session.locked && vendor.status === "approved" && !opts.whileLocked) {
    throw new ApiError(423, "store_screen_locked", "This device is showing your store screen. Unlock it with your password first.");
  }
  if (allow && !allow.includes(vendor.status)) {
    throw new ApiError(403, "not_allowed", notAllowedMessage(vendor.status, allow));
  }
  return vendor;
}

/** Why a vendor in `status` cannot use a route that allows `allow`, in words that fit where they are. */
function notAllowedMessage(status: VendorStatus, allow: readonly VendorStatus[]): string {
  // Onboarding routes allow drafts; every other restricted route is for approved stores.
  const onboardingRoute = allow.includes("draft");
  switch (status) {
    case "suspended":
      return "Your store is suspended. Contact seller support.";
    case "rejected":
      return "Your seller application was not approved. Contact seller support if you have questions.";
    case "submitted":
    case "under_review":
      return onboardingRoute
        ? "Your application is with our team for review and can't be changed now."
        : "Your application is being reviewed. This opens once your store is approved.";
    case "draft":
      return "Finish and submit your seller application first.";
    case "changes_requested":
      return "Update the sections our team flagged and resubmit your application first.";
    case "approved":
      return onboardingRoute
        ? "Your store is already approved. Update your details from Settings."
        : "This isn't available for your store.";
  }
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
  const session = await currentSession();
  if (!session) redirect(`/vendor/auth?next=${encodeURIComponent(here)}`);
  const { vendor } = session;
  if (session.locked && vendor.status === "approved") redirect(storeScreenHref(vendor));
  if (allow && !allow.includes(vendor.status)) redirect(vendorHome(vendor.status));
  return vendor;
}
