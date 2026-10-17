"use client";

import { useState } from "react";
import { ArrowLeft, CarFront, Check } from "lucide-react";
import { CloseButton, Layer } from "./Layer";
import type { Car } from "./lib";
import { ui } from "./lib";
import type { ScreenFitBrand } from "./types";

/**
 * "Find for my car": brand first, then model. Choosing a model narrows the store to products
 * listed for that model plus the universal ones. Models this store has products for come first.
 */
export function CarPicker({
  brands,
  car,
  onPick,
  onClose,
}: {
  brands: ScreenFitBrand[];
  car: Car | null;
  onPick: (car: Car | null) => void;
  onClose: () => void;
}) {
  const [brandSlug, setBrandSlug] = useState<string | null>(car ? (brands.find((b) => b.name === car.brand)?.slug ?? null) : null);
  const brand = brands.find((b) => b.slug === brandSlug) ?? null;

  return (
    <Layer label="Find for my car" onClose={onClose} size="xl">
      <div className="flex items-center gap-3 border-b border-tint/10 px-5 py-4 md:px-8">
        {brand && (
          <button type="button" onClick={() => setBrandSlug(null)} className={ui.icon} aria-label="Back to brands">
            <ArrowLeft size={20} aria-hidden />
          </button>
        )}
        <div className="min-w-0 flex-1">
          <h2 className="font-display text-2xl font-extrabold tracking-tight text-chalk md:text-3xl">
            {brand ? `Which ${brand.name}?` : "What do you drive?"}
          </h2>
          <p className="text-sm text-ash md:text-base">
            {brand ? "Pick your model to see what fits it." : "Pick the brand, then the model. We show what fits it, plus universal products."}
          </p>
        </div>
        <CloseButton onClick={onClose} />
      </div>

      <div className="ss-scroll min-h-0 flex-1 overflow-y-auto p-5 md:p-8">
        {!brand ? (
          <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
            {brands.map((b) => (
              <li key={b.slug}>
                <button
                  type="button"
                  data-autofocus={b.slug === brands[0]?.slug ? true : undefined}
                  onClick={() => setBrandSlug(b.slug)}
                  className="flex min-h-20 w-full flex-col items-start justify-center gap-0.5 rounded-2xl border border-tint/12 bg-carbon px-4 py-3 text-left transition-[transform,border-color] duration-200 active:scale-[0.97] hover:border-accent"
                >
                  <span className="font-display text-lg font-extrabold tracking-tight text-chalk">{b.name}</span>
                  <span className={`text-sm ${b.n > 0 ? "font-semibold text-accent" : "text-dim"}`}>
                    {b.n > 0 ? `${b.n} fitting ${b.n === 1 ? "product" : "products"}` : `${b.models.length} models`}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
            {brand.models.map((m) => {
              const picked = car?.slug === m.slug;
              return (
                <li key={m.slug}>
                  <button
                    type="button"
                    aria-pressed={picked}
                    onClick={() => onPick({ slug: m.slug, name: m.name, brand: brand.name })}
                    className={`flex min-h-20 w-full flex-col items-start justify-center gap-0.5 rounded-2xl border px-4 py-3 text-left transition-[transform,border-color] duration-200 active:scale-[0.97] ${
                      picked ? "border-accent bg-accent/10" : "border-tint/12 bg-carbon hover:border-accent"
                    }`}
                  >
                    <span className="flex w-full items-center justify-between gap-2 font-display text-lg font-extrabold tracking-tight text-chalk">
                      {m.name}
                      {picked && <Check size={18} className="text-accent" aria-hidden />}
                    </span>
                    <span className={`text-sm ${m.n > 0 ? "font-semibold text-accent" : "text-dim"}`}>
                      {m.n > 0 ? `${m.n} made for it` : "Universal only"}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {car && (
        <div className="flex items-center justify-between gap-3 border-t border-tint/10 px-5 py-4 md:px-8">
          <p className="flex min-w-0 items-center gap-2 text-base text-ash">
            <CarFront size={20} className="shrink-0 text-accent" aria-hidden />
            <span className="truncate">
              Showing products for your <strong className="font-bold text-chalk">{car.brand} {car.name}</strong>
            </span>
          </p>
          <button type="button" onClick={() => onPick(null)} className={`${ui.secondary} min-h-12 shrink-0`}>
            Show everything
          </button>
        </div>
      )}
    </Layer>
  );
}
