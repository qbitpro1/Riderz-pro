"use client";

import { useId, useState } from "react";
import { useRouter } from "next/navigation";
import { api, ApiFailure } from "@/lib/vendor/client";
import { COUPON_KINDS, COUPON_KIND_LABELS, couponOffer, normaliseCode, type AdminCoupon, type CouponKind } from "@/lib/coupons/types";
import { rupees } from "@/lib/format";

const day = (iso: string | null) => (iso ? new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric", timeZone: "Asia/Kolkata" }) : null);

/** "2026-10-20" from a date input → the start (or end) of that day in India. */
const istDay = (v: string, end: boolean) => (v ? `${v}T${end ? "23:59:59" : "00:00:00"}+05:30` : "");

const STATUS_TEXT: Record<AdminCoupon["status"], string> = { active: "Active", paused: "Paused", ended: "Ended" };

export function CouponsBoard({ coupons }: { coupons: AdminCoupon[] }) {
  const router = useRouter();
  const uid = useId();
  const [f, setF] = useState({ code: "", title: "", description: "", kind: "percent" as CouponKind, value: "10", maxDiscount: "", minOrder: "", startsAt: "", endsAt: "", usageLimit: "", perCustomer: "1", public: true });
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [fields, setFields] = useState<Record<string, string>>({});
  const [done, setDone] = useState<string | null>(null);

  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setF((v) => ({ ...v, [k]: e.target.type === "checkbox" ? (e.target as HTMLInputElement).checked : e.target.value }));
  const int = (v: string) => (v.trim() === "" ? null : Number(v.replace(/[^0-9]/g, "")));

  async function create(e: React.FormEvent) {
    e.preventDefault();
    setBusy("create");
    setError(null);
    setFields({});
    setDone(null);
    try {
      await api("/api/admin/coupons", {
        body: {
          code: f.code,
          title: f.title,
          description: f.description,
          kind: f.kind,
          value: f.kind === "free_shipping" ? 0 : int(f.value) ?? 0,
          maxDiscount: f.kind === "percent" ? int(f.maxDiscount) : null,
          minOrder: int(f.minOrder) ?? 0,
          startsAt: istDay(f.startsAt, false),
          endsAt: istDay(f.endsAt, true),
          usageLimit: int(f.usageLimit),
          perCustomer: int(f.perCustomer) ?? 1,
          public: f.public,
        },
      });
      setDone(`${normaliseCode(f.code)} created.`);
      setF((v) => ({ ...v, code: "", title: "", description: "" }));
      router.refresh();
    } catch (err) {
      if (err instanceof ApiFailure) {
        setFields(err.fields);
        setError(err.message);
      } else setError("Something went wrong. Please try again.");
    } finally {
      setBusy(null);
    }
  }

  async function act(c: AdminCoupon, action: "pause" | "resume" | "end" | "public" | "private") {
    if (action === "end" && !window.confirm(`End ${c.code} for good? It can't be switched back on.`)) return;
    setBusy(`${c.id}:${action}`);
    setError(null);
    try {
      await api(`/api/admin/coupons/${encodeURIComponent(c.id)}`, { body: { action } });
      router.refresh();
    } catch (err) {
      setError(err instanceof ApiFailure ? err.message : "Something went wrong. Please try again.");
    } finally {
      setBusy(null);
    }
  }

  const field = (k: keyof typeof f, label: string, props: React.InputHTMLAttributes<HTMLInputElement> = {}) => (
    <div>
      <label className="label" htmlFor={`${uid}-${k}`}>{label}</label>
      <input id={`${uid}-${k}`} className="field" value={String(f[k])} onChange={set(k)} aria-invalid={Boolean(fields[k])} {...props} />
      {fields[k] && <p className="mt-1 text-xs text-danger">{fields[k]}</p>}
    </div>
  );

  return (
    <div className="space-y-8">
      {error && <p role="alert" className="text-sm text-danger">{error}</p>}

      <div>
        <h2 className="eyebrow mb-3">Coupons ({coupons.length})</h2>
        {coupons.length === 0 ? (
          <p className="text-sm text-ash">No coupons yet. Create the first one below.</p>
        ) : (
          <ul className="space-y-3">
            {coupons.map((c) => (
              <li key={c.id} className="card p-4 text-sm">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-mono font-bold tracking-[0.08em] text-chalk">{c.code}</p>
                    <p className="text-chalk">{couponOffer(c)} · {c.title}</p>
                    <p className="mt-1 text-xs text-dim">
                      {c.minOrder > 0 ? `Min ${rupees(c.minOrder)}` : "No minimum"} · {c.perCustomer} per customer
                      {c.usageLimit ? ` · ${c.usageLimit} uses in all` : ""}
                      {c.startsAt ? ` · from ${day(c.startsAt)}` : ""}
                      {c.endsAt ? ` · until ${day(c.endsAt)}` : ""}
                      {c.public ? " · on /offers" : " · hidden (share the code)"}
                    </p>
                    <p className="mt-1 text-xs text-ash">
                      Used {c.used} time{c.used === 1 ? "" : "s"} · {rupees(c.discountGiven)} given · by {c.createdBy}
                    </p>
                  </div>
                  <span className={`rounded-[2px] border px-2 py-1 text-xs ${c.status === "active" ? "border-accent text-accent" : "border-tint/15 text-ash"}`}>{STATUS_TEXT[c.status]}</span>
                </div>
                {c.status !== "ended" && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {c.status === "active" ? (
                      <button type="button" className="btn btn-outline btn-sm" disabled={busy !== null} onClick={() => act(c, "pause")}>Pause</button>
                    ) : (
                      <button type="button" className="btn btn-outline btn-sm" disabled={busy !== null} onClick={() => act(c, "resume")}>Resume</button>
                    )}
                    <button type="button" className="btn btn-outline btn-sm" disabled={busy !== null} onClick={() => act(c, c.public ? "private" : "public")}>
                      {c.public ? "Hide from /offers" : "Show on /offers"}
                    </button>
                    <button type="button" className="btn btn-outline btn-sm text-danger" disabled={busy !== null} onClick={() => act(c, "end")}>End</button>
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>

      <form onSubmit={create} noValidate className="card space-y-3 p-5" aria-label="New coupon">
        <h2 className="eyebrow">New coupon</h2>
        <p className="text-xs text-dim">Coupons lower Riderzpro&apos;s own products, installation or delivery, never a marketplace seller&apos;s items.</p>
        <div className="grid gap-3 sm:grid-cols-2">
          {field("code", "Code (letters and numbers)", { maxLength: 20, autoCapitalize: "characters", className: "field uppercase" })}
          {field("title", "Title shoppers see", { maxLength: 80, placeholder: "Diwali: 10% off accessories" })}
        </div>
        {field("description", "Details (optional)", { maxLength: 300 })}
        <div className="grid gap-3 sm:grid-cols-3">
          <div>
            <label className="label" htmlFor={`${uid}-kind`}>Type</label>
            <select id={`${uid}-kind`} className="field" value={f.kind} onChange={set("kind")}>
              {COUPON_KINDS.map((k) => (
                <option key={k} value={k}>{COUPON_KIND_LABELS[k]}</option>
              ))}
            </select>
          </div>
          {f.kind !== "free_shipping" && field("value", f.kind === "percent" ? "Percent off (1–90)" : "Rupees off", { inputMode: "numeric", maxLength: 6 })}
          {f.kind === "percent" && field("maxDiscount", "Most it can take off (₹, optional)", { inputMode: "numeric", maxLength: 6 })}
        </div>
        <div className="grid gap-3 sm:grid-cols-3">
          {field("minOrder", "Minimum order (₹, optional)", { inputMode: "numeric", maxLength: 7 })}
          {field("usageLimit", "Uses in all (optional)", { inputMode: "numeric", maxLength: 7 })}
          {field("perCustomer", "Uses per customer", { inputMode: "numeric", maxLength: 3 })}
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          {field("startsAt", "Starts (optional)", { type: "date" })}
          {field("endsAt", "Ends after (optional)", { type: "date" })}
        </div>
        <label className="flex items-center gap-2 text-xs text-ash">
          <input type="checkbox" checked={f.public} onChange={set("public")} className="h-4 w-4 accent-[var(--accent)]" />
          Show on the public Offers page
        </label>
        <button type="submit" className="btn btn-primary" disabled={busy !== null || normaliseCode(f.code).length < 3 || f.title.trim().length < 3}>
          {busy === "create" ? "Creating…" : "Create coupon"}
        </button>
        {done && <p role="status" className="text-xs text-accent">{done}</p>}
      </form>
    </div>
  );
}
