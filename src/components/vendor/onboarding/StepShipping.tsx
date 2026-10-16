"use client";

import { useRef, useState, type FormEvent } from "react";
import type { VendorSelf } from "@/lib/vendor/types";
import { ApiFailure, api } from "@/lib/vendor/client";
import { INDIAN_STATES, shippingStepSchema } from "@/lib/vendor/validators";
import { CheckField, Notice, SelectField, TextField, useFocusFirstInvalid, validate, type FieldErrors } from "../auth/fields";
import { SectionRule, StepFooter, StepFrame, type StepProps } from "./ui";

export function StepShipping({ state, editable, onSaved, goBack, goNext }: StepProps) {
  const saved = state.vendor.onboarding.shipping;
  const form = useRef<HTMLFormElement>(null);
  const focusInvalid = useFocusFirstInvalid(form);
  const [line1, setLine1] = useState(saved?.pickup.line1 ?? "");
  const [line2, setLine2] = useState(saved?.pickup.line2 ?? "");
  const [city, setCity] = useState(saved?.pickup.city ?? "");
  const [stateName, setStateName] = useState<string>(saved?.pickup.state ?? "");
  const [pincode, setPincode] = useState(saved?.pickup.pincode ?? "");
  const [contactPhone, setContactPhone] = useState(saved?.contactPhone ?? state.vendor.mobile);
  const [handlingDays, setHandlingDays] = useState(String(saved?.handlingDays ?? 2));
  const [shipsTo, setShipsTo] = useState<"pan_india" | "own_state">(saved?.shipsTo ?? "pan_india");
  const [acceptsReturns, setAcceptsReturns] = useState(saved?.acceptsReturns ?? true);
  const [returnWindowDays, setReturnWindowDays] = useState(String(saved?.returnWindowDays || 7));
  const [errors, setErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (!editable) return goNext();
    setFormError(null);
    const payload = {
      pickup: { line1, line2: line2.trim() || null, city, state: stateName, pincode },
      contactPhone,
      handlingDays: handlingDays === "" ? NaN : Number(handlingDays),
      shipsTo,
      acceptsReturns,
      returnWindowDays: acceptsReturns ? Number(returnWindowDays) : 0,
    };
    const checked = validate(shippingStepSchema, payload);
    if (!checked.ok) {
      setErrors(checked.fields);
      focusInvalid();
      return;
    }
    setErrors({});
    setBusy(true);
    try {
      const res = await api<{ vendor: VendorSelf }>("/api/vendor/onboarding/shipping", { method: "PUT", body: payload });
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

  const stateError = errors["pickup.state"] && "Choose a state";
  return (
    <StepFrame title="Shipping & pickup" intro="Where couriers collect your orders, how fast you dispatch, and how you handle returns." locked={!editable}>
      <form ref={form} onSubmit={submit} noValidate>
        <fieldset disabled={!editable} className="space-y-5 border-0 p-0">
          {formError && <Notice tone="error">{formError}</Notice>}
          <SectionRule>Pickup address</SectionRule>
          <TextField id="pickup.line1" label="Address line 1" value={line1} onChange={(e) => setLine1(e.target.value)} autoComplete="address-line1" error={errors["pickup.line1"]} />
          <TextField id="pickup.line2" label="Address line 2" optional value={line2} onChange={(e) => setLine2(e.target.value)} autoComplete="address-line2" error={errors["pickup.line2"]} />
          <div className="grid gap-5 sm:grid-cols-3">
            <TextField id="pickup.city" label="City" value={city} onChange={(e) => setCity(e.target.value)} autoComplete="address-level2" error={errors["pickup.city"]} />
            <SelectField id="pickup.state" label="State" value={stateName} onChange={(e) => setStateName(e.target.value)} autoComplete="address-level1" error={stateError}>
              <option value="" disabled>
                Select…
              </option>
              {INDIAN_STATES.map((s) => (
                <option key={s}>{s}</option>
              ))}
            </SelectField>
            <TextField
              id="pickup.pincode"
              label="Pincode"
              value={pincode}
              onChange={(e) => setPincode(e.target.value.replace(/\D/g, "").slice(0, 6))}
              inputMode="numeric"
              autoComplete="postal-code"
              error={errors["pickup.pincode"]}
            />
          </div>
          <TextField
            id="contactPhone"
            label="Pickup contact number"
            type="tel"
            inputMode="numeric"
            value={contactPhone}
            onChange={(e) => setContactPhone(e.target.value)}
            autoComplete="tel-national"
            error={errors.contactPhone}
            hint="The courier calls this number at pickup. 10-digit mobile."
          />

          <SectionRule>Dispatch & delivery</SectionRule>
          <div className="grid gap-5 sm:grid-cols-2">
            <SelectField id="handlingDays" label="Time to dispatch" value={handlingDays} onChange={(e) => setHandlingDays(e.target.value)} error={errors.handlingDays} hint="Working days from order to handover to the courier.">
              {[0, 1, 2, 3, 4, 5, 7, 10].map((d) => (
                <option key={d} value={d}>
                  {d === 0 ? "Same day" : d === 1 ? "1 working day" : `${d} working days`}
                </option>
              ))}
            </SelectField>
            <SelectField id="shipsTo" label="You ship to" value={shipsTo} onChange={(e) => setShipsTo(e.target.value as "pan_india" | "own_state")} error={errors.shipsTo}>
              <option value="pan_india">All of India</option>
              <option value="own_state">Only within my state</option>
            </SelectField>
          </div>

          <SectionRule>Returns</SectionRule>
          <CheckField id="acceptsReturns" checked={acceptsReturns} onChange={(e) => setAcceptsReturns(e.target.checked)}>
            I accept returns on my products
          </CheckField>
          {acceptsReturns && (
            <SelectField id="returnWindowDays" label="Return window" value={returnWindowDays} onChange={(e) => setReturnWindowDays(e.target.value)} error={errors.returnWindowDays} className="sm:max-w-xs">
              {[3, 7, 10, 15, 30].map((d) => (
                <option key={d} value={d}>
                  {d} days
                </option>
              ))}
            </SelectField>
          )}
        </fieldset>
        <StepFooter onBack={goBack} busy={busy} label={editable ? "Save & continue" : "Next"} />
      </form>
    </StepFrame>
  );
}
