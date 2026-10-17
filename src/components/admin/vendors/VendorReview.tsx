"use client";

import { storeHref } from "@/lib/vendor/types";
import { AlertTriangle, ArrowLeft, Check, Eye, EyeOff, FileText, ShieldCheck, ZoomIn } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import type { VendorReview as Review } from "@/lib/server/admin-vendors";
import { api, ApiFailure } from "@/lib/vendor/client";
import { ONBOARDING_STEPS, VENDOR_TIERS, type OnboardingSectionId } from "@/lib/vendor/types";
import { maskTail } from "@/lib/vendor/validators";
import { Field, fmtDate, fmtSize, Modal, Notice, StatusBadge } from "./ui";

type Reveal = { field: "bank" | "pan"; value: string; holder?: string | null; ifsc?: string | null };

function KV({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-[8.5rem_1fr] gap-x-3 py-1.5 text-sm sm:grid-cols-[11rem_1fr]">
      <dt className="text-xs uppercase tracking-[0.08em] text-dim">{label}</dt>
      <dd className="min-w-0 break-words text-chalk">{children || <span className="text-dim">—</span>}</dd>
    </div>
  );
}

function Section({ id, title, flagged, children }: { id: string; title: string; flagged?: boolean; children: React.ReactNode }) {
  return (
    <section aria-labelledby={`sec-${id}`} className={`card p-4 md:p-5 ${flagged ? "border-gold/40" : ""}`}>
      <h2 id={`sec-${id}`} className="mb-2 flex items-center gap-2 font-display text-sm font-extrabold uppercase tracking-[0.06em]">
        {title}
        {flagged ? <span className="text-[10px] text-gold">flagged for changes</span> : null}
      </h2>
      <dl className="divide-y divide-tint/10">{children}</dl>
    </section>
  );
}

const ACTION_LABEL: Record<string, string> = {
  "kyc.start_review": "Opened for review",
  "kyc.approve": "Approved",
  "kyc.request_changes": "Changes requested",
  "kyc.reject": "Rejected",
  "kyc.suspend": "Suspended",
  "kyc.reinstate": "Reinstated",
  "kyc.reveal_bank": "Bank number revealed",
  "kyc.reveal_pan": "PAN revealed",
};

