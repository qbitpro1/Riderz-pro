"use client";

import { useEffect, useState } from "react";
import { useBe6Build } from "./BuildState";
import { lakh } from "@/lib/format";

/**
 * Sticky mobile controls: EXPLORE · BUILD · GET QUOTE.
 *
 * Sits above the site's bottom nav rather than replacing it, and only appears
 * once the hero is off screen — a sticky bar over a full-screen hero fights
 * the thing it is meant to support.
 */

const LINKS = [
  { href: "#explore", label: "EXPLORE" },
  { href: "#build", label: "BUILD" },
  { href: "#quote", label: "GET QUOTE" },
];

export function StickyBar() {
  const [shown, setShown] = useState(false);
  const { selected } = useBe6Build();

  useEffect(() => {
    const hero = document.getElementById("be6-hero");
    if (!hero || typeof IntersectionObserver === "undefined") {
      setShown(true);
      return;
    }
    const io = new IntersectionObserver(([entry]) => setShown(!entry.isIntersecting), { threshold: 0.15 });
    io.observe(hero);
    return () => io.disconnect();
  }, []);

  const total = (selected.factoryPrice ?? 0) + selected.upgradeTotal;

  return (
    <div
      aria-hidden={!shown}
      className={`glass fixed inset-x-0 z-40 border-t transition-transform duration-300 lg:hidden ${
        shown ? "translate-y-0" : "translate-y-full"
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
            tabIndex={shown ? 0 : -1}
            className={`btn btn-sm shrink-0 ${i === LINKS.length - 1 ? "btn-accent" : "btn-outline"}`}
          >
            {l.label}
          </a>
        ))}
      </div>
    </div>
  );
}
