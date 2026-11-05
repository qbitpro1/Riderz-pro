"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { VoiceSearch } from "./VoiceSearch";
import { BadgeCheck, BadgePercent, CarFront, Columns2, Search, ShoppingBag, SearchX, Sparkles, X } from "lucide-react";
import { rupees } from "@/lib/format";
import { useLatest } from "@/lib/client/hooks";
import { api } from "@/lib/vendor/client";
import { AttractScreen } from "./AttractScreen";
import { BrowseGrid, type TileActions } from "./BrowseGrid";
import { CarPicker } from "./CarPicker";
import { CompareSheet } from "./CompareSheet";
import { IdlePrompt, SellerAccess, SellerDialog } from "./Dialogs";
import { useIdle, useOrder, usePulse, useStillValid } from "./hooks";
import {
  COMPARE_MAX,
  IDLE_MS,
  NO_FACETS,
  SORTS,
  fitsCar,
  matchesFacets,
  matchesQuery,
  onSale,
  priceBands,
  settleFacets,
  sortProducts,
  suggestionsFor,
  ui,
  type Car,
  type FacetKey,
  type Facets,
  type SortKey,
} from "./lib";
import { OrderPanel } from "./OrderPanel";
import { Empty, StoreMark } from "./parts";
import { ProductSheet } from "./ProductSheet";
import { ReviewScreen } from "./ReviewScreen";
import { Styles } from "./Styles";
import { StoreAssistant, type AssistantTurn, type ScreenOffer } from "./StoreAssistant";
import { CheckoutSheet, type PayOptions } from "./CheckoutSheet";
import { SuggestBar } from "./SuggestBar";

// getRandomValues, not randomUUID: randomUUID exists only on https/localhost, and a shop TV may
// open the screen over plain http on the local network.
const newChatId = () => `sc_${Array.from(crypto.getRandomValues(new Uint8Array(16)), (b) => b.toString(16).padStart(2, "0")).join("")}`;
import type { ScreenCategory, ScreenFitBrand, ScreenProduct, ScreenStore } from "./types";

/**
 * THE OFFLINE STORE SCREEN (client)
 *
 * A showroom touch screen for customers in the seller's own shop. It opens on an attract screen,
 * then lets the customer browse every in-stock product the seller has saved, narrow by category or "Find for
 * my car", open products, compare up to three, build an order and show it at the counter.
 * Nothing is saved or paid here: the order lives in this screen only and clears itself when a
 * customer walks away (IDLE_MS, then a short "Still there?" countdown).
 *
 * The screen is always light: product photos sit on white, and a shop looks the same whatever the
 * device theme is. Leaving needs the seller's password (the session is locked to this screen).
 */

/** A typed search with no matches goes to Salesman AI after this pause in typing. */
const TYPED_NO_MATCH_MS = 2000;
/** How often the open screen checks for products the seller just added or changed. */
const PRODUCTS_REFRESH_MS = 15_000;

