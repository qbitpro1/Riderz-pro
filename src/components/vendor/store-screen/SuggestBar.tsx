"use client";

import { Check, Plus, X } from "lucide-react";
import { rupees } from "@/lib/format";
import { ui } from "./lib";
import { Photo } from "./parts";
import type { ScreenProduct } from "./types";

/** A small "Bestseller" tag for tiles and the product sheet. */
export function BestsellerTag({ className = "" }: { className?: string }) {
  return (
    <span className={`inline-flex items-center gap-1 rounded-full bg-gold px-2.5 py-1 text-xs font-extrabold uppercase tracking-[0.08em] text-void ${className}`}>
      ★ Bestseller
    </span>
  );
}

/**
 * Shown after something goes into the order: "Added …" and, below it, a few products that go
 * well with it ("Car Cover" → mats, car care), each one tap from the order.
 */
export function SuggestBar({
  added,
  items,
  onAdd,
  onOpen,
  onViewOrder,
  onClose,
}: {
  added: string;
  items: ScreenProduct[];
  onAdd: (p: ScreenProduct) => void;
  onOpen: (p: ScreenProduct) => void;
  onViewOrder: () => void;
  onClose: () => void;
}) {
  return (
    <div role="status" className="ss-pop fixed inset-x-0 bottom-24 z-[70] flex justify-center px-3 md:bottom-6">
      <div className="w-full max-w-3xl rounded-3xl bg-void p-4 shadow-2xl ring-1 ring-tint/10 md:p-5">
        <div className="flex items-center gap-3">
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-accent text-on-accent">
            <Check size={20} aria-hidden />
          </span>
          <p className="min-w-0 flex-1 truncate text-base font-bold text-chalk">{added}</p>
          <button type="button" onClick={onViewOrder} className={`${ui.primary} h-12 shrink-0 px-4 text-base`}>
            View order
          </button>
          <button type="button" onClick={onClose} aria-label="Close suggestions" className="grid h-12 w-12 shrink-0 place-items-center rounded-full text-dim hover:bg-steel hover:text-chalk">
            <X size={20} aria-hidden />
          </button>
        </div>
        {items.length > 0 && (
          <>
            <p className="mt-4 text-sm font-bold uppercase tracking-[0.14em] text-accent">Goes well with it</p>
            <ul className="ss-hide-bar mt-2 flex gap-3 overflow-x-auto pb-1">
              {items.map((p) => (
                <li key={p.id} className="w-40 shrink-0 overflow-hidden rounded-2xl border border-tint/10 bg-carbon md:w-44">
                  <button type="button" onClick={() => onOpen(p)} className="block w-full text-left">
                    <span className="relative block">
                      <Photo id={p.images[0]} alt="" sizes="176px" className="aspect-square" pad="p-2" />
                      {p.bestseller && <BestsellerTag className="absolute left-2 top-2 px-2 py-0.5 text-[10px]" />}
                    </span>
                    <span className="block px-3 pt-2 text-xs font-semibold text-dim">{p.groupName}</span>
                    <span className="line-clamp-2 block px-3 text-sm font-semibold leading-snug text-chalk">{p.title}</span>
                    <span className="tnum block px-3 pt-1 text-base font-bold text-chalk">{rupees(p.price)}</span>
                  </button>
                  <div className="p-3 pt-2">
                    <button type="button" onClick={() => onAdd(p)} className={`${ui.secondary} min-h-11 w-full px-2 text-sm`}>
                      <Plus size={16} aria-hidden /> Add
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          </>
        )}
      </div>
    </div>
  );
}
