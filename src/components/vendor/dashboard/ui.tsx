"use client";

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { CheckCircle2, AlertTriangle } from "lucide-react";
import type { VendorProduct, VendorProductStatus } from "@/lib/vendor/types";
import { ApiFailure } from "@/lib/vendor/client";

/** Shared bits of the seller dashboard: status badges, inline notices, error helpers. */

export const PRODUCT_STATUS_META: Record<VendorProductStatus, { label: string; cls: string }> = {
  draft: { label: "Draft", cls: "border-tint/10 bg-steel text-ash" },
  pending_review: { label: "Under review", cls: "border-gold/30 bg-gold/10 text-gold" },
  live: { label: "Live", cls: "border-accent/30 bg-accent/10 text-accent" },
  changes_requested: { label: "Changes needed", cls: "border-gold/40 bg-gold/15 text-gold" },
  rejected: { label: "Rejected", cls: "border-danger/30 bg-danger/10 text-danger" },
  archived: { label: "Archived", cls: "border-tint/10 bg-carbon text-dim" },
};

const pill = "inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.08em] whitespace-nowrap";

export function StatusBadge({ product }: { product: Pick<VendorProduct, "status" | "pendingRevision"> }) {
  const m = PRODUCT_STATUS_META[product.status];
  return (
    <span className="inline-flex flex-wrap items-center gap-1">
      <span className={`${pill} ${m.cls}`}>{m.label}</span>
      {product.status === "live" && product.pendingRevision && (
        <span className={`${pill} border-gold/30 bg-gold/10 text-gold`}>Edit under review</span>
      )}
    </span>
  );
}

export function Pill({ tone, children }: { tone: "ok" | "warn" | "bad" | "mute"; children: ReactNode }) {
  const cls = {
    ok: "border-accent/30 bg-accent/10 text-accent",
    warn: "border-gold/30 bg-gold/10 text-gold",
    bad: "border-danger/30 bg-danger/10 text-danger",
    mute: "border-tint/10 bg-steel text-ash",
  }[tone];
  return <span className={`${pill} ${cls}`}>{children}</span>;
}

/** Product thumbnail (first image) or an empty tile. */
export function Thumb({ id, alt, size = 48 }: { id?: string; alt: string; size?: number }) {
  return id ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={`/api/files/${id}`}
      alt={alt}
      width={size}
      height={size}
      loading="lazy"
      className="shrink-0 rounded-[2px] border border-tint/10 bg-steel object-cover"
      style={{ width: size, height: size }}
    />
  ) : (
    <span
      aria-hidden
      className="grid shrink-0 place-items-center rounded-[2px] border border-dashed border-tint/20 bg-steel text-[10px] text-dim"
      style={{ width: size, height: size }}
    >
      No photo
    </span>
  );
}

export function ReadOnlyNotice({ children }: { children?: ReactNode }) {
  return (
    <p role="note" className="flex items-start gap-2 rounded-[2px] border border-gold/30 bg-gold/10 p-3 text-sm text-chalk">
      <AlertTriangle size={16} className="mt-0.5 shrink-0 text-gold" aria-hidden />
      <span>{children ?? "Your store is suspended, so changes are disabled. Contact seller support."}</span>
    </p>
  );
}

/** Small auto-dismissing status message. `show(type, text)`; render `node` once. */
export function useFlash() {
  const [msg, setMsg] = useState<{ type: "ok" | "error"; text: string } | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const show = useCallback((type: "ok" | "error", text: string) => {
    setMsg({ type, text });
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setMsg(null), type === "ok" ? 4000 : 9000);
  }, []);
  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );
  const node = msg ? (
    <div
      role={msg.type === "error" ? "alert" : "status"}
      className={`fixed inset-x-3 bottom-24 z-[80] mx-auto flex max-w-md items-start gap-2 rounded-[2px] border p-3 text-sm shadow-[var(--shadow-lift)] lg:bottom-6 ${
        msg.type === "error" ? "border-danger/40 bg-carbon text-danger" : "border-accent/40 bg-carbon text-chalk"
      }`}
    >
      {msg.type === "error" ? (
        <AlertTriangle size={16} className="mt-0.5 shrink-0" aria-hidden />
      ) : (
        <CheckCircle2 size={16} className="mt-0.5 shrink-0 text-accent" aria-hidden />
      )}
      <span>{msg.text}</span>
    </div>
  ) : null;
  return { show, node };
}

/** API field-error keys can be "content.title" or "highlights.2"; reduce to the form field name. */
export function fieldErrors(fields: Record<string, string> | undefined): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(fields ?? {})) {
    const parts = k.split(".");
    const name = parts[0] === "content" || parts[0] === "commercial" ? parts[1] : parts[0];
    if (name) out[name] ??= v;
  }
  return out;
}

export const failureMessage = (err: unknown) =>
  err instanceof ApiFailure ? err.message : "Something went wrong. Please try again.";

/** Parse a number input to an integer; blank or invalid → null. */
export function toInt(value: string): number | null {
  const t = value.trim();
  if (!/^-?\d+$/.test(t)) return null;
  const n = Number(t);
  return Number.isSafeInteger(n) ? n : null;
}

export function EmptyState({ title, children }: { title: string; children?: ReactNode }) {
  return (
    <div className="card p-8 text-center">
      <p className="font-display text-lg font-extrabold text-chalk">{title}</p>
      {children && <div className="mx-auto mt-2 max-w-md text-sm text-ash">{children}</div>}
    </div>
  );
}
