"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { useLatest } from "@/lib/client/hooks";
import { CheckCircle2, ImagePlus, Plus, X } from "lucide-react";
import { DEPARTMENTS, type DepartmentSlug } from "@/lib/data/taxonomy";
import { BRAND_AUTH_TYPES, SELLER_TYPES, fileHref, type BrandAuthType, type SellerType, type VendorSelf } from "@/lib/vendor/types";
import { ApiFailure, api, uploadFile } from "@/lib/vendor/client";
import { slugSchema, slugify, storeStepSchema } from "@/lib/vendor/validators";
import { FieldMessage, Notice, SelectField, TextAreaField, TextField, useFocusFirstInvalid, validate, type FieldErrors } from "../auth/fields";
import { StepFooter, StepFrame, type StepProps } from "./ui";

type Brand = { name: string; authType: BrandAuthType };
type Availability = { state: "idle" | "checking" | "free" | "taken" | "error"; slug?: string };

function ImageUpload({
  kind, label, hint, fileId, disabled, onChange, onUploaded, error,
}: {
  kind: "logo" | "banner";
  label: string;
  hint: string;
  fileId: string | null;
  disabled: boolean;
  onChange: (id: string | null) => void;
  onUploaded: StepProps["onUploaded"];
  error?: string;
}) {
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const id = `${kind}-file`;

  async function pick(file: File | undefined) {
    if (!file) return;
    setBusy(true);
    setMsg(null);
    try {
      const up = await uploadFile(kind, file);
      onUploaded({ id: up.id, kind, mime: up.mime, size: up.size });
      onChange(up.id);
    } catch (err) {
      setMsg(err instanceof ApiFailure ? err.message : "Upload failed. Try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <label htmlFor={id} className="label">
        {label} <span className="font-normal normal-case tracking-normal text-dim">(optional)</span>
      </label>
      <div className="flex items-center gap-3">
        <div
          className={`flex shrink-0 items-center justify-center overflow-hidden rounded-sm border border-tint/10 bg-tint/5 ${
            kind === "logo" ? "h-20 w-20" : "h-20 w-36"
          }`}
        >
          {fileId ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={fileHref(fileId)} alt={`${label} preview`} className={`h-full w-full ${kind === "logo" ? "object-contain" : "object-cover"}`} />
          ) : (
            <ImagePlus size={20} className="text-dim" aria-hidden="true" />
          )}
        </div>
        <div className="min-w-0 space-y-2">
          <input
            id={id}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            disabled={disabled || busy}
            onChange={(e) => {
              void pick(e.target.files?.[0]);
              e.target.value = "";
            }}
            className="block w-full max-w-60 text-xs text-ash file:mr-3 file:rounded-sm file:border file:border-tint/20 file:bg-transparent file:px-3 file:py-2 file:text-xs file:font-semibold file:text-chalk"
            aria-invalid={error ? true : undefined}
            aria-describedby={`${id}-msg`}
          />
          {fileId && !disabled && (
            <button type="button" onClick={() => onChange(null)} className="text-xs font-semibold text-ash underline hover:text-chalk">
              Remove
            </button>
          )}
        </div>
      </div>
      <FieldMessage id={id} error={msg ?? error} hint={busy ? "Uploading…" : hint} />
    </div>
  );
}

export function StepStore({ state, editable, onSaved, onUploaded, goBack, goNext }: StepProps) {
  const saved = state.vendor.onboarding.store;
  const form = useRef<HTMLFormElement>(null);
  const focusInvalid = useFocusFirstInvalid(form);
  const [storeName, setStoreName] = useState(saved?.storeName ?? "");
  const [slug, setSlug] = useState(saved?.slug ?? "");
  const [slugTouched, setSlugTouched] = useState(Boolean(saved?.slug));
  const [sellerType, setSellerType] = useState<SellerType | "">(saved?.sellerType ?? "");
  const [description, setDescription] = useState(saved?.description ?? "");
  const [departments, setDepartments] = useState<DepartmentSlug[]>(saved?.departments ?? []);
  const [brands, setBrands] = useState<Brand[]>(saved?.brands?.length ? saved.brands : [{ name: "", authType: "Own brand" }]);
  const [logoFileId, setLogoFileId] = useState<string | null>(saved?.logoFileId ?? null);
  const [bannerFileId, setBannerFileId] = useState<string | null>(saved?.bannerFileId ?? null);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  // The last answer from the server, for the name it was about.
  const [checked, setChecked] = useState<(Availability & { name: string }) | null>(null);
  const name = storeName.trim();
  const needsCheck = editable && name.length >= 3 && slugify(name).length >= 3 && !(saved?.storeName === name && saved.slug);
  const avail: Availability = !editable || name.length < 3 || slugify(name).length < 3
    ? { state: "idle" }
    : !needsCheck
      ? { state: "free", slug: saved?.slug }
      : checked?.name === name
        ? checked
        : { state: "checking" };
  // Read when the answer arrives (re-running the check when it changes would refire the request).
  const slugTouchedRef = useLatest(slugTouched);

  // Check the name 450 ms after typing stops; suggest a free address unless the seller edited it.
  useEffect(() => {
    if (!needsCheck) return;
    const ctl = new AbortController();
    const t = setTimeout(async () => {
      try {
        const res = await api<{ available: boolean; slug: string }>(`/api/vendor/onboarding/store-name?name=${encodeURIComponent(name)}`);
        if (ctl.signal.aborted) return;
        setChecked({ name, state: res.available ? "free" : "taken", slug: res.slug });
        if (!slugTouchedRef.current) setSlug(res.slug);
      } catch {
        if (!ctl.signal.aborted) setChecked({ name, state: "error" });
      }
    }, 450);
    return () => {
      ctl.abort();
      clearTimeout(t);
    };
  }, [name, needsCheck, slugTouchedRef]);

  const toggleDept = (d: DepartmentSlug) =>
    setDepartments((cur) => (cur.includes(d) ? cur.filter((x) => x !== d) : [...cur, d]));
  const setBrand = (i: number, patch: Partial<Brand>) => setBrands((b) => b.map((x, j) => (j === i ? { ...x, ...patch } : x)));

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (!editable) return goNext();
    setFormError(null);
    const payload = {
      storeName,
      slug,
      sellerType,
      description,
      departments,
      brands: brands.filter((b) => b.name.trim()).map((b) => ({ name: b.name.trim(), authType: b.authType })),
      logoFileId,
      bannerFileId,
    };
    const checked = validate(storeStepSchema, payload);
    const next: FieldErrors = checked.ok ? {} : { ...checked.fields };
    if (avail.state === "taken") next.storeName = "That store name is already taken.";
    if (Object.keys(next).length) {
      setErrors(next);
      focusInvalid();
      return;
    }
    setErrors({});
    setBusy(true);
    try {
      const res = await api<{ vendor: VendorSelf }>("/api/vendor/onboarding/store", { method: "PUT", body: payload });
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

  const slugCheck = slug ? slugSchema.safeParse(slug) : null;
  const nameMsg =
    avail.state === "checking" ? "Checking availability…" : avail.state === "free" ? "Available" : avail.state === "error" ? "Couldn't check availability right now." : "This is the name shoppers will see.";

  return (
    <StepFrame title="Your store" intro="This is how your store appears on the Riderzpro website and on your Offline Store screen. Our team reviews it before approval." locked={!editable}>
      <form ref={form} onSubmit={submit} noValidate>
        <fieldset disabled={!editable} className="space-y-5 border-0 p-0">
          {formError && <Notice tone="error">{formError}</Notice>}

          <div>
            <TextField
              id="storeName"
              label="Store name"
              value={storeName}
              onChange={(e) => setStoreName(e.target.value)}
              maxLength={60}
              autoComplete="organization"
              error={errors.storeName || (avail.state === "taken" ? "That store name is already taken. Try another." : undefined)}
              hint={nameMsg}
            />
            {avail.state === "free" && !errors.storeName && (
              <p className="sr-only" role="status">
                Store name is available
              </p>
            )}
          </div>

          <div>
            <label htmlFor="slug" className="label">
              Store address
            </label>
            <div className="flex">
              <span className="flex min-h-12 items-center rounded-l-sm border border-r-0 border-tint/10 bg-tint/5 px-3 text-sm text-ash" aria-hidden="true">
                /sellers/
              </span>
              <input
                id="slug"
                name="slug"
                value={slug}
                onChange={(e) => {
                  setSlugTouched(true);
                  setSlug(e.target.value.toLowerCase());
                }}
                maxLength={48}
                autoComplete="off"
                spellCheck={false}
                className="field rounded-l-none"
                aria-invalid={errors.slug || (slugCheck && !slugCheck.success) ? true : undefined}
                aria-describedby="slug-msg"
              />
            </div>
            <FieldMessage
              id="slug"
              error={errors.slug || (slugCheck && !slugCheck.success ? slugCheck.error.issues[0].message : undefined)}
              hint={slug ? `Your online store: riderzpro.com/sellers/${slug}. Your Offline Store screen: riderzpro.com/store/${slug} (opens only when you are signed in).` : "Letters, numbers and hyphens."}
            />
          </div>

          <SelectField id="sellerType" label="Seller type" value={sellerType} onChange={(e) => setSellerType(e.target.value as SellerType)} error={errors.sellerType && "Choose a seller type"}>
            <option value="" disabled>
              Select…
            </option>
            {SELLER_TYPES.map((t) => (
              <option key={t}>{t}</option>
            ))}
          </SelectField>

          <TextAreaField
            id="description"
            label="About your store"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            maxLength={600}
            error={errors.description}
            hint={`${description.trim().length}/600 · what you sell and what makes you reliable (min 20 characters).`}
          />

          <fieldset aria-describedby="departments-msg">
            <legend className="label">Departments you sell in</legend>
            <div className="flex flex-wrap gap-2">
              {DEPARTMENTS.map((d) => {
                const on = departments.includes(d.slug);
                return (
                  <button
                    key={d.slug}
                    type="button"
                    aria-pressed={on}
                    onClick={() => toggleDept(d.slug)}
                    className={`chip min-h-9 cursor-pointer disabled:cursor-not-allowed ${on ? "chip-active" : "hover:text-chalk"}`}
                    id={d.slug === DEPARTMENTS[0].slug ? "departments" : undefined}
                    aria-invalid={errors.departments && d.slug === DEPARTMENTS[0].slug ? true : undefined}
                  >
                    {d.name}
                  </button>
                );
              })}
            </div>
            <FieldMessage id="departments" error={errors.departments} hint="Pick every department you plan to list in." />
          </fieldset>

          <fieldset>
            <legend className="label">Brands you sell</legend>
            <div className="space-y-3">
              {brands.map((b, i) => (
                <div key={i} className="grid grid-cols-[1fr_auto] gap-2 sm:grid-cols-[1fr_12rem_auto]">
                  <input
                    aria-label={`Brand ${i + 1} name`}
                    value={b.name}
                    onChange={(e) => setBrand(i, { name: e.target.value })}
                    maxLength={60}
                    placeholder="Brand name"
                    className="field col-span-2 sm:col-span-1"
                    aria-invalid={errors[`brands.${i}.name`] ? true : undefined}
                  />
                  <select
                    aria-label={`Brand ${i + 1} authorisation`}
                    value={b.authType}
                    onChange={(e) => setBrand(i, { authType: e.target.value as BrandAuthType })}
                    className="field"
                  >
                    {BRAND_AUTH_TYPES.map((t) => (
                      <option key={t}>{t}</option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={() => setBrands((cur) => cur.filter((_, j) => j !== i))}
                    disabled={brands.length === 1}
                    aria-label={`Remove brand ${i + 1}`}
                    className="btn btn-outline h-12 !min-h-12 w-12 !px-0"
                  >
                    <X size={16} aria-hidden="true" />
                  </button>
                </div>
              ))}
            </div>
            {errors.brands && (
              <p role="alert" className="mt-1.5 text-xs text-danger">
                {errors.brands}
              </p>
            )}
            {Object.entries(errors)
              .filter(([k]) => k.startsWith("brands.") && k !== "brands")
              .slice(0, 1)
              .map(([k, v]) => (
                <p key={k} role="alert" className="mt-1.5 text-xs text-danger">
                  {v}
                </p>
              ))}
            <button
              type="button"
              onClick={() => setBrands((b) => [...b, { name: "", authType: "Own brand" }])}
              disabled={brands.length >= 30}
              className="mt-3 inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-[0.1em] text-accent hover:underline"
            >
              <Plus size={14} aria-hidden="true" /> Add another brand
            </button>
          </fieldset>

          <div className="grid gap-6 sm:grid-cols-2">
            <ImageUpload
              kind="logo"
              label="Logo"
              hint="Square works best. JPG, PNG or WebP, up to 3 MB."
              fileId={logoFileId}
              disabled={!editable}
              onChange={setLogoFileId}
              onUploaded={onUploaded}
              error={errors.logoFileId}
            />
            <ImageUpload
              kind="banner"
              label="Banner"
              hint="Wide image, around 1600×400. Up to 3 MB."
              fileId={bannerFileId}
              disabled={!editable}
              onChange={setBannerFileId}
              onUploaded={onUploaded}
              error={errors.bannerFileId}
            />
          </div>
          {avail.state === "free" && (
            <p className="flex items-center gap-1.5 text-xs text-accent">
              <CheckCircle2 size={13} aria-hidden="true" /> “{storeName.trim()}” is available.
            </p>
          )}
        </fieldset>
        <StepFooter onBack={goBack} busy={busy} label={editable ? "Save & continue" : "Next"} />
      </form>
    </StepFrame>
  );
}
