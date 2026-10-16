"use client";

import Image from "next/image";
import { useCallback, useEffect, useMemo, useRef, useState, type FormEvent, type ReactNode } from "react";
import { Lock, Maximize, Minimize, Minus, Plus, Search, ShoppingBag, Trash2, X } from "lucide-react";
import { api, ApiFailure } from "@/lib/vendor/client";
import { fileHref } from "@/lib/vendor/types";
import { rupees } from "@/lib/format";
import type { ScreenProduct, ScreenStore } from "./types";

/**
 * THE OFFLINE STORE SCREEN (client)
 *
 * An order screen for customers in the seller's own shop, like a fast-food kiosk:
 * browse by category, tap a product, add it to an order, review the order and show
 * it at the counter. Nothing is saved or paid here; the order lives in this screen
 * only and clears itself after a customer walks away (IDLE_MS + a short countdown).
 *
 * Leaving the screen needs the seller's password (the session is locked to it).
 */

const IDLE_MS = 120_000;
const COUNTDOWN_S = 20;
const MAX_QTY = 99;
const LOW_STOCK = 5;

type Order = Record<string, number>;

const offPct = (p: { mrp: number; price: number }) => (p.mrp > p.price ? Math.round(((p.mrp - p.price) / p.mrp) * 100) : 0);
const maxFor = (p: ScreenProduct) => Math.min(p.stock, MAX_QTY);

