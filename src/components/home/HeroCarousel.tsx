"use client";

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { Icon } from "@/components/ui/Icon";

/**
 * Scroll-snap hero. The slides are server-rendered and passed in as children;
 * this only adds prev/next, dots and the active index. No autoplay.
 */
export function HeroCarousel({ children, labels }: { children: ReactNode[]; labels: string[] }) {
  const track = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);
  const count = labels.length;

  const sync = useCallback(() => {
    const el = track.current;
    if (!el || !el.clientWidth) return;
    setActive(Math.min(count - 1, Math.max(0, Math.round(el.scrollLeft / el.clientWidth))));
  }, [count]);

  useEffect(() => {
    window.addEventListener("resize", sync);
    return () => window.removeEventListener("resize", sync);
  }, [sync]);

  const go = (i: number) => {
    const el = track.current;
    if (!el) return;
    const next = (i + count) % count;
    el.scrollTo({ left: next * el.clientWidth, behavior: "smooth" });
  };

  const arrow =
    "flex h-11 w-11 items-center justify-center border border-tint/30 bg-void/60 backdrop-blur hover:border-accent hover:text-accent";

  return (
    <div
      data-theme="dark"
      className="relative bg-void"
      role="group"
      aria-roledescription="carousel"
      aria-label="Featured collections"
    >
      <div
        ref={track}
        onScroll={sync}
        tabIndex={0}
        aria-label="Featured collections, scroll sideways"
        className="rail !gap-0 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-accent"
      >
        {children.map((slide, i) => (
          <div
            key={labels[i]}
            role="group"
            aria-roledescription="slide"
            aria-label={`${i + 1} of ${count}: ${labels[i]}`}
            className="w-full"
          >
            {slide}
          </div>
        ))}
      </div>

      <div className="pointer-events-none absolute inset-x-0 bottom-4 z-10 md:bottom-8">
        <div className="shell flex items-center justify-between">
          <div className="pointer-events-auto flex items-center">
            {labels.map((l, i) => (
              <button
                key={l}
                type="button"
                onClick={() => go(i)}
                aria-label={`Show slide ${i + 1}: ${l}`}
                aria-current={i === active}
                className="flex h-11 w-8 items-center justify-center"
              >
                <span className={`block h-1 transition-all ${i === active ? "w-6 bg-accent" : "w-3 bg-tint/40"}`} />
              </button>
            ))}
          </div>
          <div className="pointer-events-auto flex gap-2">
            <button type="button" onClick={() => go(active - 1)} aria-label="Previous slide" className={arrow}>
              <Icon name="arrow" size={18} className="rotate-180" />
            </button>
            <button type="button" onClick={() => go(active + 1)} aria-label="Next slide" className={arrow}>
              <Icon name="arrow" size={18} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
