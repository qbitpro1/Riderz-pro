"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { Icon } from "@/components/ui/Icon";
import { useStickyBarOffset } from "@/components/layout/useStickyBarOffset";
import { whatsapp } from "@/lib/data/site";

/**
 * Mobile sticky CTA. PPF customers browse on a phone and decide on a phone, so
 * the three actions that matter stay in reach. Sits above the bottom nav and
 * only appears once the hero has scrolled past.
 */
export function StickyPpfCta({ vehicle }: { vehicle?: string }) {
  const [visible, setVisible] = useState(false);
  const bar = useRef<HTMLDivElement>(null);
  useStickyBarOffset(bar, visible);

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 520);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const message = vehicle
    ? `Hi Riderzpro, I want a PPF quote for my ${vehicle}.`
    : "Hi Riderzpro, I want a PPF quote for my ";

  return (
    <div
      ref={bar}
      inert={!visible}
      className={`fixed inset-x-0 bottom-[calc(64px+env(safe-area-inset-bottom))] z-40 border-t border-tint/10 bg-void/95 backdrop-blur-xl transition-transform duration-300 lg:hidden ${
        visible ? "translate-y-0" : "invisible translate-y-full"
      }`}
    >
      <div className="grid grid-cols-3 gap-2 p-2.5">
        <Link href="/ppf/quote" className="btn btn-accent btn-sm">
          Get quote
        </Link>
        <a href={whatsapp(message)} target="_blank" rel="noreferrer noopener" className="btn btn-whatsapp btn-sm">
          <Icon name="whatsapp" size={14} />
          WhatsApp
        </a>
        <a
          href={whatsapp(`${message} I'd like to book installation.`)}
          target="_blank"
          rel="noreferrer noopener"
          className="btn btn-outline btn-sm"
        >
          Book now
        </a>
      </div>
    </div>
  );
}
