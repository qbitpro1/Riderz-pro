"use client";

import { useEffect, useId, useState } from "react";
import Link from "next/link";
import { api, ApiFailure } from "@/lib/vendor/client";
import { INDIAN_STATES } from "@/lib/vendor/validators";
import { whatsapp } from "@/lib/data/site";
import type { CartLine } from "@/lib/store/types";
import { Icon } from "@/components/ui/Icon";
import { useCart } from "./CartContext";
import { orderMessage } from "./cartMessage";
import { customerSchema } from "./orderSchema";
import { useAccount } from "@/components/account/AccountContext";
import { ADDRESS_MAX, type AddressView } from "@/lib/account/types";

export type PlacedOrder = { number: string; total: number; whatsappHref: string };

type Totals = { subtotal: number; installTotal: number; shipping: number; total: number };
type Values = {
  name: string;
  mobile: string;
  email: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  notes: string;
};
const EMPTY: Values = { name: "", mobile: "", email: "", address: "", city: "", state: "", pincode: "", notes: "" };

/**
 * Delivery details, then POST /api/orders. On success WhatsApp opens with the
 * order number and the cart is cleared. If the order service is down (503) or
 * unreachable, it falls back to the WhatsApp-only order so the store keeps
 * taking orders; the cart is kept in that case.
 */
