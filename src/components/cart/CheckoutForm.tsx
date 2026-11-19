"use client";

import { useEffect, useId, useRef, useState } from "react";
import { useLatest } from "@/lib/client/hooks";
import Link from "next/link";
import { api, ApiFailure } from "@/lib/vendor/client";
import { INDIAN_STATES } from "@/lib/vendor/validators";
import type { CartLine } from "@/lib/store/types";
import { Icon } from "@/components/ui/Icon";
import { useCart } from "./CartContext";
import { customerSchema } from "./orderSchema";
import { useAccount } from "@/components/account/AccountContext";
import { ADDRESS_MAX, type AddressView } from "@/lib/account/types";
import { rupees } from "@/lib/format";
import { openCheckout, type RazorpaySuccess } from "@/lib/payments/checkout";
import { UNPAID_HOLD_MINUTES, type OnlinePaymentStart } from "@/lib/payments/types";
import type { CustomerDetails } from "./orderSchema";
import { DetectLocation, type DetectedLocation } from "@/components/location/DetectLocation";
import type { LatLng } from "@/lib/tracking/geo";

/**
 * payment: "paid"       paid online and confirmed
 *          "confirming" Razorpay reported success but our confirmation didn't answer (the webhook will settle it)
 *          "refund_due" the money arrived after the order had expired; it will be refunded
 */
export type PlacedOrder = {
  number: string;
  total: number;
  payment: "paid" | "confirming" | "refund_due";
};

type PayPhase = "idle" | "creating" | "open" | "verifying" | "dismissed";
type PendingPayment = { key: string; number: string; total: number; payment: OnlinePaymentStart };
const DEV = process.env.NODE_ENV !== "production";

