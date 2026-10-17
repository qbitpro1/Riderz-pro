"use client";

import { Check, Columns2, Plus } from "lucide-react";
import { COMPARE_MAX, LOW_STOCK, fitChip, maxFor, offPct, type Car } from "./lib";
import { Photo, Price, Stepper } from "./parts";
import type { ScreenProduct } from "./types";

export type TileActions = {
  car: Car | null;
  qtys: Record<string, number>;
  compare: string[];
  onOpen: (p: ScreenProduct) => void;
  onSetQty: (id: string, qty: number) => void;
  onToggleCompare: (id: string) => void;
};

/**
 * A photo-first product tile: a big photo on the showroom backdrop, then brand, title, price,
 * MRP and saving, what it fits, and a stock hint when it is nearly gone. Tapping the tile opens the
 * product; "Add" puts one in the order and turns into a quantity stepper.
 */
export function ProductTile({
  product: p,
  actions,
  compact = false,
}: {
  product: ScreenProduct;
  actions: TileActions;
  compact?: boolean;
}) {
  const { car, qtys, compare, onOpen, onSetQty, onToggleCompare } = actions;
  const qty = qtys[p.id] ?? 0;
  const max = maxFor(p);
  const off = offPct(p);
  const fit = fitChip(p, car);
  const low = p.stock <= LOW_STOCK;
  const inCompare = compare.includes(p.id);
  const compareFull = !inCompare && compare.length >= COMPARE_MAX;

  return (
    <article className="group relative flex h-full flex-col overflow-hidden rounded-3xl bg-void shadow-sm ring-1 ring-tint/5 transition-shadow duration-300 hover:shadow-lg">
      <button
        type="button"
        onClick={() => onOpen(p)}
        className="flex flex-1 flex-col text-left transition-transform duration-200 active:scale-[0.99]"
        aria-label={`${p.title}, ${p.brand}. View details`}
      >
        <div className="relative">
          <Photo
            id={p.images[0]}
            alt=""
            sizes="(min-width:1700px) 20vw, (min-width:1280px) 22vw, (min-width:1024px) 28vw, (min-width:640px) 32vw, 48vw"
            className={compact ? "aspect-[4/3] w-full" : "aspect-[5/4] w-full"}
            pad="p-4"
          />
          {off > 0 && (
            <span className="absolute left-3 top-3 rounded-full bg-accent px-3 py-1 text-sm font-bold text-on-accent tnum">{off}% off</span>
          )}
          {low && (
            <span className="absolute right-3 top-3 rounded-full bg-gold/15 px-3 py-1 text-sm font-bold text-gold">
              Only {p.stock} left
            </span>
          )}
          {fit && (
            <span
              className={`absolute bottom-3 left-3 max-w-[70%] truncate rounded-full px-2.5 py-1 text-xs font-semibold shadow-sm ${
                fit.match ? "bg-chalk text-void" : "bg-void text-ash"
              }`}
            >
              {fit.text}
            </span>
          )}
        </div>
        <div className={`flex flex-1 flex-col gap-1 ${compact ? "p-3" : "px-4 pb-3 pt-3.5"}`}>
          <p className="truncate text-xs font-bold uppercase tracking-[0.14em] text-dim">{p.brand}</p>
          <p className={`line-clamp-2 font-bold leading-snug text-chalk ${compact ? "text-[15px]" : "text-lg xl:text-xl"}`}>{p.title}</p>
          <Price p={p} size={compact ? "sm" : "md"} className="mt-auto pt-1.5" />
        </div>
      </button>

      <div className={compact ? "px-3 pb-3" : "px-4 pb-4"}>
        {qty === 0 ? (
          <button
            type="button"
            onClick={() => onSetQty(p.id, 1)}
            className="inline-flex min-h-14 w-full items-center justify-center gap-2 rounded-full bg-accent text-base font-bold text-on-accent shadow-md transition-transform duration-200 active:scale-[0.97]"
            aria-label={`Add ${p.title} to order`}
          >
            <Plus size={20} aria-hidden /> Add to order
          </button>
        ) : (
          <div className="flex items-center justify-between gap-2">
            <span className="flex items-center gap-1.5 text-sm font-bold text-accent">
              <Check size={16} aria-hidden /> In order
            </span>
            <Stepper value={qty} max={max} onChange={(n) => onSetQty(p.id, n)} label={p.title} compact />
          </div>
        )}
        {!compact && (
          <button
            type="button"
            onClick={() => onToggleCompare(p.id)}
            disabled={compareFull}
            aria-pressed={inCompare}
            aria-label={inCompare ? `Remove ${p.title} from compare` : compareFull ? `Compare is full, ${COMPARE_MAX} products` : `Compare ${p.title}`}
            className={`mt-2 flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl border-2 text-sm font-bold transition-[transform,background-color] duration-200 active:scale-[0.98] disabled:opacity-40 ${
              inCompare ? "border-chalk bg-chalk text-void" : "border-tint/10 text-ash"
            }`}
          >
            {inCompare ? <Check size={18} aria-hidden /> : <Columns2 size={18} aria-hidden />}
            {inCompare ? "Added to compare" : "Compare"}
          </button>
        )}
      </div>
    </article>
  );
}

export function BrowseGrid({ products, actions }: { products: ScreenProduct[]; actions: TileActions }) {
  return (
    <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:gap-5 xl:grid-cols-4 min-[1700px]:grid-cols-5">
      {products.map((p, i) => (
        <li key={p.id} className="ss-rise" style={{ animationDelay: `${Math.min(i, 12) * 28}ms` }}>
          <ProductTile product={p} actions={actions} />
        </li>
      ))}
    </ul>
  );
}
