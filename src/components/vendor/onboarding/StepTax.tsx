"use client";

import { useRef, useState, type FormEvent } from "react";
import { CheckCircle2 } from "lucide-react";
import { ID_TYPES, type IdType } from "@/lib/vendor/types";
import { ApiFailure, api } from "@/lib/vendor/client";
import { gstinProblem, last4, maskTail, normaliseId, panFromGstin, PAN_RE, taxStepSchema } from "@/lib/vendor/validators";
import { CheckField, Notice, SelectField, TextField, useFocusFirstInvalid, validate, type FieldErrors } from "../auth/fields";
import { StepFooter, StepFrame, type StepProps } from "./ui";
import type { VendorSelf } from "@/lib/vendor/types";

export function StepTax({ state, editable, onSaved, goBack, goNext }: StepProps) {
  const saved = state.vendor.onboarding.tax;
  const form = useRef<HTMLFormElement>(null);
  const focusInvalid = useFocusFirstInvalid(form);
  const [gstExempt, setGstExempt] = useState(saved?.gstExempt ?? false);
  const [gstin, setGstin] = useState(saved?.gstin ?? "");
  const [pan, setPan] = useState("");
  const [legalName, setLegalName] = useState(saved?.legalName ?? "");
  const [tradeName, setTradeName] = useState(saved?.tradeName ?? "");
  const [idType, setIdType] = useState<IdType>(saved?.idType ?? "PAN");
  const [idLast4, setIdLast4] = useState(saved?.idLast4 ?? "");
  const [errors, setErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const g = normaliseId(gstin);
  const gProblem = g.length === 15 ? gstinProblem(g) : null;
  const gValid = g.length === 15 && !gProblem;
  const derivedPan = gValid ? panFromGstin(g) : null;
  const typedPan = normaliseId(pan);

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (!editable) return goNext();
    setFormError(null);
    const payload = {
      gstExempt,
      gstin: gstExempt ? null : g || null,
      legalName,
      tradeName: tradeName.trim() || null,
      pan: gstExempt ? typedPan : null,
      idType,
      idLast4,
    };
    const checked = validate(taxStepSchema, payload);
    if (!checked.ok) {
      setErrors(checked.fields);
      focusInvalid();
      return;
    }
    setErrors({});
    setBusy(true);
    try {
      const res = await api<{ vendor: VendorSelf }>("/api/vendor/onboarding/tax", { method: "PUT", body: payload });
      onSaved(res.vendor);
      goNext();
    } catch (err) {
      if (err instanceof ApiFailure) {
        setErrors(err.fields);
        setFormError(err.message);
      } else setFormError("Something went wrong. Please try again.");
      setBusy(false);
      focusInvalid();
    }
  }

  const gstinHint = gstExempt
    ? undefined
    : g.length === 0
      ? "15 characters, for example 29ABCDE1234F1Z5."
      : g.length < 15
        ? `${g.length} of 15 characters`
        : undefined;

  return (
    <StepFrame
      title="Tax details"
      intro="We check these against the documents you upload. Your PAN is stored encrypted and never shown in full again."
      locked={!editable}
    >
      <form ref={form} onSubmit={submit} noValidate>
        <fieldset disabled={!editable} className="space-y-5 border-0 p-0">
          {formError && <Notice tone="error">{formError}</Notice>}

          <CheckField id="gstExempt" checked={gstExempt} onChange={(e) => setGstExempt(e.target.checked)}>
            I don&apos;t have a GSTIN (not registered for GST)
          </CheckField>

          {!gstExempt ? (
            <div>
              <TextField
                id="gstin"
                label="GSTIN"
                value={gstin}
                onChange={(e) => setGstin(e.target.value.toUpperCase())}
                maxLength={20}
                autoCapitalize="characters"
                autoComplete="off"
                spellCheck={false}
                className=""
                error={errors.gstin || (gProblem ?? undefined)}
                hint={gstinHint}
              />
              {gValid && (
                <p className="mt-1.5 flex items-center gap-1.5 text-xs text-accent">
                  <CheckCircle2 size={13} aria-hidden="true" /> GSTIN format and checksum look right.
                </p>
              )}
              {derivedPan && (
                <p className="mt-3 text-xs text-ash">
                  PAN from your GSTIN: <span className="font-mono font-semibold text-chalk">{maskTail(last4(derivedPan))}</span>
                </p>
              )}
            </div>
          ) : (
            <div>
              <TextField
                id="pan"
                label="PAN"
                value={pan}
                onChange={(e) => setPan(e.target.value.toUpperCase())}
                maxLength={10}
                autoComplete="off"
                spellCheck={false}
                error={errors.pan || (typedPan.length === 10 && !PAN_RE.test(typedPan) ? "That is not a valid PAN format." : undefined)}
                hint={
                  saved?.gstExempt && saved.panLast4
                    ? `Saved: ${maskTail(saved.panLast4)}. Enter it again to confirm or change it.`
                    : "10 characters, for example ABCDE1234F."
                }
              />
            </div>
          )}

          <div className="grid gap-5 sm:grid-cols-2">
            <TextField id="legalName" label="Legal name" value={legalName} onChange={(e) => setLegalName(e.target.value)} autoComplete="organization" error={errors.legalName} hint="As on your PAN / GST certificate." />
            <TextField id="tradeName" label="Trade name" optional value={tradeName} onChange={(e) => setTradeName(e.target.value)} error={errors.tradeName} />
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            <SelectField id="idType" label="Owner ID type" value={idType} onChange={(e) => setIdType(e.target.value as IdType)} error={errors.idType}>
              {ID_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </SelectField>
            <div>
              <TextField
                id="idLast4"
                label="Last 4 characters of the ID"
                value={idLast4}
                onChange={(e) => setIdLast4(e.target.value.toUpperCase().slice(0, 4))}
                maxLength={4}
                autoComplete="off"
                error={errors.idLast4}
              />
            </div>
          </div>
        </fieldset>
        <StepFooter onBack={goBack} busy={busy} label={editable ? "Save & continue" : "Next"} />
      </form>
    </StepFrame>
  );
}
