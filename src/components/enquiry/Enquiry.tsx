"use client";

import { useId, useRef, useState, type FormEvent, type ReactNode } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { useHydrated } from "@/lib/client/hooks";
import { ApiFailure, api } from "@/lib/vendor/client";
import { ticketSchema, type TicketTopic } from "@/lib/account/schemas";
import { Notice, TextAreaField, TextField, validate, type FieldErrors } from "@/components/vendor/auth/fields";
import { useAccount } from "@/components/account/AccountContext";

/**
 * ENQUIRIES
 *
 * Every "talk to us about this" action on the shopper site sends a help-desk ticket (the same one the
 * Contact page form sends, POST /api/support/tickets). The team answers it in admin → Customer
 * support, and a signed-in customer sees the reply under Help in their account.
 *
 *   <EnquiryButton>   a button that opens a short form (name, mobile, email, the message prefilled)
 *   sendEnquiry()     for forms that already ask for a name and mobile themselves
 */

export type EnquiryInput = {
  name: string;
  mobile: string;
  email?: string;
  topic?: TicketTopic;
  message: string;
};

/** The ticket API takes 10 to 2,000 characters. */
const fitBody = (message: string) => {
  const m = message.trim();
  return (m.length < 10 ? `${m} (enquiry from the website)` : m).slice(0, 2000);
};

/** Sends an enquiry as a help-desk ticket. Throws ApiFailure (with field errors) when it is refused. */
export async function sendEnquiry(input: EnquiryInput): Promise<void> {
  await api("/api/support/tickets", {
    body: {
      name: input.name.trim(),
      mobile: input.mobile.trim(),
      email: input.email?.trim() || undefined,
      topic: input.topic ?? "other",
      body: fitBody(input.message),
    },
  });
}

/** A readable error for a failed enquiry. */
export const enquiryError = (err: unknown) =>
  err instanceof ApiFailure ? err.message : "We couldn't send that just now. Please try again, or call us.";

/**
 * For forms that collect the name and mobile themselves: `send` posts the enquiry, `status` says how
 * it went, and `error` holds a readable message when it failed.
 */
export function useEnquiry() {
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [error, setError] = useState<string | null>(null);
  async function send(input: EnquiryInput): Promise<boolean> {
    setStatus("sending");
    setError(null);
    try {
      await sendEnquiry(input);
      setStatus("sent");
      return true;
    } catch (err) {
      setError(enquiryError(err));
      setStatus("error");
      return false;
    }
  }
  return { status, error, send, sending: status === "sending", sent: status === "sent", reset: () => setStatus("idle") };
}

/** The confirmation and error lines under a form that uses `useEnquiry`. */
export function EnquiryStatus({ status, error }: { status: string; error: string | null }) {
  if (status === "sent")
    return (
      <p role="status" className="mt-3 text-xs text-accent">
        Thanks, we have it. We&apos;ll call you within one working day.
      </p>
    );
  if (status === "error" && error)
    return (
      <p role="alert" className="mt-3 text-xs text-danger">
        {error}
      </p>
    );
  return null;
}

type Values = { name: string; mobile: string; email: string; body: string };

