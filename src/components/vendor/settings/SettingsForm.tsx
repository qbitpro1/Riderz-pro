"use client";

import { ImagePlus, Lock, Trash2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef, useState, type ReactNode } from "react";
import type { VendorSettings } from "@/lib/server/vendor-account";
import { api, ApiFailure, uploadFile } from "@/lib/vendor/client";
import { fileHref, offlineStoreHref, storeHref } from "@/lib/vendor/types";
import { INDIAN_STATES } from "@/lib/vendor/validators";

type Msg = { tone: "ok" | "error"; text: string } | null;

function Card({ id, title, hint, children }: { id: string; title: string; hint?: string; children: ReactNode }) {
  return (
    <section aria-labelledby={id} className="card p-4 md:p-5">
      <h2 id={id} className="font-display text-base font-extrabold uppercase tracking-[0.04em]">{title}</h2>
      {hint ? <p className="mt-1 text-xs text-dim">{hint}</p> : null}
      <div className="mt-4">{children}</div>
    </section>
  );
}

function Banner({ msg }: { msg: Msg }) {
  if (!msg) return null;
  return (
    <p role={msg.tone === "error" ? "alert" : "status"} className={`mt-3 rounded-[2px] border px-3 py-2 text-sm ${msg.tone === "error" ? "border-danger/40 bg-danger/10 text-danger" : "border-accent/40 bg-accent/10 text-chalk"}`}>
      {msg.text}
    </p>
  );
}

function Err({ children }: { children?: string }) {
  return children ? <span className="mt-1 block text-xs text-danger">{children}</span> : null;
}

function fail(e: unknown): { text: string; fields: Record<string, string> } {
  return e instanceof ApiFailure ? { text: e.message, fields: e.fields } : { text: "Something went wrong. Please try again.", fields: {} };
}

function ImagePicker({
  label,
  kind,
  fileId,
  onChange,
  disabled,
  wide,
}: {
  label: string;
  kind: "logo" | "banner";
  fileId: string | null;
  onChange: (id: string | null) => void;
  disabled: boolean;
  wide?: boolean;
}) {
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  async function pick(file: File | undefined) {
    if (!file) return;
    setBusy(true);
    setErr("");
    try {
      onChange((await uploadFile(kind, file)).id);
    } catch (e) {
      setErr(fail(e).text);
    } finally {
      setBusy(false);
      if (input.current) input.current.value = "";
    }
  }
  return (
    <div>
      <span className="label">{label}</span>
      <div className="flex items-center gap-3">
        <div className={`flex items-center justify-center overflow-hidden rounded-[2px] border border-tint/10 bg-steel ${wide ? "h-20 w-40 sm:w-56" : "h-20 w-20"}`}>
          {fileId ? (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img src={fileHref(fileId)} alt={`${label} preview`} className={`h-full w-full ${wide ? "object-cover" : "object-contain"}`} />
          ) : (
            <ImagePlus size={20} className="text-dim" aria-hidden />
          )}
        </div>
        <div className="flex flex-col gap-1.5">
          <input ref={input} type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" id={`pick-${kind}`} disabled={disabled || busy} onChange={(e) => pick(e.target.files?.[0])} />
          <label htmlFor={`pick-${kind}`} className={`btn btn-outline btn-sm ${disabled || busy ? "pointer-events-none opacity-50" : "cursor-pointer"}`}>
            {busy ? "Uploading…" : fileId ? "Replace" : "Upload"}
          </label>
          {fileId && !disabled ? (
            <button type="button" className="inline-flex items-center gap-1 text-xs text-ash hover:text-danger" onClick={() => onChange(null)}>
              <Trash2 size={12} aria-hidden /> Remove
            </button>
          ) : null}
        </div>
      </div>
      <p className="mt-1 text-xs text-dim">JPG, PNG or WebP, up to 3 MB.</p>
      <Err>{err}</Err>
    </div>
  );
}

