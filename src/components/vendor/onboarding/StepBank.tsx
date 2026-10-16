"use client";

import { useRef, useState, type FormEvent } from "react";
import { Landmark, Lock } from "lucide-react";
import type { VendorSelf } from "@/lib/vendor/types";
import { ApiFailure, api } from "@/lib/vendor/client";
import { bankStepSchema, normaliseId } from "@/lib/vendor/validators";
import { Notice, TextField, useFocusFirstInvalid, validate, type FieldErrors } from "../auth/fields";
import { StepFooter, StepFrame, type StepProps } from "./ui";

export function StepBank({ state, editable, onSaved, goBack, goNext }: StepProps) {
  const existing = state.bank;
  const form = useRef<HTMLFormElement>(null);
  const focusInvalid = useFocusFirstInvalid(form);
  const [changing, setChanging] = useState(!existing);
  const [holderName, setHolderName] = useState(existing?.holderName ?? state.vendor.onboarding.tax?.legalName ?? "");
  const [accountNumber, setAccountNumber] = useState("");
  const [confirmAccountNumber, setConfirm] = useState("");
  const [ifsc, setIfsc] = useState(existing?.ifsc ?? "");
  const [errors, setErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (!editable || !changing) return goNext();
    setFormError(null);
    const payload = { holderName, accountNumber: accountNumber.replace(/\s/g, ""), confirmAccountNumber: confirmAccountNumber.replace(/\s/g, ""), ifsc: normaliseId(ifsc) };
    const checked = validate(bankStepSchema, payload);
    if (!checked.ok) {
      setErrors(checked.fields);
      focusInvalid();
      return;
    }
    setErrors({});
    setBusy(true);
    try {
      const res = await api<{ vendor: VendorSelf }>("/api/vendor/onboarding/bank", { method: "PUT", body: payload });
      onSaved(res.vendor);
      setAccountNumber("");
      setConfirm("");
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

  return (
    <StepFrame title="Bank details" intro="Where we pay out your sales. The account must be in the name of your business or the owner." locked={!editable}>
      <form ref={form} onSubmit={submit} noValidate>
        {formError && (
          <div className="mb-5">
            <Notice tone="error">{formError}</Notice>
          </div>
        )}
        {existing && !changing && (
          <div className="flex flex-wrap items-center justify-between gap-4 rounded-sm border border-tint/10 p-4">
            <div className="flex items-center gap-3">
              <Landmark size={20} className="text-accent" aria-hidden="true" />
              <div>
                <p className="text-sm font-semibold text-chalk">{existing.holderName}</p>
                <p className="font-mono text-xs text-ash">
                  A/C ••••{existing.accountLast4} · {existing.ifsc}
                </p>
              </div>
            </div>
            {editable && (
              <button type="button" onClick={() => setChanging(true)} className="btn btn-outline btn-sm">
                Change bank details
              </button>
            )}
          </div>
        )}
        {changing && (
          <fieldset disabled={!editable} className="space-y-5 border-0 p-0">
            <TextField id="holderName" label="Account holder name" value={holderName} onChange={(e) => setHolderName(e.target.value)} autoComplete="off" error={errors.holderName} hint="Exactly as it appears on your bank account." />
            <div className="grid gap-5 sm:grid-cols-2">
              <TextField
                id="accountNumber"
                label="Account number"
                inputMode="numeric"
                autoComplete="off"
                value={accountNumber}
                onChange={(e) => setAccountNumber(e.target.value.replace(/\D/g, "").slice(0, 18))}
                error={errors.accountNumber}
              />
              <TextField
                id="confirmAccountNumber"
                label="Confirm account number"
                inputMode="numeric"
                autoComplete="off"
                value={confirmAccountNumber}
                onChange={(e) => setConfirm(e.target.value.replace(/\D/g, "").slice(0, 18))}
                error={errors.confirmAccountNumber}
              />
            </div>
            <TextField
              id="ifsc"
              label="IFSC code"
              value={ifsc}
              onChange={(e) => setIfsc(e.target.value.toUpperCase().slice(0, 11))}
              autoComplete="off"
              spellCheck={false}
              className="sm:max-w-xs"
              error={errors.ifsc}
              hint="11 characters, for example HDFC0001234."
            />
            {existing && editable && (
              <button type="button" onClick={() => setChanging(false)} className="text-xs font-semibold text-ash underline hover:text-chalk">
                Keep the saved account
              </button>
            )}
          </fieldset>
        )}
        <p className="mt-5 flex items-start gap-2 text-xs leading-relaxed text-dim">
          <Lock size={13} className="mt-px shrink-0" aria-hidden="true" />
          Your account number is stored encrypted. We only ever show the last four digits.
        </p>
        <StepFooter onBack={goBack} busy={busy} label={editable && changing ? "Save & continue" : "Next"} />
      </form>
    </StepFrame>
  );
}
