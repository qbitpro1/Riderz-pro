"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ApiFailure, api } from "@/lib/vendor/client";
import { SERVICE_CITIES, VEHICLES, applySchema, needsLicence, type RiderSelf, type VehicleType } from "@/lib/rider/types";
import { CheckField, Notice, SelectField, TextField, validate, type FieldErrors } from "@/components/vendor/auth/fields";

/** The rider application. No documents are uploaded: our team checks them in person. */
export function RiderApplyForm({ mobile, initial }: { mobile: string; initial: RiderSelf | null }) {
  const router = useRouter();
  const [v, setV] = useState({
    name: initial?.name ?? "",
    city: initial?.city ?? "",
    vehicleType: (initial?.vehicleType ?? "") as VehicleType | "",
    vehicleNumber: initial?.vehicleNumber ?? "",
    confirmAccurate: false,
    confirmLicence: false,
    confirmPrivacy: false,
  });
  const [errors, setErrors] = useState<FieldErrors>({});
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const motor = v.vehicleType !== "" && needsLicence(v.vehicleType);
  const set = (k: keyof typeof v) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setV((x) => ({ ...x, [k]: e.target.type === "checkbox" ? (e.target as HTMLInputElement).checked : e.target.value }));

  async function submit(e: FormEvent) {
    e.preventDefault();
    const body = { ...v, vehicleNumber: v.vehicleType === "bicycle" ? undefined : v.vehicleNumber || undefined };
    const r = validate(applySchema, body);
    if (!r.ok) return setErrors(r.fields);
    setBusy(true);
    setErrors({});
    setError(null);
    try {
      await api("/api/rider/apply", { body });
      router.replace("/rider");
      router.refresh();
    } catch (err) {
      setError(err instanceof ApiFailure ? err.message : "Something went wrong. Please try again.");
      if (err instanceof ApiFailure) setErrors(err.fields);
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} noValidate className="card space-y-4 p-5">
      {error && <Notice tone="error">{error}</Notice>}
      <p className="text-sm text-ash">
        Signed in as <span className="font-semibold text-chalk tnum">+91 {mobile}</span>
      </p>
      <TextField id="r-name" label="Full name (as on your licence)" value={v.name} onChange={set("name")} maxLength={80} autoComplete="name" error={errors.name} />
      <SelectField id="r-city" label="City you'll ride in" value={v.city} onChange={set("city")} error={errors.city}>
        <option value="">Choose a city</option>
        {SERVICE_CITIES.map((c) => (
          <option key={c} value={c}>{c}</option>
        ))}
      </SelectField>
      <SelectField id="r-vehicle" label="Vehicle" value={v.vehicleType} onChange={set("vehicleType")} error={errors.vehicleType}>
        <option value="">Choose your vehicle</option>
        {VEHICLES.map((x) => (
          <option key={x.value} value={x.value}>{x.label}</option>
        ))}
      </SelectField>
      {v.vehicleType && v.vehicleType !== "bicycle" && (
        <TextField
          id="r-number"
          label="Registration number"
          optional={!motor}
          hint={!motor ? "Leave blank for a low-speed e-scooter that needs no registration." : undefined}
          value={v.vehicleNumber}
          onChange={set("vehicleNumber")}
          maxLength={20}
          placeholder="DL 3C AB 1234"
          error={errors.vehicleNumber}
        />
      )}
      <div className="space-y-3 border-t border-tint/10 pt-4">
        <CheckField id="r-accurate" checked={v.confirmAccurate} onChange={set("confirmAccurate")} error={errors.confirmAccurate}>
          The details above are true and the vehicle is mine or I may use it.
        </CheckField>
        {motor && (
          <CheckField id="r-licence" checked={v.confirmLicence} onChange={set("confirmLicence")} error={errors.confirmLicence}>
            I hold a valid driving licence for this vehicle, and its RC and insurance are valid. I&apos;ll show them to the Riderzpro team.
          </CheckField>
        )}
        <CheckField id="r-privacy" checked={v.confirmPrivacy} onChange={set("confirmPrivacy")} error={errors.confirmPrivacy}>
          I agree Riderzpro may use these details to review my application and assign deliveries, as in the{" "}
          <Link href="/legal/privacy" className="underline underline-offset-2" target="_blank">privacy policy</Link>.
        </CheckField>
      </div>
      <button type="submit" className="btn btn-primary btn-block" disabled={busy}>
        {busy ? "Sending…" : initial ? "Resubmit application" : "Submit application"}
      </button>
    </form>
  );
}
