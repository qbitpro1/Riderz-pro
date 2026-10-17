"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, ImageOff, X, ZoomIn } from "lucide-react";
import { fileHref } from "@/lib/vendor/types";
import { Layer } from "./Layer";
import { Photo } from "./parts";

const reduced = () => typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/**
 * Swipeable gallery: native horizontal scroll-snap (so swiping feels like the phone's own), thumbnails
 * and arrows for a mouse, and a tap on the photo opens a full-screen viewer you can zoom by tapping.
 */
export function Gallery({ images, title, brand }: { images: string[]; title: string; brand: string }) {
  const track = useRef<HTMLDivElement>(null);
  const [index, setIndex] = useState(0);
  const [zoomAt, setZoomAt] = useState<number | null>(null);
  const many = images.length > 1;

  const onScroll = useCallback(() => {
    const el = track.current;
    if (!el || el.clientWidth === 0) return;
    setIndex(Math.max(0, Math.min(images.length - 1, Math.round(el.scrollLeft / el.clientWidth))));
  }, [images.length]);

  const go = (n: number) => {
    const el = track.current;
    if (!el) return;
    const i = (n + images.length) % images.length;
    el.scrollTo({ left: i * el.clientWidth, behavior: reduced() ? "auto" : "smooth" });
  };

  if (images.length === 0) {
    return (
      <div className="grid aspect-square w-full place-items-center rounded-3xl bg-[#f3f4f5] text-center text-dim lg:aspect-auto lg:h-[calc(100dvh-17rem)]">
        <div>
          <ImageOff size={36} className="mx-auto" aria-hidden />
          <p className="mt-2 text-base font-semibold text-ash">{brand}</p>
          <p className="text-sm">Photo coming soon</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-w-0 flex-col gap-3">
      <div className="relative">
        <div
          ref={track}
          onScroll={onScroll}
          role="group"
          aria-roledescription="carousel"
          aria-label={`${title}, photos`}
          className="ss-hide-bar flex aspect-square w-full snap-x snap-mandatory overflow-x-auto overscroll-x-contain rounded-3xl bg-[#f3f4f5] lg:aspect-auto lg:h-[calc(100dvh-17rem)] lg:min-h-[300px]"
        >
          {images.map((id, i) => (
            <button
              key={id}
              type="button"
              onClick={() => setZoomAt(i)}
              aria-label={`Photo ${i + 1} of ${images.length}. Tap to zoom`}
              className="relative h-full w-full shrink-0 snap-center cursor-zoom-in"
            >
              <Photo
                id={id}
                alt={i === 0 ? title : `${title}, photo ${i + 1}`}
                sizes="(min-width:1024px) 50vw, 100vw"
                priority={i === 0}
                className="h-full w-full"
                pad="p-5 md:p-8"
              />
            </button>
          ))}
        </div>
        <span className="pointer-events-none absolute bottom-3 left-3 inline-flex items-center gap-1.5 rounded-full bg-void px-3 py-1.5 text-xs font-semibold text-ash shadow-sm">
          <ZoomIn size={14} aria-hidden /> Tap to zoom
        </span>
        {many && (
          <>
            <button
              type="button"
              onClick={() => go(index - 1)}
              aria-label="Previous photo"
              className="absolute left-3 top-1/2 grid h-12 w-12 -translate-y-1/2 place-items-center rounded-full bg-void text-chalk shadow-md transition-transform active:scale-90"
            >
              <ChevronLeft size={22} aria-hidden />
            </button>
            <button
              type="button"
              onClick={() => go(index + 1)}
              aria-label="Next photo"
              className="absolute right-3 top-1/2 grid h-12 w-12 -translate-y-1/2 place-items-center rounded-full bg-void text-chalk shadow-md transition-transform active:scale-90"
            >
              <ChevronRight size={22} aria-hidden />
            </button>
            <span className="absolute bottom-3 right-3 rounded-full bg-void px-3 py-1.5 text-xs font-semibold text-ash shadow-sm tnum" aria-live="polite">
              {index + 1} / {images.length}
            </span>
          </>
        )}
      </div>

      {many && (
        <ul className="ss-hide-bar flex gap-2.5 overflow-x-auto pb-1" aria-label="Choose photo">
          {images.map((id, i) => (
            <li key={id} className="shrink-0">
              <button
                type="button"
                onClick={() => go(i)}
                aria-label={`Show photo ${i + 1}`}
                aria-current={i === index}
                className={`block h-[4.5rem] w-[4.5rem] overflow-hidden rounded-2xl border-2 transition-colors ${
                  i === index ? "border-accent" : "border-transparent hover:border-tint/25"
                }`}
              >
                <Photo id={id} alt="" sizes="96px" className="h-full w-full" pad="p-1.5" />
              </button>
            </li>
          ))}
        </ul>
      )}

      {zoomAt !== null && <Viewer images={images} start={zoomAt} title={title} onClose={() => setZoomAt(null)} />}
    </div>
  );
}

/** Full-screen photo. Tap to zoom in at that spot (then scroll or drag to look around), tap again to fit. */
function Viewer({ images, start, title, onClose }: { images: string[]; start: number; title: string; onClose: () => void }) {
  const [i, setI] = useState(start);
  const [zoom, setZoom] = useState(false);
  const box = useRef<HTMLDivElement>(null);
  const at = useRef({ x: 0.5, y: 0.5 });

  useLayoutEffect(() => {
    const el = box.current;
    if (!el) return;
    if (zoom) {
      el.scrollLeft = at.current.x * el.scrollWidth - el.clientWidth / 2;
      el.scrollTop = at.current.y * el.scrollHeight - el.clientHeight / 2;
    } else {
      el.scrollLeft = 0;
      el.scrollTop = 0;
    }
  }, [zoom, i]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (zoom || images.length < 2) return;
      if (e.key === "ArrowRight") setI((n) => (n + 1) % images.length);
      if (e.key === "ArrowLeft") setI((n) => (n - 1 + images.length) % images.length);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [zoom, images.length]);

  return (
    <Layer label={`${title}, photo ${i + 1} of ${images.length}`} onClose={onClose} kind="full">
      <div className="flex items-center justify-between gap-3 px-4 py-3">
        <p className="min-w-0 truncate text-base font-semibold text-ash">
          {title} <span className="tnum text-dim">{i + 1}/{images.length}</span>
        </p>
        <button
          type="button"
          onClick={onClose}
          data-autofocus
          className="inline-flex min-h-12 items-center gap-2 rounded-full bg-carbon px-5 text-base font-semibold text-chalk active:scale-95"
        >
          <X size={20} aria-hidden /> Close
        </button>
      </div>
      <div
        ref={box}
        className={`ss-scroll relative min-h-0 flex-1 bg-[#f3f4f5] ${zoom ? "overflow-auto" : "overflow-hidden"}`}
      >
        {/* A plain img: the file endpoint serves the original, which is what zooming needs. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={fileHref(images[i])}
          alt={`${title}, photo ${i + 1}`}
          draggable={false}
          onClick={(e) => {
            const r = e.currentTarget.getBoundingClientRect();
            at.current = { x: (e.clientX - r.left) / r.width, y: (e.clientY - r.top) / r.height };
            setZoom((z) => !z);
          }}
          className={zoom ? "block max-w-none cursor-zoom-out" : "block h-full w-full cursor-zoom-in object-contain p-4"}
          style={zoom ? { width: "230%", height: "auto" } : undefined}
        />
      </div>
      {images.length > 1 && !zoom && (
        <div className="flex justify-center gap-3 p-3">
          <button type="button" onClick={() => setI((n) => (n - 1 + images.length) % images.length)} className="grid h-14 w-14 place-items-center rounded-full bg-carbon" aria-label="Previous photo">
            <ChevronLeft size={24} aria-hidden />
          </button>
          <button type="button" onClick={() => setI((n) => (n + 1) % images.length)} className="grid h-14 w-14 place-items-center rounded-full bg-carbon" aria-label="Next photo">
            <ChevronRight size={24} aria-hidden />
          </button>
        </div>
      )}
    </Layer>
  );
}