type Totals = { subtotal: number; installTotal: number; shipping: number; total: number; discount?: number; couponCode?: string };
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
 * Delivery details, then POST /api/orders. Online payment is the only way to order.
 *
 * The server prices the order and creates a Razorpay order; Razorpay Checkout
 * (loaded only now) takes the payment; /api/payments/razorpay/verify confirms it; then the cart
 * is cleared. A closed payment window keeps the order (and its stock) for UNPAID_HOLD_MINUTES so
 * "Try payment again" reuses it. Without Razorpay keys the pay button stays off and says why.
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
  /** Set once the shopper types an address, so saved addresses arriving late never overwrite it. */
  const typedAddress = useRef(false);
  /** GPS point from "Detect my location"; dropped when the city, state or pincode is changed by hand. */
  const [point, setPoint] = useState<LatLng | null>(null);

  function pick(a: AddressView | "new") {
    setPoint(null);
    if (a === "new") {
      setChosen("new");
      setValues((v) => ({ ...v, address: "", city: "", state: "", pincode: "" }));
      return;
    }
    setChosen(a.id);
    setValues((v) => ({ ...v, name: a.name, mobile: a.mobile, address: a.address, city: a.city, state: a.state, pincode: a.pincode }));
    setErrors({});
  }

  // Signed in: fill in the account's details once per account (never over what was typed)…
  const customerId = customer?.id ?? null;
  const [filledFor, setFilledFor] = useState<string | null>(null);
  if (customer && filledFor !== customer.id) {
    setFilledFor(customer.id);
    setValues((v) => ({
      ...v,
      name: v.name || customer.name || "",
      mobile: v.mobile || customer.mobile || "",
      email: v.email || customer.email || "",
    }));
  }

  // …and offer its saved addresses, picking the default unless the shopper already chose or typed one.
  const chosenRef = useLatest(chosen);
  useEffect(() => {
    if (!customerId) return;
    let alive = true;
    api<{ addresses: AddressView[] }>("/api/account/addresses")
      .then(({ addresses }) => {
        if (!alive || addresses.length === 0) return;
        setSaved(addresses);
        if (typedAddress.current || chosenRef.current !== "new") return;
        const a = addresses.find((x) => x.isDefault) ?? addresses[0];
        setPoint(null);
        setChosen(a.id);
        setValues((v) => ({ ...v, name: a.name, mobile: a.mobile, address: a.address, city: a.city, state: a.state, pincode: a.pincode }));
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, [customerId, chosenRef]);

  function detected(loc: DetectedLocation) {
    typedAddress.current = true;
    if (chosen !== "new") setChosen("new");
    setPoint({ lat: loc.lat, lng: loc.lng });
    const a = loc.address;
    if (!a) return;
    const state = (INDIAN_STATES as readonly string[]).find((s) => s.toLowerCase() === a.state.trim().toLowerCase()) ?? "";
    setValues((v) => ({
      ...v,
      address: [a.line, a.area].filter(Boolean).join(", ").slice(0, 240) || v.address,
      city: a.city || v.city,
      state: state || v.state,
      pincode: /^\d{6}$/.test(a.pincode) ? a.pincode : v.pincode,
    }));
  }

  /** After the order is placed: keep a new address in the account (best effort, never blocks the order). */
  function rememberAddress(c: { name: string; mobile: string; address: string; city: string; state: string; pincode: string }) {
    if (!customer || chosen !== "new" || !saveNew || saved.length >= ADDRESS_MAX) return;
    const label = saved.length === 0 ? "Home" : `Address ${saved.length + 1}`;
    api("/api/account/addresses", { body: { label, ...c, isDefault: saved.length === 0 } }).catch(() => {});
  }
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);

  /* ---- payment ---- */
  const [onlineEnabled, setOnlineEnabled] = useState<boolean | null>(null);
  const [phase, setPhase] = useState<PayPhase>("idle");
  const [pending, setPending] = useState<PendingPayment | null>(null);
  const [payError, setPayError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    api<{ enabled: boolean }>("/api/payments/razorpay/config")
      .then(({ enabled }) => {
        if (!alive) return;
        setOnlineEnabled(enabled);
      })
      .catch(() => alive && setOnlineEnabled(false));
    return () => {
      alive = false;
    };
  }, []);

  async function payOnline(details: CustomerDetails) {
    const cartLines = lines.map((l) => ({ id: l.id, qty: l.qty, install: Boolean(l.install) }));
    const key = JSON.stringify({ details, cartLines });
    setPayError(null);
    let p = pending && pending.key === key ? pending : null;
    if (!p) {
      setPhase("creating");
      try {
        const res = await api<{ order: { number: string; total: number }; payment: OnlinePaymentStart }>("/api/orders", {
          body: { customer: values, lines: cartLines, paymentMethod: "online", deliveryPoint: point ?? undefined, couponCode: totals.couponCode },
        });
        p = { key, number: res.order.number, total: res.order.total, payment: res.payment };
        setPending(p);
      } catch (err) {
        setPhase("idle");
        if (err instanceof ApiFailure && err.code === "payments_unavailable") {
          setOnlineEnabled(false);
          setFormError(err.message);
        } else if (err instanceof ApiFailure && err.status !== 503) {
          const next: Record<string, string> = {};
          for (const [k, v] of Object.entries(err.fields)) next[k.replace(/^customer\./, "")] = v;
          setErrors(next);
          setFormError(err.message);
        } else {
          setFormError("We couldn't start the payment just now. Please try again in a few minutes.");
        }
        return;
      }
    }

    const current = p;
    setPhase("open");
    try {
      await openCheckout({
        ...current.payment,
        orderNumber: current.number,
        prefill: { name: details.name, email: details.email, mobile: details.mobile },
        onSuccess: (res) => void confirmPayment(current, res, details),
        onFailure: (message) => setPayError(`${message} You can try again in the payment window.`),
        onDismiss: () => setPhase("dismissed"),
      });
    } catch {
      setPhase("dismissed");
      setPayError("The payment window couldn't load. Check your connection and try again.");
    }
  }

  async function confirmPayment(p: PendingPayment, res: RazorpaySuccess, details: CustomerDetails) {
    setPhase("verifying");
    setPayError(null);
    let outcome: PlacedOrder["payment"] = "paid";
    let total = p.total;
    try {
      const v = await api<{ order: { number: string; total: number; paidAfterCancel: boolean } }>("/api/payments/razorpay/verify", { body: res });
      total = v.order.total;
      if (v.order.paidAfterCancel) outcome = "refund_due";
    } catch (err) {
      // The money moved on Razorpay's side; a bad signature is the only answer that means it didn't count.
      if (err instanceof ApiFailure && (err.code === "bad_signature" || err.code === "payment_mismatch")) {
        setPhase("dismissed");
        setPayError(err.message);
        return;
      }
      outcome = "confirming";
    }
    clear();
    rememberAddress(details);
    setPending(null);
    setPhase("idle");
    onPlaced({ number: p.number, total, payment: outcome });
  }

  const ADDRESS_FIELDS: (keyof Values)[] = ["address", "city", "state", "pincode"];
  const set = (k: keyof Values) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    if (ADDRESS_FIELDS.includes(k)) {
      typedAddress.current = true;
      // Editing a picked saved address makes it a new one (offered for saving), not a silent edit.
      if (chosen !== "new") setChosen("new");
      if (k !== "address") setPoint(null);
    }
    setValues((v) => ({ ...v, [k]: e.target.value }));
  };

  const payBusy = phase === "creating" || phase === "open" || phase === "verifying";

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (payBusy) return;
    setFormError(null);

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
    await payOnline(parsed.data);
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
      <div className="flex flex-wrap items-center justify-between gap-2">
        <DetectLocation onDetect={detected} disabled={payBusy} />
        {point && <span className="text-xs text-ash">Location added for live rider tracking</span>}
      </div>
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

      <div className="pt-1">
        <p className="label">Payment</p>
        <div className={`rounded-sm border p-3 text-xs ${onlineEnabled === false ? "border-tint/10" : "border-accent"}`}>
          <span className="flex items-center gap-1.5 font-semibold text-chalk">
            <Icon name="shield" size={14} />
            Pay online now
          </span>
          <span className="mt-0.5 block text-ash">
            {onlineEnabled === null
              ? "Checking…"
              : onlineEnabled
                ? "UPI, cards, netbanking and wallets, secured by Razorpay."
                : DEV
                  ? "Online payment not configured (set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET)."
                  : "Online payment isn't available right now. Please try again in a few minutes."}
          </span>
        </div>
      </div>

      {formError && (
        <p role="alert" className="text-xs text-danger">
          {formError}
        </p>
      )}
      {pending && phase === "dismissed" && (
        <div role="status" className="card border-gold/30 p-3 text-xs leading-relaxed text-chalk">
          Payment not completed. Order <span className="font-semibold tnum">{pending.number}</span> is held for {UNPAID_HOLD_MINUTES} minutes:
          pay below to finish it. Nothing has been charged unless Razorpay told you so.
        </div>
      )}
      {payError && (
        <p role="alert" className="text-xs text-danger">
          {payError}
        </p>
      )}
      {phase === "verifying" && (
        <p role="status" className="text-xs text-ash">
          Payment received by Razorpay. Confirming your order…
        </p>
      )}
      <button type="submit" disabled={payBusy || onlineEnabled !== true} aria-busy={payBusy} className="btn btn-primary btn-block">
        <Icon name="shield" size={16} />
        {phase === "creating"
          ? "Starting secure payment…"
          : phase === "open"
            ? "Waiting for payment…"
            : phase === "verifying"
              ? "Confirming payment…"
              : pending && phase === "dismissed"
                ? `Try payment again · ${rupees(pending.total)}`
                : `Pay ${rupees(pending?.total ?? totals.total)} securely`}
      </button>
    </form>
  );
}
