"use client";

import { useEffect, useRef, useState } from "react";
import { useBrowserValue } from "@/lib/client/hooks";
import { useBe6Build } from "./BuildState";
import { lakh } from "@/lib/format";
import { useStickyBarOffset } from "@/components/layout/useStickyBarOffset";

/**
 * Sticky mobile controls: EXPLORE · BUILD · GET QUOTE.
 *
 * Sits above the site's bottom nav rather than replacing it, and only appears
 * once the hero is off screen — a sticky bar over a full-screen hero fights
 * the thing it is meant to support.
 */

const LINKS = [
  { href: "#choose", label: "EXPLORE" },
  { href: "#build", label: "BUILD" },
  { href: "#quote", label: "GET QUOTE" },
];

export function StickyBar() {
  const [pastHero, setShown] = useState(false);
  // No hero to watch (or no IntersectionObserver): the bar is always there.
  const always = useBrowserValue(() => typeof IntersectionObserver === "undefined" || !document.getElementById("be6-hero"), false);
  const shown = pastHero || always;
  const { selected } = useBe6Build();
  const bar = useRef<HTMLDivElement>(null);
  useStickyBarOffset(bar, shown);

  useEffect(() => {
    const hero = document.getElementById("be6-hero");
    if (!hero || always) return;
    const io = new IntersectionObserver(([entry]) => setShown(!entry.isIntersecting), { threshold: 0.15 });
    io.observe(hero);
    return () => io.disconnect();
  }, [always]);

  const total = (selected.factoryPrice ?? 0) + selected.upgradeTotal;

  return (
    <div
      ref={bar}
      inert={!shown}
      className={`glass fixed inset-x-0 z-40 border-t transition-transform duration-300 lg:hidden ${
        shown ? "translate-y-0" : "invisible translate-y-full"
      }`}
      style={{ bottom: "calc(64px + env(safe-area-inset-bottom))" }}
    >
      <div className="flex items-center gap-2 px-3 py-2">
        <div className="min-w-0 flex-1">
          <p className="truncate font-display text-[0.5625rem] uppercase tracking-[0.16em] text-dim">
            {selected.variant.name} · {selected.battery.label}
          </p>
          <p className="tnum truncate font-display text-xs font-bold text-chalk">{lakh(total)}</p>
        </div>
        {LINKS.map((l, i) => (
          <a
            key={l.href}
            href={l.href}
            className={`btn btn-sm shrink-0 ${i === LINKS.length - 1 ? "btn-accent" : "btn-outline"}`}
          >
            {l.label}
          </a>
        ))}
      </div>
    </div>
  );
}
