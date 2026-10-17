"use client";

import { useId, useState } from "react";
import { useRouter } from "next/navigation";
import { api, ApiFailure } from "@/lib/vendor/client";

/** Only admin pages are allowed as the place to come back to. */
const safeNext = (next: string | null) => (next && /^\/admin(\/|$|\?)/.test(next) && !next.startsWith("//") ? next : "/admin");

export function AdminSignInForm({ next }: { next: string | null }) {
  const router = useRouter();
  const uid = useId();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    setError(null);
    try {
      await api("/api/admin/auth/sign-in", { body: { email, password } });
      router.replace(safeNext(next));
      router.refresh();
    } catch (err) {
      setError(err instanceof ApiFailure ? err.message : "Couldn't sign in. Please try again.");
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} noValidate className="card space-y-3 p-5" aria-label="Admin sign in">
      <div>
        <label className="label" htmlFor={`${uid}-e`}>Email</label>
        <input id={`${uid}-e`} className="field" type="email" autoComplete="username" value={email} onChange={(e) => setEmail(e.target.value)} maxLength={254} required />
      </div>
      <div>
        <label className="label" htmlFor={`${uid}-p`}>Password</label>
        <input id={`${uid}-p`} className="field" type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} maxLength={200} required />
      </div>
      {error && <p role="alert" className="text-xs text-danger">{error}</p>}
      <button type="submit" className="btn btn-primary btn-block" disabled={busy || !email || !password}>
        {busy ? "Signing in…" : "Sign in"}
      </button>
      <p className="text-xs text-dim">Forgot your password? Ask the owner for a reset link.</p>
    </form>
  );
}
