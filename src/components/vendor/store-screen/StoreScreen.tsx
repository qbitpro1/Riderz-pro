"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { VoiceSearch } from "./VoiceSearch";
import { BadgeCheck, CarFront, Columns2, Search, ShoppingBag, SearchX, Sparkles, X } from "lucide-react";
import { rupees } from "@/lib/format";
import { api } from "@/lib/vendor/client";
import { AttractScreen } from "./AttractScreen";
import { BrowseGrid, type TileActions } from "./BrowseGrid";
import { CarPicker } from "./CarPicker";
import { CompareSheet } from "./CompareSheet";
import { IdlePrompt, SellerAccess, SellerDialog } from "./Dialogs";
import { useIdle, useOrder, usePulse, useStillValid } from "./hooks";
import { COMPARE_MAX, IDLE_MS, SORTS, fitsCar, matchesQuery, sortProducts, ui, type Car, type SortKey } from "./lib";
import { OrderPanel } from "./OrderPanel";
import { Empty, StoreMark } from "./parts";
import { ProductSheet } from "./ProductSheet";
import { ReviewScreen } from "./ReviewScreen";
import { Styles } from "./Styles";
import { StoreAssistant, type AssistantTurn, type ScreenOffer } from "./StoreAssistant";
import { CheckoutSheet, type PayOptions } from "./CheckoutSheet";
import type { ScreenFitBrand, ScreenProduct, ScreenStore } from "./types";

/**
 * THE OFFLINE STORE SCREEN (client)
 *
 * A showroom touch screen for customers in the seller's own shop. It opens on an attract screen,
 * then lets the customer browse every approved, in-stock product, narrow by category or "Find for
 * my car", open products, compare up to three, build an order and show it at the counter.
 * Nothing is saved or paid here: the order lives in this screen only and clears itself when a
 * customer walks away (IDLE_MS, then a short "Still there?" countdown).
 *
 * The screen is always light: product photos sit on white, and a shop looks the same whatever the
 * device theme is. Leaving needs the seller's password (the session is locked to this screen).
 */
