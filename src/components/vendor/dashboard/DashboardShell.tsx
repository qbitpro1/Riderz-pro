"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import {
  Bell,
  Boxes,
  ExternalLink,
  LayoutDashboard,
  LifeBuoy,
  LogOut,
  MoreHorizontal,
  Package,
  Settings,
  Tags,
  Wallet,
  Warehouse,
  X,
  type LucideIcon,
} from "lucide-react";
import { api } from "@/lib/vendor/client";
import { storeHref } from "@/lib/vendor/types";

type Props = {
  storeName: string;
  slug: string | null;
  tier: string | null;
  status: "approved" | "suspended";
  holidayMode: boolean;
  unreadNotifications: number;
  newOrders: number;
  children: ReactNode;
};

type Item = { href: string; label: string; icon: LucideIcon; badge?: number };

export function DashboardShell({ storeName, slug, tier, status, holidayMode, unreadNotifications, newOrders, children }: Props) {
  const pathname = usePathname();
  const [more, setMore] = useState(false);
  const [signingOut, setSigningOut] = useState(false);

  useEffect(() => setMore(false), [pathname]);
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
    window.location.href = "/vendor/auth";
  }

  const badge = (n?: number) =>
    n ? (
      <span className="ml-auto grid h-5 min-w-5 place-items-center rounded-full bg-accent px-1.5 text-[10px] font-bold text-on-accent tnum">
        <span className="sr-only">{n} unread or new, </span>
        {n > 99 ? "99+" : n}
      </span>
    ) : null;

  const linkCls = (active: boolean) =>
    `relative flex min-h-11 items-center gap-3 rounded-[2px] px-3 text-sm font-semibold transition-colors ${
      active ? "bg-accent/10 text-accent" : "text-ash hover:bg-tint/5 hover:text-chalk"
    }`;

  return (
    <div className="pt-14 md:pt-[68px]">
      <div className="mx-auto flex w-full max-w-[1500px]">
        {/* Sidebar (desktop) */}
        <aside className="sticky top-[68px] hidden h-[calc(100vh-68px)] w-60 shrink-0 flex-col border-r border-tint/10 bg-carbon lg:flex">
          <div className="border-b border-tint/10 p-4">
            <p className="eyebrow">Seller portal</p>
            <p className="mt-1 truncate font-display text-base font-extrabold text-chalk" title={storeName}>
              {storeName}
            </p>
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
            {slug && (
              <Link href={storeHref(slug)} className={linkCls(false)}>
                <ExternalLink size={18} aria-hidden />
                View my store
              </Link>
            )}
            <button type="button" onClick={signOut} disabled={signingOut} className={`${linkCls(false)} w-full disabled:opacity-60`}>
              <LogOut size={18} aria-hidden />
              {signingOut ? "Signing out…" : "Sign out"}
            </button>
          </div>
        </aside>

        <div className="min-w-0 flex-1">
          {/* Sticky header */}
          <header className="sticky top-14 z-30 flex h-14 items-center justify-between gap-3 border-b border-tint/10 bg-void/95 px-4 backdrop-blur md:top-[68px] md:px-6">
            <div className="min-w-0">
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
              Your store is suspended — products are hidden from the shop and changes are disabled. Contact seller support.
            </div>
          )}
          {holidayMode && (
            <div role="status" className="border-b border-gold/40 bg-gold/10 px-4 py-3 text-sm text-chalk md:px-6">
              <strong className="text-gold">Holiday mode is on.</strong> Your products are hidden from the shop until you switch it off in{" "}
              <Link href={`${base}/settings`} className="underline underline-offset-2 hover:text-accent">
                Settings
              </Link>
              .
            </div>
          )}

          <div className="px-4 py-5 pb-28 md:px-6 md:py-6 lg:pb-10">{children}</div>
        </div>
      </div>

      {/* Mobile bottom navigation (sits over the site's own bottom bar) */}
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
              {slug && (
                <Link href={storeHref(slug)} className={linkCls(false)}>
                  <ExternalLink size={18} aria-hidden />
                  View my store
                </Link>
              )}
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
