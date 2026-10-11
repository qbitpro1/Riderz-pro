"use client";

import Link from "next/link";
import { useState } from "react";
import { Icon } from "@/components/ui/Icon";
import type { FaqItem } from "@/lib/data/faq";

/**
 * Same look as the shared Accordion, but each answer carries a link to the
 * policy section it is based on (the shared Accordion only renders plain text).
 */
export function FaqList({ items, idPrefix }: { items: FaqItem[]; idPrefix: string }) {
  const [open, setOpen] = useState<number | null>(null);

  return (
    <div className="divide-y divide-tint/8 border-y border-tint/8">
      {items.map((item, i) => {
        const isOpen = open === i;
        const panelId = `${idPrefix}-${i}`;
        return (
          <div key={item.q}>
            <h3>
              <button
                type="button"
                onClick={() => setOpen(isOpen ? null : i)}
                aria-expanded={isOpen}
                aria-controls={panelId}
                className="flex w-full items-center justify-between gap-4 py-4 text-left"
              >
                <span className="font-display text-sm font-bold uppercase tracking-[0.04em] md:text-base">
                  {item.q}
                </span>
                <Icon name={isOpen ? "minus" : "plus"} size={18} className="shrink-0 text-accent" />
              </button>
            </h3>
            <div
              id={panelId}
              className="grid transition-[grid-template-rows] duration-300 ease-out"
              style={{ gridTemplateRows: isOpen ? "1fr" : "0fr" }}
            >
              <div className="overflow-hidden">
                <p className="text-sm leading-relaxed text-ash">{item.a}</p>
                <p className="pb-5 pt-2 text-xs">
                  <Link href={item.href} className="inline-flex items-center gap-1.5 text-accent underline underline-offset-4">
                    {item.hrefLabel}
                    <Icon name="arrow" size={12} />
                  </Link>
                </p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
