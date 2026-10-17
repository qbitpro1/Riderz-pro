"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { ApiFailure, api } from "@/lib/vendor/client";
import { codeSchema, identifierSchema, profileSchema } from "@/lib/account/schemas";
import { maskContact, type CustomerSelf } from "@/lib/account/types";
import { Notice, TextField } from "@/components/vendor/auth/fields";
import { useAccount } from "./AccountContext";

const failure = (err: unknown) => (err instanceof ApiFailure ? err.message : "Something went wrong. Please try again.");

export function SettingsPanel({ me }: { me: CustomerSelf }) {
  const router = useRouter();
  const { refresh, signOut } = useAccount();
  const [notice, setNotice] = useState<string | null>(null);

  const done = async (text: string) => {
    setNotice(text);
    await refresh();
    router.refresh();
  };

  return (
    <div className="grid max-w-2xl gap-6">
      {notice && <Notice tone="success">{notice}</Notice>}
      <NameCard me={me} onSaved={() => done("Your name is saved.")} />
      <ContactCard me={me} channel="mobile" onSaved={() => done("Your mobile number is saved. Orders placed with it now show in your account.")} />
      <ContactCard me={me} channel="email" onSaved={() => done("Your email is saved.")} />

      <section className="card p-5">
        <h2 className="text-sm font-bold uppercase tracking-[0.12em] text-chalk">Sign out</h2>
        <p className="mt-1 text-sm text-ash">Your wishlist and car stay saved in your account.</p>
        <div className="mt-4 flex flex-wrap gap-2">
          <button type="button" className="btn btn-outline" onClick={async () => { await signOut(false); router.push("/"); }}>
            Sign out
          </button>
          <button type="button" className="btn btn-outline" onClick={async () => { await signOut(true); router.push("/"); }}>
            Sign out on all devices
          </button>
        </div>
      </section>

      <DeleteCard />
    </div>
  );
}

function NameCard({ me, onSaved }: { me: CustomerSelf; onSaved: () => void }) {
  const [name, setName] = useState(me.name ?? "");
  const [error, setError] = useState<string>();
  const [busy, setBusy] = useState(false);
  async function submit(e: FormEvent) {
    e.preventDefault();
    const r = profileSchema.safeParse({ name });
    if (!r.success) return setError(r.error.issues[0]?.message);
    setBusy(true);
    setError(undefined);
    try {
      await api("/api/account/profile", { method: "PATCH", body: r.data });
      onSaved();
    } catch (err) {
      setError(failure(err));
    } finally {
      setBusy(false);
    }
  }
  return (
    <section className="card p-5">
      <form onSubmit={submit} noValidate className="flex flex-wrap items-end gap-3">
        <TextField id="name" label="Your name" value={name} onChange={(e) => setName(e.target.value)} maxLength={80} autoComplete="name" error={error} className="min-w-56 flex-1" />
        <button type="submit" className="btn btn-primary" disabled={busy}>
          {busy ? "Saving…" : "Save"}
        </button>
      </form>
    </section>
  );
}

