"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
  { href: "/account", label: "Overview" },
  { href: "/account/orders", label: "Orders" },
  { href: "/account/addresses", label: "Addresses" },
  { href: "/account/help", label: "Help" },
  { href: "/account/settings", label: "Settings" },
];

/** Fade the edge where more tabs are hidden, so a phone shows that the row scrolls. */
const FADE = {
  none: "",
  right: "[mask-image:linear-gradient(to_right,#000_80%,transparent)]",
  left: "[mask-image:linear-gradient(to_left,#000_80%,transparent)]",
  both: "[mask-image:linear-gradient(to_right,transparent,#000_15%,#000_85%,transparent)]",
} as const;

export function AccountNav() {
  const pathname = usePathname();
  const nav = useRef<HTMLElement>(null);
  const [fade, setFade] = useState<keyof typeof FADE>("none");

  useEffect(() => {
    const el = nav.current;
    if (!el) return;
    const update = () => {
      const more = el.scrollWidth - el.clientWidth;
      const atStart = el.scrollLeft <= 1;
      const atEnd = el.scrollLeft >= more - 1;
      setFade(more <= 1 ? "none" : atStart ? "right" : atEnd ? "left" : "both");
    };
    // Bring the current tab into view (Help and Settings start off-screen on a narrow phone).
    const current = el.querySelector<HTMLElement>('[aria-current="page"]');
    if (current) {
      const left = current.offsetLeft - (el.clientWidth - current.offsetWidth) / 2;
      el.scrollLeft = Math.max(0, left);
    }
    update();
    el.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      el.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, [pathname]);

  return (
    <nav ref={nav} aria-label="Account" className={`-mx-4 overflow-x-auto px-4 [scrollbar-width:none] sm:mx-0 sm:px-0 ${FADE[fade]}`}>
      <ul className="flex min-w-max gap-1 border-b border-tint/10">
        {TABS.map((t) => {
          const on = t.href === "/account" ? pathname === "/account" : pathname === t.href || pathname.startsWith(`${t.href}/`);
          return (
            <li key={t.href}>
              <Link
                href={t.href}
                aria-current={on ? "page" : undefined}
                className={`-mb-px inline-flex min-h-11 items-center border-b-2 px-3 text-xs font-bold uppercase tracking-[0.12em] transition-colors ${
                  on ? "border-accent text-chalk" : "border-transparent text-ash hover:text-chalk"
                }`}
              >
                {t.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
