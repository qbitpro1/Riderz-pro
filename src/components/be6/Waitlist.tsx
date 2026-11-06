"use client";

import { useState } from "react";
import { Icon } from "@/components/ui/Icon";
import { EnquiryStatus, useEnquiry } from "@/components/enquiry/Enquiry";
import { WAITLIST_BUDGETS } from "@/lib/data/be6/limited-edition";

/**
 * BE FIRST — the Limited Edition waitlist.
 *
 * The entry is sent as a help-desk ticket (components/enquiry), which the team
 * sees in admin → Customer support.
 */

export function Waitlist() {
  const [sent, setSent] = useState(false);
  const enquiry = useEnquiry();
  const [form, setForm] = useState({
    name: "",
    phone: "",
    email: "",
    city: "",
    currentCar: "",
    buyingBe6: "",
    wantsEdition: "",
    budget: "",
  });

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  const ready = form.name.trim().length > 1 && form.phone.trim().length >= 10;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!ready || enquiry.sending) return;
    const lines = [
      "RIDERZPRO BE 6 WAITLIST",
      `Name: ${form.name}`,
      `Phone: ${form.phone}`,
      form.email && `Email: ${form.email}`,
      form.city && `City: ${form.city}`,
      form.currentCar && `Current car: ${form.currentCar}`,
      form.buyingBe6 && `Interested in buying a BE 6: ${form.buyingBe6}`,
      form.wantsEdition && `Interested in the RIDERZPRO Edition: ${form.wantsEdition}`,
      form.budget && `Budget: ${form.budget}`,
    ].filter(Boolean);
    const ok = await enquiry.send({ name: form.name, mobile: form.phone, email: form.email, topic: "other", message: lines.join("\n") });
    if (ok) setSent(true);
  }

  if (sent) {
    return (
      <div className="card p-6 text-center">
        <Icon name="check" size={28} className="mx-auto text-accent" />
        <h3 className="display-3 mt-3">YOU&apos;RE ON THE LIST.</h3>
        <p className="mx-auto mt-2 max-w-md text-sm text-ash">
          We have your details. We will come back when the Limited Edition has a date, and not before.
        </p>
        <button type="button" onClick={() => setSent(false)} className="btn btn-outline btn-sm mt-4">
          ADD ANOTHER
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="card p-4 md:p-6">
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Name" required>
          <input className="field" value={form.name} onChange={set("name")} required autoComplete="name" />
        </Field>
        <Field label="Phone" required>
          <input
            className="field"
            type="tel"
            inputMode="tel"
            value={form.phone}
            onChange={set("phone")}
            required
            autoComplete="tel"
          />
        </Field>
        <Field label="Email">
          <input className="field" type="email" value={form.email} onChange={set("email")} autoComplete="email" />
        </Field>
        <Field label="City">
          <input className="field" value={form.city} onChange={set("city")} autoComplete="address-level2" />
        </Field>
        <Field label="Current car">
          <input className="field" value={form.currentCar} onChange={set("currentCar")} />
        </Field>
        <Field label="Preferred budget">
          <select className="field" value={form.budget} onChange={set("budget")}>
            <option value="">Select</option>
            {WAITLIST_BUDGETS.map((b) => (
              <option key={b} value={b}>
                {b}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Buying a BE 6?">
          <select className="field" value={form.buyingBe6} onChange={set("buyingBe6")}>
            <option value="">Select</option>
            <option>Yes, actively looking</option>
            <option>Yes, in the next year</option>
            <option>Already own one</option>
            <option>Just interested</option>
          </select>
        </Field>
        <Field label="Interested in the RIDERZPRO Edition?">
          <select className="field" value={form.wantsEdition} onChange={set("wantsEdition")}>
            <option value="">Select</option>
            <option>Yes — keep me first in line</option>
            <option>Yes, depending on price</option>
            <option>Only certain parts of it</option>
            <option>Just following along</option>
          </select>
        </Field>
      </div>

      <button type="submit" disabled={!ready || enquiry.sending} aria-busy={enquiry.sending} className="btn btn-accent btn-block mt-5 disabled:opacity-40">
        JOIN THE RIDERZPRO BE 6 WAITLIST
      </button>
      <EnquiryStatus status={enquiry.status} error={enquiry.error} />

      <p className="mt-3 text-[0.625rem] leading-relaxed text-dim">
        Joining the waitlist is not an order and holds no vehicle. The RIDERZPRO Limited Edition is a concept with no
        confirmed launch date, no confirmed price and no confirmed production quantity. We will only contact you about
        the BE 6 programme.
      </p>
    </form>
  );
}

function Field({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="label">
        {label}
        {required && <span className="ml-1 text-accent">*</span>}
      </span>
      {children}
    </label>
  );
}