function ContactCard({ me, channel, onSaved }: { me: CustomerSelf; channel: "mobile" | "email"; onSaved: () => void }) {
  const current = channel === "mobile" ? me.mobile : me.email;
  const what = channel === "mobile" ? "Mobile number" : "Email";
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState("");
  const [code, setCode] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string>();
  const [busy, setBusy] = useState(false);

  async function send(e: FormEvent) {
    e.preventDefault();
    const r = identifierSchema.safeParse(value);
    if (!r.success) return setError(r.error.issues[0]?.message);
    if (r.data.channel !== channel) return setError(channel === "mobile" ? "Enter a 10-digit mobile number" : "Enter an email address");
    setBusy(true);
    setError(undefined);
    try {
      await api("/api/account/contact/send", { body: { identifier: value } });
      setSent(true);
    } catch (err) {
      setError(err instanceof ApiFailure && err.fields.identifier ? err.fields.identifier : failure(err));
    } finally {
      setBusy(false);
    }
  }

  async function verify(e: FormEvent) {
    e.preventDefault();
    const r = codeSchema.safeParse(code);
    if (!r.success) return setError(r.error.issues[0]?.message);
    setBusy(true);
    setError(undefined);
    try {
      await api("/api/account/contact/verify", { body: { identifier: value, code: r.data } });
      setOpen(false);
      setSent(false);
      setValue("");
      setCode("");
      onSaved();
    } catch (err) {
      setError(failure(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="card p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-sm font-bold uppercase tracking-[0.12em] text-chalk">{what}</h2>
          <p className="mt-1 text-sm text-ash">
            {current ? (
              <>
                <span className="tnum">{channel === "mobile" ? `+91 ${maskContact(current)}` : maskContact(current)}</span>
                <span className="ml-2 text-xs text-dim">verified</span>
              </>
            ) : (
              `No ${what.toLowerCase()} yet. Add one to sign in with it too.`
            )}
          </p>
        </div>
        {!open && (
          <button type="button" className="btn btn-outline btn-sm" onClick={() => setOpen(true)}>
            {current ? "Change" : "Add"}
          </button>
        )}
      </div>
      {open && (
        <form onSubmit={sent ? verify : send} noValidate className="mt-4 flex flex-wrap items-end gap-3">
          {!sent ? (
            <TextField
              id={`new-${channel}`}
              label={`New ${what.toLowerCase()}`}
              type={channel === "mobile" ? "tel" : "email"}
              inputMode={channel === "mobile" ? "tel" : "email"}
              value={value}
              onChange={(e) => setValue(e.target.value)}
              maxLength={254}
              error={error}
              className="min-w-56 flex-1"
            />
          ) : (
            <TextField
              id={`code-${channel}`}
              label={`Code sent to ${value}`}
              inputMode="numeric"
              autoComplete="one-time-code"
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
              maxLength={6}
              error={error}
              className="min-w-56 flex-1"
            />
          )}
          <button type="submit" className="btn btn-primary" disabled={busy}>
            {busy ? "Please wait…" : sent ? "Verify" : "Send code"}
          </button>
          <button type="button" className="btn btn-outline" onClick={() => { setOpen(false); setSent(false); setError(undefined); setCode(""); }}>
            Cancel
          </button>
        </form>
      )}
    </section>
  );
}

function DeleteCard() {
  const router = useRouter();
  const { forget } = useAccount();
  const [open, setOpen] = useState(false);
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string>();
  const [busy, setBusy] = useState(false);
  async function submit(e: FormEvent) {
    e.preventDefault();
    if (confirm !== "DELETE") return setError("Type DELETE to confirm");
    setBusy(true);
    try {
      await api("/api/account/delete", { body: { confirm } });
      forget();
      router.push("/");
    } catch (err) {
      setError(failure(err));
      setBusy(false);
    }
  }
  return (
    <section className="card border-danger/30 p-5">
      <h2 className="text-sm font-bold uppercase tracking-[0.12em] text-danger">Delete account</h2>
      <p className="mt-1 text-sm text-ash">
        Deletes your profile, addresses, wishlist and saved car. Orders you placed are kept for the sellers and for tax records, but are no
        longer linked to an account.
      </p>
      {!open ? (
        <button type="button" className="btn btn-outline btn-sm mt-4" onClick={() => setOpen(true)}>
          Delete my account
        </button>
      ) : (
        <form onSubmit={submit} noValidate className="mt-4 flex flex-wrap items-end gap-3">
          <TextField id="confirm-delete" label="Type DELETE to confirm" value={confirm} onChange={(e) => setConfirm(e.target.value)} error={error} className="min-w-56 flex-1" autoComplete="off" />
          <button type="submit" className="btn btn-primary" disabled={busy}>
            {busy ? "Deleting…" : "Delete account"}
          </button>
          <button type="button" className="btn btn-outline" onClick={() => setOpen(false)}>
            Cancel
          </button>
        </form>
      )}
    </section>
  );
}
