"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { STICKY_BAR_VAR } from "./useStickyBarOffset";
import { Icon } from "@/components/ui/Icon";
import { AssistantChat } from "@/components/assistant/AssistantChat";
import { OPEN_ASSISTANT_EVENT } from "@/components/catalog/FilterSidebar";

/**
 * The chat button at the bottom right of every shopper page. It opens a small window with the AI
 * shopping assistant (the same conversation as /assistant, kept in this tab). On phones the window
 * is a sheet above the bottom bar; from `md` up it is a panel in the corner.
 */
export function AssistantFab() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const button = useRef<HTMLButtonElement>(null);
  const panel = useRef<HTMLDivElement>(null);

  // Product pages pin an add-to-cart bar (BuyBox, which does not publish its own height) above the
  // bottom nav on phones. The PPF and BE 6 bars publish theirs through useStickyBarOffset; the
  // button and the footer clear whichever is there.
  const onProduct = pathname.startsWith("/products/");
  useEffect(() => {
    if (!onProduct) return;
    const root = document.documentElement;
    root.style.setProperty(STICKY_BAR_VAR, "76px");
    return () => {
      root.style.removeProperty(STICKY_BAR_VAR);
    };
  }, [onProduct]);

  // Moving to another page closes the window (a product link from the chat, for one).
  const [shownFor, setShownFor] = useState(pathname);
  if (shownFor !== pathname) {
    setShownFor(pathname);
    setOpen(false);
  }

  useEffect(() => {
    if (!open) return;
    panel.current?.querySelector<HTMLElement>("[data-autofocus]")?.focus({ preventScroll: true });
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      setOpen(false);
      button.current?.focus();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  // "Ask AI" elsewhere on the page (the listing filters) opens this window.
  useEffect(() => {
    const onOpen = () => setOpen(true);
    window.addEventListener(OPEN_ASSISTANT_EVENT, onOpen);
    return () => window.removeEventListener(OPEN_ASSISTANT_EVENT, onOpen);
  }, []);

  // The full-page assistant is already on screen there.
  if (pathname === "/assistant") return null;

  const bottom = "bottom-[calc(76px+var(--sticky-bar-h,0px)+env(safe-area-inset-bottom))] lg:bottom-6";
  // On the cart (which is also checkout) the floating button sat over the quantity controls and the
  // address fields on phones and tablets, so it is hidden there below desktop width.
  const offOnSmall = pathname === "/cart" ? "max-lg:hidden" : "";

  return (
    <>
      {open && (
        <div
          ref={panel}
          id="assistant-window"
          role="dialog"
          aria-label="AI shopping assistant"
          className={`fs-panel fixed inset-x-3 top-20 z-[60] flex flex-col overflow-hidden text-cl-ink ${bottom} md:inset-x-auto md:top-auto md:right-6 md:h-[min(600px,calc(100dvh-8rem))] md:w-[400px] lg:bottom-24`}
        >
          <div className="flex items-center justify-between gap-3 border-b border-cl-ink/[0.07] px-4 py-3.5">
            <div className="flex min-w-0 items-center gap-3">
              <span className="fs-icon h-10 w-10" aria-hidden="true">
                <Icon name="spark" size={18} />
              </span>
              <div className="min-w-0">
                <p className="text-[15px] font-semibold tracking-[-0.01em]">AI assistant</p>
                <p className="truncate text-[12px] text-cl-muted">Parts that fit your car, within budget</p>
              </div>
            </div>
            <div className="flex shrink-0 items-center gap-1.5">
              <Link
                href="/assistant"
                aria-label="Open the assistant full screen"
                title="Full screen"
                className="fs-well grid h-9 w-9 place-items-center rounded-full text-cl-muted transition-colors hover:bg-cl-ink/[0.06] hover:text-cl-ink"
              >
                <Icon name="arrow" size={15} className="-rotate-45" />
              </Link>
              <button
                type="button"
                onClick={() => {
                  setOpen(false);
                  // On a desktop listing the floating button is hidden; focus it only when it shows.
                  button.current?.focus();
                }}
                aria-label="Close the assistant"
                className="fs-well grid h-9 w-9 place-items-center rounded-full text-cl-muted transition-colors hover:bg-cl-ink/[0.06] hover:text-cl-ink"
              >
                <Icon name="close" size={15} />
              </button>
            </div>
          </div>
          <div className="min-h-0 flex-1">
            <AssistantChat compact />
          </div>
        </div>
      )}

      <button
        ref={button}
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-controls="assistant-window"
        aria-label={open ? "Close the AI assistant" : "Ask our AI assistant"}
        className={`assistant-fab fixed right-4 z-50 flex h-13 items-center gap-2 rounded-full bg-accent py-3 pl-3.5 pr-4 font-display text-xs font-bold uppercase tracking-[0.12em] text-on-accent shadow-[0_14px_40px_-12px_rgba(0,0,0,0.8)] transition-transform hover:-translate-y-0.5 lg:right-6 ${bottom} ${offOnSmall} ${open ? "max-md:hidden" : ""}`}
      >
        <Icon name={open ? "close" : "spark"} size={19} />
        <span className="hidden xs:inline">{open ? "Close" : "Ask AI"}</span>
      </button>
    </>
  );
}
