"use client";

import { AlertTriangle, ArrowLeft, Check, Copy, Info } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import type { ProductReview as Review } from "@/lib/server/admin-vendors";
import { rupees } from "@/lib/format";
import { api, ApiFailure } from "@/lib/vendor/client";
import { Field, fmtDate, Modal, Notice, StatusBadge } from "@/components/admin/vendors/ui";

const FIELD_OPTIONS = ["Title", "Brand", "Category", "Part type", "HSN code", "GST rate", "Warranty", "Summary", "Highlights", "Specifications", "Fitment", "Photos", "Price / MRP"];

export default function ProductReview({ review }: { review: Review }) {
  const router = useRouter();
  const { product, vendor } = review;
  const [active, setActive] = useState(0);
  const [dialog, setDialog] = useState<null | "changes" | "reject">(null);
  const [note, setNote] = useState("");
  const [fields, setFields] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ tone: "ok" | "error"; text: string } | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const vendorBlocked = vendor.status !== "approved";
  const warn = review.price.flags.some((f) => f.level === "warn") || review.duplicates.length > 0 || !review.compliance.hsnPresent;

  async function decide(action: "approve" | "request_changes" | "reject") {
    setBusy(true);
    setMsg(null);
    setErrors({});
    try {
      await api(`/api/admin/vendor-products/${product.id}/decision`, { body: { action, note, fields } });
      setMsg({ tone: "ok", text: action === "approve" ? "Approved. It is on the shop now." : action === "reject" ? "Rejected. The seller has been told why." : "Sent back to the seller with your notes." });
      setDialog(null);
      setNote("");
      setFields([]);
      router.refresh();
    } catch (e) {
      if (e instanceof ApiFailure) {
        setErrors(e.fields);
        setMsg({ tone: "error", text: e.message });
        if (e.status === 409) router.refresh();
      } else setMsg({ tone: "error", text: "Something went wrong." });
    } finally {
      setBusy(false);
    }
  }

  function closeDialog() {
    setDialog(null);
    setErrors({});
  }

  return (
    <div className="shell pt-24 pb-16 md:pt-32">
      <Link href="/admin/vendor-products" className="mb-4 inline-flex items-center gap-1.5 text-xs uppercase tracking-[0.12em] text-ash hover:text-chalk">
        <ArrowLeft size={14} aria-hidden /> Product queue
      </Link>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="eyebrow mb-2">{review.kind === "revision" ? "Edit to a live product" : "New product"} · internal</p>
          <h1 className="display-3 break-words">{review.content.title}</h1>
          <p className="mt-2 text-sm text-ash">
            {review.content.brand} · SKU {product.sku} · by{" "}
            <Link href={`/admin/vendors/${vendor.id}`} className="text-accent hover:underline">{vendor.storeName ?? vendor.fullName}</Link>{" "}
            <StatusBadge status={vendor.status} />
          </p>
        </div>
        <div className="text-right">
          <StatusBadge status={product.status} />
          <p className="mt-2 text-xs text-dim">Submitted {fmtDate(product.submittedAt)}</p>
        </div>
      </div>

      {msg ? <div className="mt-4"><Notice tone={msg.tone}>{msg.text}</Notice></div> : null}
      {!review.canDecide ? <div className="mt-4"><Notice>This product is {product.status.replace(/_/g, " ")} and has nothing waiting for review.</Notice></div> : null}
      {vendorBlocked ? <div className="mt-4"><Notice tone="error">This seller is {vendor.status.replace(/_/g, " ")}. Products cannot be approved until the seller is approved.</Notice></div> : null}
      {product.reviewNotes ? (
        <div className="card mt-4 p-3 text-sm">
          <p className="text-xs uppercase tracking-[0.1em] text-dim">Last review note · {fmtDate(product.reviewNotes.at)}</p>
          <p className="mt-1 text-chalk/90">{product.reviewNotes.note}</p>
        </div>
      ) : null}

      <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_22rem]">
        <div className="space-y-4">
          {/* gallery */}
          <section aria-label="Photos" className="card p-3">
            {review.imageUrls.length === 0 ? <p className="p-6 text-center text-sm text-danger">No photos.</p> : (
              <>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={review.imageUrls[active]} alt={`Photo ${active + 1} of ${review.imageUrls.length}`} className="mx-auto max-h-[420px] w-full rounded-[2px] bg-steel object-contain" />
                {review.imageUrls.length > 1 ? (
                  <ul className="mt-3 flex gap-2 overflow-x-auto pb-1">
                    {review.imageUrls.map((u, i) => (
                      <li key={u}>
                        <button type="button" onClick={() => setActive(i)} aria-label={`Show photo ${i + 1}`} aria-current={i === active} className={`block h-16 w-16 overflow-hidden rounded-[2px] border ${i === active ? "border-accent" : "border-tint/10"}`}>
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={u} alt="" className="h-full w-full object-cover" loading="lazy" />
                        </button>
                      </li>
                    ))}
                  </ul>
                ) : null}
              </>
            )}
          </section>

          {/* revision diff */}
          {review.kind === "revision" ? (
            <section aria-labelledby="diff" className="card border-gold/40 p-4">
              <h2 id="diff" className="mb-3 font-display text-sm font-extrabold uppercase tracking-[0.06em] text-gold">What the seller changed</h2>
              {review.diff.length === 0 ? <p className="text-sm text-dim">The edit matches the live content. Nothing to review.</p> : (
                <ul className="space-y-4">
                  {review.diff.map((d) => (
                    <li key={d.key}>
                      <p className="label">{d.label}</p>
                      {d.beforeImages && d.afterImages ? (
                        <div className="grid gap-3 sm:grid-cols-2">
                          {([["Live now", d.beforeImages], ["Proposed", d.afterImages]] as const).map(([cap, ids]) => (
                            <div key={cap}>
                              <p className="mb-1 text-xs text-dim">{cap}</p>
                              <div className="flex flex-wrap gap-1.5">
                                {ids.map((id) => (
                                  /* eslint-disable-next-line @next/next/no-img-element */
                                  <img key={id} src={`/api/admin/files/${id}`} alt="" className="h-14 w-14 rounded-[2px] border border-tint/10 object-cover" loading="lazy" />
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="grid gap-3 sm:grid-cols-2">
                          <div className="rounded-[2px] border border-danger/30 bg-danger/6 p-2.5 text-sm">
                            <p className="mb-1 text-[10px] uppercase tracking-[0.1em] text-danger">Live now</p>
                            <p className="whitespace-pre-wrap break-words text-ash">{d.before}</p>
                          </div>
                          <div className="rounded-[2px] border border-accent/30 bg-accent/6 p-2.5 text-sm">
                            <p className="mb-1 text-[10px] uppercase tracking-[0.1em] text-accent">Proposed</p>
                            <p className="whitespace-pre-wrap break-words text-chalk">{d.after}</p>
                          </div>
                        </div>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </section>
          ) : null}

          {/* content */}
          <section aria-labelledby="content" className="card p-4">
            <h2 id="content" className="mb-2 font-display text-sm font-extrabold uppercase tracking-[0.06em]">
              {review.kind === "revision" ? "Proposed content" : "Content"}
            </h2>
            <dl className="divide-y divide-tint/10">
              {review.contentRows.map((r) => (
                <div key={r.key} className="grid grid-cols-[7.5rem_1fr] gap-x-3 py-2 text-sm sm:grid-cols-[10rem_1fr]">
                  <dt className="text-xs uppercase tracking-[0.08em] text-dim">{r.label}{r.changed ? <span className="ml-1 text-gold">•</span> : null}</dt>
                  <dd className="min-w-0 whitespace-pre-wrap break-words text-chalk">{r.text}</dd>
                </div>
              ))}
            </dl>
          </section>
        </div>

        <aside className="space-y-4 lg:sticky lg:top-24 lg:self-start">
          <section aria-labelledby="price" className="card p-4">
            <h2 id="price" className="mb-2 font-display text-sm font-extrabold uppercase tracking-[0.06em]">Price check</h2>
            <p className="tnum text-2xl font-extrabold">{rupees(review.price.price)}</p>
            <p className="text-sm text-ash">MRP {rupees(review.price.mrp)} · {review.price.discountPct}% off · stock {product.stock}</p>
            <ul className="mt-2 space-y-1.5">
              {review.price.flags.length === 0 ? <li className="flex items-center gap-1.5 text-xs text-dim"><Check size={12} aria-hidden /> Looks reasonable</li> : null}
              {review.price.flags.map((f) => (
                <li key={f.text} className={`flex items-start gap-1.5 text-xs ${f.level === "warn" ? "text-gold" : "text-ash"}`}>
                  {f.level === "warn" ? <AlertTriangle size={12} className="mt-0.5 shrink-0" aria-hidden /> : <Info size={12} className="mt-0.5 shrink-0" aria-hidden />}
                  {f.text}
                </li>
              ))}
            </ul>
          </section>

          <section aria-labelledby="compliance" className="card p-4 text-sm">
            <h2 id="compliance" className="mb-2 font-display text-sm font-extrabold uppercase tracking-[0.06em]">Tax & fitment</h2>
            <p className={review.compliance.hsnPresent ? "text-chalk" : "text-gold"}>
              HSN: {review.compliance.hsn ?? "missing"} · GST {review.compliance.gstRate}%
            </p>
            <p className="mt-2 text-xs uppercase tracking-[0.08em] text-dim">Fits</p>
            <p className="break-words text-ash">{review.fitment.length ? (review.fitment.length > 12 ? `${review.fitment.slice(0, 12).join(", ")} and ${review.fitment.length - 12} more` : review.fitment.join(", ")) : "Not stated"}</p>
          </section>

          <section aria-labelledby="dupes" className="card p-4 text-sm">
            <h2 id="dupes" className="mb-2 flex items-center gap-1.5 font-display text-sm font-extrabold uppercase tracking-[0.06em]">
              <Copy size={14} aria-hidden /> Duplicate check
            </h2>
            {review.duplicates.length === 0 ? <p className="flex items-center gap-1.5 text-xs text-dim"><Check size={12} aria-hidden /> No matching SKU or similar title found.</p> : (
              <ul className="space-y-2">
                {review.duplicates.map((d) => (
                  <li key={`${d.source}-${d.id}`} className="text-xs">
                    {d.href ? <Link href={d.href} className="font-semibold text-gold hover:underline">{d.title}</Link> : <span className="font-semibold text-gold">{d.title}</span>}
                    <span className="block text-dim">{d.detail}</span>
                  </li>
                ))}
              </ul>
            )}
          </section>

          {review.canDecide ? (
            <section aria-labelledby="decide" className="card p-4">
              <h2 id="decide" className="mb-3 font-display text-sm font-extrabold uppercase tracking-[0.06em]">Decision</h2>
              {warn ? <p className="mb-3 flex items-start gap-1.5 text-xs text-gold"><AlertTriangle size={12} className="mt-0.5 shrink-0" aria-hidden /> Some checks above need a look before approving.</p> : null}
              <div className="space-y-2">
                <button type="button" className="btn btn-primary btn-block" disabled={busy || vendorBlocked} onClick={() => decide("approve")}>
                  <Check size={16} aria-hidden /> {review.kind === "revision" ? "Approve edit" : "Approve and publish"}
                </button>
                <button type="button" className="btn btn-outline btn-block" disabled={busy} onClick={() => setDialog("changes")}>Request changes</button>
                <button type="button" className="btn btn-outline btn-block border-danger/50 text-danger" disabled={busy} onClick={() => setDialog("reject")}>
                  {review.kind === "revision" ? "Discard edit" : "Reject"}
                </button>
              </div>
            </section>
          ) : null}
        </aside>
      </div>

      <Modal open={dialog === "changes"} title="Request changes" onClose={closeDialog}>
        <fieldset>
          <legend className="label">Which parts need fixing</legend>
          <div className="grid grid-cols-2 gap-x-3 gap-y-2">
            {FIELD_OPTIONS.map((f) => (
              <label key={f} className="flex items-center gap-2 text-sm">
                <input type="checkbox" className="h-4 w-4 accent-[var(--accent)]" checked={fields.includes(f)} onChange={(e) => setFields((cur) => (e.target.checked ? [...cur, f] : cur.filter((x) => x !== f)))} />
                {f}
              </label>
            ))}
          </div>
        </fieldset>
        <div className="mt-4">
          <Field label="Note to the seller" error={errors.note}>
            <textarea data-autofocus className="field min-h-24 py-2" value={note} onChange={(e) => setNote(e.target.value)} maxLength={1000} placeholder="e.g. Photo 2 is blurry. Add the fitment years." />
          </Field>
        </div>
        <div className="mt-5 flex justify-end gap-2">
          <button type="button" className="btn btn-outline btn-sm" onClick={closeDialog}>Cancel</button>
          <button type="button" className="btn btn-primary btn-sm" disabled={busy} onClick={() => decide("request_changes")}>Send back</button>
        </div>
      </Modal>

      <Modal open={dialog === "reject"} title={review.kind === "revision" ? "Discard this edit" : "Reject product"} onClose={closeDialog}>
        <p className="mb-3 text-sm text-ash">{review.kind === "revision" ? "The live listing stays as it is. The seller is told why the edit was declined." : "The seller sees this reason."}</p>
        <Field label="Reason" error={errors.note}>
          <textarea data-autofocus className="field min-h-24 py-2" value={note} onChange={(e) => setNote(e.target.value)} maxLength={1000} />
        </Field>
        <div className="mt-5 flex justify-end gap-2">
          <button type="button" className="btn btn-outline btn-sm" onClick={closeDialog}>Cancel</button>
          <button type="button" className="btn btn-primary btn-sm" disabled={busy} onClick={() => decide("reject")}>{review.kind === "revision" ? "Discard edit" : "Reject"}</button>
        </div>
      </Modal>
    </div>
  );
}
