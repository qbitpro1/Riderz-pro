import type { Metadata } from "next";
import Link from "next/link";
import type { ReactNode } from "react";
import { Logo } from "@/components/brand/Logo";
import { RiderSignOut } from "@/components/rider/RiderSignOut";
import { riderSession } from "@/lib/server/riders";

export const metadata: Metadata = {
  title: { default: "Rider app", template: "%s | Riderzpro rider" },
  robots: { index: false, follow: false },
};

/** The rider app's own frame: small header, no shopper menus (see SiteChrome). Phone-first. */
export default async function RiderLayout({ children }: { children: ReactNode }) {
  const session = await riderSession();
  return (
    <div className="min-h-dvh bg-void">
      <header className="sticky top-0 z-30 border-b border-tint/10 bg-void/95 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-3xl items-center justify-between gap-3 px-4">
          <Link href="/rider" className="flex items-center gap-2" aria-label="Riderzpro rider app">
            <Logo className="h-9" />
            <span className="rounded-sm bg-accent px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-[0.12em] text-on-accent">Rider</span>
          </Link>
          {session && <RiderSignOut />}
        </div>
      </header>
      <div className="mx-auto max-w-3xl px-4 pb-16 pt-6">{children}</div>
    </div>
  );
}
