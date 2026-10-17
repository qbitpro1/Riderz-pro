"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { ApiFailure, api } from "@/lib/vendor/client";
import { riderCodeSendSchema } from "@/lib/rider/types";
import { Notice, TextField } from "@/components/vendor/auth/fields";

export function RiderSignIn() {
  const router = useRouter();
  const [mobile, setMobile] = useState("");
  const [code, setCode] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string>();
  const [notice, setNotice] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [wait, setWait] = useState(0);

  useEffect(() => {
    if (wait <= 0) return;
    const t = window.setTimeout(() => setWait((n) => n - 1), 1000);
    return () => window.clearTimeout(t);
  }, [wait]);

  const fail = (err: unknown) => setError(err instanceof ApiFailure ? err.fields.mobile ?? err.fields.code ?? err.message : "Something went wrong. Please try again.");

  async function send(e?: FormEvent) {
    e?.preventDefault();
    const r = riderCodeSendSchema.safeParse({ mobile });
    if (!r.success) return setError(r.error.issues[0]?.message);
    setBusy(true);
    setError(undefined);
    setNotice(null);
    try {
      await api("/api/rider/code/send", { body: { mobile } });
      setSent(true);
      setWait(30);
      setNotice(`Code sent to +91 ${r.data.mobile}.`);
    } catch (err) {
      fail(err);
    } finally {
      setBusy(false);
    }
  }

  async function verify(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(undefined);
    try {
      await api("/api/rider/code/verify", { body: { mobile, code } });
      router.refresh();
    } catch (err) {
      fail(err);
      setCode("");
      setBusy(false);
    }
  }

  return (
    <form onSubmit={sent ? verify : send} noValidate className="card space-y-4 p-5">
      <div>
        <h2 className="font-display text-xl font-extrabold tracking-tight text-chalk">Sign in or apply</h2>
        <p className="mt-1 text-sm text-ash">Use your mobile number. We&apos;ll send a 6-digit code.</p>
      </div>
      {notice && <Notice tone="success">{notice}</Notice>}
      {!sent ? (
        <TextField id="rider-mobile" label="Mobile number" type="tel" inputMode="tel" autoComplete="tel-national" value={mobile} onChange={(e) => setMobile(e.target.value)} maxLength={16} error={error} placeholder="98765 43210" />
      ) : (
        <TextField id="rider-code" label="6-digit code" inputMode="numeric" autoComplete="one-time-code" value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))} maxLength={6} error={error} autoFocus />
      )}
      <button type="submit" className="btn btn-primary btn-block" disabled={busy || (sent && code.length !== 6)}>
        {busy ? "Please wait…" : sent ? "Sign in" : "Send code"}
      </button>
      {sent && (
        <div className="flex justify-between text-sm">
          <button type="button" className="text-ash underline underline-offset-4" onClick={() => { setSent(false); setCode(""); setNotice(null); setError(undefined); }}>
            Change number
          </button>
          <button type="button" className="font-semibold text-accent disabled:text-dim" disabled={wait > 0 || busy} onClick={() => void send()}>
            {wait > 0 ? `Resend in ${wait}s` : "Resend code"}
          </button>
        </div>
      )}
    </form>
  );
}
