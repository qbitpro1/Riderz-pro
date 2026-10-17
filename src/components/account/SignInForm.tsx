"use client";

import { useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Heart, MapPin, Package, ShieldCheck } from "lucide-react";
import { ApiFailure, api } from "@/lib/vendor/client";
import { codeSchema, identifierSchema, profileSchema } from "@/lib/account/schemas";
import { maskContact } from "@/lib/account/types";
import { Notice, TextField } from "@/components/vendor/auth/fields";
import { useAccount } from "./AccountContext";

const PERKS = [
  { icon: Package, title: "Your orders in one place", body: "See every order, what each seller has shipped and the courier tracking number." },
  { icon: MapPin, title: "Faster checkout", body: "Save your addresses once and pick one at checkout." },
  { icon: Heart, title: "Wishlist and car on every device", body: "Your saved products and the car you drive follow you when you sign in." },
  { icon: ShieldCheck, title: "No password to remember", body: "We send a 6-digit code to your mobile or email each time you sign in." },
];

const RESEND_AFTER = 30;
const message = (err: unknown) => (err instanceof ApiFailure ? err.message : "Something went wrong. Please try again.");

type Step = { kind: "ask" } | { kind: "code"; identifier: string; channel: "mobile" | "email"; target: string } | { kind: "name" };

/**
 * Passwordless sign-in: mobile or email → 6-digit code → signed in. A first sign-in creates the
 * account and asks for a name (it can be skipped).
 */
