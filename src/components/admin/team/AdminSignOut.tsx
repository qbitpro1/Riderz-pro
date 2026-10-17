"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/vendor/client";

/** "Sign out" for the admin area: ends this browser's admin session. */
export function AdminSignOut() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  async function signOut() {
    setBusy(true);
    try {
      await api("/api/admin/auth/sign-out", { body: {} });
    } finally {
      router.replace("/admin/sign-in");
      router.refresh();
    }
  }
  return (
    <button type="button" onClick={signOut} disabled={busy} className="text-xs font-semibold text-accent underline underline-offset-4 disabled:opacity-60">
      {busy ? "Signing out…" : "Sign out"}
    </button>
  );
}