export function StoreScreen({
  store,
  products,
  fitment,
  locked,
  sales,
}: {
  store: ScreenStore;
  products: ScreenProduct[];
  fitment: ScreenFitBrand[];
  locked: boolean;
  /** Selling from the screen: the AI salesperson and the ways to pay (the seller's store settings). */
  sales: { aiEnabled: boolean; pay: PayOptions };
}) {
  const [attract, setAttract] = useState<"on" | "leaving" | "off">("on");
  const [group, setGroup] = useState("all");
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<SortKey>("featured");
  const [car, setCar] = useState<Car | null>(null);
  const [compare, setCompare] = useState<string[]>([]);

  const [openId, setOpenId] = useState<string | null>(null);
  const [drawer, setDrawer] = useState(false);
  const [review, setReview] = useState(false);
  const [compareOpen, setCompareOpen] = useState(false);
  const [carOpen, setCarOpen] = useState(false);
  const [sellerOpen, setSellerOpen] = useState(false);
  const [idlePrompt, setIdlePrompt] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [aiOpen, setAiOpen] = useState(false);
  const [aiSeed, setAiSeed] = useState<string | null>(null);
  const [aiTurns, setAiTurns] = useState<AssistantTurn[]>([]);
  const [offer, setOffer] = useState<ScreenOffer | null>(null);
  const [checkoutOpen, setCheckoutOpen] = useState(false);

  const scroller = useRef<HTMLElement>(null);
  const order = useOrder(products, store.slug);
  const { lines, count, total, savings, setQty } = order;
  const badgePulse = usePulse(count);

  const byId = useMemo(() => new Map(products.map((p) => [p.id, p])), [products]);
  const open = openId ? (byId.get(openId) ?? null) : null;
  const hasCars = fitment.some((b) => b.n > 0);

  // Opening the screen locks this session to it.
  useEffect(() => {
    if (!locked) api("/api/vendor/store-screen", { body: { action: "lock" } }).catch(() => {});
  }, [locked]);

  // Always light; the page around it (scrollbars, browser bar) follows while it is open.
  useEffect(() => {
    const html = document.documentElement;
    const before = html.dataset.theme;
    html.dataset.theme = "light";
    return () => {
      if (before) html.dataset.theme = before;
      else delete html.dataset.theme;
    };
  }, []);

  // Short messages ("Added to order") fade after a moment.
  useEffect(() => {
    if (!notice) return;
    const t = window.setTimeout(() => setNotice(null), 2600);
    return () => window.clearTimeout(t);
  }, [notice]);

  /* ---- what is shown ---- */
  const base = useMemo(() => products.filter((p) => fitsCar(p, car) && matchesQuery(p, query)), [products, car, query]);

  const groups = useMemo(() => {
    const m = new Map<string, { name: string; count: number }>();
    for (const p of products) if (!m.has(p.group)) m.set(p.group, { name: p.groupName, count: 0 });
    for (const p of base) m.get(p.group)!.count++;
    return [...m.entries()].map(([slug, g]) => ({ slug, ...g }));
  }, [products, base]);

  const shown = useMemo(() => sortProducts(group === "all" ? base : base.filter((p) => p.group === group), sort), [base, group, sort]);
  const gridKey = `${group}|${query}|${sort}|${car?.slug ?? ""}`;

  const attractGroups = useMemo(() => {
    const all = new Map<string, { slug: string; name: string; count: number }>();
    for (const p of products) {
      const g = all.get(p.group) ?? { slug: p.group, name: p.groupName, count: 0 };
      g.count++;
      all.set(p.group, g);
    }
    return [...all.values()].sort((a, b) => b.count - a.count);
  }, [products]);

  /* ---- actions ---- */
  const resetBrowse = useCallback(() => {
    setGroup("all");
    setQuery("");
    setSort("featured");
    setCar(null);
    setCompare([]);
  }, []);

  const closeLayers = useCallback(() => {
    setOpenId(null);
    setDrawer(false);
    setReview(false);
    setCompareOpen(false);
    setCarOpen(false);
    setIdlePrompt(false);
    setNotice(null);
    setAiOpen(false);
    setCheckoutOpen(false);
  }, []);

  /** Back to the attract screen with a clean slate for the next customer. */
  const startOver = useCallback(() => {
    order.clear();
    setAiTurns([]);
    setAiSeed(null);
    setOffer(null);
    closeLayers();
    resetBrowse();
    setAttract("on");
    scroller.current?.scrollTo({ top: 0 });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- `order.clear` is stable
  }, [closeLayers, resetBrowse, order.clear]);

  const begin = useCallback((g?: string) => {
    if (g) setGroup(g);
    setAttract("leaving");
    window.setTimeout(() => setAttract("off"), 520);
  }, []);

  const toggleCompare = useCallback(
    (id: string) =>
      setCompare((c) => (c.includes(id) ? c.filter((x) => x !== id) : c.length >= COMPARE_MAX ? c : [...c, id])),
    [],
  );

  const overlays = open !== null || drawer || review || compareOpen || carOpen || aiOpen || checkoutOpen;

  // A special price belongs to this order: gone when the order is empty or the offer has expired.
  const offerValid = useStillValid(offer?.expiresAt ?? null);
  const liveOffer = offer && offerValid && count > 0 ? offer : null;
  const specialOff = liveOffer ? Math.min(liveOffer.discount, Math.floor((total * liveOffer.percent) / 100)) : 0;
  const askAi = (q?: string) => {
    setAiSeed(q?.trim() ? q.trim() : null);
    setAiOpen(true);
  };
  useIdle(
    () => {
      if (count > 0 || overlays) setIdlePrompt(true);
      else startOver();
    },
    IDLE_MS,
    attract === "on" || idlePrompt || sellerOpen,
  );

  const actions: TileActions = {
    car,
    qtys: order.qtys,
    compare,
    onOpen: (p) => setOpenId(p.id),
    onSetQty: setQty,
    onToggleCompare: toggleCompare,
  };

  const compareProducts = compare.map((id) => byId.get(id)).filter((p): p is ScreenProduct => Boolean(p));
  const dockBottom = count > 0 || compare.length > 0;

  const orderButton = (
    <button type="button" onClick={() => setDrawer(true)} className={`${ui.primary} relative h-14 shrink-0 px-4 md:px-6`} aria-label={`Your order, ${count} items, ${rupees(total)}`}>
      <ShoppingBag size={22} aria-hidden />
      <span className="hidden md:inline">Your order</span>
      {count > 0 && <span className="tnum hidden border-l border-on-accent/30 pl-2.5 lg:inline">{rupees(total)}</span>}
      <span
        aria-hidden
        className={`absolute -right-1.5 -top-1.5 grid h-7 min-w-7 place-items-center rounded-full bg-chalk px-1.5 text-sm font-bold text-void tnum ring-2 ring-void transition-opacity ${
          count > 0 ? "opacity-100" : "opacity-0"
        } ${badgePulse ? "ss-bump" : ""}`}
      >
        {count}
      </span>
    </button>
  );

  return (
    // Always light: a shop screen looks the same whatever theme the device or the site is set to.
    <div data-theme="light" className="ss-root flex h-dvh select-none flex-col bg-void text-chalk [&_input]:select-text">
      <Styles />

      {/* Browse (stays mounted under the attract screen, so the first touch is instant) */}
      <div className="flex min-h-0 flex-1 flex-col" inert={attract === "on"} aria-hidden={attract === "on"}>
        <header className="z-20 shrink-0 border-b border-tint/10 bg-void">
          <div className="flex items-center gap-3 px-4 py-3 md:gap-4 md:px-6">
            <button
              type="button"
              onClick={() => {
                resetBrowse();
                scroller.current?.scrollTo({ top: 0 });
              }}
              aria-label={`${store.name}. Show all products`}
              className="hidden min-w-0 shrink-0 items-center gap-3 rounded-2xl text-left transition-transform duration-200 active:scale-[0.97] sm:flex lg:w-60 xl:w-64"
            >
              <StoreMark store={store} className="h-12 w-12 md:h-14 md:w-14" text="text-xl" />
              <span className="hidden min-w-0 lg:block">
                <span className="flex min-w-0 items-center gap-1.5">
                  <h1 className="truncate font-display text-lg font-extrabold leading-tight tracking-tight text-chalk">{store.name}</h1>
                  <BadgeCheck size={18} aria-label="Riderzpro verified seller" className="shrink-0 fill-verified text-on-verified" />
                </span>
                <span className="block text-sm text-dim tnum">{products.length} in stock</span>
              </span>
            </button>

            <label className="relative min-w-0 flex-1">
              <span className="sr-only">Search products</span>
              <Search size={20} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-dim" aria-hidden />
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search or tap the mic: seat covers for Creta…"
                autoComplete="off"
                enterKeyHint="search"
                className="h-14 w-full rounded-xl border border-tint/15 bg-carbon pl-12 pr-28 text-base text-chalk outline-none transition-colors placeholder:text-dim focus:border-accent [&::-webkit-search-cancel-button]:hidden"
              />
              <span className="absolute right-1 top-1/2 flex -translate-y-1/2 items-center">
                {query && (
                  <button
                    type="button"
                    onClick={() => setQuery("")}
                    aria-label="Clear search"
                    className="grid h-12 w-12 place-items-center rounded-full text-ash active:bg-steel"
                  >
                    <X size={20} aria-hidden />
                  </button>
                )}
                <VoiceSearch onText={setQuery} />
              </span>
            </label>

            {sales.aiEnabled && (
              <button type="button" onClick={() => askAi()} className={`${ui.secondary} h-14 shrink-0 px-4 md:px-5`} aria-label="Ask our AI assistant">
                <Sparkles size={22} aria-hidden />
                <span className="hidden xl:inline">Ask AI</span>
              </button>
            )}

            {hasCars && (
              <button
                type="button"
                onClick={() => setCarOpen(true)}
                className={`${ui.secondary} h-14 shrink-0 px-4 md:px-5 ${car ? "border-chalk bg-chalk text-void hover:bg-chalk" : ""}`}
                aria-label={car ? `Your car: ${car.brand} ${car.name}. Change` : "Find for my car"}
              >
                <CarFront size={22} aria-hidden />
                <span className="hidden max-w-40 truncate md:inline">{car ? `${car.brand} ${car.name}` : "Find for my car"}</span>
              </button>
            )}

            {orderButton}
            <SellerAccess onOpen={() => setSellerOpen(true)} />
          </div>

          {/* Categories on phones and tablets (the rail takes over from lg) */}
          {groups.length > 1 && (
            <nav aria-label="Categories" className="ss-hide-bar flex gap-2 overflow-x-auto px-4 pb-3 lg:hidden md:px-6">
              <CategoryPill active={group === "all"} onClick={() => setGroup("all")} label="All products" count={base.length} />
              {groups.map((g) => (
                <CategoryPill key={g.slug} active={group === g.slug} onClick={() => setGroup(g.slug)} label={g.name} count={g.count} />
              ))}
            </nav>
          )}
        </header>

        <div className="flex min-h-0 flex-1">
          {/* Category rail */}
          {groups.length > 1 && (
            <nav aria-label="Categories" className="ss-scroll hidden w-60 shrink-0 overflow-y-auto border-r border-tint/10 bg-carbon px-3 py-5 lg:block xl:w-64">
              <ul className="space-y-1">
                <li>
                  <RailItem active={group === "all"} onClick={() => setGroup("all")} label="All products" count={base.length} />
                </li>
                {groups.map((g) => (
                  <li key={g.slug}>
                    <RailItem active={group === g.slug} onClick={() => setGroup(g.slug)} label={g.name} count={g.count} dim={g.count === 0} />
                  </li>
                ))}
              </ul>
            </nav>
          )}

          <section ref={scroller} aria-label="Products" className={`ss-scroll min-w-0 flex-1 overflow-y-auto px-4 pt-4 md:px-6 md:pt-5 ${dockBottom ? "pb-32" : "pb-8"}`}>
            {products.length > 0 && (
              <div className="mb-5 flex flex-wrap items-center justify-between gap-x-4 gap-y-3">
                <div className="flex min-w-0 items-center gap-3">
                  <p className="text-base font-semibold text-chalk tnum" aria-live="polite">
                    {shown.length} {shown.length === 1 ? "product" : "products"}
                  </p>
                  {sales.aiEnabled && query.trim().length > 2 && (
                    <button type="button" onClick={() => askAi(query)} className="inline-flex min-h-10 items-center gap-1.5 rounded-full border border-accent px-3.5 text-sm font-semibold text-accent active:scale-95">
                      <Sparkles size={16} aria-hidden /> Ask AI about “{query.trim().slice(0, 30)}”
                    </button>
                  )}
                  {car && (
                    <button type="button" onClick={() => setCar(null)} className="inline-flex min-h-10 items-center gap-1.5 rounded-full bg-chalk pl-3.5 pr-2.5 text-sm font-semibold text-void active:scale-95">
                      <span className="max-w-48 truncate">For your {car.name}</span> <X size={16} aria-hidden />
                      <span className="sr-only">Clear car</span>
                    </button>
                  )}
                </div>
                <div role="group" aria-label="Sort products" className="ss-hide-bar -mx-4 flex max-w-[100vw] gap-2 overflow-x-auto px-4 md:mx-0 md:px-0">
                  {SORTS.map((s) => (
                    <button
                      key={s.key}
                      type="button"
                      aria-pressed={sort === s.key}
                      onClick={() => setSort(s.key)}
                      className={`${ui.pill} min-h-12 text-sm ${sort === s.key ? "border-chalk bg-chalk text-void" : "border-tint/15 text-ash hover:border-tint/35"}`}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {products.length === 0 ? (
              <Empty title="No products to show yet">
                Approved products with stock appear here. Add products and stock from your seller dashboard.
              </Empty>
            ) : shown.length === 0 ? (
              <Empty title={car ? `Nothing listed for your ${car.name} yet` : "Nothing matches"} icon={<SearchX size={40} aria-hidden />}>
                <p>{car ? "Universal products show up here too, so ask us at the counter." : "Try a different word or category."}</p>
                {sales.aiEnabled && (
                  <button type="button" className={`${ui.secondary} mt-5`} onClick={() => askAi(query || (car ? `Parts for my ${car.brand} ${car.name}` : ""))}>
                    <Sparkles size={20} aria-hidden /> Ask our AI assistant
                  </button>
                )}
                <button
                  type="button"
                  className={`${ui.primary} mt-5`}
                  onClick={() => {
                    setQuery("");
                    setGroup("all");
                    setCar(null);
                  }}
                >
                  Show all products
                </button>
              </Empty>
            ) : (
              <div key={gridKey} className="ss-fade">
                <BrowseGrid products={shown} actions={actions} />
              </div>
            )}
          </section>
        </div>

        {/* Floating dock: compare, and the order on phones */}
        {dockBottom && (
          <div className="pointer-events-none fixed inset-x-0 bottom-0 z-30 flex flex-col items-center gap-2 px-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
            <div className="pointer-events-auto flex w-full max-w-xl items-center justify-center gap-2">
              {compare.length > 0 && (
                <div className="ss-pop flex items-center rounded-2xl bg-chalk text-void shadow-xl">
                  <button type="button" onClick={() => setCompareOpen(true)} className="inline-flex min-h-14 items-center gap-2.5 rounded-l-2xl pl-5 pr-3 text-base font-bold active:opacity-80">
                    <Columns2 size={20} aria-hidden /> Compare <span className="tnum">({compare.length})</span>
                  </button>
                  <button type="button" onClick={() => setCompare([])} aria-label="Clear compare" className="grid h-14 w-12 place-items-center rounded-r-2xl active:opacity-80">
                    <X size={18} aria-hidden />
                  </button>
                </div>
              )}
              {count > 0 && (
                <button type="button" onClick={() => setDrawer(true)} className={`${ui.primary} ss-pop flex-1 justify-between shadow-xl md:hidden`}>
                  <span className="flex items-center gap-2.5">
                    <ShoppingBag size={20} aria-hidden /> {count} {count === 1 ? "item" : "items"}
                  </span>
                  <span className="tnum">{rupees(total)}</span>
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Added-to-order message */}
      {notice && (
        <div role="status" className="ss-pop pointer-events-none fixed inset-x-0 bottom-24 z-[70] flex justify-center px-4 md:bottom-8">
          <div className="pointer-events-auto flex items-center gap-4 rounded-2xl bg-chalk py-2 pl-5 pr-2 text-void shadow-xl">
            <span className="text-base font-semibold">{notice}</span>
            <button type="button" onClick={() => { setNotice(null); setDrawer(true); }} className="min-h-12 rounded-xl bg-void px-4 text-base font-bold text-chalk active:scale-95">
              View order
            </button>
          </div>
        </div>
      )}

      {/* Layers, bottom to top */}
      {open && (
        <ProductSheet
          key={open.id}
          product={open}
          products={products}
          car={car}
          inOrder={order.qtys[open.id] ?? 0}
          orderCount={count}
          orderTotal={total}
          compare={compare}
          actions={actions}
          onClose={() => setOpenId(null)}
          onToggleCompare={toggleCompare}
          onViewOrder={() => {
            setOpenId(null);
            setDrawer(true);
          }}
          onAdd={(qty) => {
            setQty(open.id, (order.qtys[open.id] ?? 0) + qty);
            setOpenId(null);
            setNotice(`Added ${qty > 1 ? `${qty} × ` : ""}${open.title.length > 34 ? `${open.title.slice(0, 33)}…` : open.title}`);
          }}
        />
      )}

      {compareOpen && (
        <CompareSheet
          products={compareProducts}
          qtys={order.qtys}
          onSetQty={setQty}
          onRemove={toggleCompare}
          onOpen={(p) => {
            setCompareOpen(false);
            setOpenId(p.id);
          }}
          onClose={() => setCompareOpen(false)}
        />
      )}

      {drawer && (
        <OrderPanel
          lines={lines}
          count={count}
          total={total}
          savings={savings}
          setQty={setQty}
          onClose={() => setDrawer(false)}
          onReview={() => {
            setDrawer(false);
            setReview(true);
          }}
          onClear={() => {
            order.clear();
            setOffer(null);
            setDrawer(false);
          }}
          onCheckout={
            sales.pay.onScreen || sales.pay.atCounter
              ? () => {
                  setDrawer(false);
                  setCheckoutOpen(true);
                }
              : undefined
          }
          specialOff={specialOff}
        />
      )}

      {aiOpen && (
        <StoreAssistant
          byId={byId}
          qtys={order.qtys}
          car={car}
          offer={liveOffer}
          turns={aiTurns}
          setTurns={setAiTurns}
          seed={aiSeed}
          onAdd={(id, qty) => {
            const p = byId.get(id);
            if (!p) return;
            setQty(id, (order.qtys[id] ?? 0) + qty);
            setNotice(`Added ${p.title.length > 34 ? `${p.title.slice(0, 33)}…` : p.title}`);
          }}
          onOffer={setOffer}
          onCheckout={() => {
            setAiOpen(false);
            setCheckoutOpen(true);
          }}
          onOpenProduct={(id) => {
            setAiOpen(false);
            setOpenId(id);
          }}
          onClose={() => {
            setAiOpen(false);
            setAiSeed(null);
          }}
        />
      )}

      {checkoutOpen && count > 0 && (
        <CheckoutSheet
          store={store}
          lines={lines}
          total={total}
          offer={liveOffer}
          pay={sales.pay}
          onClose={() => setCheckoutOpen(false)}
          onDone={startOver}
        />
      )}

      {review && (
        <ReviewScreen
          store={store}
          lines={lines}
          count={count}
          total={total}
          savings={savings}
          token={order.token}
          onBack={() => setReview(false)}
          onNewOrder={startOver}
        />
      )}

      {carOpen && (
        <CarPicker
          brands={fitment}
          car={car}
          onClose={() => setCarOpen(false)}
          onPick={(c) => {
            setCar(c);
            setCarOpen(false);
            scroller.current?.scrollTo({ top: 0 });
          }}
        />
      )}

      {attract !== "off" && (
        <AttractScreen
          store={store}
          products={products}
          groups={attractGroups}
          leaving={attract === "leaving"}
          onStart={begin}
          seller={<SellerAccess onOpen={() => setSellerOpen(true)} />}
        />
      )}

      {idlePrompt && <IdlePrompt onStay={() => setIdlePrompt(false)} onTimeout={startOver} />}
      {sellerOpen && <SellerDialog
          onClose={() => setSellerOpen(false)}
          onWelcome={() => {
            setSellerOpen(false);
            startOver();
          }}
        />}
    </div>
  );
}

/* ------------------------------------------------------------------ parts */

function CategoryPill({ active, onClick, label, count }: { active: boolean; onClick: () => void; label: string; count: number }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`${ui.pill} ${active ? "border-accent bg-accent text-on-accent" : "border-tint/15 text-ash"} ${count === 0 && !active ? "opacity-50" : ""}`}
    >
      {label}
      <span className={`tnum text-sm ${active ? "text-on-accent" : "text-dim"}`}>{count}</span>
    </button>
  );
}

function RailItem({ active, onClick, label, count, dim = false }: { active: boolean; onClick: () => void; label: string; count: number; dim?: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`flex min-h-14 w-full items-center justify-between gap-3 rounded-xl px-4 text-left text-base font-semibold transition-colors duration-200 active:scale-[0.98] ${
        active ? "bg-accent text-on-accent shadow-sm" : "text-chalk hover:bg-steel"
      } ${dim && !active ? "opacity-45" : ""}`}
    >
      <span className="min-w-0 leading-tight">{label}</span>
      <span className={`tnum shrink-0 text-sm font-bold ${active ? "text-on-accent" : "text-dim"}`}>{count}</span>
    </button>
  );
}
