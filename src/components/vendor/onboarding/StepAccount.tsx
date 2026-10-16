"use client";

import { useEffect, useState, type FormEvent } from "react";
import { CheckCircle2 } from "lucide-react";
import { ApiFailure, api } from "@/lib/vendor/client";
import { Notice } from "../auth/fields";
import { StepFooter, StepFrame, type StepProps } from "./ui";

type Channel = "email" | "mobile";

function VerifyRow({
  channel, label, value, verified, deliverable, disabled, onVerified,
}: {
  channel: Channel;
  label: string;
  value: string;
  verified: boolean;
  deliverable: boolean;
  disabled: boolean;
  onVerified: () => Promise<unknown>;
}) {
  const [sent, setSent] = useState<string | null>(null);
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState<"send" | "verify" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [wait, setWait] = useState(0);

  useEffect(() => {
    if (wait <= 0) return;
    const t = setTimeout(() => setWait((w) => w - 1), 1000);
    return () => clearTimeout(t);
  }, [wait]);

  async function send() {
    setBusy("send");
    setError(null);
    try {
      const res = await api<{ sentTo: string }>("/api/vendor/auth/otp/send", { body: { channel } });
      setSent(res.sentTo);
      setWait(30);
    } catch (err) {
      setError(err instanceof ApiFailure ? err.message : "Could not send the code. Try again.");
    } finally {
      setBusy(null);
    }
  }

  async function verify(e: FormEvent) {
    e.preventDefault();
    if (!/^[0-9]{6}$/.test(code)) {
      setError("Enter the 6-digit code.");
      return;
    }
    setBusy("verify");
    setError(null);
    try {
      await api("/api/vendor/auth/otp/verify", { body: { channel, code } });
      await onVerified();
    } catch (err) {
      setError(err instanceof ApiFailure ? err.message : "Could not verify the code. Try again.");
    } finally {
      setBusy(null);
    }
  }

  const id = `otp-${channel}`;
  return (
    <div className="rounded-sm border border-tint/10 p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="label !mb-1">{label}</p>
          <p className="break-all text-sm font-semibold text-chalk">{value}</p>
        </div>
        {verified ? (
          <span className="verified">
            <CheckCircle2 size={12} aria-hidden="true" /> Verified
          </span>
        ) : deliverable ? (
          <button type="button" onClick={send} disabled={disabled || busy !== null || wait > 0} className="btn btn-outline btn-sm">
            {busy === "send" ? "Sending…" : sent ? (wait > 0 ? `Resend in ${wait}s` : "Resend code") : "Send code"}
          </button>
        ) : null}
      </div>
      {!verified && !deliverable && (
        <p className="mt-3 text-xs leading-relaxed text-ash">We'll confirm this during review. Nothing to do for now.</p>
      )}
      {!verified && deliverable && sent && (
        <form onSubmit={verify} className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-end">
          <div className="flex-1">
            <label htmlFor={id} className="label">
              Code sent to {sent}
            </label>
            <input
              id={id}
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={6}
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
              className="field"
              aria-invalid={error ? true : undefined}
              aria-describedby={error ? `${id}-err` : undefined}
            />
          </div>
          <button type="submit" disabled={busy !== null} className="btn btn-primary">
            {busy === "verify" ? "Checking…" : "Verify"}
          </button>
        </form>
      )}
      {error && (
        <p id={`${id}-err`} role="alert" className="mt-2 text-xs text-danger">
          {error}
        </p>
      )}
    </div>
  );
}

export function StepAccount({ state, editable, refresh, goNext }: StepProps) {
  const { vendor, otp } = state;
  const [busy, setBusy] = useState(false);
  const emailOk = vendor.emailVerified || !otp.email;
  const mobileOk = vendor.mobileVerified || !otp.mobile;
  const complete = emailOk && mobileOk;

  async function next(e: FormEvent) {
    e.preventDefault();
    if (!complete) return;
    setBusy(true);
    await refresh(); // records step 1 as done on the server
    setBusy(false);
    goNext();
  }

  return (
    <StepFrame
      title="Confirm your contact details"
      intro="Buyers and our review team use these to reach you. Verify each with a one-time code."
      locked={!editable}
    >
      <form onSubmit={next} className="space-y-4">
        <dl className="grid gap-4 sm:grid-cols-2">
          <div>
            <dt className="label">Name</dt>
            <dd className="text-sm font-semibold text-chalk">{vendor.fullName}</dd>
          </div>
          <div>
            <dt className="label">Business type</dt>
            <dd className="text-sm font-semibold text-chalk">{vendor.businessType}</dd>
          </div>
        </dl>
        <VerifyRow
          channel="email"
          label="Email"
          value={vendor.email}
          verified={vendor.emailVerified}
          deliverable={otp.email}
          disabled={!editable}
          onVerified={refresh}
        />
        <VerifyRow
          channel="mobile"
          label="Mobile"
          value={`+91 ${vendor.mobile}`}
          verified={vendor.mobileVerified}
          deliverable={otp.mobile}
          disabled={!editable}
          onVerified={refresh}
        />
        {!complete && <Notice tone="info">Verify the items above to continue.</Notice>}
        <StepFooter onBack={() => {}} showBack={false} busy={busy} label={complete ? "Save & continue" : "Verify to continue"} />
      </form>
    </StepFrame>
  );
}
