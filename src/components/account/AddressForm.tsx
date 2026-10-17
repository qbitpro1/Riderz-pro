"use client";

import { useId, useState, type FormEvent } from "react";
import { INDIAN_STATES } from "@/lib/vendor/validators";
import { addressSchema, type AddressInput } from "@/lib/account/schemas";
import type { AddressView } from "@/lib/account/types";
import { SelectField, TextField, validate, type FieldErrors } from "@/components/vendor/auth/fields";

export type AddressValues = { label: string; name: string; mobile: string; address: string; city: string; state: string; pincode: string; isDefault: boolean };

export const emptyAddress = (name = "", mobile = ""): AddressValues => ({
  label: "Home", name, mobile, address: "", city: "", state: "", pincode: "", isDefault: false,
});

export const toValues = (a: AddressView): AddressValues => ({ ...a });

/** One address's fields. Validates with the same schema as the API before calling `onSave`. */
export function AddressForm({
  initial,
  submitLabel,
  onSave,
  onCancel,
  serverErrors,
  busy,
}: {
  initial: AddressValues;
  submitLabel: string;
  onSave: (input: AddressInput) => void;
  onCancel?: () => void;
  serverErrors?: FieldErrors;
  busy?: boolean;
}) {
  const uid = useId();
  const [v, setV] = useState(initial);
  const [errors, setErrors] = useState<FieldErrors>({});
  const shown = { ...serverErrors, ...errors };
  const set = (k: keyof AddressValues) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setV((x) => ({ ...x, [k]: e.target.type === "checkbox" ? (e.target as HTMLInputElement).checked : e.target.value }));

  function submit(e: FormEvent) {
    e.preventDefault();
    const r = validate(addressSchema, v);
    if (!r.ok) {
      setErrors(r.fields);
      requestAnimationFrame(() => document.querySelector<HTMLElement>(`[id^="${CSS.escape(uid)}"][aria-invalid="true"]`)?.focus());
      return;
    }
    setErrors({});
    onSave(r.data);
  }

  const id = (k: string) => `${uid}-${k}`;
  return (
    <form onSubmit={submit} noValidate className="grid gap-3 sm:grid-cols-2">
      <TextField id={id("label")} label="Label" value={v.label} onChange={set("label")} maxLength={30} placeholder="Home, Office…" error={shown.label} />
      <TextField id={id("name")} label="Full name" value={v.name} onChange={set("name")} maxLength={80} autoComplete="name" error={shown.name} />
      <TextField id={id("mobile")} label="Mobile" type="tel" inputMode="tel" value={v.mobile} onChange={set("mobile")} maxLength={16} autoComplete="tel-national" error={shown.mobile} className="sm:col-span-2" />
      <TextField id={id("address")} label="Address" value={v.address} onChange={set("address")} maxLength={240} autoComplete="street-address" placeholder="House, street, area" error={shown.address} className="sm:col-span-2" />
      <TextField id={id("city")} label="City" value={v.city} onChange={set("city")} maxLength={60} autoComplete="address-level2" error={shown.city} />
      <TextField id={id("pincode")} label="Pincode" inputMode="numeric" value={v.pincode} onChange={set("pincode")} maxLength={6} autoComplete="postal-code" error={shown.pincode} />
      <SelectField id={id("state")} label="State" value={v.state} onChange={set("state")} autoComplete="address-level1" error={shown.state} className="sm:col-span-2">
        <option value="">Select state</option>
        {INDIAN_STATES.map((s) => (
          <option key={s} value={s}>
            {s}
          </option>
        ))}
      </SelectField>
      <label className="flex items-center gap-2 text-sm text-ash sm:col-span-2">
        <input type="checkbox" checked={v.isDefault} onChange={set("isDefault")} className="h-4 w-4 accent-[var(--accent)]" />
        Use as my default address
      </label>
      <div className="flex flex-wrap gap-2 sm:col-span-2">
        <button type="submit" className="btn btn-primary" disabled={busy}>
          {busy ? "Saving…" : submitLabel}
        </button>
        {onCancel && (
          <button type="button" className="btn btn-outline" onClick={onCancel}>
            Cancel
          </button>
        )}
      </div>
    </form>
  );
}
