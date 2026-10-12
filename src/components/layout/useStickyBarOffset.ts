"use client";

import { useEffect, type RefObject } from "react";

/** CSS variable holding the height of the sticky action bar that sits above the bottom nav. */
export const STICKY_BAR_VAR = "--sticky-bar-h";

/**
 * Publish a fixed bottom bar's height on <html> while it is mounted and shown,
 * so the WhatsApp button and the footer can clear it without knowing which
 * route they are on. The bars are `lg:hidden`, so the measured height is 0 on
 * desktop. Anything that must clear the bar adds `var(--sticky-bar-h, 0px)`.
 */
export function useStickyBarOffset(ref: RefObject<HTMLElement | null>, active: boolean) {
  useEffect(() => {
    const el = ref.current;
    if (!el || !active) return;
    const root = document.documentElement;
    const set = () => root.style.setProperty(STICKY_BAR_VAR, `${el.offsetHeight}px`);
    set();
    const ro = new ResizeObserver(set);
    ro.observe(el);
    return () => {
      ro.disconnect();
      root.style.removeProperty(STICKY_BAR_VAR);
    };
  }, [ref, active]);
}
