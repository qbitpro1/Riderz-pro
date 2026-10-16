"use client";

import { AlertCircle, Banknote, BellRing, Boxes, LifeBuoy, PackageCheck, ShoppingBag, UserCheck, type LucideIcon } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import type { VendorNotification } from "@/lib/server/vendor-account";
import { api, ApiFailure } from "@/lib/vendor/client";

const ICONS: Record<VendorNotification["type"], { icon: LucideIcon; label: string }> = {
  account: { icon: UserCheck, label: "Account" },
  product: { icon: PackageCheck, label: "Product" },
  order: { icon: ShoppingBag, label: "Order" },
  stock: { icon: Boxes, label: "Stock" },
  payout: { icon: Banknote, label: "Payout" },
  support: { icon: LifeBuoy, label: "Support" },
};

function ago(iso: string): string {
  const s = Math.max(0, (Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 60) return "just now";
  if (s < 3600) return `${Math.floor(s / 60)} min ago`;
  if (s < 86400) return `${Math.floor(s / 3600)} h ago`;
  if (s < 7 * 86400) return `${Math.floor(s / 86400)} d ago`;
  return new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

export default function NotificationList({ initialItems }: { initialItems: VendorNotification[] }) {
  const router = useRouter();
  const [items, setItems] = useState(initialItems);
  const [error, setError] = useState("");
  const unread = items.filter((i) => !i.read).length;

  async function mark(body: { ids?: string[]; all?: boolean }) {
    setError("");
    try {
      await api("/api/vendor/notifications/read", { body });
      setItems((cur) => cur.map((n) => (body.all || body.ids?.includes(n.id) ? { ...n, read: true } : n)));
      router.refresh();
    } catch (e) {
      setError(e instanceof ApiFailure ? e.message : "Could not update. Please try again.");
    }
  }

  if (items.length === 0) {
    return (
      <div className="card mt-6 flex flex-col items-center gap-2 p-10 text-center">
        <BellRing size={24} className="text-dim" aria-hidden />
        <p className="text-sm text-ash">Nothing yet. Updates about your store will appear here.</p>
      </div>
    );
  }

  return (
    <div className="mt-6">
      <div className="mb-3 flex items-center justify-between gap-3">
        <p className="text-sm text-ash" aria-live="polite">{unread > 0 ? `${unread} unread` : "All caught up"}</p>
        <button type="button" className="btn btn-outline btn-sm" disabled={unread === 0} onClick={() => mark({ all: true })}>Mark all read</button>
      </div>
      {error ? (
        <p role="alert" className="mb-3 flex items-center gap-2 text-sm text-danger"><AlertCircle size={14} aria-hidden /> {error}</p>
      ) : null}
      <ul className="space-y-2">
        {items.map((n) => {
          const { icon: Icon, label } = ICONS[n.type];
          const body = (
            <>
              <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-[2px] border border-tint/10 bg-steel text-accent">
                <Icon size={16} aria-label={label} />
              </span>
              <span className="min-w-0 flex-1">
                <span className="flex items-start justify-between gap-2">
                  <span className={`text-sm ${n.read ? "text-ash" : "font-bold text-chalk"}`}>{n.title}</span>
                  <span className="shrink-0 text-xs text-dim">{ago(n.createdAt)}</span>
                </span>
                <span className="mt-0.5 block break-words text-sm text-ash">{n.body}</span>
              </span>
              {!n.read ? <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-accent" aria-label="Unread" /> : null}
            </>
          );
          return (
            <li key={n.id} className={`card flex gap-3 p-3 ${n.read ? "" : "border-accent/30"}`}>
              {n.link ? (
                <Link href={n.link} className="flex min-w-0 flex-1 gap-3" onClick={() => !n.read && mark({ ids: [n.id] })}>{body}</Link>
              ) : (
                <div className="flex min-w-0 flex-1 gap-3">{body}</div>
              )}
              {!n.read && !n.link ? (
                <button type="button" className="self-start text-xs text-accent hover:underline" onClick={() => mark({ ids: [n.id] })}>Mark read</button>
              ) : null}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
