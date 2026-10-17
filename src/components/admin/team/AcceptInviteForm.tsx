"use client";

import { useId, useState } from "react";
import { useRouter } from "next/navigation";
import { api, ApiFailure } from "@/lib/vendor/client";
import { PASSWORD_MIN } from "@/lib/admin/roles";

/** Joins the team, or sets a new password, from a one-time link; then signs in. */
export function AcceptInviteForm({ token, email, name: initialName, kind }: { token: string; email: string; name: string; kind: "invite" | "reset" }) {
  const router = useRouter();
  const uid = useId();
  const [name, setName] = useState(initialName);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    setError(null);
    setErrors({});
    try {
      await api("/api/admin/auth/invite", { body: { token, name, password, confirm } });
      router.replace("/admin");
      router.refresh();
    } catch (err) {
      if (err instanceof ApiFailure) {
        setErrors(err.fields);
        setError(err.message);
      } else setError("Something went wrong. Please try again.");
      setBusy(false);
    }
  }

  const err = (k: string) => errors[k] && <p id={`${uid}-${k}-err`} className="mt-1 text-xs text-danger">{errors[k]}</p>;

  return (
    <form onSubmit={submit} noValidate className="card space-y-3 p-5" aria-label={kind === "invite" ? "Join the admin team" : "Set a new password"}>
      <p className="text-sm text-ash">
        Login: <span className="font-semibold text-chalk">{email}</span>
      </p>
      <div>
        <label className="label" htmlFor={`${uid}-name`}>Your name</label>
        <input id={`${uid}-name`} className="field" autoComplete="name" value={name} onChange={(e) => setName(e.target.value)} maxLength={80} aria-invalid={Boolean(errors.name)} />
        {err("name")}
      </div>
      <div>
        <label className="label" htmlFor={`${uid}-password`}>New password (at least {PASSWORD_MIN} characters)</label>
        <input id={`${uid}-password`} className="field" type="password" autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} maxLength={200} aria-invalid={Boolean(errors.password)} />
        {err("password")}
      </div>
      <div>
        <label className="label" htmlFor={`${uid}-confirm`}>Type it again</label>
        <input id={`${uid}-confirm`} className="field" type="password" autoComplete="new-password" value={confirm} onChange={(e) => setConfirm(e.target.value)} maxLength={200} aria-invalid={Boolean(errors.confirm)} />
        {err("confirm")}
      </div>
      {error && <p role="alert" className="text-xs text-danger">{error}</p>}
      <button type="submit" className="btn btn-primary btn-block" disabled={busy || password.length < PASSWORD_MIN || !confirm}>
        {busy ? "Saving…" : kind === "invite" ? "Join and sign in" : "Save password and sign in"}
      </button>
    </form>
  );
}
