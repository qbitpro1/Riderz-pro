/**
 * Browser side of Razorpay Checkout. The script is loaded only when the shopper actually pays.
 * Nothing secret here: the key id is public and the amount comes from the server.
 */

const SCRIPT_SRC = "https://checkout.razorpay.com/v1/checkout.js";

export type RazorpaySuccess = { razorpay_order_id: string; razorpay_payment_id: string; razorpay_signature: string };
export type RazorpayFailure = { error?: { code?: string; description?: string; reason?: string } };

type RazorpayOptions = {
  key: string;
  order_id: string;
  amount: number;
  currency: string;
  name: string;
  description: string;
  prefill?: { name?: string; email?: string; contact?: string };
  notes?: Record<string, string>;
  theme?: { color?: string };
  timeout?: number;
  retry?: { enabled: boolean };
  modal?: { ondismiss?: () => void; escape?: boolean; confirm_close?: boolean };
  handler: (res: RazorpaySuccess) => void;
};

type RazorpayInstance = { open: () => void; on: (event: "payment.failed", cb: (res: RazorpayFailure) => void) => void };
type RazorpayConstructor = new (options: RazorpayOptions) => RazorpayInstance;

declare global {
  interface Window {
    Razorpay?: RazorpayConstructor;
  }
}

let loading: Promise<RazorpayConstructor> | null = null;

export function loadRazorpay(): Promise<RazorpayConstructor> {
  if (typeof window === "undefined") return Promise.reject(new Error("no window"));
  if (window.Razorpay) return Promise.resolve(window.Razorpay);
  loading ??= new Promise<RazorpayConstructor>((resolve, reject) => {
    const s = document.createElement("script");
    s.src = SCRIPT_SRC;
    s.async = true;
    s.onload = () => (window.Razorpay ? resolve(window.Razorpay) : reject(new Error("Razorpay did not load")));
    s.onerror = () => reject(new Error("Razorpay did not load"));
    document.head.appendChild(s);
  }).catch((err) => {
    loading = null; // allow a retry
    document.querySelector(`script[src="${SCRIPT_SRC}"]`)?.remove();
    throw err;
  });
  return loading;
}

export type OpenCheckoutArgs = {
  keyId: string;
  razorpayOrderId: string;
  amountPaise: number;
  currency: string;
  timeoutSeconds: number;
  orderNumber: string;
  prefill: { name: string; email: string | null; mobile: string };
  onSuccess: (res: RazorpaySuccess) => void;
  onFailure: (message: string) => void;
  onDismiss: () => void;
};

/** Opens the Razorpay window. Resolves once it is open; the callbacks report the outcome. */
export async function openCheckout(a: OpenCheckoutArgs): Promise<void> {
  const Razorpay = await loadRazorpay();
  let settled = false;
  const accent = getComputedStyle(document.documentElement).getPropertyValue("--accent").trim();
  const rzp = new Razorpay({
    key: a.keyId,
    order_id: a.razorpayOrderId,
    amount: a.amountPaise,
    currency: a.currency,
    name: "Riderzpro",
    description: `Order ${a.orderNumber}`,
    prefill: { name: a.prefill.name, contact: `+91${a.prefill.mobile}`, ...(a.prefill.email ? { email: a.prefill.email } : {}) },
    notes: { order_number: a.orderNumber },
    ...(/^#[0-9a-f]{3,8}$/i.test(accent) ? { theme: { color: accent } } : {}),
    timeout: a.timeoutSeconds,
    retry: { enabled: true },
    modal: {
      confirm_close: true,
      ondismiss: () => {
        if (!settled) a.onDismiss();
      },
    },
    handler: (res) => {
      settled = true;
      a.onSuccess(res);
    },
  });
  // Razorpay lets the shopper retry inside the window; this reports each failed attempt.
  rzp.on("payment.failed", (res) => a.onFailure(res.error?.description || "The payment didn't go through."));
  rzp.open();
}
