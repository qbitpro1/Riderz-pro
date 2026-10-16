import type { Metadata } from "next";
import Link from "next/link";
import { AlertTriangle, ArrowRight, CheckCircle2, Clock, Lock, Mail, Phone, ShieldCheck, XCircle, type LucideIcon } from "lucide-react";
import { SignOutButton } from "@/components/vendor/auth/SignOutButton";
import { VendorTimeline } from "@/components/vendor/pending/VendorTimeline";
import { sql } from "@/lib/db/client";
import { SITE } from "@/lib/data/site";
import { vendorPage } from "@/lib/server/session";
import { ONBOARDING_STEPS, type VendorStatus } from "@/lib/vendor/types";

export const metadata: Metadata = {
  title: "Application status",
  description: "Where your Riderzpro seller application stands.",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

const STATUS: Partial<Record<VendorStatus, { icon: LucideIcon; tone: string; title: string; body: string }>> = {
  submitted: {
    icon: Clock,
    tone: "bg-gold/15 text-gold",
    title: "Application received",
    body: "Your application is in the queue. A reviewer will open it shortly and check your documents against the details you gave.",
  },
  under_review: {
    icon: ShieldCheck,
    tone: "bg-accent/10 text-accent",
    title: "Under review",
    body: "A reviewer is checking your GSTIN, PAN, bank details and documents. You don't need to do anything right now.",
  },
  changes_requested: {
    icon: AlertTriangle,
    tone: "bg-gold/15 text-gold",
    title: "Changes needed",
    body: "Our reviewer flagged a few sections. Update only those and resubmit. The rest stays as you submitted it.",
  },
  rejected: {
    icon: XCircle,
    tone: "bg-danger/10 text-danger",
    title: "Application not approved",
    body: "We couldn't approve this application. The reason is below. If you think this is a mistake, get in touch with seller support.",
  },
};

/** The vendor's own actions and review decisions. Admin names and IPs are never read. */
async function timeline(vendorId: string) {
  const rows = await sql<{ at: Date; action: string }>(
    `SELECT at, action FROM audit_log
      WHERE vendor_id = $1
        AND ((actor_type = 'vendor' AND action IN ('vendor.signup','vendor.verify_email','vendor.verify_mobile','onboarding.submit','onboarding.resubmit'))
             OR action LIKE 'kyc.%')
      ORDER BY at ASC, id ASC LIMIT 60`,
    [vendorId],
  );
  const label = (a: string): string => {
    if (a === "vendor.signup") return "Account created";
    if (a === "vendor.verify_email") return "Email verified";
    if (a === "vendor.verify_mobile") return "Mobile verified";
    if (a === "onboarding.submit") return "Application submitted";
    if (a === "onboarding.resubmit") return "Application resubmitted";
    if (/approve/.test(a)) return "Application approved";
    if (/reject/.test(a)) return "Application not approved";
    if (/change/.test(a)) return "Changes requested";
    if (/open|review|start/.test(a)) return "Review started";
    if (/suspend/.test(a)) return "Account paused";
    if (/reinstate|restore|unsuspend/.test(a)) return "Account restored";
    return "Review update";
  };
  return rows.map((r) => ({ at: new Date(r.at).toISOString(), label: label(r.action) }));
}

export default async function PendingPage() {
  const vendor = await vendorPage(["submitted", "under_review", "rejected", "changes_requested"], "/vendor/pending");
  const info = STATUS[vendor.status]!;
  const Icon = info.icon;
  const events = await timeline(vendor.id);
  const flagged = vendor.changesRequested?.sections
    .map((id) => ONBOARDING_STEPS.find((s) => s.id === id)?.title)
    .filter(Boolean);

  return (
    <main className="shell max-w-3xl space-y-6 pb-16 pt-28 md:pb-24 md:pt-36">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="eyebrow">Seller application</p>
        <SignOutButton />
      </div>

      <section className="card p-6 text-center sm:p-9" aria-labelledby="status-title">
        <div className={`mx-auto flex h-14 w-14 items-center justify-center rounded-full ${info.tone}`}>
          <Icon size={28} aria-hidden="true" />
        </div>
        <h1 id="status-title" className="display-3 mt-5">
          {info.title}
        </h1>
        <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-ash">{info.body}</p>
        {vendor.storeName && (
          <p className="mt-4 text-xs text-dim">
            Store: <span className="font-semibold text-chalk">{vendor.storeName}</span>
          </p>
        )}

        {(vendor.status === "submitted" || vendor.status === "under_review") && (
          <p className="mx-auto mt-5 inline-flex items-center gap-2 rounded-sm border border-tint/10 bg-tint/5 px-3 py-2 text-xs text-ash">
            <Clock size={14} aria-hidden="true" /> Expected review time: 1–2 working days
          </p>
        )}

        {vendor.status === "changes_requested" && (
          <div className="mt-6 text-left">
            <div className="rounded-sm border border-gold/40 bg-gold/10 p-4">
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-dim">Note from the reviewer</p>
              <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-chalk">
                {vendor.changesRequested?.note || "Please check the flagged sections and re-upload clear documents."}
              </p>
              {flagged && flagged.length > 0 && (
                <p className="mt-3 flex flex-wrap items-center gap-2 text-xs text-ash">
                  Sections to fix:
                  {flagged.map((f) => (
                    <span key={f} className="chip">
                      {f}
                    </span>
                  ))}
                </p>
              )}
            </div>
            <div className="mt-5 text-center">
              <Link href="/vendor/onboarding" className="btn btn-primary">
                Fix and resubmit <ArrowRight size={15} aria-hidden="true" />
              </Link>
            </div>
          </div>
        )}

        {vendor.status === "rejected" && (
          <div className="mt-6 text-left">
            <div className="rounded-sm border border-danger/40 bg-danger/10 p-4">
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-dim">Reason</p>
              <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-chalk">
                {vendor.rejectionReason || "No reason was recorded. Please contact seller support."}
              </p>
            </div>
            <div className="mt-5 flex flex-wrap justify-center gap-3">
              <a href={`mailto:${SITE.email}?subject=${encodeURIComponent("Seller application support")}`} className="btn btn-outline">
                <Mail size={15} aria-hidden="true" /> {SITE.email}
              </a>
              <a href={SITE.phoneHref} className="btn btn-outline">
                <Phone size={15} aria-hidden="true" /> {SITE.phone}
              </a>
            </div>
          </div>
        )}
      </section>

      <div className="flex items-start gap-3 rounded-sm border border-tint/10 bg-tint/5 p-4 sm:p-5">
        <Lock size={18} className="mt-0.5 shrink-0 text-dim" aria-hidden="true" />
        <div>
          <h2 className="text-sm font-bold text-chalk">Listing products unlocks after approval</h2>
          <p className="mt-1 text-xs leading-relaxed text-ash">
            Adding products, managing stock and prices, and receiving orders open up as soon as your application is approved. We'll show it on this page and in your seller notifications.
          </p>
        </div>
      </div>

      <section className="card p-6" aria-labelledby="timeline-title">
        <h2 id="timeline-title" className="display-3 mb-5 !text-xl">
          Timeline
        </h2>
        {events.length ? (
          <VendorTimeline events={events} />
        ) : (
          <p className="text-sm text-ash">Nothing here yet.</p>
        )}
      </section>

      <p className="flex items-center justify-center gap-1.5 text-center text-xs text-dim">
        <CheckCircle2 size={13} aria-hidden="true" /> Questions? Write to{" "}
        <a href={`mailto:${SITE.email}`} className="font-semibold text-accent hover:underline">
          {SITE.email}
        </a>
      </p>
    </main>
  );
}