export function StoreScreen({ store, products, locked }: { store: ScreenStore; products: ScreenProduct[]; locked: boolean }) {
  const [group, setGroup] = useState<string>("all");
  const [query, setQuery] = useState("");
  const [order, setOrder] = useState<Order>({});
  const [open, setOpen] = useState<ScreenProduct | null>(null);
  const [review, setReview] = useState(false);
  const [unlock, setUnlock] = useState(false);
  const [idlePrompt, setIdlePrompt] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);
  const scroller = useRef<HTMLElement>(null);

  // Opening the screen locks this session to it.
  useEffect(() => {
    if (!locked) api("/api/vendor/store-screen", { body: { action: "lock" } }).catch(() => {});
  }, [locked]);

  // The screen is always light; the page around it (scrollbars, browser bar) follows while it is open.
  useEffect(() => {
    const html = document.documentElement;
    const before = html.dataset.theme;
    html.dataset.theme = "light";
    return () => {
      if (before) html.dataset.theme = before;
    };
  }, []);

  useEffect(() => {
    const onChange = () => setFullscreen(Boolean(document.fullscreenElement));
    document.addEventListener("fullscreenchange", onChange);
    return () => document.removeEventListener("fullscreenchange", onChange);
  }, []);

  const byId = useMemo(() => new Map(products.map((p) => [p.id, p])), [products]);

  const groups = useMemo(() => {
    const m = new Map<string, { name: string; count: number }>();
    for (const p of products) {
      const g = m.get(p.group) ?? { name: p.groupName, count: 0 };
      g.count++;
      m.set(p.group, g);
    }
    return [...m.entries()].map(([slug, g]) => ({ slug, ...g }));
  }, [products]);

  const shown = useMemo(() => {
    const q = query.trim().toLowerCase();
    return products.filter(
      (p) =>
        (group === "all" || p.group === group) &&
        (!q || `${p.title} ${p.brand} ${p.groupName}`.toLowerCase().includes(q)),
    );
  }, [products, group, query]);

  const lines = useMemo(
    () =>
      Object.entries(order)
        .map(([id, qty]) => ({ product: byId.get(id), qty }))
        .filter((l): l is { product: ScreenProduct; qty: number } => Boolean(l.product) && l.qty > 0),
    [order, byId],
  );
  const count = lines.reduce((n, l) => n + l.qty, 0);
  const total = lines.reduce((n, l) => n + l.product.price * l.qty, 0);
  const savings = lines.reduce((n, l) => n + Math.max(0, l.product.mrp - l.product.price) * l.qty, 0);

  const setQty = useCallback(
    (id: string, qty: number) =>
      setOrder((o) => {
        const p = byId.get(id);
        if (!p) return o;
        const next = { ...o };
        const q = Math.max(0, Math.min(qty, maxFor(p)));
        if (q === 0) delete next[id];
        else next[id] = q;
        return next;
      }),
    [byId],
  );

  const startOver = useCallback(() => {
    setOrder({});
    setOpen(null);
    setReview(false);
    setIdlePrompt(false);
    setGroup("all");
    setQuery("");
    scroller.current?.scrollTo({ top: 0 });
  }, []);

  /* ---- idle reset: a walk-away customer's order never greets the next one ---- */
  const busy = count > 0 || open !== null || review || query !== "" || group !== "all";
  useEffect(() => {
    if (unlock) return;
    let timer = window.setTimeout(onIdle, IDLE_MS);
    function onIdle() {
      if (busy) setIdlePrompt(true);
      else scroller.current?.scrollTo({ top: 0 });
    }
    const poke = () => {
      window.clearTimeout(timer);
      timer = window.setTimeout(onIdle, IDLE_MS);
    };
    const events = ["pointerdown", "keydown", "wheel", "touchmove"] as const;
    events.forEach((e) => window.addEventListener(e, poke, { passive: true }));
    return () => {
      window.clearTimeout(timer);
      events.forEach((e) => window.removeEventListener(e, poke));
    };
  }, [busy, unlock]);

  async function toggleFullscreen() {
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
      else await document.documentElement.requestFullscreen();
    } catch {
      /* not allowed here (some tablets); the screen still works */
    }
  }

  return (
    // Always light: a shop screen looks the same whatever theme the device or the site is set to.
    <div data-theme="light" className="flex h-dvh flex-col bg-void text-chalk">
      {/* Top bar */}
      <header className="z-30 shrink-0 border-b border-tint/10 bg-void">
        <div className="flex items-center gap-3 px-4 py-3 md:px-6">
          <div className="relative grid h-12 w-12 shrink-0 place-items-center overflow-hidden rounded-[2px] border border-tint/10 bg-carbon">
            {store.logo ? (
              <Image src={fileHref(store.logo)} alt="" fill sizes="48px" className="object-contain p-1" />
            ) : (
              <span className="font-display text-xl font-extrabold uppercase text-accent">{store.name.slice(0, 1)}</span>
            )}
          </div>
          <div className="min-w-0 flex-1">
            <h1 className="truncate font-display text-lg font-extrabold uppercase leading-tight text-chalk md:text-2xl">{store.name}</h1>
            <p className="hidden truncate text-sm text-ash sm:block">Tap a product to add it to your order</p>
          </div>
          <label className="relative hidden w-72 md:block">
            <span className="sr-only">Search products</span>
            <Search size={18} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-dim" aria-hidden />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search products"
              className="field pl-10"
              autoComplete="off"
            />
          </label>
          <button
            type="button"
            onClick={toggleFullscreen}
            aria-label={fullscreen ? "Exit full screen" : "Full screen"}
            className="grid h-12 w-12 shrink-0 place-items-center rounded-[2px] border border-tint/10 text-ash hover:text-chalk"
          >
            {fullscreen ? <Minimize size={20} aria-hidden /> : <Maximize size={20} aria-hidden />}
          </button>
          <button
            type="button"
            onClick={() => setUnlock(true)}
            aria-label="Close store screen (seller only)"
            className="grid h-12 w-12 shrink-0 place-items-center rounded-[2px] border border-tint/10 text-dim hover:text-chalk"
          >
            <Lock size={18} aria-hidden />
          </button>
        </div>

        {/* Search (phones) and categories */}
        <div className="px-4 pb-3 md:hidden">
          <label className="relative block">
            <span className="sr-only">Search products</span>
            <Search size={18} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-dim" aria-hidden />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search products"
              className="field pl-10"
              autoComplete="off"
            />
          </label>
        </div>
        {groups.length > 1 && (
          <nav aria-label="Categories" className="flex gap-2 overflow-x-auto px-4 pb-3 md:px-6">
            <CategoryTab active={group === "all"} onClick={() => setGroup("all")} label="All" count={products.length} />
            {groups.map((g) => (
              <CategoryTab key={g.slug} active={group === g.slug} onClick={() => setGroup(g.slug)} label={g.name} count={g.count} />
            ))}
          </nav>
        )}
      </header>

      <div className="flex min-h-0 flex-1">
        {/* Products (the root layout already provides <main>) */}
        <section
          ref={scroller}
          className={`min-w-0 flex-1 overflow-y-auto px-4 py-5 md:px-6 ${count > 0 ? "pb-32 lg:pb-8" : "pb-8"}`}
          aria-label="Products"
        >
          {products.length === 0 ? (
            <Empty title="No products to show yet">
              Approved products with stock appear here. Add products and stock from your seller dashboard.
            </Empty>
          ) : shown.length === 0 ? (
            <Empty title="Nothing matches">
              <button type="button" className="btn btn-outline btn-sm mt-4" onClick={() => { setQuery(""); setGroup("all"); }}>
                Show all products
              </button>
            </Empty>
          ) : (
            <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:gap-4 xl:grid-cols-4 2xl:grid-cols-5">
              {shown.map((p) => (
                <li key={p.id}>
                  <ProductTile product={p} qty={order[p.id] ?? 0} onOpen={() => setOpen(p)} onAdd={() => setQty(p.id, (order[p.id] ?? 0) + 1)} />
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* Order (large screens) */}
        <aside aria-label="Your order" className="hidden w-[380px] shrink-0 flex-col border-l border-tint/10 bg-carbon lg:flex">
          <OrderPanel lines={lines} count={count} total={total} savings={savings} setQty={setQty} onReview={() => setReview(true)} onClear={startOver} />
        </aside>
      </div>

      {/* Order bar (phones and tablets) */}
      {count > 0 && (
        <div className="safe-b fixed inset-x-0 bottom-0 z-30 border-t border-tint/10 bg-void p-3 lg:hidden">
          <button type="button" onClick={() => setReview(true)} className="btn btn-primary btn-block min-h-14 justify-between text-base">
            <span className="flex items-center gap-2">
              <ShoppingBag size={20} aria-hidden />
              View order · {count} {count === 1 ? "item" : "items"}
            </span>
            <span className="tnum">{rupees(total)}</span>
          </button>
        </div>
      )}

      {open && (
        <ProductDialog
          product={open}
          inOrder={order[open.id] ?? 0}
          onClose={() => setOpen(null)}
          onAdd={(qty) => {
            setQty(open.id, (order[open.id] ?? 0) + qty);
            setOpen(null);
          }}
        />
      )}

      {review && (
        <ReviewScreen
          lines={lines}
          count={count}
          total={total}
          savings={savings}
          setQty={setQty}
          onBack={() => setReview(false)}
          onDone={startOver}
        />
      )}

      {idlePrompt && <IdlePrompt onStay={() => setIdlePrompt(false)} onTimeout={startOver} />}
      {unlock && <UnlockDialog onClose={() => setUnlock(false)} />}
    </div>
  );
}

/* ------------------------------------------------------------------ parts */

function CategoryTab({ active, onClick, label, count }: { active: boolean; onClick: () => void; label: string; count: number }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`flex min-h-11 shrink-0 items-center gap-2 rounded-full border px-4 text-sm font-semibold transition-colors ${
        active ? "border-accent bg-accent text-on-accent" : "border-tint/15 text-ash hover:border-tint/30 hover:text-chalk"
      }`}
    >
      {label}
      <span className={`tnum text-xs ${active ? "text-on-accent/80" : "text-dim"}`}>{count}</span>
    </button>
  );
}

function Thumb({ id, alt, sizes, className = "" }: { id: string | undefined; alt: string; sizes: string; className?: string }) {
  return (
    <div className={`relative overflow-hidden bg-steel ${className}`}>
      {id ? (
        <Image src={fileHref(id)} alt={alt} fill sizes={sizes} className="object-contain p-2" />
      ) : (
        <div className="grid h-full w-full place-items-center text-dim">
          <ShoppingBag size={28} aria-hidden />
        </div>
      )}
    </div>
  );
}

function Price({ p, large = false }: { p: { mrp: number; price: number }; large?: boolean }) {
  const off = offPct(p);
  return (
    <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
      <span className={`tnum font-display font-extrabold text-chalk ${large ? "text-3xl" : "text-lg md:text-xl"}`}>{rupees(p.price)}</span>
      {off > 0 && (
        <>
          <span className="tnum text-xs text-dim line-through">{rupees(p.mrp)}</span>
          <span className="text-xs font-bold text-accent">{off}% off</span>
        </>
      )}
    </div>
  );
}

function ProductTile({ product: p, qty, onOpen, onAdd }: { product: ScreenProduct; qty: number; onOpen: () => void; onAdd: () => void }) {
  const full = qty >= maxFor(p);
  return (
    <div className="card relative flex h-full flex-col overflow-hidden p-0">
      <button type="button" onClick={onOpen} className="flex flex-1 flex-col text-left" aria-label={`${p.title}, ${rupees(p.price)}. View details`}>
        <Thumb id={p.images[0]} alt="" sizes="(min-width:1536px) 18vw, (min-width:1280px) 22vw, (min-width:640px) 30vw, 48vw" className="aspect-square w-full" />
        <div className="flex flex-1 flex-col gap-1 p-3">
          <p className="text-[11px] font-bold uppercase tracking-[0.1em] text-dim">{p.brand}</p>
          <p className="line-clamp-2 text-sm font-semibold leading-snug text-chalk md:text-base">{p.title}</p>
          <div className="mt-auto pt-1">
            <Price p={p} />
          </div>
        </div>
      </button>
      <div className="px-3 pb-3">
        <button
          type="button"
          onClick={onAdd}
          disabled={full}
          className="btn btn-primary btn-block min-h-11 gap-1.5 disabled:opacity-50"
          aria-label={full ? `${p.title}: no more in stock` : `Add ${p.title} to order`}
        >
          <Plus size={16} aria-hidden /> {full ? "Max in order" : "Add"}
        </button>
      </div>
      {qty > 0 && (
        <span className="absolute right-2 top-2 grid h-8 min-w-8 place-items-center rounded-full bg-accent px-2 text-sm font-bold text-on-accent tnum">
          <span className="sr-only">In order: </span>
          {qty}
        </span>
      )}
    </div>
  );
}

function Stepper({ value, max, onChange, label }: { value: number; max: number; onChange: (n: number) => void; label: string }) {
  return (
    <div className="flex items-center rounded-[2px] border border-tint/15" role="group" aria-label={`Quantity, ${label}`}>
      <button type="button" onClick={() => onChange(value - 1)} disabled={value <= 0} className="grid h-11 w-11 place-items-center text-chalk disabled:opacity-40" aria-label={`One less ${label}`}>
        <Minus size={16} aria-hidden />
      </button>
      <span className="w-8 text-center font-bold tnum text-chalk" aria-live="polite">
        {value}
      </span>
      <button type="button" onClick={() => onChange(value + 1)} disabled={value >= max} className="grid h-11 w-11 place-items-center text-chalk disabled:opacity-40" aria-label={`One more ${label}`}>
        <Plus size={16} aria-hidden />
      </button>
    </div>
  );
}

type Line = { product: ScreenProduct; qty: number };

function OrderLines({ lines, setQty }: { lines: Line[]; setQty: (id: string, n: number) => void }) {
  return (
    <ul className="divide-y divide-tint/10">
      {lines.map(({ product: p, qty }) => (
        <li key={p.id} className="flex gap-3 py-3">
          <Thumb id={p.images[0]} alt="" sizes="64px" className="h-16 w-16 shrink-0 rounded-[2px]" />
          <div className="min-w-0 flex-1">
            <p className="line-clamp-2 text-sm font-semibold leading-snug text-chalk">{p.title}</p>
            <p className="text-xs text-dim tnum">{rupees(p.price)} each</p>
            <div className="mt-2 flex items-center justify-between gap-2">
              <Stepper value={qty} max={maxFor(p)} onChange={(n) => setQty(p.id, n)} label={p.title} />
              <span className="font-bold tnum text-chalk">{rupees(p.price * qty)}</span>
            </div>
          </div>
          <button type="button" onClick={() => setQty(p.id, 0)} className="grid h-9 w-9 shrink-0 place-items-center text-dim hover:text-danger" aria-label={`Remove ${p.title}`}>
            <Trash2 size={16} aria-hidden />
          </button>
        </li>
      ))}
    </ul>
  );
}

function Totals({ count, total, savings }: { count: number; total: number; savings: number }) {
  return (
    <div className="space-y-1">
      <div className="flex items-baseline justify-between">
        <span className="text-sm text-ash">
          Total ({count} {count === 1 ? "item" : "items"})
        </span>
        <span className="font-display text-3xl font-extrabold text-chalk tnum">{rupees(total)}</span>
      </div>
      <p className="text-right text-xs text-dim">Inclusive of GST</p>
      {savings > 0 && <p className="text-right text-sm font-semibold text-accent">You save {rupees(savings)} on MRP</p>}
    </div>
  );
}

function OrderPanel({
  lines, count, total, savings, setQty, onReview, onClear,
}: { lines: Line[]; count: number; total: number; savings: number; setQty: (id: string, n: number) => void; onReview: () => void; onClear: () => void }) {
  return (
    <>
      <div className="flex items-center justify-between border-b border-tint/10 px-5 py-4">
        <h2 className="font-display text-xl font-extrabold uppercase text-chalk">Your order</h2>
        {count > 0 && (
          <button type="button" onClick={onClear} className="text-sm font-semibold text-dim hover:text-danger">
            Clear
          </button>
        )}
      </div>
      <div className="flex-1 overflow-y-auto px-5">
        {count === 0 ? (
          <div className="grid h-full place-items-center py-10 text-center">
            <div>
              <ShoppingBag size={36} className="mx-auto text-dim" aria-hidden />
              <p className="mt-3 text-sm text-ash">Your order is empty.</p>
              <p className="text-sm text-dim">Tap Add on any product.</p>
            </div>
          </div>
        ) : (
          <OrderLines lines={lines} setQty={setQty} />
        )}
      </div>
      {count > 0 && (
        <div className="space-y-4 border-t border-tint/10 p-5">
          <Totals count={count} total={total} savings={savings} />
          <button type="button" onClick={onReview} className="btn btn-primary btn-block min-h-14 text-base">
            Review order
          </button>
        </div>
      )}
    </>
  );
}

/** A modal layer: focus moves in, Escape closes, focus returns on close. */
function Layer({ label, onClose, children, wide = false }: { label: string; onClose?: () => void; children: ReactNode; wide?: boolean }) {
  const box = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const before = document.activeElement as HTMLElement | null;
    const first = box.current?.querySelector<HTMLElement>("[data-autofocus]") ?? box.current?.querySelector<HTMLElement>("button, input");
    first?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && onClose) onClose();
      if (e.key === "Tab" && box.current) {
        const f = [...box.current.querySelectorAll<HTMLElement>("button:not([disabled]), input, [href]")];
        if (f.length === 0) return;
        const [a, z] = [f[0], f[f.length - 1]];
        if (e.shiftKey && document.activeElement === a) { e.preventDefault(); z.focus(); }
        else if (!e.shiftKey && document.activeElement === z) { e.preventDefault(); a.focus(); }
      }
    };
    document.addEventListener("keydown", onKey);
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = overflow;
      before?.focus?.();
    };
  }, [onClose]);
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-6" role="dialog" aria-modal="true" aria-label={label}>
      <div className="absolute inset-0 bg-ink/70" onClick={onClose} aria-hidden />
      <div
        ref={box}
        className={`relative max-h-[92dvh] w-full overflow-y-auto rounded-t-[8px] border border-tint/10 bg-void sm:rounded-[4px] ${wide ? "sm:max-w-4xl" : "sm:max-w-md"}`}
      >
        {children}
      </div>
    </div>
  );
}

