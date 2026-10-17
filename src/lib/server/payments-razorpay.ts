import "server-only";

/**
 * RAZORPAY REST CLIENT (plain fetch, no SDK)
 *
 * Basic auth with RAZORPAY_KEY_ID:RAZORPAY_KEY_SECRET. Every amount here is integer PAISE.
 * The secret never leaves the server; only the key id is ever sent to a browser.
 *
 * Tests: outside production, RAZORPAY_API_BASE can point at a local mock server
 * (scripts/test-payments.mjs). Production always talks to api.razorpay.com.
 */

export type RazorpayKeys = { keyId: string; keySecret: string };

export function razorpayKeys(): RazorpayKeys | null {
  const keyId = process.env.RAZORPAY_KEY_ID?.trim();
  const keySecret = process.env.RAZORPAY_KEY_SECRET?.trim();
  if (!keyId || !keySecret) return null;
  return { keyId, keySecret };
}

export const webhookSecret = (): string | null => process.env.RAZORPAY_WEBHOOK_SECRET?.trim() || null;

function apiBase(): string {
  const override = process.env.RAZORPAY_API_BASE?.trim();
  if (override && process.env.NODE_ENV !== "production") return override.replace(/\/+$/, "");
  return "https://api.razorpay.com";
}

/** Razorpay answered with an error (4xx/5xx). `description` is Razorpay's own text, safe to show an admin. */
export class RazorpayError extends Error {
  constructor(
    public status: number,
    public code: string,
    public description: string,
  ) {
    super(`Razorpay ${status} ${code}: ${description}`);
    this.name = "RazorpayError";
  }
}

/** No answer (network error or timeout): the request may or may not have taken effect. */
export class RazorpayUnreachable extends Error {
  constructor(cause: string) {
    super(`Razorpay unreachable: ${cause}`);
    this.name = "RazorpayUnreachable";
  }
}

async function call<T>(method: "GET" | "POST", path: string, body?: Record<string, unknown>): Promise<T> {
  const keys = razorpayKeys();
  if (!keys) throw new RazorpayError(0, "not_configured", "Razorpay keys are not set.");
  let res: Response;
  try {
    res = await fetch(`${apiBase()}${path}`, {
      method,
      headers: {
        Authorization: `Basic ${Buffer.from(`${keys.keyId}:${keys.keySecret}`).toString("base64")}`,
        ...(body ? { "Content-Type": "application/json" } : {}),
      },
      body: body ? JSON.stringify(body) : undefined,
      cache: "no-store",
      signal: AbortSignal.timeout(15_000),
    });
  } catch (err) {
    throw new RazorpayUnreachable(err instanceof Error ? err.name : "fetch failed");
  }
  let data: unknown = null;
  try {
    data = await res.json();
  } catch {
    /* empty or non-JSON body */
  }
  if (!res.ok) {
    const e = (data as { error?: { code?: string; description?: string } } | null)?.error;
    throw new RazorpayError(res.status, e?.code ?? "error", (e?.description ?? "Razorpay refused the request.").slice(0, 300));
  }
  return data as T;
}

export type RazorpayOrder = { id: string; amount: number; currency: string; receipt: string | null; status: string };
export type RazorpayPayment = {
  id: string;
  order_id: string | null;
  amount: number;
  currency: string;
  status: "created" | "authorized" | "captured" | "refunded" | "failed";
  method?: string;
  error_code?: string | null;
  error_description?: string | null;
};
export type RazorpayRefund = { id: string; payment_id: string; amount: number; status: "pending" | "processed" | "failed"; notes?: Record<string, string> };

/** POST /v1/orders. `amountPaise` comes from the server's own order total. */
export function createRazorpayOrder(input: { amountPaise: number; receipt: string; notes: Record<string, string> }): Promise<RazorpayOrder> {
  return call<RazorpayOrder>("POST", "/v1/orders", {
    amount: input.amountPaise,
    currency: "INR",
    receipt: input.receipt.slice(0, 40),
    notes: input.notes,
  });
}

export function fetchPayment(paymentId: string): Promise<RazorpayPayment> {
  return call<RazorpayPayment>("GET", `/v1/payments/${encodeURIComponent(paymentId)}`);
}

export async function fetchOrderPayments(razorpayOrderId: string): Promise<RazorpayPayment[]> {
  const res = await call<{ items?: RazorpayPayment[] }>("GET", `/v1/orders/${encodeURIComponent(razorpayOrderId)}/payments`);
  return res.items ?? [];
}

/** POST /v1/payments/{id}/refund (normal speed). */
export function createRazorpayRefund(paymentId: string, input: { amountPaise: number; receipt: string; notes: Record<string, string> }): Promise<RazorpayRefund> {
  return call<RazorpayRefund>("POST", `/v1/payments/${encodeURIComponent(paymentId)}/refund`, {
    amount: input.amountPaise,
    speed: "normal",
    receipt: input.receipt.slice(0, 40),
    notes: input.notes,
  });
}
