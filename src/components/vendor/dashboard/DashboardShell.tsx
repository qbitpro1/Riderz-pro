"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import {
  Bell,
  Boxes,
  LayoutDashboard,
  LifeBuoy,
  LogOut,
  ExternalLink,
  MonitorSmartphone,
  MoreHorizontal,
  Package,
  Settings,
  Tags,
  Wallet,
  Warehouse,
  X,
  type LucideIcon,
} from "lucide-react";
import { Logo } from "@/components/brand/Logo";
import { api } from "@/lib/vendor/client";
import { offlineStoreHref, storeHref } from "@/lib/vendor/types";

type Props = {
  storeName: string;
  slug: string | null;
  tier: string | null;
  status: "approved" | "suspended";
  unreadNotifications: number;
  newOrders: number;
  children: ReactNode;
};

type Item = { href: string; label: string; icon: LucideIcon; badge?: number };

export function DashboardShell({ storeName, slug, tier, status, unreadNotifications, newOrders, children }: Props) {
  const pathname = usePathname();
  const [more, setMore] = useState(false);
  const [signingOut, setSigningOut] = useState(false);

  // A new page closes the "More" menu (adjusting state while rendering, not in an effect).
  const [moreFor, setMoreFor] = useState(pathname);
  if (moreFor !== pathname) {
    setMoreFor(pathname);
    setMore(false);
  }
  useEffect(() => {
    if (!more) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setMore(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [more]);

  const base = "/vendor/dashboard";
  const items: Item[] = [
    { href: base, label: "Overview", icon: LayoutDashboard },
    { href: `${base}/orders`, label: "Orders", icon: Package, badge: newOrders },
    { href: `${base}/products`, label: "Products", icon: Boxes },
    { href: `${base}/inventory`, label: "Inventory", icon: Warehouse },
    { href: `${base}/pricing`, label: "Pricing", icon: Tags },
    { href: `${base}/payments`, label: "Payments", icon: Wallet },
    { href: `${base}/notifications`, label: "Notifications", icon: Bell, badge: unreadNotifications },
    { href: `${base}/store-screen`, label: "Offline Store", icon: MonitorSmartphone },
    { href: `${base}/settings`, label: "Settings", icon: Settings },
    { href: `${base}/support`, label: "Support", icon: LifeBuoy },
  ];
  const primary = items.slice(0, 4);
  const rest = items.slice(4);

  const isActive = (href: string) => (href === base ? pathname === base : pathname === href || pathname.startsWith(`${href}/`));
  const moreActive = rest.some((i) => isActive(i.href));
  const current = items.find((i) => isActive(i.href));

  async function signOut() {
    setSigningOut(true);
    try {
      await api("/api/vendor/auth/signout", { method: "POST", body: {} });
    } catch {
      /* the cookie may already be gone */
    }
    // A full page load (not a client navigation), so nothing of the seller's session stays in memory;
    // `replace` keeps Back from returning to the dashboard.
    window.location.replace(new URL("/vendor/auth", window.location.origin));
  }

  const badge = (n?: number) =>
    n ? (
      <span className="ml-auto grid h-5 min-w-5 place-items-center rounded-full bg-accent px-1.5 text-[10px] font-bold text-on-accent tnum">
        <span className="sr-only">{n} unread or new, </span>
        {n > 99 ? "99+" : n}
      </span>
    ) : null;

  // The Offline Store screen (the seller's own shop): separate from online selling, so it sits apart and highlighted.
  const offlineStore =
    status === "approved" && slug ? (
      <Link
        href={offlineStoreHref(slug)}
        className="flex min-h-11 items-center gap-3 rounded-[2px] border border-accent/60 bg-accent/10 px-3 text-sm font-bold text-chalk transition-colors hover:bg-accent/20"
      >
        <MonitorSmartphone size={18} className="text-accent" aria-hidden />
        Offline Store
      </Link>
    ) : null;

  // The public storefront on the Riderzpro website.
  const onlineStore =
    status === "approved" && slug ? (
      <Link
        href={storeHref(slug)}
        className="flex min-h-11 items-center gap-3 rounded-[2px] px-3 text-sm font-semibold text-ash transition-colors hover:bg-tint/5 hover:text-chalk"
      >
        <ExternalLink size={18} aria-hidden />
        View my online store
      </Link>
    ) : null;

  const linkCls = (active: boolean) =>
    `relative flex min-h-11 items-center gap-3 rounded-[2px] px-3 text-sm font-semibold transition-colors ${
      active ? "bg-accent/10 text-accent" : "text-ash hover:bg-tint/5 hover:text-chalk"
    }`;

  return (
    // The site's shopper header is off here (SiteChrome); the dashboard carries its own brand mark.
    <div>
      <div className="mx-auto flex w-full max-w-[1500px]">
        {/* Sidebar (desktop) */}
        <aside className="sticky top-0 hidden h-dvh w-60 shrink-0 flex-col border-r border-tint/10 bg-carbon lg:flex">
          <div className="border-b border-tint/10 p-4">
            <Link href="/vendor/dashboard" aria-label="Riderzpro seller portal, overview" className="mb-3 inline-block">
              <Logo className="h-9" />
            </Link>
            <p className="eyebrow">Seller portal</p>
            <p className="mt-1 truncate font-display text-base font-extrabold text-chalk" title={storeName}>
              {storeName}
            </p>
            {offlineStore && <div className="mt-3">{offlineStore}</div>}
            {onlineStore && <div className="mt-1">{onlineStore}</div>}
          </div>
          <nav aria-label="Seller dashboard" className="flex-1 space-y-1 overflow-y-auto p-3">
            {items.map((i) => {
              const active = isActive(i.href);
              return (
                <Link key={i.href} href={i.href} aria-current={active ? "page" : undefined} className={linkCls(active)}>
                  {active && <span aria-hidden className="absolute inset-y-2 left-0 w-0.5 bg-accent" />}
                  <i.icon size={18} aria-hidden />
                  <span>{i.label}</span>
                  {badge(i.badge)}
                </Link>
              );
            })}
          </nav>
          <div className="space-y-1 border-t border-tint/10 p-3">
            <button type="button" onClick={signOut} disabled={signingOut} className={`${linkCls(false)} w-full disabled:opacity-60`}>
              <LogOut size={18} aria-hidden />
              {signingOut ? "Signing out…" : "Sign out"}
            </button>
          </div>
        </aside>

        <div className="min-w-0 flex-1">
          {/* Sticky header */}
          <header className="sticky top-0 z-30 flex h-14 items-center justify-between gap-3 border-b border-tint/10 bg-void/95 px-4 backdrop-blur md:px-6">
            <div className="flex min-w-0 items-center gap-3">
              <Link href="/vendor/dashboard" aria-label="Riderzpro seller portal, overview" className="shrink-0 lg:hidden">
                <Logo className="h-8" />
              </Link>
              <p className="truncate text-sm font-bold text-chalk lg:hidden">{storeName}</p>
              <p className="hidden truncate font-display text-lg font-extrabold text-chalk lg:block">{current?.label ?? "Dashboard"}</p>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              {tier && (
                <span className="rounded-full border border-gold/40 bg-gold/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.1em] text-gold">
                  {tier}
                </span>
              )}
              <Link
                href={`${base}/notifications`}
                aria-label={unreadNotifications ? `Notifications, ${unreadNotifications} unread` : "Notifications"}
                className="relative grid h-10 w-10 place-items-center rounded-[2px] border border-tint/10 text-ash hover:border-accent hover:text-accent"
              >
                <Bell size={18} aria-hidden />
                {unreadNotifications > 0 && (
                  <span className="absolute -right-1 -top-1 grid h-4 min-w-4 place-items-center rounded-full bg-accent px-1 text-[10px] font-bold text-on-accent tnum">
                    {unreadNotifications > 9 ? "9+" : unreadNotifications}
                  </span>
                )}
              </Link>
              <button
                type="button"
                onClick={signOut}
                disabled={signingOut}
                className="btn btn-outline btn-sm gap-1.5 disabled:opacity-60"
                aria-label="Sign out"
              >
                <LogOut size={14} aria-hidden />
                <span className="hidden sm:inline">Sign out</span>
              </button>
            </div>
          </header>

          {status === "suspended" && (
            <div role="alert" className="border-b border-danger/40 bg-danger/10 px-4 py-3 text-sm font-semibold text-danger md:px-6">
              Your store is suspended: your products are hidden from the Riderzpro website and the Offline Store screen is closed, and changes are disabled. Contact seller support.
            </div>
          )}

          <div className="px-4 py-5 pb-28 md:px-6 md:py-6 lg:pb-10">{children}</div>
        </div>
      </div>

      {/* Mobile bottom navigation (the site's own bottom bar is off on these routes, see SiteChrome) */}
      <nav
        aria-label="Seller dashboard"
        className="safe-b fixed inset-x-0 bottom-0 z-[60] border-t border-tint/10 bg-void lg:hidden"
      >
        <ul className="grid grid-cols-5">
          {primary.map((i) => {
            const active = isActive(i.href);
            return (
              <li key={i.href}>
                <Link
                  href={i.href}
                  aria-current={active ? "page" : undefined}
                  className={`relative flex h-16 flex-col items-center justify-center gap-1 ${active ? "text-accent" : "text-ash"}`}
                >
                  <span className="relative">
                    <i.icon size={20} aria-hidden />
                    {!!i.badge && (
                      <span className="absolute -right-2 -top-1.5 grid h-4 min-w-4 place-items-center rounded-full bg-accent px-1 text-[10px] font-bold text-on-accent tnum">
                        {i.badge > 9 ? "9+" : i.badge}
                      </span>
                    )}
                  </span>
                  <span className="font-display text-[10px] font-bold uppercase tracking-[0.08em]">{i.label}</span>
                </Link>
              </li>
            );
          })}
          <li>
            <button
              type="button"
              onClick={() => setMore(true)}
              aria-haspopup="dialog"
              aria-expanded={more}
              className={`relative flex h-16 w-full flex-col items-center justify-center gap-1 ${moreActive ? "text-accent" : "text-ash"}`}
            >
              <span className="relative">
                <MoreHorizontal size={20} aria-hidden />
                {unreadNotifications > 0 && <span className="absolute -right-1 -top-1 h-2 w-2 rounded-full bg-accent" />}
              </span>
              <span className="font-display text-[10px] font-bold uppercase tracking-[0.08em]">More</span>
            </button>
          </li>
        </ul>
      </nav>

      {more && (
        <div className="fixed inset-0 z-[70] lg:hidden" role="dialog" aria-modal="true" aria-label="More seller links">
          <button type="button" aria-label="Close menu" className="absolute inset-0 bg-ink/70" onClick={() => setMore(false)} />
          <div className="safe-b absolute inset-x-0 bottom-0 max-h-[80vh] overflow-y-auto rounded-t-[8px] border-t border-tint/10 bg-void p-4">
            <div className="mb-2 flex items-center justify-between">
              <p className="font-display text-base font-extrabold text-chalk">More</p>
              <button
                type="button"
                onClick={() => setMore(false)}
                aria-label="Close"
                className="grid h-10 w-10 place-items-center rounded-[2px] text-ash hover:text-chalk"
              >
                <X size={20} aria-hidden />
              </button>
            </div>
            <div className="space-y-1">
              {offlineStore && <div className="mb-2">{offlineStore}</div>}
              {onlineStore}
              {rest.map((i) => {
                const active = isActive(i.href);
                return (
                  <Link key={i.href} href={i.href} aria-current={active ? "page" : undefined} className={linkCls(active)}>
                    <i.icon size={18} aria-hidden />
                    {i.label}
                    {badge(i.badge)}
                  </Link>
                );
              })}
              <button type="button" onClick={signOut} disabled={signingOut} className={`${linkCls(false)} w-full disabled:opacity-60`}>
                <LogOut size={18} aria-hidden />
                {signingOut ? "Signing out…" : "Sign out"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