function CloseButton({ onClick, label = "Close" }: { onClick: () => void; label?: string }) {
  return (
    <button type="button" onClick={onClick} aria-label={label} className="grid h-11 w-11 shrink-0 place-items-center rounded-[2px] text-ash hover:text-chalk">
      <X size={22} aria-hidden />
    </button>
  );
}

function ProductDialog({ product: p, inOrder, onClose, onAdd }: { product: ScreenProduct; inOrder: number; onClose: () => void; onAdd: (qty: number) => void }) {
  const room = maxFor(p) - inOrder;
  const [qty, setQty] = useState(room > 0 ? 1 : 0);
  const [img, setImg] = useState(0);
  return (
    <Layer label={p.title} onClose={onClose} wide>
      <div className="flex items-start justify-between gap-3 p-4 pb-0 md:p-6 md:pb-0">
        <div className="min-w-0">
          <p className="text-xs font-bold uppercase tracking-[0.1em] text-dim">{p.brand} · {p.groupName}</p>
          <h2 className="mt-1 font-display text-xl font-extrabold leading-tight text-chalk md:text-2xl">{p.title}</h2>
        </div>
        <CloseButton onClick={onClose} />
      </div>
      <div className="grid gap-5 p-4 md:grid-cols-2 md:gap-8 md:p-6">
        <div>
          <Thumb id={p.images[img]} alt={p.title} sizes="(min-width:768px) 420px, 92vw" className="aspect-square w-full rounded-[2px]" />
          {p.images.length > 1 && (
            <div className="mt-2 flex gap-2 overflow-x-auto">
              {p.images.map((id, i) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => setImg(i)}
                  aria-label={`Photo ${i + 1}`}
                  aria-pressed={i === img}
                  className={`shrink-0 rounded-[2px] border-2 ${i === img ? "border-accent" : "border-transparent"}`}
                >
                  <Thumb id={id} alt="" sizes="64px" className="h-16 w-16" />
                </button>
              ))}
            </div>
          )}
        </div>
        <div className="flex flex-col gap-4">
          <Price p={p} large />
          <p className="text-sm text-ash">
            {p.stock <= LOW_STOCK ? `Only ${p.stock} left` : "In stock"}
            {p.warrantyMonths ? ` · ${p.warrantyMonths}-month warranty` : ""}
          </p>
          {p.summary && <p className="text-sm leading-relaxed text-ash">{p.summary}</p>}
          {p.highlights.length > 0 && (
            <ul className="space-y-1.5 text-sm text-chalk">
              {p.highlights.map((h) => (
                <li key={h} className="flex gap-2">
                  <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-accent" aria-hidden />
                  {h}
                </li>
              ))}
            </ul>
          )}
          {p.specs.length > 0 && (
            <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1.5 border-t border-tint/10 pt-3 text-sm">
              {p.specs.map((s) => (
                <div key={s.label} className="contents">
                  <dt className="text-dim">{s.label}</dt>
                  <dd className="text-chalk">{s.value}</dd>
                </div>
              ))}
            </dl>
          )}
          <div className="mt-auto flex items-center gap-3 border-t border-tint/10 pt-4">
            {room > 0 ? (
              <>
                <Stepper value={qty} max={room} onChange={(n) => setQty(Math.max(1, n))} label={p.title} />
                <button type="button" data-autofocus onClick={() => onAdd(qty)} className="btn btn-primary min-h-12 flex-1 text-base">
                  Add to order · <span className="tnum">{rupees(p.price * qty)}</span>
                </button>
              </>
            ) : (
              <p className="text-sm text-ash">All available units are already in your order.</p>
            )}
          </div>
        </div>
      </div>
    </Layer>
  );
}

