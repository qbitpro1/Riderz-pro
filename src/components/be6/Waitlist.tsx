"use client";

import { useState } from "react";
import { Icon } from "@/components/ui/Icon";
import { whatsapp } from "@/lib/data/site";
import { WAITLIST_BUDGETS } from "@/lib/data/be6/limited-edition";

/**
 * BE FIRST — the Limited Edition waitlist.
 *
 * There is no leads endpoint on this site yet, so the form does not pretend to
 * post to one. It composes the enquiry and hands it to WhatsApp, which is
 * where Motorbotz enquiries actually land today. When a leads API exists this
 * component gets a submit handler and nothing else changes.
 */

export function Waitlist() {
  const [sent, setSent] = useState(false);
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

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!ready) return;
    const lines = [
      "MOTORBOTZ BE 6 WAITLIST",
      `Name: ${form.name}`,
      `Phone: ${form.phone}`,
      form.email && `Email: ${form.email}`,
      form.city && `City: ${form.city}`,
      form.currentCar && `Current car: ${form.currentCar}`,
      form.buyingBe6 && `Interested in buying a BE 6: ${form.buyingBe6}`,
      form.wantsEdition && `Interested in the MOTORBOTZ Edition: ${form.wantsEdition}`,
      form.budget && `Budget: ${form.budget}`,
    ].filter(Boolean);
    window.open(whatsapp(lines.join("\n")), "_blank", "noopener,noreferrer");
    setSent(true);
  }

  if (sent) {
    return (
      <div className="card p-6 text-center">
        <Icon name="check" size={28} className="mx-auto text-accent" />
        <h3 className="display-3 mt-3">YOU&apos;RE ON THE LIST.</h3>
        <p className="mx-auto mt-2 max-w-md text-sm text-ash">
          Your details opened in WhatsApp — send the message and we have you. We will come back when the Limited
          Edition has a date, and not before.
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
        <Field label="Interested in the MOTORBOTZ Edition?">
          <select className="field" value={form.wantsEdition} onChange={set("wantsEdition")}>
            <option value="">Select</option>
            <option>Yes — keep me first in line</option>
            <option>Yes, depending on price</option>
            <option>Only certain parts of it</option>
            <option>Just following along</option>
          </select>
        </Field>
      </div>

      <button type="submit" disabled={!ready} className="btn btn-accent btn-block mt-5 disabled:opacity-40">
        JOIN THE MOTORBOTZ BE 6 WAITLIST
      </button>

      <p className="mt-3 text-[0.625rem] leading-relaxed text-dim">
        Joining the waitlist is not an order and holds no vehicle. The MOTORBOTZ Limited Edition is a concept with no
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
