"use client";

import { X } from "lucide-react";
import { useEffect, useId, useRef, type ReactNode } from "react";

/** Small shared pieces for the admin marketplace screens. */

export function fmtDate(iso: string | null | undefined, withTime = true): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    ...(withTime ? { hour: "2-digit", minute: "2-digit" } : {}),
  });
}

export function fmtSize(bytes: number): string {
  return bytes > 1024 * 1024 ? `${(bytes / 1024 / 1024).toFixed(1)} MB` : `${Math.max(1, Math.round(bytes / 1024))} KB`;
}

const TONES: Record<string, string> = {
  approved: "border-accent/40 bg-accent/10 text-accent",
  live: "border-accent/40 bg-accent/10 text-accent",
  answered: "border-accent/40 bg-accent/10 text-accent",
  submitted: "border-gold/40 bg-gold/10 text-gold",
  under_review: "border-gold/40 bg-gold/10 text-gold",
  pending_review: "border-gold/40 bg-gold/10 text-gold",
  open: "border-gold/40 bg-gold/10 text-gold",
  pending: "border-gold/40 bg-gold/10 text-gold",
  changes_requested: "border-gold/40 bg-gold/10 text-gold",
  rejected: "border-danger/40 bg-danger/10 text-danger",
  suspended: "border-danger/40 bg-danger/10 text-danger",
};

export function StatusBadge({ status, label }: { status: string; label?: string }) {
  const tone = TONES[status] ?? "border-tint/10 bg-steel text-ash";
  return (
    <span className={`inline-flex items-center rounded-[2px] border px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.1em] ${tone}`}>
      {label ?? status.replace(/_/g, " ")}
    </span>
  );
}

export function Notice({ tone = "info", children }: { tone?: "info" | "error" | "ok"; children: ReactNode }) {
  const cls =
    tone === "error"
      ? "border-danger/40 bg-danger/10 text-danger"
      : tone === "ok"
        ? "border-accent/40 bg-accent/10 text-chalk"
        : "border-tint/10 bg-steel text-ash";
  return (
    <p role={tone === "error" ? "alert" : "status"} className={`rounded-[2px] border px-3 py-2 text-sm ${cls}`}>
      {children}
    </p>
  );
}

const FOCUSABLE = 'a[href],button:not([disabled]),textarea:not([disabled]),input:not([disabled]),select:not([disabled]),[tabindex]:not([tabindex="-1"])';

/** Accessible modal: labelled, focus is trapped, Esc and the backdrop close it, focus returns to the opener. */
export function Modal({
  open,
  title,
  onClose,
  children,
  wide = false,
}: {
  open: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
  wide?: boolean;
}) {
  const titleId = useId();
  const box = useRef<HTMLDivElement>(null);
  const closeRef = useRef(onClose);
  closeRef.current = onClose;

  useEffect(() => {
    if (!open) return;
    const opener = document.activeElement as HTMLElement | null;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const first = box.current?.querySelector<HTMLElement>("[data-autofocus]") ?? box.current?.querySelector<HTMLElement>(FOCUSABLE);
    first?.focus();
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        e.stopPropagation();
        closeRef.current();
        return;
      }
      if (e.key !== "Tab" || !box.current) return;
      const items = [...box.current.querySelectorAll<HTMLElement>(FOCUSABLE)];
      if (items.length === 0) return;
      const a = items[0];
      const z = items[items.length - 1];
      if (e.shiftKey && document.activeElement === a) {
        e.preventDefault();
        z.focus();
      } else if (!e.shiftKey && document.activeElement === z) {
        e.preventDefault();
        a.focus();
      }
    }
    document.addEventListener("keydown", onKey, true);
    return () => {
      document.removeEventListener("keydown", onKey, true);
      document.body.style.overflow = prevOverflow;
      opener?.focus?.();
    };
  }, [open]);

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[100] flex items-end justify-center bg-void/80 p-0 sm:items-center sm:p-4" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div
        ref={box}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className={`card max-h-[92vh] w-full overflow-y-auto bg-carbon p-5 ${wide ? "sm:max-w-3xl" : "sm:max-w-md"}`}
      >
        <div className="mb-4 flex items-start justify-between gap-3">
          <h2 id={titleId} className="font-display text-lg font-extrabold uppercase leading-tight">
            {title}
          </h2>
          <button type="button" onClick={onClose} aria-label="Close dialog" className="rounded-[2px] p-1 text-ash hover:text-chalk">
            <X size={18} aria-hidden />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

export function Field({ label, error, children }: { label: string; error?: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="label">{label}</span>
      {children}
      {error ? <span className="mt-1 block text-xs text-danger">{error}</span> : null}
    </label>
  );
}