function ReviewScreen({
  lines, count, total, savings, setQty, onBack, onDone,
}: { lines: Line[]; count: number; total: number; savings: number; setQty: (id: string, n: number) => void; onBack: () => void; onDone: () => void }) {
  const [confirmNew, setConfirmNew] = useState(false);
  useEffect(() => {
    if (count === 0) onBack();
  }, [count, onBack]);
  return (
    <Layer label="Your order" onClose={onBack} wide>
      <div className="flex items-center justify-between gap-3 border-b border-tint/10 p-4 md:p-6">
        <h2 className="font-display text-2xl font-extrabold uppercase text-chalk md:text-3xl">Your order</h2>
        <CloseButton onClick={onBack} label="Back to products" />
      </div>
      <div className="grid gap-6 p-4 md:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)] md:p-6">
        <OrderLines lines={lines} setQty={setQty} />
        <div className="space-y-5">
          <Totals count={count} total={total} savings={savings} />
          <div className="rounded-[2px] border border-accent/40 bg-accent/10 p-4 text-center">
            <p className="font-display text-lg font-extrabold uppercase text-chalk">Show this screen at the counter</p>
            <p className="mt-1 text-sm text-ash">Our team will confirm your items and take payment there.</p>
          </div>
          <div className="grid gap-2">
            <button type="button" data-autofocus onClick={onBack} className="btn btn-outline btn-block min-h-12">
              Add more items
            </button>
            {confirmNew ? (
              <div className="grid grid-cols-2 gap-2">
                <button type="button" onClick={() => setConfirmNew(false)} className="btn btn-outline min-h-12">
                  Keep order
                </button>
                <button type="button" onClick={onDone} className="btn btn-primary min-h-12">
                  Yes, start new
                </button>
              </div>
            ) : (
              <button type="button" onClick={() => setConfirmNew(true)} className="btn btn-primary btn-block min-h-12">
                Done · start new order
              </button>
            )}
          </div>
        </div>
      </div>
    </Layer>
  );
}