export function SignInForm({ next }: { next: string }) {
  const router = useRouter();
  const { refresh } = useAccount();
  const [step, setStep] = useState<Step>({ kind: "ask" });
  const [identifier, setIdentifier] = useState("");
  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [fieldError, setFieldError] = useState<string | undefined>();
  const [busy, setBusy] = useState(false);
  const [wait, setWait] = useState(0);

  useEffect(() => {
    if (wait <= 0) return;
    const t = window.setTimeout(() => setWait((n) => n - 1), 1000);
    return () => window.clearTimeout(t);
  }, [wait]);

  useEffect(() => {
    if (step.kind === "code") document.getElementById("code")?.focus();
  }, [step.kind]);

  async function finish() {
    await refresh();
    router.replace(next);
    router.refresh();
  }

  async function send(e?: FormEvent) {
    e?.preventDefault();
    const raw = step.kind === "code" ? step.identifier : identifier;
    const parsed = identifierSchema.safeParse(raw);
    if (!parsed.success) {
      setFieldError(parsed.error.issues[0]?.message);
      return;
    }
    setBusy(true);
    setError(null);
    setFieldError(undefined);
    try {
      await api("/api/account/code/send", { body: { identifier: raw } });
      setStep({ kind: "code", identifier: raw, channel: parsed.data.channel, target: parsed.data.target });
      setCode("");
      setWait(RESEND_AFTER);
    } catch (err) {
      if (err instanceof ApiFailure && err.fields.identifier) setFieldError(err.fields.identifier);
      else setError(message(err));
    } finally {
      setBusy(false);
    }
  }

  async function verify(e: FormEvent) {
    e.preventDefault();
    if (step.kind !== "code") return;
    const parsed = codeSchema.safeParse(code);
    if (!parsed.success) {
      setFieldError(parsed.error.issues[0]?.message);
      return;
    }
    setBusy(true);
    setError(null);
    setFieldError(undefined);
    try {
      const res = await api<{ created: boolean }>("/api/account/code/verify", { body: { identifier: step.identifier, code: parsed.data } });
      if (res.created) {
        setStep({ kind: "name" });
        setBusy(false);
      } else {
        await finish();
      }
    } catch (err) {
      setFieldError(message(err));
      setCode("");
      setBusy(false);
    }
  }

  async function saveName(e: FormEvent) {
    e.preventDefault();
    const parsed = profileSchema.safeParse({ name });
    if (!parsed.success) {
      setFieldError(parsed.error.issues[0]?.message);
      return;
    }
    setBusy(true);
    setFieldError(undefined);
    try {
      await api("/api/account/profile", { method: "PATCH", body: parsed.data });
      await finish();
    } catch (err) {
      setError(message(err));
      setBusy(false);
    }
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_minmax(0,28rem)] lg:gap-14">
      <aside className="order-2 lg:order-1 lg:pt-6">
        <p className="eyebrow mb-3">Your Riderzpro account</p>
        <h1 className="display-3 max-w-md">Orders, addresses and saved parts, in one place.</h1>
        <ul className="mt-8 grid gap-4 sm:grid-cols-2">
          {PERKS.map(({ icon: Icon, title, body }) => (
            <li key={title} className="card p-4">
              <Icon size={18} className="text-accent" aria-hidden="true" />
              <p className="mt-3 text-sm font-semibold text-chalk">{title}</p>
              <p className="mt-1 text-xs leading-relaxed text-ash">{body}</p>
            </li>
          ))}
        </ul>
        <p className="mt-6 text-xs text-dim">
          Selling on Riderzpro? <Link href="/vendor/auth" className="text-accent underline underline-offset-4">Seller sign in</Link>
        </p>
      </aside>

      <section aria-label="Sign in" className="order-1 lg:order-2">
        <div className="card p-5 sm:p-7">
          {error && (
            <div className="mb-4">
              <Notice tone="error">{error}</Notice>
            </div>
          )}

          {step.kind === "ask" && (
            <form onSubmit={send} noValidate className="space-y-4">
              <div>
                <h2 className="font-display text-xl font-extrabold tracking-tight text-chalk">Sign in or create an account</h2>
                <p className="mt-1 text-sm text-ash">We&apos;ll send a 6-digit code. New here? The code creates your account.</p>
              </div>
              <TextField
                id="identifier"
                label="Mobile number or email"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                autoComplete="username"
                inputMode="email"
                placeholder="98765 43210 or you@example.com"
                maxLength={254}
                error={fieldError}
                autoFocus
              />
              <button type="submit" className="btn btn-primary btn-block" disabled={busy}>
                {busy ? "Sending…" : "Send code"}
              </button>
              <p className="text-xs leading-relaxed text-dim">
                By continuing you agree to our <Link href="/legal/terms" className="underline underline-offset-2">terms</Link> and{" "}
                <Link href="/legal/privacy" className="underline underline-offset-2">privacy policy</Link>.
              </p>
            </form>
          )}

          {step.kind === "code" && (
            <form onSubmit={verify} noValidate className="space-y-4">
              <div>
                <h2 className="font-display text-xl font-extrabold tracking-tight text-chalk">Enter your code</h2>
                <p className="mt-1 text-sm text-ash">
                  We sent a 6-digit code to {step.channel === "mobile" ? "+91 " : ""}
                  <span className="font-semibold text-chalk">{maskContact(step.target)}</span>. It expires in 10 minutes.
                </p>
              </div>
              <TextField
                id="code"
                label="6-digit code"
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                autoComplete="one-time-code"
                inputMode="numeric"
                maxLength={6}
                className="[&_input]:tracking-[0.4em] [&_input]:tnum"
                error={fieldError}
              />
              <button type="submit" className="btn btn-primary btn-block" disabled={busy || code.length !== 6}>
                {busy ? "Checking…" : "Sign in"}
              </button>
              <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
                <button
                  type="button"
                  className="text-ash underline underline-offset-4 hover:text-chalk"
                  onClick={() => {
                    setStep({ kind: "ask" });
                    setFieldError(undefined);
                    setError(null);
                  }}
                >
                  Use a different number or email
                </button>
                <button type="button" className="font-semibold text-accent disabled:text-dim" disabled={wait > 0 || busy} onClick={() => void send()}>
                  {wait > 0 ? `Resend in ${wait}s` : "Resend code"}
                </button>
              </div>
            </form>
          )}

          {step.kind === "name" && (
            <form onSubmit={saveName} noValidate className="space-y-4">
              <div>
                <h2 className="font-display text-xl font-extrabold tracking-tight text-chalk">Welcome to Riderzpro</h2>
                <p className="mt-1 text-sm text-ash">Your account is ready. What should we call you?</p>
              </div>
              <TextField id="name" label="Your name" value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" maxLength={80} error={fieldError} autoFocus />
              <button type="submit" className="btn btn-primary btn-block" disabled={busy}>
                {busy ? "Saving…" : "Continue"}
              </button>
              <button type="button" className="w-full text-sm text-ash underline underline-offset-4 hover:text-chalk" onClick={() => void finish()}>
                Skip for now
              </button>
            </form>
          )}
        </div>
      </section>
    </div>
  );
}
