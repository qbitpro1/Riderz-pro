"use client";

import { useId, useState } from "react";
import { Mail, MessageSquareText, ReceiptText } from "lucide-react";
import { api, ApiFailure } from "@/lib/vendor/client";
import { ui } from "./lib";

type Outcome = { sent: boolean; status: string; message: string };

/**
 * "GET YOUR RECEIPT" after a screen sale: SMS to the mobile given at checkout, email to an address
 * the customer types, or Skip. Nothing is sent unless the customer picks SMS or Email.
 */
export function ReceiptChoice({ number, mobile }: { number: string; mobile: string }) {
  const uid = useId();
  const [mode, setMode] = useState<"choose" | "email" | "done" | "skipped">("choose");
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState<{ text: string; good: boolean } | null>(null);
  const [fieldError, setFieldError] = useState<string | null>(null);
  const lastFour = mobile.replace(/\D/g, "").slice(-4);

  async function send(channel: "sms" | "email") {
    if (busy) return;
    setBusy(true);
    setNote(null);
    setFieldError(null);
    try {
      const r = await api<Outcome>("/api/vendor/store-screen/receipt", { body: channel === "email" ? { number, channel, email } : { number, channel } });
      setNote({ text: r.message, good: r.sent });
      if (r.sent) setMode("done");
    } catch (err) {
      if (err instanceof ApiFailure) {
        if (err.fields.email) setFieldError(err.fields.email);
        else setNote({ text: err.message, good: false });
      } else setNote({ text: "Something went wrong. Please ask the staff for a printed bill.", good: false });
    } finally {
      setBusy(false);
    }
  }

  if (mode === "skipped") return <p className="text-base text-dim">No receipt sent.</p>;
  if (mode === "done") {
    return (
      <p role="status" className="flex max-w-xl items-center gap-2 text-lg font-semibold text-accent">
        <ReceiptText size={22} aria-hidden /> {note?.text}
      </p>
    );
  }

  return (
    <section aria-labelledby={`${uid}-h`} className="w-full max-w-xl rounded-3xl border border-tint/15 bg-carbon p-5 text-left short:p-4">
      <h2 id={`${uid}-h`} className="font-display text-xl font-extrabold text-chalk">Get your receipt</h2>
      <p className="mt-1 text-sm text-dim">Optional. We only send it if you choose SMS or Email.</p>

      {mode === "choose" ? (
        <div className="mt-4 grid gap-2 sm:grid-cols-3 short:mt-3">
          <button type="button" onClick={() => send("sms")} disabled={busy} className={`${ui.secondary} px-4 short:min-h-12`}>
            <MessageSquareText size={20} aria-hidden /> {busy ? "Sending…" : "SMS"}
          </button>
          <button type="button" onClick={() => { setMode("email"); setNote(null); }} disabled={busy} className={`${ui.secondary} px-4 short:min-h-12`}>
            <Mail size={20} aria-hidden /> Email
          </button>
          <button type="button" onClick={() => setMode("skipped")} disabled={busy} className={`${ui.secondary} px-4 short:min-h-12`}>
            Skip
          </button>
        </div>
      ) : (
        <form
          className="mt-4 space-y-2 short:mt-3"
          noValidate
          onSubmit={(e) => {
            e.preventDefault();
            void send("email");
          }}
        >
          <label className="block text-base font-semibold text-chalk" htmlFor={`${uid}-e`}>Your email address</label>
          <input id={`${uid}-e`} type="email" inputMode="email" autoComplete="off" value={email} onChange={(e) => setEmail(e.target.value)} maxLength={254} autoFocus
            className="h-14 w-full rounded-xl border border-tint/15 bg-void px-4 text-lg short:h-12 text-chalk outline-none focus:border-accent" aria-invalid={Boolean(fieldError)} />
          {fieldError && <p className="text-sm text-danger">{fieldError}</p>}
          <div className="grid gap-2 pt-1 sm:grid-cols-3">
            <button type="submit" disabled={busy || !email.includes("@")} className={`${ui.primary} px-4 sm:col-span-1 short:min-h-12`}>
              {busy ? "Sending…" : "Send"}
            </button>
            <button type="button" onClick={() => { setMode("choose"); setNote(null); setFieldError(null); }} disabled={busy} className={`${ui.secondary} px-4 short:min-h-12`}>
              Back
            </button>
            <button type="button" onClick={() => setMode("skipped")} disabled={busy} className={`${ui.secondary} px-4 short:min-h-12`}>
              Skip
            </button>
          </div>
        </form>
      )}
      {mode === "choose" && lastFour.length === 4 && <p className="mt-2 text-sm text-dim">SMS goes to your mobile ending {lastFour}.</p>}
      {note && <p role="alert" className={`mt-3 text-base ${note.good ? "text-accent" : "text-danger"}`}>{note.text}</p>}
    </section>
  );
}