function IdlePrompt({ onStay, onTimeout }: { onStay: () => void; onTimeout: () => void }) {
  const [left, setLeft] = useState(COUNTDOWN_S);
  useEffect(() => {
    if (left <= 0) {
      onTimeout();
      return;
    }
    const t = window.setTimeout(() => setLeft((n) => n - 1), 1000);
    return () => window.clearTimeout(t);
  }, [left, onTimeout]);
  return (
    <Layer label="Are you still there?" onClose={onStay}>
      <div className="p-6 text-center">
        <p className="font-display text-2xl font-extrabold uppercase text-chalk">Still there?</p>
        <p className="mt-2 text-sm text-ash" aria-live="polite">
          This order clears in <span className="font-bold tnum text-chalk">{left}</span> seconds so the next customer can start fresh.
        </p>
        <div className="mt-5 grid gap-2">
          <button type="button" data-autofocus onClick={onStay} className="btn btn-primary btn-block min-h-12">
            I&apos;m still here
          </button>
          <button type="button" onClick={onTimeout} className="btn btn-outline btn-block min-h-12">
            Start a new order
          </button>
        </div>
      </div>
    </Layer>
  );
}

function UnlockDialog({ onClose }: { onClose: () => void }) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  async function submit(e: FormEvent) {
    e.preventDefault();
    if (!password) {
      setError("Enter your password.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const res = await api<{ next: string }>("/api/vendor/store-screen", { body: { action: "unlock", password } });
      if (document.fullscreenElement) await document.exitFullscreen().catch(() => {});
      window.location.href = res.next;
    } catch (err) {
      setError(err instanceof ApiFailure ? err.message : "Something went wrong. Please try again.");
      setPassword("");
      setBusy(false);
    }
  }
  return (
    <Layer label="Close the store screen" onClose={onClose}>
      <form onSubmit={submit} noValidate className="p-6">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="font-display text-xl font-extrabold uppercase text-chalk">Seller only</p>
            <p className="mt-1 text-sm text-ash">Enter your seller password to close the store screen and go back to your dashboard.</p>
          </div>
          <CloseButton onClick={onClose} />
        </div>
        <label htmlFor="screen-password" className="label mt-5">
          Seller password
        </label>
        <input
          id="screen-password"
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="field"
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? "screen-password-msg" : undefined}
          data-autofocus
        />
        {error && (
          <p id="screen-password-msg" role="alert" className="mt-1.5 text-xs text-danger">
            {error}
          </p>
        )}
        <div className="mt-5 grid grid-cols-2 gap-2">
          <button type="button" onClick={onClose} className="btn btn-outline min-h-12">
            Cancel
          </button>
          <button type="submit" disabled={busy} className="btn btn-primary min-h-12 disabled:opacity-60">
            {busy ? "Checking…" : "Unlock"}
          </button>
        </div>
      </form>
    </Layer>
  );
}

function Empty({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="card mx-auto max-w-lg p-10 text-center">
      <p className="font-display text-xl font-extrabold uppercase text-chalk">{title}</p>
      <div className="mt-2 text-sm text-ash">{children}</div>
    </div>
  );
}
