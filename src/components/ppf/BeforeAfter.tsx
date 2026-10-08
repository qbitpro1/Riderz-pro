"use client";

import { useCallback, useRef, useState } from "react";
import { Photo } from "@/components/ui/Photo";
import type { MediaKey } from "@/lib/media";

/**
 * Drag-to-compare slider. Pointer events cover mouse, touch and pen with one
 * code path; the range input underneath keeps it operable by keyboard.
 *
 * When `before` and `after` are the same asset the left half is rendered
 * through a "dulled" filter to illustrate the difference in finish. That is
 * labelled as a simulation on the face of the component — customer before and
 * after sets are shot in the studio and published separately.
 */
export function BeforeAfter({
  before,
  after,
  beforeLabel = "Before",
  afterLabel = "After",
  caption,
}: {
  before: MediaKey;
  after: MediaKey;
  beforeLabel?: string;
  afterLabel?: string;
  caption?: string;
}) {
  const [pos, setPos] = useState(50);
  const wrapRef = useRef<HTMLDivElement>(null);
  const dragging = useRef(false);
  const simulated = before === after;

  const moveTo = useCallback((clientX: number) => {
    const el = wrapRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const pct = ((clientX - rect.left) / rect.width) * 100;
    setPos(Math.min(100, Math.max(0, pct)));
  }, []);

  return (
    <figure className="card overflow-hidden">
      <div
        ref={wrapRef}
        className="relative aspect-[4/3] touch-none select-none md:aspect-[16/10]"
        onPointerDown={(e) => {
          dragging.current = true;
          e.currentTarget.setPointerCapture(e.pointerId);
          moveTo(e.clientX);
        }}
        onPointerMove={(e) => dragging.current && moveTo(e.clientX)}
        onPointerUp={() => {
          dragging.current = false;
        }}
        onPointerCancel={() => {
          dragging.current = false;
        }}
      >
        <Photo media={after} sizes="(min-width:768px) 50vw, 100vw" />

        {/* Clip rather than resize, so the left frame never rescales as you drag. */}
        <div className="absolute inset-0" style={{ clipPath: `inset(0 ${100 - pos}% 0 0)` }}>
          <Photo
            media={before}
            sizes="(min-width:768px) 50vw, 100vw"
            className={simulated ? "saturate-[.5] brightness-[.72] contrast-[.88]" : "brightness-90"}
          />
          {simulated && <div className="absolute inset-0 bg-[#20242b]/35 mix-blend-luminosity" />}
          <span className="absolute bottom-3 left-3 chip bg-void/75">{beforeLabel}</span>
        </div>

        <span className="absolute bottom-3 right-3 chip border-accent/35 bg-accent/15 text-accent">
          {afterLabel}
        </span>

        {simulated && (
          <span className="absolute right-3 top-3 chip bg-void/75 text-dim">Simulated before</span>
        )}

        <div className="pointer-events-none absolute inset-y-0 w-px bg-accent" style={{ left: `${pos}%` }}>
          <span className="absolute left-1/2 top-1/2 grid h-10 w-10 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full border border-accent bg-void/80 backdrop-blur">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-accent">
              <path d="m9 6-5 6 5 6M15 6l5 6-5 6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </span>
        </div>
      </div>

      <label className="sr-only" htmlFor={`ba-${before}-${after}`}>
        Comparison position
      </label>
      <input
        id={`ba-${before}-${after}`}
        type="range"
        min={0}
        max={100}
        value={Math.round(pos)}
        onChange={(e) => setPos(Number(e.target.value))}
        className="h-1 w-full cursor-ew-resize appearance-none bg-white/10 accent-[var(--color-accent)]"
      />

      {caption && <figcaption className="p-4 text-xs leading-relaxed text-ash">{caption}</figcaption>}
    </figure>
  );
}
