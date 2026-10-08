"use client";

import { useState } from "react";
import { Icon } from "./Icon";

export type QA = { q: string; a: string };

export function Accordion({ items }: { items: QA[] }) {
  const [open, setOpen] = useState<number | null>(0);

  return (
    <div className="divide-y divide-white/8 border-y border-white/8">
      {items.map((item, i) => {
        const isOpen = open === i;
        return (
          <div key={item.q}>
            <button
              type="button"
              onClick={() => setOpen(isOpen ? null : i)}
              aria-expanded={isOpen}
              className="flex w-full items-center justify-between gap-4 py-4 text-left"
            >
              <span className="font-display text-sm font-bold uppercase tracking-[0.04em] md:text-base">
                {item.q}
              </span>
              <Icon
                name={isOpen ? "minus" : "plus"}
                size={18}
                className="shrink-0 text-accent transition-transform"
              />
            </button>
            <div
              className="grid transition-[grid-template-rows] duration-300 ease-out"
              style={{ gridTemplateRows: isOpen ? "1fr" : "0fr" }}
            >
              <div className="overflow-hidden">
                <p className="pb-5 text-sm leading-relaxed text-ash">{item.a}</p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