export function StoreScreen({
  store,
  products: firstProducts,
  categories: firstCategories,
  fitment: firstFitment,
  locked,
  sales,
}: {
  store: ScreenStore;
  products: ScreenProduct[];
  /** The seller's main shop categories: shown even before they have products. */
  categories: ScreenCategory[];
  fitment: ScreenFitBrand[];
  locked: boolean;
  /** Selling from the screen: the AI salesperson and the ways to pay (the seller's store settings). */
  sales: { aiEnabled: boolean; pay: PayOptions };
}) {
  // The seller controls this screen: what they save in the seller portal shows here within seconds.
  const [catalogue, setCatalogue] = useState({ products: firstProducts, categories: firstCategories, fitment: firstFitment });
  const { products, categories, fitment } = catalogue;
  const catalogueSig = useRef(JSON.stringify([firstProducts, firstCategories]));
  useEffect(() => {
    let stop = false;
    async function refresh() {
      if (document.hidden) return;
      try {
        const r = await api<{ products: ScreenProduct[]; categories: ScreenCategory[]; fitment: ScreenFitBrand[] }>("/api/vendor/store-screen/products");
        const sig = JSON.stringify([r.products, r.categories]);
        if (!stop && sig !== catalogueSig.current) {
          catalogueSig.current = sig;
          setCatalogue({ products: r.products, categories: r.categories, fitment: r.fitment });
        }
      } catch {
        /* offline for a moment: keep showing what we have */
      }
    }
    const t = window.setInterval(refresh, PRODUCTS_REFRESH_MS);
    document.addEventListener("visibilitychange", refresh);
    return () => {
      stop = true;
      window.clearInterval(t);
      document.removeEventListener("visibilitychange", refresh);
    };
  }, []);

  const [attract, setAttract] = useState<"on" | "leaving" | "off">("on");
  const [facets, setFacets] = useState<Facets>(NO_FACETS);
  const { group, sub, brand, price, sale } = facets;
  const [query, setQuery] = useState("");
  // A new search looks in every category: starting to type (or speak) clears the chosen category,
  // so "speaker" typed while Seat Cover is open still finds the speakers. The customer can narrow
  // the results by category afterwards.
  const search = (text: string) => {
    if (!query.trim() && text.trim()) setFacets((f) => (f.group === "all" && f.sub === "all" ? f : { ...f, group: "all", sub: "all" }));
    setQuery(text);
  };
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
  // "Added …" after something goes into the order, with what goes well with it.
  const [notice, setNotice] = useState<{ text: string; items: ScreenProduct[] } | null>(null);
  const [aiOpen, setAiOpen] = useState(false);
  const [aiSeed, setAiSeed] = useState<string | null>(null);
  const [aiTurns, setAiTurns] = useState<AssistantTurn[]>([]);
  // One id per customer chat, for the Salesman AI log; a new one for each new customer.
  const [aiChat, setAiChat] = useState(newChatId);
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
    const t = window.setTimeout(() => setNotice(null), notice.items.length ? 15_000 : 2600);
    return () => window.clearTimeout(t);
  }, [notice]);

  /* ---- what is shown ---- */
  const base = useMemo(() => products.filter((p) => fitsCar(p, car) && matchesQuery(p, query)), [products, car, query]);

  // Category, brand, price and "on sale" narrow each other: each filter's counts follow the
  // other three.
  const bands = useMemo(() => priceBands(products), [products]);
  const without = useCallback((k: FacetKey) => base.filter((p) => matchesFacets(p, facets, bands, k)), [base, facets, bands]);

  // The seller's shop categories first, in their order; then the rest as they come.
  const groups = useMemo(() => {
    const m = new Map<string, { name: string; pos: number; count: number }>();
    for (const c of categories) m.set(c.id, { name: c.name, pos: c.pos, count: 0 });
    for (const p of products) if (!m.has(p.group)) m.set(p.group, { name: p.groupName, pos: p.groupPos, count: 0 });
    for (const p of without("group")) m.get(p.group)!.count++;
    return [...m.entries()].map(([slug, g]) => ({ slug, ...g })).sort((a, b) => a.pos - b.pos);
  }, [products, categories, without]);

  // Sub-categories of the chosen category ("Autoform", "GFX Pro" inside Mats), when it has any.
  const subs = useMemo(() => {
    if (group === "all") return [];
    const m = new Map<string, { name: string; pos: number; count: number }>();
    for (const x of categories.find((c) => c.id === group)?.subs ?? []) m.set(x.id, { name: x.name, pos: x.pos, count: 0 });
    for (const p of products) if (p.group === group && p.sub && !m.has(p.sub)) m.set(p.sub, { name: p.subName ?? "", pos: p.subPos, count: 0 });
    for (const p of without("sub")) if (p.sub && m.has(p.sub)) m.get(p.sub)!.count++;
    return [...m.entries()].map(([slug, g]) => ({ slug, ...g })).sort((a, b) => a.pos - b.pos);
  }, [products, categories, without, group]);
  const subTotal = useMemo(() => without("sub").length, [without]);
  const groupTotal = useMemo(() => without("group").length, [without]);

  const brandPool = useMemo(() => without("brand"), [without]);
  const brands = useMemo(() => {
    const m = new Map<string, number>();
    for (const p of products) if (p.brand && !m.has(p.brand)) m.set(p.brand, 0);
    for (const p of brandPool) if (p.brand) m.set(p.brand, (m.get(p.brand) ?? 0) + 1);
    return [...m.entries()].map(([name, count]) => ({ name, count })).sort((a, b) => a.name.localeCompare(b.name));
  }, [products, brandPool]);

  const pricePool = useMemo(() => without("price"), [without]);
  const prices = useMemo(
    () => bands.map((b) => ({ ...b, count: pricePool.filter((p) => p.price >= b.min && (b.max === null || p.price < b.max)).length })),
    [bands, pricePool],
  );

  // "On sale" only when it narrows something: some products are below MRP, not all of them.
  const saleCount = useMemo(() => without("sale").filter(onSale).length, [without]);
  const hasSale = products.some(onSale) && !products.every(onSale);

  const shown = useMemo(() => sortProducts(base.filter((p) => matchesFacets(p, facets, bands)), sort), [base, facets, bands, sort]);
  const gridKey = `${group}|${sub}|${brand}|${price}|${sale}|${query}|${sort}|${car?.slug ?? ""}`;

  // Picking a value nothing else chosen has products in clears the filters it clashes with,
  // instead of showing an empty screen.
  const pick = (k: FacetKey, v: string | boolean) => setFacets((f) => settleFacets(base, { ...f, [k]: v }, k, bands));
  const pickGroup = (g: string) => setFacets((f) => settleFacets(base, { ...f, group: g, sub: "all" }, "group", bands));
  const pickSub = (v: string) => pick("sub", v);
  const pickBrand = (b: string) => pick("brand", b);
  const pickPrice = (key: string) => pick("price", key);
  const toggleSale = () => pick("sale", !sale);
  const showFilters = groups.length > 1 || brands.length > 1 || prices.length > 0 || hasSale;

  const attractGroups = useMemo(() => {
    const all = new Map<string, { slug: string; name: string; pos: number; count: number }>();
    for (const p of products) {
      const g = all.get(p.group) ?? { slug: p.group, name: p.groupName, pos: p.groupPos, count: 0 };
      g.count++;
      all.set(p.group, g);
    }
    // The seller's own category order first, then the biggest.
    return [...all.values()].sort((a, b) => a.pos - b.pos || b.count - a.count);
  }, [products]);

  /* ---- actions ---- */
  const resetBrowse = useCallback(() => {
    setFacets(NO_FACETS);
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
    setAiChat(newChatId());
    setAiSeed(null);
    setOffer(null);
    closeLayers();
    resetBrowse();
    setAttract("on");
    scroller.current?.scrollTo({ top: 0 });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- `order.clear` is stable
  }, [closeLayers, resetBrowse, order.clear]);

  const begin = useCallback((g?: string) => {
    if (g) setFacets({ ...NO_FACETS, group: g });
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

  // Nothing in stock matches the search: Salesman AI takes the question instead of an empty
  // screen. Spoken: as soon as the customer stops talking. Typed: on Enter, or after a pause.
  const [listening, setListening] = useState(false);
  const noMatch = useCallback(
    (q: string) => q.trim().length >= 3 && !products.some((p) => fitsCar(p, car) && matchesQuery(p, q)),
    [products, car],
  );
  const handToAi = useLatest((q: string) => {
    if (!sales.aiEnabled || !noMatch(q)) return false;
    setQuery("");
    askAi(q);
    return true;
  });
  useEffect(() => {
    if (!sales.aiEnabled || listening || overlays || !noMatch(query)) return;
    const t = window.setTimeout(() => handToAi.current(query), TYPED_NO_MATCH_MS);
    return () => window.clearTimeout(t);
  }, [query, listening, overlays, noMatch, sales.aiEnabled, handToAi]);
  useIdle(
    () => {
      if (count > 0 || overlays) setIdlePrompt(true);
      else startOver();
    },
    IDLE_MS,
    attract === "on" || idlePrompt || sellerOpen,
  );

  /** "Added …" plus a few products that go well with it. */
  const announce = (p: ScreenProduct, qty = 1) => {
    const name = p.title.length > 34 ? `${p.title.slice(0, 33)}…` : p.title;
    const inOrder = { ...order.qtys, [p.id]: (order.qtys[p.id] ?? 0) + qty };
    setNotice({ text: `Added ${qty > 1 ? `${qty} × ` : ""}${name}`, items: suggestionsFor([p], products, categories, inOrder, car) });
  };

  const actions: TileActions = {
    car,
    qtys: order.qtys,
    compare,
    onOpen: (p) => setOpenId(p.id),
    onSetQty: (id, n) => {
      const before = order.qtys[id] ?? 0;
      setQty(id, n);
      const p = byId.get(id);
      if (p && before === 0 && n > 0) announce(p, n);
    },
    onToggleCompare: toggleCompare,
  };

  // "You may also need" in the order panel: what goes with everything already in it.
  const orderSuggestions = useMemo(
    () => (lines.length ? suggestionsFor(lines.map((l) => l.product), products, categories, order.qtys, car, 4) : []),
    [lines, products, categories, order.qtys, car],
  );

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
          <div className="flex flex-wrap items-center gap-3 px-4 py-3 sm:flex-nowrap md:gap-4 md:px-6">
            <button
              type="button"
              onClick={() => {
                resetBrowse();
                scroller.current?.scrollTo({ top: 0 });
              }}
              aria-label={`${store.name}. Show all products`}
              className="flex min-w-0 shrink-0 items-center gap-3 rounded-2xl text-left transition-transform duration-200 active:scale-[0.97] max-sm:mr-auto lg:w-60 xl:w-64"
            >
              <StoreMark store={store} className="h-12 w-12 md:h-14 md:w-14" text="text-xl" />
              <span className="hidden min-w-0 lg:block">
                <span className="flex min-w-0 items-center gap-1.5">
                  <h1 className="truncate font-display text-lg font-extrabold leading-tight tracking-tight text-chalk">{store.name}</h1>
                  <BadgeCheck size={18} aria-label="Riderzpro verified seller" className="shrink-0 fill-verified text-on-verified" />
                </span>
                <span className="line-clamp-2 text-sm leading-snug text-dim tnum" title={store.address ?? undefined}>{store.address ?? `${products.length} in stock`}</span>
              </span>
            </button>

            <label className="relative order-last min-w-0 basis-full sm:order-none sm:basis-auto sm:flex-1">
              <span className="sr-only">Search products</span>
              <Search size={20} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-dim" aria-hidden />
              <input
                type="search"
                value={query}
                onChange={(e) => search(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && handToAi.current(query)) e.preventDefault();
                }}
                placeholder="Search or tap the mic: seat covers for Creta…"
                autoComplete="off"
                enterKeyHint="search"
                className={`h-14 w-full rounded-xl border border-tint/15 bg-carbon pl-12 ${query ? "pr-28" : "pr-14"} text-base text-chalk outline-none transition-colors placeholder:text-dim focus:border-accent [&::-webkit-search-cancel-button]:hidden`}
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
                <VoiceSearch onText={search} onFinal={(t) => handToAi.current(t)} onListening={setListening} />
              </span>
            </label>

            {sales.aiEnabled && (
              <button type="button" onClick={() => askAi()} className={`${ui.secondary} h-14 shrink-0 px-4 md:px-5`} aria-label="Ask Salesman AI">
                <Sparkles size={22} aria-hidden />
                <span className="hidden xl:inline">Salesman AI</span>
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
              <CategoryPill active={group === "all"} onClick={() => pickGroup("all")} label="All products" count={groupTotal} />
              {groups.map((g) => (
                <CategoryPill key={g.slug} active={group === g.slug} onClick={() => pickGroup(g.slug)} label={g.name} count={g.count} />
              ))}
            </nav>
          )}
          {subs.length > 0 && (
            <nav aria-label="Sub-categories" className="ss-hide-bar flex gap-2 overflow-x-auto px-4 pb-3 lg:hidden md:px-6">
              <CategoryPill active={sub === "all"} onClick={() => pickSub("all")} label={`All ${groups.find((g) => g.slug === group)?.name ?? ""}`} count={subTotal} />
              {subs.map((x) => (
                <CategoryPill key={x.slug} active={sub === x.slug} onClick={() => pickSub(x.slug)} label={x.name} count={x.count} />
              ))}
            </nav>
          )}
          {brands.length > 1 && (
            <nav aria-label="Brands" className="ss-hide-bar flex gap-2 overflow-x-auto px-4 pb-3 lg:hidden md:px-6">
              <CategoryPill active={brand === "all"} onClick={() => pickBrand("all")} label="All brands" count={brandPool.length} />
              {brands.map((b) => (
                <CategoryPill key={b.name} active={brand === b.name} onClick={() => pickBrand(b.name)} label={b.name} count={b.count} />
              ))}
            </nav>
          )}
          {(prices.length > 0 || hasSale) && (
            <nav aria-label="Price and offers" className="ss-hide-bar flex gap-2 overflow-x-auto px-4 pb-3 lg:hidden md:px-6">
              {hasSale && <SalePill active={sale} onClick={toggleSale} count={saleCount} />}
              {prices.length > 0 && <CategoryPill active={price === "all"} onClick={() => pickPrice("all")} label="Any price" count={pricePool.length} />}
              {prices.map((b) => (
                <CategoryPill key={b.key} active={price === b.key} onClick={() => pickPrice(b.key)} label={b.label} count={b.count} />
              ))}
            </nav>
          )}
        </header>

        <div className="flex min-h-0 flex-1">
          {/* Category rail */}
          {showFilters && (
            <nav aria-label="Categories, brands and prices" className="ss-scroll hidden w-60 shrink-0 overflow-y-auto border-r border-tint/10 bg-carbon px-3 py-5 lg:block xl:w-64">
              {groups.length > 1 && (
                <ul className="space-y-1">
                  <li>
                    <RailItem active={group === "all"} onClick={() => pickGroup("all")} label="All products" count={groupTotal} />
                  </li>
                  {groups.map((g) => (
                    <li key={g.slug}>
                      <RailItem active={group === g.slug && sub === "all"} onClick={() => pickGroup(g.slug)} label={g.name} count={g.count} dim={g.count === 0} />
                      {group === g.slug && subs.length > 0 && (
                        <ul aria-label={`${g.name} sub-categories`} className="mt-1 space-y-1 border-l-2 border-accent/30 pl-2 ml-4">
                          {subs.map((x) => (
                            <li key={x.slug}>
                              <RailItem active={sub === x.slug} onClick={() => pickSub(x.slug)} label={x.name} count={x.count} dim={x.count === 0} small />
                            </li>
                          ))}
                        </ul>
                      )}
                    </li>
                  ))}
                </ul>
              )}
              {brands.length > 1 && (
                <>
                  <p className={`px-4 pb-2 text-xs font-bold uppercase tracking-[0.12em] text-dim ${groups.length > 1 ? "mt-6 border-t border-tint/10 pt-5" : ""}`}>Brands</p>
                  <ul className="space-y-1">
                    <li>
                      <RailItem active={brand === "all"} onClick={() => pickBrand("all")} label="All brands" count={brandPool.length} />
                    </li>
                    {brands.map((b) => (
                      <li key={b.name}>
                        <RailItem active={brand === b.name} onClick={() => pickBrand(b.name)} label={b.name} count={b.count} dim={b.count === 0} />
                      </li>
                    ))}
                  </ul>
                </>
              )}
              {(prices.length > 0 || hasSale) && (
                <>
                  <p className={`px-4 pb-2 text-xs font-bold uppercase tracking-[0.12em] text-dim ${groups.length > 1 || brands.length > 1 ? "mt-6 border-t border-tint/10 pt-5" : ""}`}>Price</p>
                  <ul className="space-y-1">
                    {hasSale && (
                      <li className={prices.length > 0 ? "pb-2" : ""}>
                        <SaleSwitch active={sale} onClick={toggleSale} count={saleCount} />
                      </li>
                    )}
                    {prices.length > 0 && (
                      <li>
                        <RailItem active={price === "all"} onClick={() => pickPrice("all")} label="Any price" count={pricePool.length} />
                      </li>
                    )}
                    {prices.map((b) => (
                      <li key={b.key}>
                        <RailItem active={price === b.key} onClick={() => pickPrice(b.key)} label={b.label} count={b.count} dim={b.count === 0} />
                      </li>
                    ))}
                  </ul>
                </>
              )}
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
                      <Sparkles size={16} aria-hidden /> Ask Salesman AI about “{query.trim().slice(0, 30)}”
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
                Products with stock appear here as soon as you save them in your seller dashboard.
              </Empty>
            ) : shown.length === 0 && group !== "all" && !products.some((p) => p.group === group) ? (
              <Empty title={`${groups.find((g) => g.slug === group)?.name ?? "This category"}: coming soon`}>
                <p>Nothing on the screen here yet. Ask our staff, they can help you at the counter.</p>
                <button type="button" className={`${ui.secondary} mt-5`} onClick={() => pickGroup("all")}>
                  See all products
                </button>
              </Empty>
            ) : shown.length === 0 ? (
              <Empty title={car ? `Nothing listed for your ${car.name} yet` : "Nothing matches"} icon={<SearchX size={40} aria-hidden />}>
                <p>{car ? "Universal products show up here too, so ask us at the counter." : "Try a different word, category, brand or price."}</p>
                {sales.aiEnabled && (
                  <button type="button" className={`${ui.secondary} mt-5`} onClick={() => askAi(query || (car ? `Parts for my ${car.brand} ${car.name}` : ""))}>
                    <Sparkles size={20} aria-hidden /> Ask Salesman AI
                  </button>
                )}
                <button
                  type="button"
                  className={`${ui.primary} mt-5`}
                  onClick={() => {
                    setQuery("");
                    setFacets(NO_FACETS);
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
        <SuggestBar
          added={notice.text}
          items={notice.items}
          onAdd={(p) => {
            setQty(p.id, (order.qtys[p.id] ?? 0) + 1);
            announce(p);
          }}
          onOpen={(p) => {
            setNotice(null);
            setOpenId(p.id);
          }}
          onViewOrder={() => {
            setNotice(null);
            setDrawer(true);
          }}
          onClose={() => setNotice(null)}
        />
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
            announce(open, qty);
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
          suggestions={orderSuggestions}
          onAddSuggestion={(p) => setQty(p.id, (order.qtys[p.id] ?? 0) + 1)}
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
          storeName={store.name}
          conversationId={aiChat}
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
            // A short note only: suggestions would cover the chat (Salesman AI suggests in the chat itself).
            setNotice({ text: `Added ${p.title.length > 34 ? `${p.title.slice(0, 33)}…` : p.title}`, items: [] });
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
          conversationId={aiTurns.length ? aiChat : null}
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

/** "On sale" on phones and tablets: a toggle among the price pills. */
function SalePill({ active, onClick, count }: { active: boolean; onClick: () => void; count: number }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`${ui.pill} ${active ? "border-accent bg-accent text-on-accent" : "border-accent/40 text-accent"} ${count === 0 && !active ? "opacity-50" : ""}`}
    >
      <BadgePercent size={18} aria-hidden />
      On sale
      <span className={`tnum text-sm ${active ? "text-on-accent" : "text-accent/75"}`}>{count}</span>
    </button>
  );
}

/** "On sale" in the rail: an on/off switch above the price ranges. */
function SaleSwitch({ active, onClick, count }: { active: boolean; onClick: () => void; count: number }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={active}
      onClick={onClick}
      className={`flex min-h-14 w-full items-center gap-3 rounded-xl border px-4 text-left text-base font-semibold transition-colors duration-200 active:scale-[0.98] ${
        active ? "border-accent bg-accent/10 text-chalk" : "border-tint/15 bg-void text-chalk hover:bg-steel"
      } ${count === 0 && !active ? "opacity-45" : ""}`}
    >
      <BadgePercent size={20} aria-hidden className="shrink-0 text-accent" />
      <span className="min-w-0 flex-1 leading-tight">
        On sale <span className="tnum text-sm font-bold text-dim">{count}</span>
      </span>
      <span aria-hidden className={`relative h-6 w-10 shrink-0 rounded-full transition-colors ${active ? "bg-accent" : "bg-tint/25"}`}>
        <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-[left] ${active ? "left-[1.125rem]" : "left-0.5"}`} />
      </span>
    </button>
  );
}

function RailItem({
  active,
  onClick,
  label,
  count,
  dim = false,
  small = false,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  count: number;
  dim?: boolean;
  small?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`flex ${small ? "min-h-12 text-[15px]" : "min-h-14 text-base"} w-full items-center justify-between gap-3 rounded-xl px-4 text-left font-semibold transition-colors duration-200 active:scale-[0.98] ${
        active ? "bg-accent text-on-accent shadow-sm" : "text-chalk hover:bg-steel"
      } ${dim && !active ? "opacity-45" : ""}`}
    >
      <span className="min-w-0 leading-tight">{label}</span>
      <span className={`tnum shrink-0 text-sm font-bold ${active ? "text-on-accent" : "text-dim"}`}>{count}</span>
    </button>
  );
}
