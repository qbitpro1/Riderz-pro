"use client";

import { useEffect, useId, useRef, type ReactNode } from "react";
import { X } from "lucide-react";

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

/** Open layers, newest last: only the top one answers Escape and traps Tab. */
const stack: string[] = [];

export type LayerKind = "modal" | "full" | "drawer";

/**
 * A modal layer. Focus moves in (to `[data-autofocus]` or the first control), Tab stays inside,
 * Escape closes, and focus returns to what had it. Only the top layer reacts, so a dialog can open
 * over a product sheet. `drawer` is a right-hand panel from `md` up and a bottom sheet below it.
 */
export function Layer({
  label,
  onClose,
  children,
  kind = "modal",
  size = "md",
}: {
  label: string;
  onClose?: () => void;
  children: ReactNode;
  kind?: LayerKind;
  size?: "sm" | "md" | "lg" | "xl";
}) {
  const id = useId();
  const box = useRef<HTMLDivElement>(null);
  const close = useRef(onClose);
  useEffect(() => {
    close.current = onClose;
  });

  useEffect(() => {
    const before = document.activeElement as HTMLElement | null;
    stack.push(id);
    const root = box.current;
    const first = root?.querySelector<HTMLElement>("[data-autofocus]") ?? root?.querySelector<HTMLElement>(FOCUSABLE);
    (first ?? root)?.focus({ preventScroll: true });

    const onKey = (e: KeyboardEvent) => {
      if (stack[stack.length - 1] !== id) return;
      if (e.key === "Escape" && close.current) {
        e.stopPropagation();
        close.current();
        return;
      }
      if (e.key !== "Tab" || !root) return;
      const items = [...root.querySelectorAll<HTMLElement>(FOCUSABLE)].filter((el) => el.offsetParent !== null || el === document.activeElement);
      if (items.length === 0) {
        e.preventDefault();
        return;
      }
      const [a, z] = [items[0], items[items.length - 1]];
      const active = document.activeElement;
      if (e.shiftKey && (active === a || !root.contains(active))) {
        e.preventDefault();
        z.focus();
      } else if (!e.shiftKey && (active === z || !root.contains(active))) {
        e.preventDefault();
        a.focus();
      }
    };
    document.addEventListener("keydown", onKey, true);
    return () => {
      document.removeEventListener("keydown", onKey, true);
      const i = stack.indexOf(id);
      if (i >= 0) stack.splice(i, 1);
      if (before && document.contains(before)) before.focus({ preventScroll: true });
    };
  }, [id]);

  if (kind === "full") {
    return (
      <div
        ref={box}
        role="dialog"
        aria-modal="true"
        aria-label={label}
        tabIndex={-1}
        className="ss-layer ss-sheet fixed inset-0 z-50 flex flex-col bg-void outline-none"
      >
        {children}
      </div>
    );
  }

  if (kind === "drawer") {
    const width = size === "xl" ? "md:w-[520px]" : "md:w-[440px]";
    return (
      <div className="ss-layer fixed inset-0 z-[55]" role="presentation">
        <button type="button" tabIndex={-1} aria-label="Close" onClick={onClose} className="ss-fade absolute inset-0 bg-ink/60 backdrop-blur-[2px]" />
        <div
          ref={box}
          role="dialog"
          aria-modal="true"
          aria-label={label}
          tabIndex={-1}
          className={`ss-drawer absolute inset-x-0 bottom-0 flex max-h-[90dvh] flex-col rounded-t-3xl bg-void shadow-2xl outline-none md:inset-y-0 md:left-auto md:right-0 md:max-h-none md:rounded-none md:rounded-l-3xl ${width}`}
        >
          {children}
        </div>
      </div>
    );
  }

  const w = { sm: "sm:max-w-md", md: "sm:max-w-xl", lg: "sm:max-w-3xl", xl: "sm:max-w-5xl" }[size];
  return (
    <div className="ss-layer fixed inset-0 z-[60] flex items-end justify-center sm:items-center sm:p-6" role="presentation">
      <button type="button" tabIndex={-1} aria-label="Close" onClick={onClose} className="ss-fade absolute inset-0 bg-ink/70 backdrop-blur-sm" />
      <div
        ref={box}
        role="dialog"
        aria-modal="true"
        aria-label={label}
        tabIndex={-1}
        className={`ss-sheet relative flex max-h-[92dvh] w-full flex-col overflow-hidden rounded-t-3xl bg-void shadow-2xl outline-none sm:rounded-3xl ${w}`}
      >
        {children}
      </div>
    </div>
  );
}

export function CloseButton({ onClick, label = "Close" }: { onClick: () => void; label?: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-carbon text-chalk transition-transform duration-200 active:scale-90 hover:bg-steel"
    >
      <X size={22} aria-hidden />
    </button>
  );
}