export function EnquiryButton({
  message,
  topic = "other",
  title = "Send us a message",
  className = "btn btn-outline btn-sm",
  id,
  tabIndex,
  children,
}: {
  /** Prefilled into the message box; the customer can edit it. */
  message: string;
  topic?: TicketTopic;
  title?: string;
  className?: string;
  /** Lets a link elsewhere on the page (#id) jump to this button. */
  id?: string;
  tabIndex?: number;
  children: ReactNode;
}) {
  const uid = useId();
  const dialog = useRef<HTMLDialogElement>(null);
  const { customer } = useAccount();
  const [v, setV] = useState<Values>({ name: "", mobile: "", email: "", body: message });
  const [errors, setErrors] = useState<FieldErrors>({});
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);

  // The dialog is rendered at the end of <body> (a portal), so it is valid wherever the button
  // sits — inside a paragraph, a sticky bar or a list — and no parent transform clips it.
  const mounted = useHydrated();

  function open() {
    // Start from the current context's message and the signed-in customer's details (never
    // overwriting what was typed in an earlier, unsent attempt).
    setV((x) => ({
      name: x.name || customer?.name || "",
      mobile: x.mobile || customer?.mobile || "",
      email: x.email || customer?.email || "",
      body: message,
    }));
    setErrors({});
    setError(null);
    setSent(false);
    dialog.current?.showModal();
  }

  async function submit(e: FormEvent) {
    e.preventDefault();
    const body = fitBody(v.body);
    const r = validate(ticketSchema, { name: v.name, mobile: v.mobile, email: v.email, topic, body });
    if (!r.ok) {
      setErrors(r.fields);
      return;
    }
    setBusy(true);
    setErrors({});
    setError(null);
    try {
      await sendEnquiry({ name: v.name, mobile: v.mobile, email: v.email, topic, message: body });
      setSent(true);
    } catch (err) {
      setError(enquiryError(err));
      if (err instanceof ApiFailure) setErrors(err.fields);
    } finally {
      setBusy(false);
    }
  }

  const set = (k: keyof Values) => (e: { target: { value: string } }) => setV((x) => ({ ...x, [k]: e.target.value }));
  const fid = (k: string) => `${uid}-${k}`;

  return (
    <>
      <button type="button" id={id} tabIndex={tabIndex} className={`${className} scroll-mt-28`} onClick={open}>
        {children}
      </button>
      {mounted &&
        createPortal(
          <dialog
            ref={dialog}
            onClose={() => setSent(false)}
            aria-labelledby={fid("title")}
            className="m-auto w-[min(32rem,calc(100vw-2rem))] max-h-[calc(100svh-2rem)] overflow-y-auto border border-tint/12 bg-carbon p-0 text-chalk backdrop:bg-black/60 backdrop:backdrop-blur-sm"
            onClick={(e) => {
              // A click on the backdrop (the dialog element itself) closes it.
              if (e.target === e.currentTarget) dialog.current?.close();
            }}
          >
            <div className="p-5 md:p-6">
              <div className="flex items-start justify-between gap-4">
                <p id={fid("title")} className="font-display text-lg font-extrabold uppercase tracking-tight">
                  {title}
                </p>
                <button
                  type="button"
                  className="-mr-2 -mt-1 inline-flex min-h-[44px] min-w-[44px] items-center justify-center text-ash hover:text-accent"
                  aria-label="Close"
                  onClick={() => dialog.current?.close()}
                >
                  ✕
                </button>
              </div>

              {sent ? (
                <div className="mt-3 space-y-4">
                  <Notice tone="success">
                    Thanks, we have your message and reply within one working day by phone
                    {customer ? ", and under Help in your account" : ""}.
                  </Notice>
                  {!customer && (
                    <p className="text-sm text-ash">
                      <Link href="/account/sign-in?next=/account/help" className="text-accent underline underline-offset-4">
                        Sign in
                      </Link>{" "}
                      to see our reply in your account.
                    </p>
                  )}
                  <button type="button" className="btn btn-primary btn-sm" onClick={() => dialog.current?.close()}>
                    Done
                  </button>
                </div>
              ) : (
                <form onSubmit={submit} noValidate className="mt-3 space-y-3">
                  <p className="text-sm text-ash">We reply within one working day by phone.</p>
                  {error && <Notice tone="error">{error}</Notice>}
                  <div className="grid gap-3 sm:grid-cols-2">
                    <TextField id={fid("name")} label="Name" value={v.name} onChange={set("name")} maxLength={80} autoComplete="name" error={errors.name} />
                    <TextField id={fid("mobile")} label="Mobile" type="tel" inputMode="tel" value={v.mobile} onChange={set("mobile")} maxLength={16} autoComplete="tel-national" error={errors.mobile} />
                  </div>
                  <TextField id={fid("email")} label="Email" optional type="email" value={v.email} onChange={set("email")} maxLength={254} autoComplete="email" error={errors.email} />
                  <TextAreaField id={fid("body")} label="Message" value={v.body} onChange={set("body")} maxLength={2000} rows={5} error={errors.body} />
                  <button type="submit" className="btn btn-primary btn-block" disabled={busy} aria-busy={busy}>
                    {busy ? "Sending…" : "Send message"}
                  </button>
                </form>
              )}
            </div>
          </dialog>,
          document.body,
        )}
    </>
  );
}
