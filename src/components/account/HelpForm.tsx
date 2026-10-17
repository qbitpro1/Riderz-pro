"use client";

import { useEffect, useId, useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ApiFailure, api } from "@/lib/vendor/client";
import { TICKET_TOPICS, ticketSchema } from "@/lib/account/schemas";
import { Notice, SelectField, TextAreaField, TextField, validate, type FieldErrors } from "@/components/vendor/auth/fields";
import { useAccount } from "./AccountContext";

type Values = { name: string; mobile: string; email: string; orderNumber: string; topic: string; body: string };

/**
 * "Send us a message" — a help-desk ticket. Guests give a name and mobile; a signed-in customer's
 * details are filled in and the ticket (and our reply) shows on /account/help.
 */
export function HelpForm({ orderNumber = "", compact = false }: { orderNumber?: string; compact?: boolean }) {
  const uid = useId();
  const router = useRouter();
  const { customer } = useAccount();
  const [v, setV] = useState<Values>({ name: "", mobile: "", email: "", orderNumber, topic: orderNumber ? "order" : "", body: "" });
  const [errors, setErrors] = useState<FieldErrors>({});
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);

  // Fill in the signed-in customer's details once they are known (never overwrite what was typed).
  useEffect(() => {
    if (!customer) return;
    setV((x) => ({
      ...x,
      name: x.name || customer.name || "",
      mobile: x.mobile || customer.mobile || "",
      email: x.email || customer.email || "",
    }));
  }, [customer]);

  const set = (k: keyof Values) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setV((x) => ({ ...x, [k]: e.target.value }));

  async function submit(e: FormEvent) {
    e.preventDefault();
    const r = validate(ticketSchema, v);
    if (!r.ok) {
      setErrors(r.fields);
      return;
    }
    setBusy(true);
    setErrors({});
    setError(null);
    try {
      await api("/api/support/tickets", { body: v });
      setSent(true);
      setV((x) => ({ ...x, orderNumber: "", topic: "", body: "" }));
      if (customer) router.refresh();
    } catch (err) {
      setError(err instanceof ApiFailure ? err.message : "Something went wrong. Please try again.");
      if (err instanceof ApiFailure) setErrors(err.fields);
    } finally {
      setBusy(false);
    }
  }

  const id = (k: string) => `${uid}-${k}`;
  return (
    <form onSubmit={submit} noValidate className={`card space-y-3 ${compact ? "p-4" : "p-5 md:p-6"}`} aria-label="Send us a message">
      <div>
        <p className="font-display text-lg font-extrabold uppercase tracking-tight text-chalk">Send us a message</p>
        <p className="mt-1 text-sm text-ash">We reply within one working day, on WhatsApp or by phone{customer ? ", and here in your account" : ""}.</p>
      </div>
      {sent && (
        <Notice tone="success">
          Thanks, we have your message.{" "}
          {customer ? "Our reply will show under Help in your account." : <>Sign in to <Link href="/account/sign-in?next=/account/help" className="underline">see our reply in your account</Link>.</>}
        </Notice>
      )}
      {error && <Notice tone="error">{error}</Notice>}
      <div className="grid gap-3 sm:grid-cols-2">
        <TextField id={id("name")} label="Name" value={v.name} onChange={set("name")} maxLength={80} autoComplete="name" error={errors.name} />
        <TextField id={id("mobile")} label="Mobile" type="tel" inputMode="tel" value={v.mobile} onChange={set("mobile")} maxLength={16} autoComplete="tel-national" error={errors.mobile} />
        <TextField id={id("email")} label="Email" optional type="email" value={v.email} onChange={set("email")} maxLength={254} autoComplete="email" error={errors.email} />
        <TextField id={id("order")} label="Order number" optional value={v.orderNumber} onChange={set("orderNumber")} maxLength={10} placeholder="RZP-ABC234" error={errors.orderNumber} />
      </div>
      <SelectField id={id("topic")} label="What is it about?" value={v.topic} onChange={set("topic")} error={errors.topic}>
        <option value="">Choose one</option>
        {TICKET_TOPICS.map((t) => (
          <option key={t.value} value={t.value}>
            {t.label}
          </option>
        ))}
      </SelectField>
      <TextAreaField id={id("body")} label="Message" value={v.body} onChange={set("body")} maxLength={2000} error={errors.body} placeholder="Tell us what you need. For fitment questions, include your car's model and year." />
      <button type="submit" className="btn btn-primary" disabled={busy}>
        {busy ? "Sending…" : "Send message"}
      </button>
    </form>
  );
}
