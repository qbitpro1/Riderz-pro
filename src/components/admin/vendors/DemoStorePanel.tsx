"use client";

import { useState, type FormEvent } from "react";
import { api, ApiFailure } from "@/lib/vendor/client";
import { Field, Notice } from "./ui";

type Result = { slug: string; action: "created" | "renamed" | "refreshed"; products: number; photos: number };

/**
 * Create or refresh the "Indus Enterprises" demo store (seat covers and speakers from the
 * house catalogue). The login fields are needed only the first time.
 */
export function DemoStorePanel({ exists }: { exists: boolean }) {
  const [busy, setBusy] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [message, setMessage] = useState<{ tone: "ok" | "error"; text: string } | null>(null);

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const body: Record<string, string> = {};
    for (const k of ["email", "mobile", "password"]) {
      const v = String(fd.get(k) ?? "").trim();
      if (v) body[k] = v;
    }
    setBusy(true);
    setErrors({});
    setMessage(null);
    try {
      const { result } = await api<{ result: Result }>("/api/admin/demo-store", { body });
      const verb = { created: "Created", renamed: "Renamed Asha Accessories to", refreshed: "Refreshed" }[result.action];
      setMessage({ tone: "ok", text: `${verb} Indus Enterprises: ${result.products} products, ${result.photos} photos. Sign in as the demo seller and open Offline Store.` });
      (e.target as HTMLFormElement).reset();
    } catch (err) {
      if (err instanceof ApiFailure) {
        setErrors(err.fields);
        setMessage({ tone: "error", text: err.message });
      } else setMessage({ tone: "error", text: "Something went wrong. Please try again." });
    } finally {
      setBusy(false);
    }
  }

  return (
    <details className="card mt-6 p-4">
      <summary className="cursor-pointer font-display text-sm font-extrabold uppercase text-chalk">
        Demo store: Indus Enterprises {exists ? "(set up)" : "(not set up)"}
      </summary>
      <p className="mt-3 max-w-2xl text-sm text-ash">
        An approved demo seller with seat covers and speakers copied from the main catalogue, for showing the offline store
        screen. Running it again refreshes the demo products. An existing Asha Accessories demo store is renamed.
        {exists ? " Leave a field blank to keep it; fill it to change the demo login." : " Give a login for the demo seller."}
      </p>
      <form onSubmit={submit} noValidate className="mt-4 grid max-w-3xl gap-3 sm:grid-cols-3">
        <Field label={exists ? "New login email (optional)" : "Login email"} error={errors.email}>
          <input name="email" type="email" autoComplete="off" className="field" />
        </Field>
        <Field label={exists ? "New mobile (optional)" : "Mobile"} error={errors.mobile}>
          <input name="mobile" type="tel" inputMode="numeric" autoComplete="off" className="field" />
        </Field>
        <Field label={exists ? "New password (optional)" : "Password"} error={errors.password}>
          <input name="password" type="password" autoComplete="new-password" className="field" />
        </Field>
        <div className="sm:col-span-3">
          <button type="submit" disabled={busy} className="btn btn-primary btn-sm disabled:opacity-60">
            {busy ? "Setting up… (copies photos, up to a minute)" : exists ? "Refresh demo store" : "Create demo store"}
          </button>
        </div>
      </form>
      {message && (
        <div className="mt-4" role="status">
          <Notice tone={message.tone}>{message.text}</Notice>
        </div>
      )}
    </details>
  );
}