export function CheckoutForm({
  lines,
  totals,
  onPlaced,
}: {
  lines: CartLine[];
  totals: Totals;
  onPlaced: (order: PlacedOrder) => void;
}) {
  const { clear } = useCart();
  const { customer } = useAccount();
  const uid = useId();
  const [values, setValues] = useState<Values>(EMPTY);
  const [saved, setSaved] = useState<AddressView[]>([]);
  const [chosen, setChosen] = useState<string | "new">("new");
  const [saveNew, setSaveNew] = useState(true);

  // Signed in: fill in the account's details and offer its saved addresses (default first).
  useEffect(() => {
    if (!customer) return;
    setValues((v) => ({
      ...v,
      name: v.name || customer.name || "",
      mobile: v.mobile || customer.mobile || "",
      email: v.email || customer.email || "",
    }));
    let alive = true;
    api<{ addresses: AddressView[] }>("/api/account/addresses")
      .then(({ addresses }) => {
        if (!alive || addresses.length === 0) return;
        setSaved(addresses);
        const a = addresses.find((x) => x.isDefault) ?? addresses[0];
        pick(a);
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
    // `pick` only sets state.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [customer]);

  function pick(a: AddressView | "new") {
    if (a === "new") {
      setChosen("new");
      setValues((v) => ({ ...v, address: "", city: "", state: "", pincode: "" }));
      return;
    }
    setChosen(a.id);
    setValues((v) => ({ ...v, name: a.name, mobile: a.mobile, address: a.address, city: a.city, state: a.state, pincode: a.pincode }));
    setErrors({});
  }

  /** After the order is placed: keep a new address in the account (best effort, never blocks the order). */
  function rememberAddress(c: { name: string; mobile: string; address: string; city: string; state: string; pincode: string }) {
    if (!customer || chosen !== "new" || !saveNew || saved.length >= ADDRESS_MAX) return;
    const label = saved.length === 0 ? "Home" : `Address ${saved.length + 1}`;
    api("/api/account/addresses", { body: { label, ...c, isDefault: saved.length === 0 } }).catch(() => {});
  }
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [fallbackHref, setFallbackHref] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const set = (k: keyof Values) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setValues((v) => ({ ...v, [k]: e.target.value }));

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (busy) return;
    setFormError(null);
    setFallbackHref(null);

    const parsed = customerSchema.safeParse(values);
    if (!parsed.success) {
      const next: Record<string, string> = {};
      for (const issue of parsed.error.issues) next[String(issue.path[0])] ??= issue.message;
      setErrors(next);
      setFormError("Please fix the highlighted details.");
      const first = Object.keys(next)[0];
      if (first) document.getElementById(`${uid}-${first}`)?.focus();
      return;
    }
    setErrors({});
    const details = parsed.data;

    setBusy(true);
    try {
      const res = await api<{ order: { number: string; total: number } }>("/api/orders", {
        body: {
          customer: values,
          lines: lines.map((l) => ({ id: l.id, qty: l.qty, install: Boolean(l.install) })),
        },
      });
      const href = whatsapp(orderMessage(lines, { ...totals, total: res.order.total }, { orderNumber: res.order.number, customer: details }));
      clear();
      rememberAddress(details);
      window.open(href, "_blank", "noopener,noreferrer");
      onPlaced({ number: res.order.number, total: res.order.total, whatsappHref: href });
    } catch (err) {
      if (err instanceof ApiFailure && err.status !== 503) {
        const next: Record<string, string> = {};
        for (const [k, v] of Object.entries(err.fields)) next[k.replace(/^customer\./, "")] = v;
        setErrors(next);
        setFormError(err.message);
      } else {
        // Order service unavailable or unreachable: take the order the old way.
        const href = whatsapp(orderMessage(lines, totals, { customer: details }));
        setFallbackHref(href);
        window.open(href, "_blank", "noopener,noreferrer");
      }
    } finally {
      setBusy(false);
    }
  }

  const field = (k: keyof Values, label: string, props: React.InputHTMLAttributes<HTMLInputElement> = {}) => (
    <div>
      <label className="label" htmlFor={`${uid}-${k}`}>
        {label}
      </label>
      <input
        id={`${uid}-${k}`}
        className="field"
        value={values[k]}
        onChange={set(k)}
        aria-invalid={Boolean(errors[k])}
        aria-describedby={errors[k] ? `${uid}-${k}-err` : undefined}
        {...props}
      />
      {errors[k] && (
        <p id={`${uid}-${k}-err`} className="mt-1 text-xs text-danger">
          {errors[k]}
        </p>
      )}
    </div>
  );

  return (
    <form onSubmit={submit} noValidate className="space-y-3" aria-label="Delivery details">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <p className="eyebrow">Delivery details</p>
        {!customer && (
          <Link href="/account/sign-in?next=/cart" className="text-xs font-semibold text-accent underline underline-offset-4">
            Sign in for saved addresses
          </Link>
        )}
      </div>
      {saved.length > 0 && (
        <fieldset className="space-y-2">
          <legend className="label">Deliver to</legend>
          {saved.map((a) => (
            <label key={a.id} className={`flex cursor-pointer items-start gap-3 rounded-sm border p-3 text-xs ${chosen === a.id ? "border-accent" : "border-tint/15"}`}>
              <input type="radio" name={`${uid}-addr`} checked={chosen === a.id} onChange={() => pick(a)} className="mt-0.5 accent-[var(--accent)]" />
              <span className="min-w-0 text-ash">
                <span className="font-semibold text-chalk">{a.label}</span> · {a.name}
                <br />
                {a.address}, {a.city}, {a.state} {a.pincode}
              </span>
            </label>
          ))}
          <label className={`flex cursor-pointer items-center gap-3 rounded-sm border p-3 text-xs ${chosen === "new" ? "border-accent" : "border-tint/15"}`}>
            <input type="radio" name={`${uid}-addr`} checked={chosen === "new"} onChange={() => pick("new")} className="accent-[var(--accent)]" />
            <span className="font-semibold text-chalk">A different address</span>
          </label>
        </fieldset>
      )}
      {field("name", "Full name", { autoComplete: "name", maxLength: 80 })}
      {field("mobile", "Mobile", { type: "tel", inputMode: "tel", autoComplete: "tel-national", maxLength: 16, placeholder: "10-digit number" })}
      {field("email", "Email (optional)", { type: "email", autoComplete: "email", maxLength: 254 })}
      {field("address", "Address", { autoComplete: "street-address", maxLength: 240, placeholder: "House, street, area" })}
      <div className="grid grid-cols-2 gap-3">
        {field("city", "City", { autoComplete: "address-level2", maxLength: 60 })}
        {field("pincode", "Pincode", { inputMode: "numeric", autoComplete: "postal-code", maxLength: 6 })}
      </div>
      <div>
        <label className="label" htmlFor={`${uid}-state`}>
          State
        </label>
        <select
          id={`${uid}-state`}
          className="field"
          value={values.state}
          onChange={set("state")}
          autoComplete="address-level1"
          aria-invalid={Boolean(errors.state)}
          aria-describedby={errors.state ? `${uid}-state-err` : undefined}
        >
          <option value="">Select state</option>
          {INDIAN_STATES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
        {errors.state && (
          <p id={`${uid}-state-err`} className="mt-1 text-xs text-danger">
            {errors.state}
          </p>
        )}
      </div>
      <div>
        <label className="label" htmlFor={`${uid}-notes`}>
          Notes (optional)
        </label>
        <textarea
          id={`${uid}-notes`}
          className="field py-3"
          rows={2}
          maxLength={300}
          value={values.notes}
          onChange={set("notes")}
          placeholder="Your car model, fitment questions…"
        />
        {errors.notes && <p className="mt-1 text-xs text-danger">{errors.notes}</p>}
      </div>

      {customer && chosen === "new" && saved.length < ADDRESS_MAX && (
        <label className="flex items-center gap-2 text-xs text-ash">
          <input type="checkbox" checked={saveNew} onChange={(e) => setSaveNew(e.target.checked)} className="h-4 w-4 accent-[var(--accent)]" />
          Save this address to my account
        </label>
      )}

      {formError && (
        <p role="alert" className="text-xs text-danger">
          {formError}
        </p>
      )}
      {fallbackHref && (
        <div role="status" className="card border-gold/30 p-3 text-xs leading-relaxed text-chalk">
          We couldn&apos;t save your order online just now, so we opened WhatsApp instead. Send the message there and we&apos;ll confirm
          it. Nothing opened?{" "}
          <a href={fallbackHref} target="_blank" rel="noreferrer noopener" className="underline hover:text-accent">
            Open WhatsApp
          </a>
          .
        </div>
      )}

      <button type="submit" disabled={busy} aria-busy={busy} className="btn btn-whatsapp btn-block">
        <Icon name="whatsapp" size={16} />
        {busy ? "Placing your order…" : "Place order & confirm on WhatsApp"}
      </button>
    </form>
  );
}
