"use client";

import { useRef, useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CheckCircle2, ExternalLink, FileText, Upload } from "lucide-react";
import { DEPARTMENT_BY_SLUG } from "@/lib/data/taxonomy";
import {
  DOCUMENT_KINDS,
  DOCUMENT_LABELS,
  ONBOARDING_STEPS,
  fileHref,
  type DocumentKind,
  type VendorSelf,
} from "@/lib/vendor/types";
import { ApiFailure, api, uploadFile } from "@/lib/vendor/client";
import { documentsStepSchema, maskTail, requiredDocuments } from "@/lib/vendor/validators";
import { CheckField, FieldMessage, Notice, TextField, useFocusFirstInvalid, validate, type FieldErrors } from "../auth/fields";
import { SectionRule, StepFooter, StepFrame, formatBytes, type StepProps } from "./ui";

type Doc = { fileId: string; name: string };

function Summary({ title, step, goTo, canEdit, rows }: { title: string; step: number; goTo: (n: number) => void; canEdit: boolean; rows: [string, string][] }) {
  return (
    <div className="rounded-sm border border-tint/10 p-4">
      <div className="mb-3 flex items-center justify-between gap-3">
        <h4 className="text-sm font-bold text-chalk">{title}</h4>
        <button type="button" onClick={() => goTo(step)} className="text-xs font-bold uppercase tracking-[0.1em] text-accent hover:underline">
          {canEdit ? "Edit" : "View"}
        </button>
      </div>
      <dl className="grid gap-x-6 gap-y-2 text-xs sm:grid-cols-2">
        {rows.map(([k, v]) => (
          <div key={k} className="min-w-0">
            <dt className="text-dim">{k}</dt>
            <dd className="break-words font-medium text-chalk">{v || "—"}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

export function StepDocuments({ state, editable, onSaved, onUploaded, goBack, goTo }: StepProps) {
  const router = useRouter();
  const { vendor } = state;
  const ob = vendor.onboarding;
  const form = useRef<HTMLFormElement>(null);
  const focusInvalid = useFocusFirstInvalid(form);

  // Saved choices first; otherwise the newest uploaded file of that kind.
  const [docs, setDocs] = useState<Partial<Record<DocumentKind, Doc>>>(() => {
    const out: Partial<Record<DocumentKind, Doc>> = {};
    for (const kind of DOCUMENT_KINDS) {
      const savedFile = ob.documents?.files.find((f) => f.kind === kind);
      const up = [...state.uploaded].reverse().find((u) => u.kind === kind);
      if (savedFile) out[kind] = { fileId: savedFile.fileId, name: savedFile.name };
      else if (up) out[kind] = { fileId: up.id, name: "Uploaded document" };
    }
    return out;
  });
  const [uploading, setUploading] = useState<DocumentKind | null>(null);
  const [upError, setUpError] = useState<Partial<Record<DocumentKind, string>>>({});
  const [signatoryName, setSignatoryName] = useState(ob.documents?.agreement.signatoryName ?? vendor.fullName);
  const [accept, setAccept] = useState(Boolean(ob.documents));
  const [errors, setErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const gstExempt = ob.tax?.gstExempt ?? false;
  const required = new Set<DocumentKind>(requiredDocuments(gstExempt));
  const sizeOf = (id: string) => state.uploaded.find((u) => u.id === id)?.size;

  async function upload(kind: DocumentKind, file: File | undefined) {
    if (!file) return;
    setUploading(kind);
    setUpError((e) => ({ ...e, [kind]: undefined }));
    try {
      const up = await uploadFile(kind, file);
      onUploaded({ id: up.id, kind, mime: up.mime, size: up.size });
      setDocs((d) => ({ ...d, [kind]: { fileId: up.id, name: file.name.slice(0, 120) } }));
    } catch (err) {
      setUpError((e) => ({ ...e, [kind]: err instanceof ApiFailure ? err.message : "Upload failed. Try again." }));
    } finally {
      setUploading(null);
    }
  }

  const steps = ONBOARDING_STEPS.slice(0, 5);
  const incomplete = steps.filter((s) => !vendor.completedSteps.includes(s.step));
  const canEditStep = (id: string) => vendor.status !== "changes_requested" || (vendor.changesRequested?.sections.includes(id as never) ?? false);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setFormError(null);
    if (incomplete.length) {
      setFormError(`Finish these steps first: ${incomplete.map((s) => s.title).join(", ")}.`);
      return;
    }
    const next: FieldErrors = {};
    for (const k of required) if (!docs[k]) next[k] = "Required";
    if (editable) {
      const files = DOCUMENT_KINDS.flatMap((kind) => (docs[kind] ? [{ kind, fileId: docs[kind]!.fileId, name: docs[kind]!.name }] : []));
      const payload = { files, signatoryName, acceptAgreement: accept };
      const checked = validate(documentsStepSchema, payload);
      if (!checked.ok) Object.assign(next, checked.fields);
      if (Object.keys(next).length) {
        setErrors(next);
        focusInvalid();
        return;
      }
      setErrors({});
      setBusy(true);
      try {
        const res = await api<{ vendor: VendorSelf }>("/api/vendor/onboarding/documents", { method: "PUT", body: payload });
        onSaved(res.vendor);
      } catch (err) {
        if (err instanceof ApiFailure) {
          setErrors(err.fields);
          setFormError(err.message);
        } else setFormError("Something went wrong. Please try again.");
        setBusy(false);
        focusInvalid();
        return;
      }
    } else if (!ob.documents) {
      setFormError("Your documents are missing. Ask support to reopen that section.");
      return;
    }
    setBusy(true);
    try {
      const res = await api<{ next: string }>("/api/vendor/onboarding/submit", { body: {} });
      router.replace(res.next);
      router.refresh();
    } catch (err) {
      setFormError(err instanceof ApiFailure ? err.message : "Something went wrong. Please try again.");
      setBusy(false);
    }
  }

  const tax = ob.tax;
  const store = ob.store;
  const ship = ob.shipping;

  return (
    <StepFrame
      title="Documents & review"
      intro="Upload clear copies, check everything once more, then submit. PDF, JPG, PNG or WebP, up to 5 MB each."
      locked={!editable}
    >
      <form ref={form} onSubmit={submit} noValidate>
        <fieldset disabled={!editable} className="space-y-3 border-0 p-0">
          <SectionRule>Documents</SectionRule>
          {formError && <Notice tone="error">{formError}</Notice>}
          <ul className="space-y-3">
            {DOCUMENT_KINDS.map((kind) => {
              const doc = docs[kind];
              const isReq = required.has(kind);
              const err = errors[kind] ?? upError[kind];
              const id = `doc-${kind}`;
              return (
                <li key={kind} className="rounded-sm border border-tint/10 p-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="min-w-0">
                      <label htmlFor={id} className="flex items-center gap-2 text-sm font-semibold text-chalk">
                        {DOCUMENT_LABELS[kind]}
                        <span className={`chip ${isReq ? "!text-accent" : ""}`}>{isReq ? "Required" : "Optional"}</span>
                      </label>
                      {doc ? (
                        <p className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-ash">
                          <span className="inline-flex min-w-0 items-center gap-1.5">
                            <FileText size={14} className="shrink-0 text-accent" aria-hidden="true" />
                            <span className="truncate">{doc.name}</span>
                            {sizeOf(doc.fileId) ? <span className="text-dim">· {formatBytes(sizeOf(doc.fileId)!)}</span> : null}
                          </span>
                          <a href={fileHref(doc.fileId)} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 font-semibold text-accent hover:underline">
                            View <ExternalLink size={12} aria-hidden="true" />
                          </a>
                        </p>
                      ) : (
                        <p className="mt-1 text-xs text-dim">{kind === "doc_pan" ? "PAN card of the business or owner." : kind === "doc_cheque" ? "Shows your name and account number." : "Not uploaded yet."}</p>
                      )}
                    </div>
                    <label className={`btn btn-outline btn-sm cursor-pointer ${!editable || uploading === kind ? "pointer-events-none opacity-50" : ""}`}>
                      <Upload size={14} aria-hidden="true" />
                      {uploading === kind ? "Uploading…" : doc ? "Replace" : "Upload"}
                      <input
                        id={id}
                        type="file"
                        accept="application/pdf,image/jpeg,image/png,image/webp"
                        className="sr-only"
                        disabled={!editable || uploading !== null}
                        aria-invalid={err ? true : undefined}
                        aria-describedby={err ? `${id}-msg` : undefined}
                        onChange={(e) => {
                          void upload(kind, e.target.files?.[0]);
                          e.target.value = "";
                        }}
                      />
                    </label>
                  </div>
                  <FieldMessage id={id} error={err} />
                </li>
              );
            })}
          </ul>
        </fieldset>

        <SectionRule>Review your answers</SectionRule>
        <div className="space-y-3">
          <Summary
            title="Account"
            step={1}
            goTo={goTo}
            canEdit={canEditStep("account")}
            rows={[
              ["Name", vendor.fullName],
              ["Business type", vendor.businessType],
              ["Email", `${vendor.email}${vendor.emailVerified ? " (verified)" : ""}`],
              ["Mobile", `+91 ${vendor.mobile}${vendor.mobileVerified ? " (verified)" : ""}`],
            ]}
          />
          <Summary
            title="Tax details"
            step={2}
            goTo={goTo}
            canEdit={canEditStep("tax")}
            rows={
              tax
                ? [
                    ["GSTIN", tax.gstExempt ? "Not registered for GST" : (tax.gstin ?? "")],
                    ["PAN", maskTail(tax.panLast4)],
                    ["Legal name", tax.legalName],
                    ["Owner ID", `${tax.idType} ending ${tax.idLast4}`],
                  ]
                : [["Status", "Not completed"]]
            }
          />
          <Summary
            title="Store"
            step={3}
            goTo={goTo}
            canEdit={canEditStep("store")}
            rows={
              store
                ? [
                    ["Store", store.storeName],
                    ["Address", `/store/${store.slug}`],
                    ["Seller type", store.sellerType],
                    ["Departments", store.departments.map((d) => DEPARTMENT_BY_SLUG[d]?.name ?? d).join(", ")],
                    ["Brands", store.brands.map((b) => b.name).join(", ")],
                  ]
                : [["Status", "Not completed"]]
            }
          />
          <Summary
            title="Shipping & pickup"
            step={4}
            goTo={goTo}
            canEdit={canEditStep("shipping")}
            rows={
              ship
                ? [
                    ["Pickup", `${ship.pickup.line1}, ${ship.pickup.city}, ${ship.pickup.state} ${ship.pickup.pincode}`],
                    ["Dispatch", ship.handlingDays === 0 ? "Same day" : `${ship.handlingDays} working day(s)`],
                    ["Ships to", ship.shipsTo === "pan_india" ? "All of India" : "Own state only"],
                    ["Returns", ship.acceptsReturns ? `${ship.returnWindowDays} days` : "Not accepted"],
                  ]
                : [["Status", "Not completed"]]
            }
          />
          <Summary
            title="Bank details"
            step={5}
            goTo={goTo}
            canEdit={canEditStep("bank")}
            rows={
              state.bank
                ? [
                    ["Account holder", state.bank.holderName],
                    ["Account", `••••${state.bank.accountLast4}`],
                    ["IFSC", state.bank.ifsc],
                  ]
                : [["Status", "Not completed"]]
            }
          />
        </div>

        <fieldset disabled={!editable} className="mt-8 space-y-5 border-0 p-0">
          <SectionRule>Seller agreement</SectionRule>
          <TextField
            id="signatoryName"
            label="Authorised signatory"
            value={signatoryName}
            onChange={(e) => setSignatoryName(e.target.value)}
            autoComplete="name"
            error={errors.signatoryName}
            hint="Type the full name of the person accepting on behalf of the business."
            className="sm:max-w-md"
          />
          <CheckField id="acceptAgreement" checked={accept} onChange={(e) => setAccept(e.target.checked)} error={errors.acceptAgreement}>
            I confirm the information and documents are accurate, and I accept the{" "}
            <Link href="/legal/terms" target="_blank" className="font-semibold text-accent underline">
              Riderzpro seller terms
            </Link>
            .
          </CheckField>
        </fieldset>

        {incomplete.length > 0 && (
          <div className="mt-5">
            <Notice tone="warn">
              Finish before submitting:{" "}
              {incomplete.map((s, i) => (
                <span key={s.id}>
                  {i > 0 && ", "}
                  <button type="button" onClick={() => goTo(s.step)} className="font-semibold underline">
                    {s.title}
                  </button>
                </span>
              ))}
              .
            </Notice>
          </div>
        )}
        {incomplete.length === 0 && (
          <p className="mt-5 flex items-center gap-1.5 text-xs text-ash">
            <CheckCircle2 size={14} className="text-accent" aria-hidden="true" /> All sections are filled in. Reviews usually take 1–2 working days.
          </p>
        )}
        <StepFooter onBack={goBack} busy={busy} label={vendor.status === "changes_requested" ? "Resubmit application" : "Submit application"} />
      </form>
    </StepFrame>
  );
}
