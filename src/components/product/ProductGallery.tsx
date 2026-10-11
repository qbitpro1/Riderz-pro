"use client";

import { useState, type KeyboardEvent } from "react";
import { Icon } from "@/components/ui/Icon";
import type { ProductImage } from "@/lib/store/types";
import { imageBackdrop, ProductImageView } from "./ProductImageView";

const MAIN_SIZES = "(min-width:1024px) 46vw, 100vw";

/** Main image plus a thumbnail strip (vertical on desktop, a swipe row on phones). */
export function ProductGallery({ images, brandName }: { images: ProductImage[]; brandName: string }) {
  const [active, setActive] = useState(0);

  if (images.length === 0) {
    return (
      <div className="flex aspect-square w-full flex-col items-center justify-center gap-2 border border-tint/8 bg-graphite p-6 text-center">
        <Icon name="search" size={24} className="text-dim" />
        <span className="font-display text-sm font-bold uppercase tracking-[0.12em] text-ash">{brandName}</span>
        <span className="text-[11px] uppercase tracking-[0.14em] text-dim">Photo not available yet</span>
      </div>
    );
  }

  const index = Math.min(active, images.length - 1);
  const current = images[index];
  const many = images.length > 1;

  const go = (i: number) => setActive((i + images.length) % images.length);
  const onKey = (e: KeyboardEvent) => {
    if (e.key === "ArrowRight" || e.key === "ArrowDown") {
      e.preventDefault();
      go(index + 1);
    } else if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
      e.preventDefault();
      go(index - 1);
    }
  };

  return (
    <div className="flex min-w-0 flex-col gap-3 lg:flex-row-reverse">
      <div
        className={`relative aspect-square w-full overflow-hidden border border-tint/8 lg:flex-1 ${imageBackdrop(current)}`}
        role="group"
        aria-roledescription="carousel"
        aria-label="Product images"
        tabIndex={many ? 0 : undefined}
        onKeyDown={many ? onKey : undefined}
      >
        <ProductImageView key={index} image={current} sizes={MAIN_SIZES} priority={index === 0} />
        {many && (
          <>
            <button
              type="button"
              onClick={() => go(index - 1)}
              aria-label="Previous image"
              className="absolute left-2 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center border border-tint/15 bg-void/80 text-chalk"
            >
              <Icon name="chevron" size={16} className="rotate-180" />
            </button>
            <button
              type="button"
              onClick={() => go(index + 1)}
              aria-label="Next image"
              className="absolute right-2 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center border border-tint/15 bg-void/80 text-chalk"
            >
              <Icon name="chevron" size={16} />
            </button>
            <span className="absolute bottom-2 right-2 bg-void/80 px-2 py-0.5 text-[11px] text-ash tnum" aria-live="polite">
              {index + 1} / {images.length}
            </span>
          </>
        )}
      </div>

      {many && (
        <ul
          className="rail gap-2 pb-1 lg:max-h-[34rem] lg:w-20 lg:flex-col lg:overflow-y-auto lg:overflow-x-hidden lg:pb-0"
          aria-label="Choose image"
        >
          {images.map((img, i) => (
            <li key={i} className="shrink-0">
              <button
                type="button"
                onClick={() => setActive(i)}
                aria-label={`Show image ${i + 1}`}
                aria-current={i === index}
                className={`relative block h-16 w-16 overflow-hidden border-2 lg:h-20 lg:w-20 ${imageBackdrop(img)} ${
                  i === index ? "border-accent" : "border-tint/10 hover:border-tint/30"
                }`}
              >
                <ProductImageView image={img} sizes="80px" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
