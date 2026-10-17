"use client";

import Image from "next/image";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { Armchair, BadgeCheck, Hand, Lightbulb, Package, Speaker } from "lucide-react";
import { fileHref } from "@/lib/vendor/types";
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

  const shortcuts = groups.slice(0, 4);

  return (
    <div
      className={`fixed inset-0 z-40 overflow-hidden bg-carbon transition-[opacity,transform] duration-500 ease-out ${
        leaving ? "pointer-events-none scale-[1.02] opacity-0" : "opacity-100"
      }`}
      onClick={() => onStart()}
      role="region"
      aria-label={`${store.name}, welcome`}
    >
      <div className="relative flex h-full flex-col landscape:lg:flex-row">
        {/* Photo stage: the product photos are shot on white, so they blend into the backdrop. */}
        <div className="relative order-2 min-h-[38dvh] flex-1 overflow-hidden bg-[#f3f4f5] landscape:lg:order-1">
          {featured.length === 0 ? (
            <div className="grid h-full place-items-center">
              <StoreMark store={store} className="h-40 w-40" text="text-7xl" />
            </div>
          ) : (
            featured.map((p, i) => (
              <div
                key={p.id}
                aria-hidden={i !== slide}
                className={`absolute inset-0 transition-opacity duration-[1600ms] ease-in-out ${i === slide ? "opacity-100" : "opacity-0"}`}
              >
                {/* The drift restarts when a slide returns as the current one, and keeps going while it fades out. */}
                {/* The backdrop sits on this layer too: the drift's transform isolates blending from the stage behind it. */}
                <div className={`absolute inset-0 bg-[#f3f4f5] ${i === slide || i === pos.prev ? "ss-kb" : ""}`}>
                  <Image
                    src={fileHref(p.images[0])}
                    alt=""
                    fill
                    sizes="(min-width:1024px) 58vw, 100vw"
                    priority={i < 2}
                    className="object-contain p-[8%] mix-blend-multiply"
                  />
                </div>
              </div>
            ))
          )}
          {featured.length > 1 && (
            <div className="absolute bottom-6 left-1/2 flex -translate-x-1/2 gap-2" aria-hidden>
              {featured.map((p, i) => (
                <span key={p.id} className={`h-1.5 rounded-full transition-all duration-700 ${i === slide ? "w-10 bg-chalk" : "w-3 bg-tint/20"}`} />
              ))}
            </div>
          )}
        </div>

        {/* Words */}
        <div className="order-1 flex flex-col justify-between gap-8 p-6 sm:p-10 landscape:lg:order-2 landscape:lg:w-[42%] landscape:lg:p-16 xl:p-20">
          <div className="ss-rise flex items-center justify-between gap-4">
            <div className="flex min-w-0 items-center gap-4">
              <StoreMark store={store} className="h-14 w-14 lg:h-16 lg:w-16" text="text-2xl" />
              <div className="min-w-0">
                <p className="truncate font-display text-xl font-extrabold tracking-tight text-chalk lg:text-2xl">{store.name}</p>
                <p className="flex min-w-0 items-center gap-1.5 text-sm font-medium text-ash lg:text-base">
                  <span className="truncate">{store.city ? `${store.city} · ` : ""}Riderzpro verified seller</span>
                  <BadgeCheck size={20} aria-label="Verified" className="shrink-0 fill-accent text-on-accent" />
                </p>
              </div>
            </div>
            <div onClick={(e) => e.stopPropagation()}>{seller}</div>
          </div>

          <div className="ss-rise [animation-delay:120ms]">
            <p className="mb-4 text-sm font-bold uppercase tracking-[0.2em] text-accent lg:text-base">Offline Store</p>
            <h2 className="text-balance font-display text-[clamp(2.4rem,5.4vw,5.25rem)] font-extrabold leading-[1.02] tracking-[-0.035em] text-chalk">
              {products.length > 0 ? "Everything in stock." : "Coming soon."}
              <br />
              <span className="text-dim">{products.length > 0 ? "Right at your fingertips." : "Our products will appear here."}</span>
            </h2>
          </div>

          <div className="ss-rise space-y-5 [animation-delay:240ms]">
            {shortcuts.length > 0 && (
              <div className="grid grid-cols-2 gap-3 lg:gap-4" onClick={(e) => e.stopPropagation()}>
                {shortcuts.map((g) => {
                  const Icon = groupIcon(g.slug);
                  return (
                    <button
                      key={g.slug}
                      type="button"
                      onClick={() => onStart(g.slug)}
                      className="flex min-h-20 items-center gap-3 rounded-2xl bg-void p-4 text-left shadow-sm transition-transform duration-200 active:scale-[0.97] lg:min-h-24 lg:p-5"
                    >
                      <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-accent/10 text-accent">
                        <Icon size={24} aria-hidden />
                      </span>
                      <span className="min-w-0">
                        <span className="block truncate text-lg font-bold text-chalk">{g.name}</span>
                        <span className="tnum text-sm text-ash">{g.count} in store</span>
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
            <button
              type="button"
              data-autofocus
              onClick={(e) => {
                e.stopPropagation();
                onStart();
              }}
              className="relative flex h-20 w-full items-center justify-center gap-3 rounded-full bg-accent font-display text-xl font-extrabold tracking-tight text-on-accent shadow-lg transition-transform duration-200 active:scale-[0.98] lg:h-24 lg:text-2xl"
            >
              <span aria-hidden className="ss-breathe absolute inset-0 rounded-full bg-accent" />
              <Hand size={28} aria-hidden className="relative" />
              <span className="relative">Touch to explore</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/** An icon for a category shortcut, by its group slug. */
function groupIcon(slug: string) {
  if (/seat|cushion|mat|steering/.test(slug)) return Armchair;
  if (/speaker|sub|amp|processor|display|camera|installation/.test(slug)) return Speaker;
  if (/light|lamp|led|fog/.test(slug)) return Lightbulb;
  return Package;
}
