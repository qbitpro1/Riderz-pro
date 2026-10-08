"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { Icon } from "@/components/ui/Icon";
import { searchAll, SEARCH_BRANDS, SEARCH_SUGGESTIONS, type SearchEntry } from "@/lib/search";

export function SearchPanel({ onClose }: { onClose: () => void }) {
  const [q, setQ] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  const results = useMemo(() => searchAll(q, 9), [q]);

  return (
    <div className="fixed inset-0 z-[70] flex flex-col bg-void/95 backdrop-blur-xl">
      <div className="shell flex items-center gap-3 py-4">
        <Icon name="search" size={20} className="text-dim" />
        <input
          ref={inputRef}
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search your car, accessory or modification..."
          aria-label="Search Motorbotz"
          className="h-12 flex-1 bg-transparent text-base outline-none placeholder:text-dim"
        />
        <button
          type="button"
          onClick={onClose}
          aria-label="Close search"
          className="grid h-10 w-10 place-items-center text-ash transition-colors hover:text-chalk"
        >
          <Icon name="close" size={22} />
        </button>
      </div>

      <div className="hairline" />

      <div className="shell flex-1 overflow-y-auto py-6">
        {q.length < 2 ? (
          <>
            <p className="eyebrow mb-4">Search by brand</p>
            <ul className="mb-8 grid gap-px overflow-hidden border border-white/8 bg-white/8 sm:grid-cols-2 lg:grid-cols-4">
              {SEARCH_BRANDS.map((b) => (
                <li key={b.slug} className="bg-void">
                  <Link
                    href={b.href}
                    onClick={onClose}
                    className="group flex items-center justify-between gap-3 p-4 transition-colors hover:bg-white/4"
                  >
                    <span className="min-w-0">
                      <span className="block truncate font-display text-base font-extrabold uppercase tracking-[-0.02em] group-hover:text-accent">
                        {b.name}
                      </span>
                      <span className="block text-[11px] text-dim tnum">
                        {b.count > 0 ? `${b.count} products` : "Coming soon"}
                      </span>
                    </span>
                    <Icon name="arrow" size={15} className="shrink-0 text-dim group-hover:text-accent" />
                  </Link>
                </li>
              ))}
            </ul>

            <p className="eyebrow mb-4">Popular right now</p>
            <div className="flex flex-wrap gap-2">
              {SEARCH_SUGGESTIONS.map((s) => (
                <button key={s} type="button" onClick={() => setQ(s)} className="chip hover:border-accent hover:text-accent">
                  {s}
                </button>
              ))}
            </div>
          </>
        ) : results.length === 0 ? (
          <div className="py-10 text-center">
            <p className="font-display text-lg uppercase">Nothing matched “{q}”</p>
            <p className="mt-2 text-sm text-ash">
              Ask us on WhatsApp — if it fits a car, we can usually source it.
            </p>
          </div>
        ) : (
          <ul className="divide-y divide-white/8">
            {results.map((r) => (
              <ResultRow key={r.id} entry={r} onNavigate={onClose} />
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function ResultRow({ entry, onNavigate }: { entry: SearchEntry; onNavigate: () => void }) {
  return (
    <li>
      <Link
        href={entry.href}
        onClick={onNavigate}
        className="group flex items-center justify-between gap-4 py-3.5 transition-colors hover:text-accent"
      >
        <span className="min-w-0">
          <span className="block truncate text-sm font-semibold">{entry.title}</span>
          <span className="block truncate text-xs text-dim">{entry.meta}</span>
        </span>
        <span className="flex shrink-0 items-center gap-3">
          <span className="chip">{entry.kind}</span>
          <Icon name="arrow" size={16} className="text-dim transition-colors group-hover:text-accent" />
        </span>
      </Link>
    </li>
  );
}