export default function SettingsForm({ initial }: { initial: VendorSettings }) {
  const router = useRouter();
  const canEdit = initial.canEdit;
  const e0 = initial.editable;

  /* profile */
  const [description, setDescription] = useState(e0.description);
  const [logo, setLogo] = useState(e0.logoFileId);
  const [banner, setBanner] = useState(e0.bannerFileId);
  const [profileMsg, setProfileMsg] = useState<Msg>(null);
  const [profileErr, setProfileErr] = useState<Record<string, string>>({});

  /* shipping */
  const [phone, setPhone] = useState(e0.contactPhone);
  const [handling, setHandling] = useState(e0.handlingDays);
  const [shipsTo, setShipsTo] = useState(e0.shipsTo);
  const [returns, setReturns] = useState(e0.acceptsReturns);
  const [window_, setWindow] = useState(e0.returnWindowDays);
  const [shipMsg, setShipMsg] = useState<Msg>(null);
  const [shipErr, setShipErr] = useState<Record<string, string>>({});

  /* pickup */
  const [pickup, setPickup] = useState(e0.pickup);
  const [pickupMsg, setPickupMsg] = useState<Msg>(null);
  const [pickupErr, setPickupErr] = useState<Record<string, string>>({});

  /* bank */
  const [bankOpen, setBankOpen] = useState(false);
  const [bank, setBank] = useState({ holderName: "", accountNumber: "", confirmAccountNumber: "", ifsc: "" });
  const [bankMsg, setBankMsg] = useState<Msg>(null);
  const [bankErr, setBankErr] = useState<Record<string, string>>({});

  /* password */
  const [pw, setPw] = useState({ current: "", next: "" });
  const [pwMsg, setPwMsg] = useState<Msg>(null);
  const [pwErr, setPwErr] = useState<Record<string, string>>({});

  const [busy, setBusy] = useState<string | null>(null);

  async function patch(section: string, body: Record<string, unknown>, set: (m: Msg) => void, setE: (f: Record<string, string>) => void, ok: string) {
    setBusy(section);
    set(null);
    setE({});
    try {
      await api("/api/vendor/settings", { method: "PATCH", body });
      set({ tone: "ok", text: ok });
      router.refresh();
    } catch (e) {
      const f = fail(e);
      set({ tone: "error", text: f.text });
      setE(f.fields);
    } finally {
      setBusy(null);
    }
  }

  async function requestBank(ev: React.FormEvent) {
    ev.preventDefault();
    setBusy("bank");
    setBankMsg(null);
    setBankErr({});
    try {
      await api("/api/vendor/settings/bank", { body: bank });
      setBank({ holderName: "", accountNumber: "", confirmAccountNumber: "", ifsc: "" });
      setBankOpen(false);
      setBankMsg({ tone: "ok", text: "Request sent. We will check it and notify you. Payouts keep using your current account until then." });
      router.refresh();
    } catch (e) {
      const f = fail(e);
      setBankMsg({ tone: "error", text: f.text });
      setBankErr(f.fields);
    } finally {
      setBusy(null);
    }
  }

  async function changePw(ev: React.FormEvent) {
    ev.preventDefault();
    setBusy("pw");
    setPwMsg(null);
    setPwErr({});
    try {
      await api("/api/vendor/settings/password", { body: pw });
      setPw({ current: "", next: "" });
      setPwMsg({ tone: "ok", text: "Password changed. Other devices have been signed out." });
    } catch (e) {
      const f = fail(e);
      setPwMsg({ tone: "error", text: f.text });
      setPwErr(f.fields);
    } finally {
      setBusy(null);
    }
  }

  const ro = initial.readOnly;
  const lock = !canEdit;

  return (
    <div className="mt-6 space-y-5">
      {lock ? (
        <p role="status" className="rounded-[2px] border border-gold/40 bg-gold/10 px-3 py-2 text-sm text-gold">
          Your store is suspended: your products are hidden from the website and the Offline Store, and settings are read-only. <Link href="/vendor/dashboard/support" className="underline">Contact support</Link> to resolve this.
        </p>
      ) : null}

      <Card id="profile" title="Store profile" hint="Changes here go live straight away on your online store and Offline Store screen. No review needed.">
        <div className="space-y-5">
          <div className="grid gap-5 sm:grid-cols-2">
            <ImagePicker label="Logo" kind="logo" fileId={logo} onChange={setLogo} disabled={lock} />
            <ImagePicker label="Banner" kind="banner" fileId={banner} onChange={setBanner} disabled={lock} wide />
          </div>
          <label className="block">
            <span className="label">About your store</span>
            <textarea className="field min-h-28 py-2" value={description} onChange={(e) => setDescription(e.target.value)} maxLength={600} disabled={lock} />
            <span className="mt-1 flex justify-between text-xs text-dim"><Err>{profileErr.description}</Err><span>{description.length}/600</span></span>
          </label>
          <button type="button" className="btn btn-primary btn-sm" disabled={lock || busy === "profile"} onClick={() => patch("profile", { description, logoFileId: logo, bannerFileId: banner }, setProfileMsg, setProfileErr, "Store profile saved.")}>
            {busy === "profile" ? "Saving…" : "Save profile"}
          </button>
          <Banner msg={profileMsg} />
        </div>
      </Card>

      <Card id="shipping" title="Shipping & returns" hint="Shown to shoppers on your products on the Riderzpro website.">
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block">
            <span className="label">Contact phone</span>
            <input className="field" inputMode="numeric" value={phone} onChange={(e) => setPhone(e.target.value)} disabled={lock} autoComplete="tel-national" />
            <Err>{shipErr.contactPhone}</Err>
          </label>
          <label className="block">
            <span className="label">Dispatch within (working days)</span>
            <input className="field" type="number" min={0} max={10} value={handling} onChange={(e) => setHandling(Number(e.target.value))} disabled={lock} />
            <Err>{shipErr.handlingDays}</Err>
          </label>
          <label className="block">
            <span className="label">Ships to</span>
            <select className="field" value={shipsTo} onChange={(e) => setShipsTo(e.target.value as typeof shipsTo)} disabled={lock}>
              <option value="pan_india">All India</option>
              <option value="own_state">My state only</option>
            </select>
          </label>
          <div>
            <span className="label">Returns</span>
            <label className="flex min-h-12 items-center gap-2 text-sm">
              <input type="checkbox" className="h-4 w-4 accent-[var(--accent)]" checked={returns} onChange={(e) => setReturns(e.target.checked)} disabled={lock} />
              I accept returns
            </label>
          </div>
          {returns ? (
            <label className="block">
              <span className="label">Return window (days)</span>
              <input className="field" type="number" min={1} max={30} value={window_} onChange={(e) => setWindow(Number(e.target.value))} disabled={lock} />
              <Err>{shipErr.returnWindowDays}</Err>
            </label>
          ) : null}
        </div>
        <button
          type="button"
          className="btn btn-primary btn-sm mt-4"
          disabled={lock || busy === "ship"}
          onClick={() => patch("ship", { contactPhone: phone, handlingDays: handling, shipsTo, acceptsReturns: returns, returnWindowDays: returns ? window_ : 0 }, setShipMsg, setShipErr, "Shipping settings saved.")}
        >
          {busy === "ship" ? "Saving…" : "Save shipping"}
        </button>
        <Banner msg={shipMsg} />
      </Card>

      <Card id="pickup" title="Pickup address" hint="Where couriers collect orders. Changes are recorded in your account history.">
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block sm:col-span-2">
            <span className="label">Address line 1</span>
            <input className="field" value={pickup.line1} onChange={(e) => setPickup({ ...pickup, line1: e.target.value })} disabled={lock} autoComplete="address-line1" />
            <Err>{pickupErr["pickup.line1"]}</Err>
          </label>
          <label className="block sm:col-span-2">
            <span className="label">Address line 2 (optional)</span>
            <input className="field" value={pickup.line2 ?? ""} onChange={(e) => setPickup({ ...pickup, line2: e.target.value || null })} disabled={lock} autoComplete="address-line2" />
          </label>
          <label className="block">
            <span className="label">City</span>
            <input className="field" value={pickup.city} onChange={(e) => setPickup({ ...pickup, city: e.target.value })} disabled={lock} autoComplete="address-level2" />
            <Err>{pickupErr["pickup.city"]}</Err>
          </label>
          <label className="block">
            <span className="label">State</span>
            <select className="field" value={pickup.state} onChange={(e) => setPickup({ ...pickup, state: e.target.value })} disabled={lock}>
              <option value="">Select</option>
              {INDIAN_STATES.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
            <Err>{pickupErr["pickup.state"]}</Err>
          </label>
          <label className="block">
            <span className="label">Pincode</span>
            <input className="field" inputMode="numeric" maxLength={6} value={pickup.pincode} onChange={(e) => setPickup({ ...pickup, pincode: e.target.value })} disabled={lock} autoComplete="postal-code" />
            <Err>{pickupErr["pickup.pincode"]}</Err>
          </label>
        </div>
        <button type="button" className="btn btn-primary btn-sm mt-4" disabled={lock || busy === "pickup"} onClick={() => patch("pickup", { pickup }, setPickupMsg, setPickupErr, "Pickup address saved.")}>
          {busy === "pickup" ? "Saving…" : "Save address"}
        </button>
        <Banner msg={pickupMsg} />
      </Card>

      <Card id="identity" title="Store identity & tax" hint="These need verification, so only our team can change them.">
        <dl className="grid gap-x-6 gap-y-3 text-sm sm:grid-cols-2">
          {([
            ["Store name", ro.storeName],
            ["Online store", ro.slug ? storeHref(ro.slug) : null],
            ["Offline Store screen", ro.slug ? offlineStoreHref(ro.slug) : null],
            ["Legal name", ro.legalName],
            ["Trade name", ro.tradeName],
            ["GSTIN", ro.gstExempt ? "GST exempt" : ro.gstin],
            ["PAN", ro.panLast4 ? `XXXXXX${ro.panLast4}` : null],
            ["Business type", ro.businessType],
            ["Login email", ro.email],
            ["Login mobile", ro.mobile],
          ] as const).map(([k, v]) => (
            <div key={k} className="flex items-start gap-2">
              <Lock size={12} className="mt-1 shrink-0 text-dim" aria-hidden />
              <div className="min-w-0">
                <dt className="text-xs uppercase tracking-[0.08em] text-dim">{k}</dt>
                <dd className="break-words text-chalk">{v || "—"}</dd>
              </div>
            </div>
          ))}
        </dl>
        <p className="mt-4 text-xs text-ash">Need to change one? <Link href="/vendor/dashboard/support" className="text-accent hover:underline">Contact support</Link>.</p>
      </Card>

      <Card id="bank" title="Payout bank account" hint="Payouts go to this account. Changes are checked by our team before they apply.">
        {initial.bank ? (
          <p className="text-sm">
            <span className="text-chalk">{initial.bank.holderName}</span> · <span className="font-mono">{initial.bank.maskedAccount}</span> · <span className="font-mono">{initial.bank.ifsc}</span>
          </p>
        ) : <p className="text-sm text-dim">No account on file.</p>}

        {initial.pendingBankChange ? (
          <p role="status" className="mt-3 rounded-[2px] border border-gold/40 bg-gold/10 px-3 py-2 text-sm text-gold">
            Waiting for review: {initial.pendingBankChange.summary}
          </p>
        ) : bankOpen ? (
          <form onSubmit={requestBank} className="mt-4 grid gap-4 sm:grid-cols-2" noValidate>
            <label className="block sm:col-span-2">
              <span className="label">Account holder name</span>
              <input className="field" value={bank.holderName} onChange={(e) => setBank({ ...bank, holderName: e.target.value })} autoComplete="off" />
              <Err>{bankErr.holderName}</Err>
            </label>
            <label className="block">
              <span className="label">Account number</span>
              <input className="field" inputMode="numeric" value={bank.accountNumber} onChange={(e) => setBank({ ...bank, accountNumber: e.target.value.replace(/\D/g, "") })} autoComplete="off" />
              <Err>{bankErr.accountNumber}</Err>
            </label>
            <label className="block">
              <span className="label">Confirm account number</span>
              <input className="field" inputMode="numeric" value={bank.confirmAccountNumber} onChange={(e) => setBank({ ...bank, confirmAccountNumber: e.target.value.replace(/\D/g, "") })} autoComplete="off" />
              <Err>{bankErr.confirmAccountNumber}</Err>
            </label>
            <label className="block">
              <span className="label">IFSC</span>
              <input className="field uppercase" value={bank.ifsc} onChange={(e) => setBank({ ...bank, ifsc: e.target.value })} maxLength={11} autoComplete="off" />
              <Err>{bankErr.ifsc}</Err>
            </label>
            <div className="flex items-end gap-2 sm:col-span-2">
              <button type="submit" className="btn btn-primary btn-sm" disabled={busy === "bank"}>{busy === "bank" ? "Sending…" : "Send for review"}</button>
              <button type="button" className="btn btn-outline btn-sm" onClick={() => { setBankOpen(false); setBankErr({}); }}>Cancel</button>
            </div>
          </form>
        ) : (
          <button type="button" className="btn btn-outline btn-sm mt-4" disabled={lock} onClick={() => setBankOpen(true)}>Request a bank change</button>
        )}
        <Banner msg={bankMsg} />
      </Card>

      <Card id="password" title="Change password" hint="This signs you out on every other device.">
        <form onSubmit={changePw} className="grid gap-4 sm:grid-cols-2" noValidate>
          <label className="block">
            <span className="label">Current password</span>
            <input className="field" type="password" value={pw.current} onChange={(e) => setPw({ ...pw, current: e.target.value })} autoComplete="current-password" />
            <Err>{pwErr.current}</Err>
          </label>
          <label className="block">
            <span className="label">New password</span>
            <input className="field" type="password" value={pw.next} onChange={(e) => setPw({ ...pw, next: e.target.value })} autoComplete="new-password" />
            <Err>{pwErr.next}</Err>
          </label>
          <div className="sm:col-span-2">
            <button type="submit" className="btn btn-primary btn-sm" disabled={busy === "pw" || !pw.current || !pw.next}>{busy === "pw" ? "Changing…" : "Change password"}</button>
          </div>
        </form>
        <Banner msg={pwMsg} />
      </Card>
    </div>
  );
}
