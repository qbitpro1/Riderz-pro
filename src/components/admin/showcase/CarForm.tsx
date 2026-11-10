"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { api, ApiFailure } from "@/lib/vendor/client";
import { BODY_TYPES, CAR_STATUSES, DRIVETRAINS, FUELS, TRANSMISSIONS, type Car } from "@/lib/data/cars";
import { PhotoPicker, type PickedPhoto } from "./PhotoPicker";
import { fromPairs, toLines, toPairs } from "./lines";

const STATUS_TEXT: Record<Car["status"], string> = { draft: "Draft (not on the site)", live: "Live (for sale)", sold: "Sold (shown as sold)", archived: "Archived (off the site)" };

/** Add or edit one of Riderzpro's own cars for sale. */
export function CarForm({ car }: { car: Car | null }) {
  const router = useRouter();
  const [f, setF] = useState({
    status: car?.status ?? "draft",
    make: car?.brand ?? "",
    model: car?.model ?? "",
    variant: car?.variant ?? "",
    year: String(car?.year ?? new Date().getFullYear() - 3),
    price: String(car?.price ?? ""),
    km: String(car?.km ?? ""),
    fuel: car?.fuel ?? "Petrol",
    transmission: car?.transmission ?? "Manual",
    owners: String(car?.owners ?? 1),
    city: car?.city ?? "",
    state: car?.state ?? "",
    body: car?.body ?? "SUV",
    engine: car?.engine ?? "",
    power: car?.power ?? "",
    drivetrain: car?.drivetrain ?? "2WD",
    colour: car?.colour ?? "",
    registration: car?.registration ?? "",
    insurance: car?.insurance ?? "",
    serviceHistory: car?.serviceHistory ?? "",
    note: car?.note ?? "",
    highlights: (car?.highlights ?? []).join("\n"),
    modifications: fromPairs(car?.modifications ?? []),
    financing: car?.financing ?? true,
    featured: car?.featured ?? false,
  });
  const [photos, setPhotos] = useState<PickedPhoto[]>(car ? car.photoIds.map((id, i) => ({ id, url: car.photos[i] })) : []);
  const [busy, setBusy] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [msg, setMsg] = useState<string | null>(null);
  const set = (k: keyof typeof f) => (e: { target: { value: string } }) => setF({ ...f, [k]: e.target.value });

  const save = async () => {
    setBusy(true);
    setErrors({});
    setMsg(null);
    const body = {
      ...f,
      year: Number(f.year),
      price: Number(f.price),
      km: Number(f.km),
      owners: Number(f.owners),
      highlights: toLines(f.highlights),
      modifications: toPairs(f.modifications),
      photoIds: photos.map((p) => p.id),
    };
    try {
      const r = await api<{ car: { id: string; slug: string } }>(car ? `/api/admin/cars/${car.id}` : "/api/admin/cars", { method: car ? "PUT" : "POST", body });
      setMsg("Saved.");
      router.push(`/admin/cars?edit=${r.car.id}`);
      router.refresh();
    } catch (e) {
      if (e instanceof ApiFailure) {
        setErrors(e.fields);
        setMsg(e.message);
      } else setMsg("Something went wrong.");
    } finally {
      setBusy(false);
    }
  };

  const input = (k: keyof typeof f, label: string, props: Record<string, unknown> = {}) => (
    <div>
      <label className="label" htmlFor={`car-${k}`}>{label}</label>
      <input id={`car-${k}`} className="field" value={String(f[k])} onChange={set(k)} {...props} />
      {errors[k] && <p className="mt-1 text-xs text-danger">{errors[k]}</p>}
    </div>
  );
  const select = (k: keyof typeof f, label: string, options: readonly string[], labels?: Record<string, string>) => (
    <div>
      <label className="label" htmlFor={`car-${k}`}>{label}</label>
      <select id={`car-${k}`} className="field" value={String(f[k])} onChange={set(k)}>
        {options.map((o) => <option key={o} value={o}>{labels?.[o] ?? o}</option>)}
      </select>
    </div>
  );

  return (
    <div className="card space-y-4 p-5">
      <h2 className="font-display text-lg font-extrabold uppercase">{car ? `Edit ${car.year} ${car.brand} ${car.model}` : "Add a car"}</h2>
      <div className="grid gap-4 sm:grid-cols-3">
        {select("status", "Status", CAR_STATUSES, STATUS_TEXT)}
        {input("make", "Make", { placeholder: "Mahindra" })}
        {input("model", "Model", { placeholder: "Thar" })}
        {input("variant", "Variant", { placeholder: "LX 4x4 Hard Top Diesel MT" })}
        {input("year", "Year", { inputMode: "numeric" })}
        {input("price", "Price (₹)", { inputMode: "numeric", placeholder: "1575000" })}
        {input("km", "Kilometres", { inputMode: "numeric" })}
        {select("fuel", "Fuel", FUELS)}
        {select("transmission", "Transmission", TRANSMISSIONS)}
        {input("owners", "Owners so far", { inputMode: "numeric" })}
        {select("body", "Body", BODY_TYPES)}
        {select("drivetrain", "Drivetrain", DRIVETRAINS)}
        {input("city", "City")}
        {input("state", "State")}
        {input("colour", "Colour")}
        {input("engine", "Engine (optional)")}
        {input("power", "Power (optional)")}
        {input("registration", "Registration (optional)", { placeholder: "KA-03, valid till 2037" })}
        {input("insurance", "Insurance (optional)")}
        {input("serviceHistory", "Service history (optional)")}
      </div>
      <div>
        <label className="label" htmlFor="car-note">Description</label>
        <textarea id="car-note" className="field min-h-20 py-2" value={f.note} onChange={set("note")} maxLength={600} />
        {errors.note && <p className="mt-1 text-xs text-danger">{errors.note}</p>}
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="label" htmlFor="car-highlights">Highlights (one per line)</label>
          <textarea id="car-highlights" className="field min-h-24 py-2" value={f.highlights} onChange={set("highlights")} />
        </div>
        <div>
          <label className="label" htmlFor="car-mods">Modifications (one per line, &quot;Name: detail&quot;)</label>
          <textarea id="car-mods" className="field min-h-24 py-2" value={f.modifications} onChange={set("modifications")} />
        </div>
      </div>
      <PhotoPicker kind="car_photo" photos={photos} onChange={setPhotos} error={errors.photoIds} />
      <div className="flex flex-wrap gap-5 text-sm">
        <label className="flex items-center gap-2"><input type="checkbox" checked={f.financing} onChange={(e) => setF({ ...f, financing: e.target.checked })} /> Finance available</label>
        <label className="flex items-center gap-2"><input type="checkbox" checked={f.featured} onChange={(e) => setF({ ...f, featured: e.target.checked })} /> Featured</label>
      </div>
      {msg && <p role="status" className={`text-sm ${Object.keys(errors).length ? "text-danger" : "text-accent"}`}>{msg}</p>}
      <button type="button" className="btn btn-primary btn-sm" disabled={busy} onClick={save}>{busy ? "Saving…" : car ? "Save changes" : "Add car"}</button>
    </div>
  );
}
