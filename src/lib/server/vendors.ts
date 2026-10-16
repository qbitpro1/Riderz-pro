import "server-only";

import { sql, type Query } from "@/lib/db/client";
import { newId } from "./security";
import type {
  BusinessType,
  ChangesRequested,
  VendorOnboarding,
  VendorSelf,
  VendorStatus,
  VendorTier,
} from "@/lib/vendor/types";

/**
 * Vendor rows, the audit log and vendor notifications.
 * The only place a database row becomes a `VendorSelf`.
 */

export type VendorRow = {
  id: string;
  email: string;
  mobile: string;
  password_hash: string;
  full_name: string;
  business_type: BusinessType;
  status: VendorStatus;
  email_verified_at: Date | null;
  mobile_verified_at: Date | null;
  store_name: string | null;
  slug: string | null;
  onboarding: VendorOnboarding;
  current_step: number;
  completed_steps: number[];
  commission_rate: string | null;
  tier: VendorTier | null;
  holiday_mode: boolean;
  changes_requested: ChangesRequested | null;
  rejection_reason: string | null;
  status_before_suspension: VendorStatus | null;
  submitted_at: Date | null;
  approved_at: Date | null;
  approved_by: string | null;
  created_at: Date;
  updated_at: Date;
};

const iso = (d: Date | string | null) => (d ? new Date(d).toISOString() : null);

export function toVendorSelf(r: VendorRow): VendorSelf {
  return {
    id: r.id,
    email: r.email,
    mobile: r.mobile,
    fullName: r.full_name,
    businessType: r.business_type,
    status: r.status,
    emailVerified: Boolean(r.email_verified_at),
    mobileVerified: Boolean(r.mobile_verified_at),
    storeName: r.store_name,
    slug: r.slug,
    onboarding: r.onboarding ?? {},
    currentStep: r.current_step,
    completedSteps: r.completed_steps ?? [],
    commissionRate: r.commission_rate === null ? null : Number(r.commission_rate),
    tier: r.tier,
    changesRequested: r.changes_requested,
    rejectionReason: r.rejection_reason,
    submittedAt: iso(r.submitted_at),
    approvedAt: iso(r.approved_at),
  };
}

export async function vendorById(id: string, q: Query = sql): Promise<VendorRow | null> {
  return (await q<VendorRow>("SELECT * FROM vendors WHERE id = $1", [id]))[0] ?? null;
}

/** An approved store by its slug. */
export async function publicVendorBySlug(slug: string): Promise<VendorRow | null> {
  return (
    (await sql<VendorRow>("SELECT * FROM vendors WHERE slug = $1 AND status = 'approved'", [slug]))[0] ?? null
  );
}

/* ------------------------------------------------------------------ audit */

export type Actor = { type: "vendor" | "admin" | "system" | "customer"; id: string };

/** Append-only record of every account, KYC, product, order and payout decision. */
export async function audit(
  actor: Actor,
  action: string,
  opts: { vendorId?: string | null; detail?: Record<string, unknown>; ip?: string | null } = {},
  q: Query = sql,
): Promise<void> {
  await q(
    "INSERT INTO audit_log (actor_type, actor, vendor_id, action, detail, ip) VALUES ($1, $2, $3, $4, $5, $6)",
    [actor.type, actor.id, opts.vendorId ?? null, action, opts.detail ? JSON.stringify(opts.detail) : null, opts.ip ?? null],
  );
}

/* ---------------------------------------------------------- notifications */

export type NotificationType = "account" | "product" | "order" | "stock" | "payout" | "support";

export async function notifyVendor(
  vendorId: string,
  n: { type: NotificationType; title: string; body: string; link?: string },
  q: Query = sql,
): Promise<void> {
  await q("INSERT INTO notifications (id, vendor_id, type, title, body, link) VALUES ($1, $2, $3, $4, $5, $6)", [
    newId("ntf"),
    vendorId,
    n.type,
    n.title.slice(0, 120),
    n.body.slice(0, 600),
    n.link ?? null,
  ]);
}
