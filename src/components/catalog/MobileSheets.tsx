"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { Icon } from "@/components/ui/Icon";
import { SORTS, type SortKey } from "@/lib/catalog/filters";

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

/**
 * A bottom sheet for phones (filters, sort, the car picker). Escape and the backdrop close it, body
 * scroll is locked, Tab stays inside, focus returns to whatever opened it, and it closes itself if
 * the viewport grows past `closeAbove` while open.
 */
export function Sheet({
  title,
  onClose,
  footer,
  full = false,
  closeAbove = "(min-width: 48rem)",
  children,
}: {
  title: string;
  onClose: () => void;
  footer?: ReactNode;
  /** Full height (the filter sheet) rather than fitted to its content. */
  full?: boolean;
  closeAbove?: string;
  children: ReactNode;
}) {
  const [shown, setShown] = useState(false);
  const sheet = useRef<HTMLDivElement>(null);
  const closeBtn = useRef<HTMLButtonElement>(null);
  const close = useRef(onClose);
  useEffect(() => {
    close.current = onClose;
  });

  useEffect(() => {
    const opener = document.activeElement as HTMLElement | null;
    const raf = requestAnimationFrame(() => {
      setShown(true);
      closeBtn.current?.focus();
    });
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        close.current();
        return;
      }
      if (e.key !== "Tab" || !sheet.current) return;
      const els = Array.from(sheet.current.querySelectorAll<HTMLElement>(FOCUSABLE));
      if (els.length === 0) return;
      const first = els[0];
      const last = els[els.length - 1];
      const cur = document.activeElement;
      if (!sheet.current.contains(cur)) {
        e.preventDefault();
        first.focus();
      } else if (e.shiftKey && cur === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && cur === last) {
        e.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", onKey);
    const mq = window.matchMedia(closeAbove);
    const onBreakpoint = (e: MediaQueryListEvent) => e.matches && close.current();
    mq.addEventListener("change", onBreakpoint);

    return () => {
      cancelAnimationFrame(raf);
      document.removeEventListener("keydown", onKey);
      mq.removeEventListener("change", onBreakpoint);
      document.body.style.overflow = prevOverflow;
      opener?.focus?.();
    };
  }, [closeAbove]);

  return (
    <div className="cl-scope fixed inset-0 z-[80]" role="dialog" aria-modal="true" aria-label={title}>
      <button
        type="button"
        tabIndex={-1}
        aria-label={`Close ${title.toLowerCase()}`}
        onClick={onClose}
        className={`absolute inset-0 bg-black/55 transition-opacity duration-200 ${shown ? "opacity-100" : "opacity-0"}`}
      />
      <div
        ref={sheet}
        className={`absolute inset-x-0 bottom-0 flex flex-col rounded-t-[var(--radius-cl)] bg-cl-surface text-cl-ink shadow-2xl transition-transform duration-300 ${
          full ? "top-[max(1rem,env(safe-area-inset-top))]" : "max-h-[88dvh]"
        } ${shown ? "translate-y-0" : "translate-y-full"}`}
      >
        <div className="flex shrink-0 items-center justify-between border-b border-cl-line px-4 py-2">
          <p className="font-display text-lg font-extrabold uppercase">{title}</p>
          <button
            ref={closeBtn}
            type="button"
            onClick={onClose}
            aria-label={`Close ${title.toLowerCase()}`}
            className="grid h-11 w-11 place-items-center rounded-full text-cl-ink hover:bg-cl-fill"
          >
            <Icon name="close" size={20} />
          </button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-4">{children}</div>
        {footer && (
          <div className="shrink-0 border-t border-cl-line px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">{footer}</div>
        )}
      </div>
    </div>
  );
}

/** The sort options as a list of radio buttons, for the phone "Sort" sheet. */
export function SortSheet({ value, onChange, onClose }: { value: SortKey; onChange: (s: SortKey) => void; onClose: () => void }) {
  return (
    <Sheet title="Sort" onClose={onClose}>
      <fieldset>
        <legend className="sr-only">Sort products</legend>
        <ul className="divide-y divide-cl-line">
          {SORTS.filter((s) => s.key !== "rating").map((s) => (
            <li key={s.key}>
              <label className="flex min-h-[52px] cursor-pointer items-center justify-between gap-3 text-[15px]">
                {s.label}
                <input
                  type="radio"
                  name="cl-sort"
                  checked={value === s.key}
                  onChange={() => {
                    onChange(s.key);
                    onClose();
                  }}
                  className="h-5 w-5 accent-[var(--cl-ink)]"
                />
              </label>
            </li>
          ))}
        </ul>
      </fieldset>
    </Sheet>
  );
}
