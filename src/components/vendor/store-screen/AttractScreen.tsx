"use client";

import Image from "next/image";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { ArrowRight, Hand } from "lucide-react";
import { rupees } from "@/lib/format";
import { fileHref } from "@/lib/vendor/types";
import { offPct } from "./lib";
import { StoreMark } from "./parts";
import type { ScreenProduct, ScreenStore } from "./types";

const SLIDE_MS = 5500;

/**
 * THE ATTRACT SCREEN
 *
 * Shown when the screen opens and after an unattended order resets. A light showroom
 * stage with the store's name and logo, a slow crossfade of featured product photos
 * (with a gentle Ken Burns drift), category shortcuts and one big "Touch to explore".
 * Touching anywhere starts; the shortcuts start inside that category.
 */
export function AttractScreen({
  store,
  products,
  groups,
  leaving,
  onStart,
  seller,
}: {
  store: ScreenStore;
  products: ScreenProduct[];
  groups: { slug: string; name: string; count: number }[];
  leaving: boolean;
  onStart: (group?: string) => void;
  seller: ReactNode;
}) {
  // Featured photos: products with a photo, best first (the server already ranks them), one per category before repeats.
  const featured = useMemo(() => {
    const withPhoto = products.filter((p) => p.images.length > 0);
    const seen = new Set<string>();
    const first: ScreenProduct[] = [];
    const rest: ScreenProduct[] = [];
    for (const p of withPhoto) (seen.has(p.group) ? rest : first).push(p);
    for (const p of first) seen.add(p.group);
    return [...first, ...rest].slice(0, 6);
  }, [products]);

  const [pos, setPos] = useState({ cur: 0, prev: -1 });
  const slide = pos.cur;
  const [paused, setPaused] = useState(false);
  useEffect(() => {
    if (featured.length < 2 || paused) return;
    const t = window.setInterval(() => setPos((s) => ({ cur: (s.cur + 1) % featured.length, prev: s.cur })), SLIDE_MS);
    return () => window.clearInterval(t);
  }, [featured.length, paused]);
  useEffect(() => {
    const onVis = () => setPaused(document.hidden);
    document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
  }, []);

  const current = featured[slide];
  const shortcuts = groups.slice(0, 6);

  return (
    <div
      className={`fixed inset-0 z-40 overflow-hidden bg-void transition-[opacity,transform] duration-500 ease-out ${
        leaving ? "pointer-events-none scale-[1.02] opacity-0" : "opacity-100"
      }`}
      onClick={() => onStart()}
      role="region"
      aria-label={`${store.name}, welcome`}
    >
      {/* soft showroom light */}
      <div aria-hidden className="absolute inset-0 bg-[radial-gradient(120%_90%_at_85%_20%,var(--carbon),var(--void)_60%)]" />
      <div aria-hidden className="absolute -left-40 bottom-[-30%] h-[70vmax] w-[70vmax] rounded-full bg-accent/5 blur-3xl" />

      <div className="relative flex h-full flex-col landscape:md:flex-row">
        {/* Words */}
        <div className="flex min-h-0 flex-1 flex-col justify-between px-6 pb-6 pt-8 landscape:md:basis-[46%] landscape:md:flex-none landscape:md:px-14 landscape:md:py-12 xl:px-20">
          <div className="ss-rise flex items-center gap-4">
            <StoreMark store={store} className="h-16 w-16 md:h-20 md:w-20" text="text-3xl" />
            {store.city && <p className="text-base font-medium text-ash md:text-lg">{store.city}</p>}
          </div>

          <div className="ss-rise [animation-delay:120ms]">
            <h2 className="text-balance font-display text-[clamp(2.6rem,7.2vw,6.5rem)] font-extrabold leading-[0.92] tracking-[-0.045em] text-chalk">
              {store.name}
            </h2>
            <p className="mt-5 max-w-md text-lg leading-snug text-ash md:text-xl">
              {products.length > 0
                ? `Browse all ${products.length} ${products.length === 1 ? "product" : "products"} in stock today. Pick what you like and show your order at the counter.`
                : "Our products will appear here soon."}
            </p>

            {shortcuts.length > 1 && (
              <div className="mt-7 flex flex-wrap gap-2.5" onClick={(e) => e.stopPropagation()}>
                {shortcuts.map((g) => (
                  <button
                    key={g.slug}
                    type="button"
                    onClick={() => onStart(g.slug)}
                    className="inline-flex min-h-12 items-center gap-2 rounded-full border border-tint/15 bg-void px-5 text-[15px] font-semibold text-chalk shadow-sm transition-[transform,border-color] duration-200 active:scale-95 hover:border-accent"
                  >
                    {g.name}
                    <span className="tnum text-sm font-medium text-dim">{g.count}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="ss-rise flex items-center justify-between gap-4 [animation-delay:240ms]">
            <button
              type="button"
              data-autofocus
              onClick={(e) => {
                e.stopPropagation();
                onStart();
              }}
              className="group relative inline-flex min-h-[4.5rem] items-center gap-4 rounded-full bg-accent pl-8 pr-4 font-display text-xl font-extrabold tracking-tight text-on-accent transition-transform duration-200 active:scale-[0.97] md:text-2xl"
            >
              <span aria-hidden className="ss-ring absolute inset-0 rounded-full bg-accent" />
              <span className="relative">Touch to explore</span>
              <span className="relative grid h-12 w-12 place-items-center rounded-full bg-void text-accent">
                <Hand size={22} aria-hidden className="group-active:hidden" />
                <ArrowRight size={22} aria-hidden className="hidden group-active:block" />
              </span>
            </button>
            <div onClick={(e) => e.stopPropagation()}>{seller}</div>
          </div>
        </div>

        {/* Stage */}
        <div className="relative m-4 min-h-[34dvh] flex-1 overflow-hidden rounded-[2rem] bg-[#f3f4f5] shadow-sm ring-1 ring-tint/10 landscape:md:m-6 landscape:md:ml-0 landscape:md:rounded-[2.5rem]">
          {featured.length === 0 ? (
            <div className="grid h-full place-items-center">
              <StoreMark store={store} className="h-40 w-40" text="text-7xl" />
            </div>
          ) : (
            featured.map((p, i) => (
              <div
                key={p.id}
                aria-hidden={i !== slide}
                className={`absolute inset-0 transition-opacity duration-[1400ms] ease-in-out ${i === slide ? "opacity-100" : "opacity-0"}`}
              >
                {/* The drift restarts when a slide returns as the current one, and keeps going while it fades out. */}
                <div className={i === slide || i === pos.prev ? "ss-kb absolute inset-0" : "absolute inset-0"}>
                  <Image
                    src={fileHref(p.images[0])}
                    alt=""
                    fill
                    sizes="(min-width:768px) 56vw, 100vw"
                    priority={i < 2}
                    className="object-contain p-8 md:p-14"
                  />
                </div>
              </div>
            ))
          )}

          {current && (
            <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-4 bg-gradient-to-t from-void/90 via-void/60 to-transparent p-6 pt-20 md:p-8 md:pt-24">
              <div key={current.id} className="ss-fade min-w-0">
                <p className="truncate text-sm font-semibold text-dim">{current.brand}</p>
                <p className="line-clamp-1 font-display text-xl font-extrabold tracking-tight text-chalk md:text-2xl">{current.title}</p>
                <p className="tnum mt-0.5 text-lg font-bold text-chalk">
                  {rupees(current.price)}
                  {offPct(current) > 0 && <span className="ml-2 text-sm font-bold text-accent">{offPct(current)}% off</span>}
                </p>
              </div>
              {featured.length > 1 && (
                <div className="flex shrink-0 gap-1.5 pb-2" aria-hidden>
                  {featured.map((p, i) => (
                    <span key={p.id} className={`h-1.5 rounded-full transition-all duration-500 ${i === slide ? "w-7 bg-accent" : "w-1.5 bg-tint/25"}`} />
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
