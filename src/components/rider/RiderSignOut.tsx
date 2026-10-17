"use client";

import { useRouter } from "next/navigation";
import { api } from "@/lib/vendor/client";

export function RiderSignOut() {
  const router = useRouter();
  return (
    <button
      type="button"
      className="text-xs font-semibold uppercase tracking-[0.12em] text-ash hover:text-chalk"
      onClick={async () => {
        await api("/api/rider/signout", { body: {} }).catch(() => {});
        router.replace("/rider");
        router.refresh();
      }}
    >
      Sign out
    </button>
  );
}
