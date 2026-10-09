"use client";

import Image from "next/image";
import { useState } from "react";
import { Icon } from "@/components/ui/Icon";
import type { CatalogImage } from "@/lib/data/recoil";

export function ProductGallery({ images, sku }: { images: CatalogImage[]; sku: string }) {
  const [active, setActive] = useState(0);

  if (images.length === 0) {
    return (
      <div className="card flex aspect-square flex-col items-center justify-center gap-3 p-8 text-center">
        <Icon name="shield" size={28} className="text-gold" />
        <p className="font-display text-sm font-bold uppercase tracking-[0.12em] text-gold">
          Image verification required
        </p>
        <p className="max-w-xs text-xs leading-relaxed text-ash">
          We have not been able to match an authentic manufacturer image to {sku}. Rather than show
          you a photo of a similar model, we are showing you nothing until it is verified.
        </p>
      </div>
    );
  }

  const current = images[active];

  return (
    <div>
      <div className="card relative aspect-square overflow-hidden bg-[#f3f4f5]">
        <Image
          src={current.url}
          alt={current.alt}
          fill
          sizes="(min-width:1024px) 50vw, 100vw"
          priority
          className="object-contain p-6"
        />
      </div>

      {images.length > 1 && (
        <ul className="mt-3 grid grid-cols-5 gap-2 sm:grid-cols-7">
          {images.map((img, i) => (
            <li key={img.url}>
              <button
                type="button"
                onClick={() => setActive(i)}
                aria-label={`View image ${i + 1} of ${images.length}`}
                aria-current={i === active}
                className={`relative block aspect-square w-full overflow-hidden border bg-[#f3f4f5] transition-colors ${
                  i === active ? "border-accent" : "border-tint/10 hover:border-tint/30"
                }`}
              >
                <Image src={img.url} alt="" fill sizes="80px" className="object-contain p-1.5" />
              </button>
            </li>
          ))}
        </ul>
      )}

      <p className="mt-3 flex flex-wrap items-center gap-1.5 text-[10px] leading-relaxed text-dim">
        <Icon name="check" size={11} className="text-accent" />
        Manufacturer image, {current.sourceLabel} —{" "}
        <a
          href={current.sourceUrl}
          target="_blank"
          rel="noreferrer noopener"
          className="underline underline-offset-2 hover:text-accent"
        >
          {current.source}
        </a>
        <span className="opacity-60">· matched to {current.sku} · used under reseller marketing permission</span>
      </p>
    </div>
  );
}