export default function VendorReview({ review }: { review: Review }) {
  const router = useRouter();
  const { vendor, checks } = review;
  const o = vendor.onboarding;
  const flagged = new Set<OnboardingSectionId>(vendor.changesRequested?.sections ?? []);

  const [msg, setMsg] = useState<{ tone: "ok" | "error"; text: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const [dialog, setDialog] = useState<null | "approve" | "changes" | "reject" | "suspend" | "reveal">(null);
  const [zoom, setZoom] = useState<Review["files"][number] | null>(null);

  // Moderation checklist: server-verifiable items start ticked when they pass.
  const [ticks, setTicks] = useState({
    gstin: checks.gstin.applicable ? !checks.gstin.problem : true,
    pan: false,
    docs: false,
    holder: checks.holderMatchesLegalName,
    contact: checks.emailVerified && checks.mobileVerified,
  });
  const allTicked = Object.values(ticks).every(Boolean);

  // approve form
  const [commission, setCommission] = useState(10);
  const [tier, setTier] = useState<(typeof VENDOR_TIERS)[number]>("standard");
  // changes form
  const [sections, setSections] = useState<OnboardingSectionId[]>([]);
  const [note, setNote] = useState("");
  const [reason, setReason] = useState("");
  // reveal
  const [revealField, setRevealField] = useState<"bank" | "pan">("bank");
  const [revealReason, setRevealReason] = useState("");
  const [revealed, setRevealed] = useState<(Reveal & { until: number }) | null>(null);
  const [now, setNow] = useState(() => Date.now());
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!revealed) return;
    const t = setInterval(() => {
      setNow(Date.now());
      setRevealed((r) => (r && Date.now() >= r.until ? null : r));
    }, 500);
    return () => clearInterval(t);
  }, [revealed]);

  const status = vendor.status;
  const canDecide = status === "submitted" || status === "under_review";

  function closeDialog() {
    setDialog(null);
    setFieldErrors({});
  }

  async function decide(body: Record<string, unknown>, done: string) {
    setBusy(true);
    setMsg(null);
    setFieldErrors({});
    try {
      await api(`/api/admin/vendors/${vendor.id}/decision`, { body });
      setMsg({ tone: "ok", text: done });
      setDialog(null);
      router.refresh();
    } catch (e) {
      if (e instanceof ApiFailure) {
        setFieldErrors(e.fields);
        setMsg({ tone: "error", text: e.message });
        if (e.status === 409) router.refresh();
      } else setMsg({ tone: "error", text: "Something went wrong." });
    } finally {
      setBusy(false);
    }
  }

  async function doReveal() {
    setBusy(true);
    setFieldErrors({});
    try {
      const res = await api<{ revealed: Reveal }>(`/api/admin/vendors/${vendor.id}/reveal`, {
        body: { field: revealField, reason: revealReason },
      });
      setRevealed({ ...res.revealed, until: Date.now() + 30_000 });
      setNow(Date.now());
      setRevealReason("");
      setDialog(null);
      router.refresh();
    } catch (e) {
      setFieldErrors(e instanceof ApiFailure ? { ...e.fields, _: e.message } : { _: "Something went wrong." });
    } finally {
      setBusy(false);
    }
  }

  const secondsLeft = revealed ? Math.max(0, Math.ceil((revealed.until - now) / 1000)) : 0;
  const imgUrl = (id: string | null | undefined) => (id ? `/api/admin/files/${id}` : null);
  const logo = imgUrl(o.store?.logoFileId);
  const banner = imgUrl(o.store?.bannerFileId);
  const sectionTitle = (id: OnboardingSectionId) => ONBOARDING_STEPS.find((s) => s.id === id)!.title;
  const stepOf = useMemo(() => Object.fromEntries(ONBOARDING_STEPS.map((s) => [s.id, s.title])), []);

  return (
    <div className="shell pt-24 pb-16 md:pt-32">
      <Link href="/admin/vendors" className="mb-4 inline-flex items-center gap-1.5 text-xs uppercase tracking-[0.12em] text-ash hover:text-chalk">
        <ArrowLeft size={14} aria-hidden /> KYC queue
      </Link>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="eyebrow mb-2">Seller application · internal</p>
          <h1 className="display-3 break-words">{vendor.storeName ?? vendor.fullName}</h1>
          <p className="mt-2 text-sm text-ash">
            {vendor.fullName} · {vendor.businessType} · {vendor.email} · {vendor.mobile}
          </p>
        </div>
        <div className="text-right">
          <StatusBadge status={status} />
          <p className="mt-2 text-xs text-dim">Submitted {fmtDate(vendor.submittedAt)}</p>
          {vendor.approvedAt ? <p className="text-xs text-dim">Approved {fmtDate(vendor.approvedAt)}{review.approvedBy ? ` by ${review.approvedBy}` : ""}</p> : null}
        </div>
      </div>

      {msg ? <div className="mt-4"><Notice tone={msg.tone}>{msg.text}</Notice></div> : null}
      {vendor.changesRequested ? (
        <div className="card mt-4 border-gold/40 bg-gold/6 p-4 text-sm">
          <p className="font-bold text-gold">Waiting on the seller</p>
          <p className="mt-1 text-chalk/90">{vendor.changesRequested.note}</p>
          <p className="mt-1 text-xs text-dim">
            Sections: {vendor.changesRequested.sections.map((s) => stepOf[s]).join(", ")} · asked {fmtDate(vendor.changesRequested.requestedAt)}
          </p>
        </div>
      ) : null}
      {status === "rejected" && vendor.rejectionReason ? <div className="mt-4"><Notice tone="error">Rejected: {vendor.rejectionReason}</Notice></div> : null}
      {status === "suspended" && vendor.rejectionReason ? <div className="mt-4"><Notice tone="error">Suspended: {vendor.rejectionReason}</Notice></div> : null}

      <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_22rem]">
        {/* ------------------------------------------------ application */}
        <div className="space-y-4">
          <Section id="account" title="1 · Account" flagged={flagged.has("account")}>
            <KV label="Full name">{vendor.fullName}</KV>
            <KV label="Business type">{vendor.businessType}</KV>
            <KV label="Email">{vendor.email} {vendor.emailVerified ? <span className="text-xs text-accent">verified</span> : <span className="text-xs text-gold">not verified</span>}</KV>
            <KV label="Mobile">{vendor.mobile} {vendor.mobileVerified ? <span className="text-xs text-accent">verified</span> : <span className="text-xs text-gold">not verified</span>}</KV>
          </Section>

          <Section id="tax" title="2 · Tax details" flagged={flagged.has("tax")}>
            <KV label="Legal name">{o.tax?.legalName}</KV>
            <KV label="Trade name">{o.tax?.tradeName}</KV>
            <KV label="GSTIN">
              {o.tax?.gstExempt ? (
                "GST exempt / not registered"
              ) : (
                <span className="font-mono">
                  {o.tax?.gstin}{" "}
                  {checks.gstin.problem ? <span className="text-xs text-danger">{checks.gstin.problem}</span> : <span className="text-xs text-accent">checksum valid</span>}
                </span>
              )}
            </KV>
            <KV label="PAN">
              <span className="font-mono">{review.secrets.panLast4 ? maskTail(review.secrets.panLast4) : "—"}</span>{" "}
              {checks.panMatchesGstin === true ? <span className="text-xs text-accent">matches GSTIN</span> : checks.panMatchesGstin === false ? <span className="text-xs text-danger">does not match GSTIN</span> : null}
              {review.secrets.panLast4 ? (
                <button type="button" className="ml-2 inline-flex items-center gap-1 text-xs text-accent underline-offset-2 hover:underline" onClick={() => { setRevealField("pan"); setDialog("reveal"); }}>
                  <Eye size={12} aria-hidden /> Reveal
                </button>
              ) : null}
            </KV>
            <KV label="ID document">{o.tax ? `${o.tax.idType} ending ${o.tax.idLast4}` : null}</KV>
          </Section>

          <Section id="store" title="3 · Store" flagged={flagged.has("store")}>
            <KV label="Store name">{o.store?.storeName}</KV>
            <KV label="URL">{o.store ? <span className="font-mono">/store/{o.store.slug}</span> : null}</KV>
            <KV label="Seller type">{o.store?.sellerType}</KV>
            <KV label="Description">{o.store?.description}</KV>
            <KV label="Departments">{o.store?.departments.join(", ")}</KV>
            <KV label="Brands">{o.store?.brands.map((b) => `${b.name} (${b.authType})`).join(", ")}</KV>
            {logo || banner ? (
              <KV label="Branding">
                <div className="flex flex-wrap items-center gap-3">
                  {logo ? /* eslint-disable-next-line @next/next/no-img-element */ <img src={logo} alt="Store logo" className="h-14 w-14 rounded-[2px] border border-tint/10 bg-steel object-contain" /> : null}
                  {banner ? /* eslint-disable-next-line @next/next/no-img-element */ <img src={banner} alt="Store banner" className="h-14 max-w-full rounded-[2px] border border-tint/10 bg-steel object-cover" /> : null}
                </div>
              </KV>
            ) : null}
          </Section>

          <Section id="shipping" title="4 · Shipping & pickup" flagged={flagged.has("shipping")}>
            {o.shipping ? (
              <>
                <KV label="Pickup address">
                  {[o.shipping.pickup.line1, o.shipping.pickup.line2, o.shipping.pickup.city, o.shipping.pickup.state, o.shipping.pickup.pincode].filter(Boolean).join(", ")}
                </KV>
                <KV label="Contact phone">{o.shipping.contactPhone}</KV>
                <KV label="Dispatch in">{o.shipping.handlingDays} working day(s)</KV>
                <KV label="Ships to">{o.shipping.shipsTo === "pan_india" ? "All India" : "Own state only"}</KV>
                <KV label="Returns">{o.shipping.acceptsReturns ? `Accepted within ${o.shipping.returnWindowDays} days` : "Not accepted"}</KV>
              </>
            ) : <KV label="Shipping">{null}</KV>}
          </Section>

          <Section id="bank" title="5 · Bank details" flagged={flagged.has("bank")}>
            <KV label="Account holder">
              {review.secrets.bankHolder}{" "}
              {checks.holderMatchesLegalName ? <span className="text-xs text-accent">matches legal name</span> : <span className="text-xs text-gold">differs from legal name</span>}
            </KV>
            <KV label="Account number">
              <span className="font-mono">{review.secrets.bankLast4 ? maskTail(review.secrets.bankLast4, 12) : "—"}</span>
              {review.secrets.bankLast4 ? (
                <button type="button" className="ml-2 inline-flex items-center gap-1 text-xs text-accent underline-offset-2 hover:underline" onClick={() => { setRevealField("bank"); setDialog("reveal"); }}>
                  <Eye size={12} aria-hidden /> Reveal
                </button>
              ) : null}
            </KV>
            <KV label="IFSC"><span className="font-mono">{review.secrets.bankIfsc}</span></KV>
            {revealed ? (
              <div className="py-2">
                <div role="status" className="card border-gold/40 bg-gold/6 p-3 text-sm">
                  <p className="flex items-center gap-2 text-xs uppercase tracking-[0.1em] text-gold">
                    <EyeOff size={14} aria-hidden /> {revealed.field === "bank" ? "Account number" : "PAN"} · hides in {secondsLeft}s
                  </p>
                  <p className="mt-1 break-all font-mono text-lg text-chalk">{revealed.value}</p>
                  <button type="button" className="btn btn-outline btn-sm mt-2" onClick={() => setRevealed(null)}>Hide now</button>
                </div>
              </div>
            ) : null}
          </Section>

          <Section id="documents" title="6 · Documents & agreement" flagged={flagged.has("documents")}>
            {checks.documents.map((d) => (
              <KV key={d.kind} label={d.label}>
                {d.present ? <span className="text-xs text-accent">uploaded</span> : <span className="text-xs text-danger">missing (required)</span>}
              </KV>
            ))}
            <KV label="Signatory">{o.documents?.agreement.signatoryName}</KV>
            <KV label="Agreement accepted">{fmtDate(o.documents?.agreement.acceptedAt)}</KV>
            <div className="py-3">
              <p className="mb-2 text-xs uppercase tracking-[0.08em] text-dim">Uploaded files ({review.files.length})</p>
              {review.files.length === 0 ? <p className="text-sm text-dim">No documents uploaded.</p> : (
                <ul className="grid gap-3 sm:grid-cols-2">
                  {review.files.map((f) => (
                    <li key={f.id} className="rounded-[2px] border border-tint/10 bg-steel p-2">
                      <button type="button" onClick={() => setZoom(f)} className="group relative block w-full overflow-hidden rounded-[2px] bg-carbon" aria-label={`Open ${f.label}`}>
                        {f.mime.startsWith("image/") ? (
                          /* eslint-disable-next-line @next/next/no-img-element */
                          <img src={f.url} alt={f.label} className="h-36 w-full object-contain" />
                        ) : (
                          <span className="flex h-36 w-full items-center justify-center gap-2 text-ash"><FileText size={28} aria-hidden /> PDF</span>
                        )}
                        <span className="absolute right-1.5 top-1.5 rounded-[2px] bg-void/80 p-1 text-chalk opacity-80 group-hover:opacity-100"><ZoomIn size={14} aria-hidden /></span>
                      </button>
                      <p className="mt-2 text-sm font-semibold">{f.label}</p>
                      <p className="text-xs text-dim">{f.mime.replace("application/", "").replace("image/", "").toUpperCase()} · {fmtSize(f.size)} · {fmtDate(f.createdAt, false)}</p>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </Section>

          <section aria-labelledby="timeline" className="card p-4 md:p-5">
            <h2 id="timeline" className="mb-3 font-display text-sm font-extrabold uppercase tracking-[0.06em]">Timeline</h2>
            {review.timeline.length === 0 ? <p className="text-sm text-dim">Nothing recorded yet.</p> : (
              <ol className="space-y-3 border-l border-tint/10 pl-4">
                {review.timeline.map((t, i) => {
                  const detail = t.detail && typeof t.detail === "object" ? (t.detail as Record<string, unknown>) : null;
                  const text = detail ? (detail.reason ?? detail.note ?? null) : null;
                  return (
                    <li key={i} className="relative text-sm">
                      <span className="absolute -left-[21px] top-1.5 h-2 w-2 rounded-full bg-accent" aria-hidden />
                      <p className="text-chalk">{ACTION_LABEL[t.action] ?? t.action.replace(/[._]/g, " ")}</p>
                      <p className="text-xs text-dim">{fmtDate(t.at)} · {t.actorType}{t.actorType === "admin" ? ` (${t.actor})` : ""}</p>
                      {typeof text === "string" && text ? <p className="mt-0.5 text-xs text-ash">“{text}”</p> : null}
                    </li>
                  );
                })}
              </ol>
            )}
          </section>
        </div>

        {/* --------------------------------------------- checklist/decide */}
        <aside className="space-y-4 lg:sticky lg:top-24 lg:self-start">
          <section aria-labelledby="checklist" className="card p-4">
            <h2 id="checklist" className="mb-3 flex items-center gap-2 font-display text-sm font-extrabold uppercase tracking-[0.06em]">
              <ShieldCheck size={16} aria-hidden className="text-accent" /> Moderation checklist
            </h2>
            <ul className="space-y-2.5 text-sm">
              {([
                ["gstin", checks.gstin.applicable ? "GSTIN is valid" : "GST exempt: PAN supplied", checks.gstin.problem ? `Server check: ${checks.gstin.problem}` : checks.gstin.applicable ? "Checksum passed" : ""],
                ["pan", "PAN matches the documents", checks.panMatchesGstin === true ? "PAN matches the GSTIN. Compare with the PAN card image." : checks.panMatchesGstin === false ? "Does NOT match the GSTIN" : "Compare with the PAN card image"],
                ["docs", "Documents are legible and genuine", checks.documentsComplete ? "All required documents uploaded" : "Required document missing"],
                ["holder", "Bank holder matches legal name", checks.holderMatchesLegalName ? "Names match" : "Names differ. Check the cancelled cheque."],
                ["contact", "Email and mobile verified", `${checks.emailVerified ? "Email ok" : "Email not verified"} · ${checks.mobileVerified ? "mobile ok" : "mobile not verified"}`],
              ] as const).map(([key, label, hint]) => (
                <li key={key}>
                  <label className="flex cursor-pointer items-start gap-2.5">
                    <input
                      type="checkbox"
                      className="mt-0.5 h-4 w-4 accent-[var(--accent)]"
                      checked={ticks[key]}
                      onChange={(e) => setTicks((t) => ({ ...t, [key]: e.target.checked }))}
                      disabled={!canDecide}
                    />
                    <span>
                      <span className="block text-chalk">{label}</span>
                      {hint ? <span className={`block text-xs ${hint.includes("NOT") || hint.includes("missing") || hint.includes("Server check") || hint.includes("not verified") ? "text-danger" : "text-dim"}`}>{hint}</span> : null}
                    </span>
                  </label>
                </li>
              ))}
            </ul>
            <p className="mt-3 text-xs text-dim">Store URL: <span className="font-mono">{checks.slug ? storeHref(checks.slug) : "not set"}</span></p>
          </section>

          <section aria-labelledby="decision" className="card p-4">
            <h2 id="decision" className="mb-3 font-display text-sm font-extrabold uppercase tracking-[0.06em]">Decision</h2>
            {status === "submitted" ? (
              <button type="button" className="btn btn-outline btn-block mb-2" disabled={busy} onClick={() => decide({ action: "start_review" }, "Marked as under review.")}>
                Open for review
              </button>
            ) : null}
            {canDecide ? (
              <div className="space-y-2">
                <button type="button" className="btn btn-primary btn-block" disabled={busy || !allTicked} onClick={() => setDialog("approve")}>
                  <Check size={16} aria-hidden /> Approve
                </button>
                {!allTicked ? <p className="text-xs text-dim">Tick every checklist item to approve.</p> : null}
                <button type="button" className="btn btn-outline btn-block" disabled={busy} onClick={() => setDialog("changes")}>Request changes</button>
                <button type="button" className="btn btn-outline btn-block border-danger/50 text-danger" disabled={busy} onClick={() => setDialog("reject")}>Reject</button>
              </div>
            ) : null}
            {status === "changes_requested" ? (
              <div className="space-y-2">
                <p className="text-sm text-ash">The seller is editing. You can still reject the application.</p>
                <button type="button" className="btn btn-outline btn-block border-danger/50 text-danger" disabled={busy} onClick={() => setDialog("reject")}>Reject</button>
              </div>
            ) : null}
            {status === "approved" ? (
              <div className="space-y-2">
                <p className="text-sm text-ash">Commission {vendor.commissionRate ?? "—"}% · {vendor.tier ?? "—"} tier</p>
                <button type="button" className="btn btn-outline btn-block border-danger/50 text-danger" disabled={busy} onClick={() => setDialog("suspend")}>Suspend seller</button>
              </div>
            ) : null}
            {status === "suspended" ? (
              <button type="button" className="btn btn-primary btn-block" disabled={busy} onClick={() => decide({ action: "reinstate" }, "Seller reinstated.")}>Reinstate seller</button>
            ) : null}
            {status === "draft" || status === "rejected" ? <p className="text-sm text-ash">{status === "draft" ? "Not submitted yet." : "This application is closed."}</p> : null}
          </section>

          <section className="card p-4 text-sm">
            <p className="text-xs uppercase tracking-[0.1em] text-dim">Products</p>
            <p className="mt-1 text-chalk">
              {Object.keys(review.products).length === 0 ? "None yet" : Object.entries(review.products).map(([k, n]) => `${n} ${k.replace(/_/g, " ")}`).join(" · ")}
            </p>
            {(review.products.pending_review ?? 0) > 0 ? <Link href="/admin/vendor-products" className="mt-2 inline-block text-xs text-accent hover:underline">Open product queue</Link> : null}
          </section>
        </aside>
      </div>

      {/* ---------------------------------------------------------- dialogs */}
      <Modal open={dialog === "approve"} title="Approve seller" onClose={closeDialog}>
        <p className="mb-4 text-sm text-ash">The seller can add products and receive orders straight away.</p>
        <div className="space-y-4">
          <Field label="Commission (%)" error={fieldErrors.commissionRate}>
            <input data-autofocus type="number" min={0} max={50} step={0.5} className="field" value={commission} onChange={(e) => setCommission(Number(e.target.value))} />
          </Field>
          <Field label="Tier" error={fieldErrors.tier}>
            <select className="field" value={tier} onChange={(e) => setTier(e.target.value as typeof tier)}>
              {VENDOR_TIERS.map((t) => <option key={t} value={t}>{t[0].toUpperCase() + t.slice(1)}</option>)}
            </select>
          </Field>
        </div>
        <div className="mt-5 flex justify-end gap-2">
          <button type="button" className="btn btn-outline btn-sm" onClick={closeDialog}>Cancel</button>
          <button type="button" className="btn btn-primary btn-sm" disabled={busy} onClick={() => decide({ action: "approve", commissionRate: commission, tier }, "Seller approved.")}>Approve</button>
        </div>
      </Modal>

      <Modal open={dialog === "changes"} title="Request changes" onClose={closeDialog}>
        <fieldset>
          <legend className="label">Sections the seller must fix</legend>
          <div className="space-y-2">
            {ONBOARDING_STEPS.map((s) => (
              <label key={s.id} className="flex items-center gap-2 text-sm">
                <input type="checkbox" className="h-4 w-4 accent-[var(--accent)]" checked={sections.includes(s.id)} onChange={(e) => setSections((cur) => e.target.checked ? [...cur, s.id] : cur.filter((x) => x !== s.id))} />
                {s.step}. {s.title}
                {s.id === "account" ? <span className="text-xs text-dim">(only if contact details are wrong)</span> : null}
              </label>
            ))}
          </div>
          {fieldErrors.sections ? <p className="mt-1 text-xs text-danger">{fieldErrors.sections}</p> : null}
        </fieldset>
        <div className="mt-4">
          <Field label="What needs fixing" error={fieldErrors.note}>
            <textarea className="field min-h-24 py-2" value={note} onChange={(e) => setNote(e.target.value)} maxLength={1000} placeholder="e.g. The cancelled cheque is blurred. Upload a clear photo." />
          </Field>
        </div>
        <div className="mt-5 flex justify-end gap-2">
          <button type="button" className="btn btn-outline btn-sm" onClick={closeDialog}>Cancel</button>
          <button type="button" className="btn btn-primary btn-sm" disabled={busy} onClick={() => decide({ action: "request_changes", sections, note }, "Changes requested. The seller has been notified.")}>Send request</button>
        </div>
      </Modal>

      <Modal open={dialog === "reject" || dialog === "suspend"} title={dialog === "suspend" ? "Suspend seller" : "Reject application"} onClose={closeDialog}>
        <p className="mb-3 text-sm text-ash">
          {dialog === "suspend" ? "Their products leave the shop at once and the portal turns read-only. The reason is shown to the seller." : "The seller is signed out everywhere and sees this reason."}
        </p>
        <Field label="Reason" error={fieldErrors.reason}>
          <textarea data-autofocus className="field min-h-24 py-2" value={reason} onChange={(e) => setReason(e.target.value)} maxLength={1000} />
        </Field>
        <div className="mt-5 flex justify-end gap-2">
          <button type="button" className="btn btn-outline btn-sm" onClick={closeDialog}>Cancel</button>
          <button
            type="button"
            className="btn btn-primary btn-sm"
            disabled={busy}
            onClick={() => decide({ action: dialog === "suspend" ? "suspend" : "reject", reason }, dialog === "suspend" ? "Seller suspended." : "Application rejected.")}
          >
            {dialog === "suspend" ? "Suspend" : "Reject"}
          </button>
        </div>
      </Modal>

      <Modal open={dialog === "reveal"} title={revealField === "bank" ? "Reveal account number" : "Reveal PAN"} onClose={closeDialog}>
        <p className="mb-3 flex gap-2 text-sm text-ash">
          <AlertTriangle size={16} className="mt-0.5 shrink-0 text-gold" aria-hidden />
          This is recorded in the audit log with your name and reason. The value is shown for 30 seconds.
        </p>
        <Field label="Why do you need to see it?" error={fieldErrors.reason}>
          <input data-autofocus className="field" value={revealReason} onChange={(e) => setRevealReason(e.target.value)} maxLength={300} placeholder="e.g. Verifying against the cancelled cheque" />
        </Field>
        {fieldErrors._ ? <p className="mt-2 text-xs text-danger">{fieldErrors._}</p> : null}
        <div className="mt-5 flex justify-end gap-2">
          <button type="button" className="btn btn-outline btn-sm" onClick={closeDialog}>Cancel</button>
          <button type="button" className="btn btn-primary btn-sm" disabled={busy || revealReason.trim().length < 5} onClick={doReveal}>Reveal</button>
        </div>
      </Modal>

      <Modal open={Boolean(zoom)} title={zoom?.label ?? "Document"} onClose={() => setZoom(null)} wide>
        {zoom ? (
          zoom.mime.startsWith("image/") ? (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img src={zoom.url} alt={zoom.label} className="mx-auto max-h-[70vh] w-auto max-w-full" />
          ) : (
            <iframe src={zoom.url} title={zoom.label} className="h-[70vh] w-full rounded-[2px] border border-tint/10 bg-steel" />
          )
        ) : null}
        {zoom ? <a href={zoom.url} target="_blank" rel="noreferrer" className="mt-3 inline-block text-xs text-accent hover:underline">Open in a new tab</a> : null}
      </Modal>
    </div>
  );
}
