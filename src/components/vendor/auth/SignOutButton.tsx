"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { api } from "@/lib/vendor/client";

export function SignOutButton({ label = "Sign out", className = "btn btn-outline btn-sm" }: { label?: string; className?: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function signOut() {
    setBusy(true);
    try {
      await api("/api/vendor/auth/signout", { method: "POST", body: {} });
    } catch {
      /* the cookie may already be gone; go to the sign-in page either way */
    }
    router.replace("/vendor/auth");
    router.refresh();
  }

  return (
    <button type="button" onClick={signOut} disabled={busy} className={className}>
      <LogOut size={14} aria-hidden="true" />
      {busy ? "Signing out…" : label}
    </button>
  );
}
