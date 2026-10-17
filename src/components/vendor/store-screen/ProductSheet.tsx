"use client";

import { useMemo, useState } from "react";
import { ArrowLeft, CarFront, Check, Columns2, Plus, ShieldCheck, ShoppingBag } from "lucide-react";
import { rupees } from "@/lib/format";
import { ProductTile, type TileActions } from "./BrowseGrid";
import { Gallery } from "./Gallery";
import { Layer } from "./Layer";
import { COMPARE_MAX, LOW_STOCK, maxFor, ui, type Car } from "./lib";
import { Price, Stepper, highlightIcon } from "./parts";
import type { ScreenProduct } from "./types";

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid grid-cols-[minmax(0,2fr)_minmax(0,3fr)] gap-4 py-3.5">
      <dt className="text-base text-dim">{label}</dt>
      <dd className="break-words text-base font-medium text-chalk">{value}</dd>
    </div>
  );
}

const h3 = "font-display text-xl font-extrabold tracking-tight text-chalk md:text-2xl";

/**
 * One product, full screen: a large swipeable gallery beside the price, highlights and fitment; then
 * About, Product details, Specifications and a "Similar in this store" strip. The add bar stays at the
 * bottom whatever you scroll to.
 */
export function ProductSheet({
  product: p,
  products,
  car,
  inOrder,
  orderCount,
  orderTotal,
  compare,
  actions,
  onClose,
  onAdd,
  onViewOrder,
  onToggleCompare,
}: {
  product: ScreenProduct;
  products: ScreenProduct[];
  car: Car | null;
  inOrder: number;
  orderCount: number;
  orderTotal: number;
  compare: string[];
  actions: TileActions;
  onClose: () => void;
  onAdd: (qty: number) => void;
  onViewOrder: () => void;
  onToggleCompare: (id: string) => void;
}) {
  const room = maxFor(p) - inOrder;
  const [qty, setQty] = useState(room > 0 ? 1 : 0);
  const low = p.stock <= LOW_STOCK;
  const fitsYours = car ? p.universal || p.fitSlugs.includes(car.slug) : null;

  const similar = useMemo(() => {
    const same = products.filter((o) => o.id !== p.id && o.group === p.group);
    const other = products.filter((o) => o.id !== p.id && o.group !== p.group && o.department === p.department);
    return [...same, ...other].slice(0, 10);
  }, [products, p]);

  const facts = [
    { label: "Brand", value: p.brand },
    { label: "Category", value: p.groupName },
    { label: "Part type", value: p.partType },
    ...(p.warrantyMonths ? [{ label: "Warranty", value: `${p.warrantyMonths} months` }] : []),
  ];
  const inCompare = compare.includes(p.id);

  return (
    <Layer label={p.title} onClose={onClose} kind="full">
      {/* Top bar */}
      <div className="flex shrink-0 items-center justify-between gap-3 border-b border-tint/10 bg-void px-4 py-3 md:px-8">
        <button type="button" onClick={onClose} className={`${ui.secondary} min-h-12 px-5`}>
          <ArrowLeft size={20} aria-hidden /> Back to products
        </button>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => onToggleCompare(p.id)}
            disabled={!inCompare && compare.length >= COMPARE_MAX}
            aria-pressed={inCompare}
            className={`${ui.secondary} min-h-12 px-4 ${inCompare ? "border-chalk bg-chalk text-void hover:bg-chalk" : ""}`}
          >
            {inCompare ? <Check size={18} aria-hidden /> : <Columns2 size={18} aria-hidden />}
            <span className="hidden sm:inline">{inCompare ? "In compare" : "Compare"}</span>
          </button>
          {orderCount > 0 && (
            <button type="button" onClick={onViewOrder} className={`${ui.primary} min-h-12 px-5`}>
              <ShoppingBag size={18} aria-hidden />
              <span className="hidden sm:inline">Your order</span>
              <span className="tnum">{orderCount} · {rupees(orderTotal)}</span>
            </button>
          )}
        </div>
      </div>

      <div className="ss-scroll min-h-0 flex-1 overflow-y-auto">
        <div className="mx-auto max-w-[1500px] px-4 py-6 md:px-8 md:py-8">
          <div className="grid gap-8 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)] lg:gap-12">
            <div className="min-w-0 lg:sticky lg:top-0 lg:self-start">
              <Gallery images={p.images} title={p.title} brand={p.brand} />
            </div>

            <div className="min-w-0 space-y-6">
              <div>
                <p className="text-base font-semibold text-accent">
                  {p.brand} <span className="text-dim">/ {p.groupName}</span>
                </p>
                <h2 className="mt-2 text-balance font-display text-[clamp(1.75rem,3.4vw,3rem)] font-extrabold leading-[1.02] tracking-[-0.035em] text-chalk">
                  {p.title}
                </h2>
              </div>

              <div>
                <Price p={p} size="lg" />
                <p className="mt-1.5 text-sm text-dim">Price includes GST. MRP is the printed maximum retail price.</p>
              </div>

              <ul className="flex flex-wrap gap-2">
                <li className={`rounded-full px-3.5 py-1.5 text-sm font-semibold ${low ? "bg-accent/10 text-accent" : "bg-carbon text-ash"}`}>
                  {low ? `Only ${p.stock} left` : "In stock"}
                </li>
                <li className="rounded-full bg-carbon px-3.5 py-1.5 text-sm font-semibold text-ash">{p.partType}</li>
                {p.warrantyMonths ? (
                  <li className="inline-flex items-center gap-1.5 rounded-full bg-carbon px-3.5 py-1.5 text-sm font-semibold text-ash">
                    <ShieldCheck size={15} aria-hidden /> {p.warrantyMonths}-month warranty
                  </li>
                ) : null}
              </ul>

              {/* Fitment */}
              <div className="rounded-2xl border border-tint/10 bg-carbon p-4 md:p-5">
                <p className="flex items-center gap-2 text-base font-bold text-chalk">
                  <CarFront size={20} className="text-accent" aria-hidden />
                  {p.universal ? "Universal fit" : "Made to fit"}
                </p>
                {car && fitsYours !== null && (
                  <p className={`mt-1.5 text-base font-semibold ${fitsYours ? "text-chalk" : "text-accent"}`}>
                    {fitsYours ? <Check size={16} className="mr-1 inline" aria-hidden /> : null}
                    {fitsYours ? `Fits your ${car.brand} ${car.name}` : `Not listed for your ${car.brand} ${car.name}. Ask at the counter.`}
                  </p>
                )}
                {p.fitLabels.length > 0 && (
                  <ul className="mt-3 flex flex-wrap gap-2">
                    {p.fitLabels.map((f, i) => (
                      <li
                        key={f}
                        className={`rounded-full px-3 py-1.5 text-sm font-medium ${
                          car && p.fitSlugs[i] === car.slug ? "bg-chalk text-void" : "bg-void text-ash ring-1 ring-tint/10"
                        }`}
                      >
                        {f}
                      </li>
                    ))}
                  </ul>
                )}
                {p.universal && p.fitLabels.length === 0 && <p className="mt-1.5 text-base text-ash">Fits most cars. Ask us if you are unsure.</p>}
              </div>

              {p.highlights.length > 0 && (
                <ul className="space-y-3.5">
                  {p.highlights.slice(0, 8).map((h) => {
                    const Icon = highlightIcon(h);
                    return (
                      <li key={h} className="flex gap-3.5 text-base leading-snug text-ash md:text-[17px]">
                        <span className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-full bg-accent/10 text-accent">
                          <Icon size={17} aria-hidden />
                        </span>
                        <span className="pt-1">{h}</span>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          </div>

          <div className="mt-12 grid gap-10 border-t border-tint/10 pt-10 lg:grid-cols-2 lg:gap-14">
            <div className="min-w-0 space-y-9">
              {p.summary && (
                <section>
                  <h3 className={h3}>About this product</h3>
                  <p className="mt-3 max-w-[65ch] whitespace-pre-line text-base leading-relaxed text-ash md:text-[17px]">{p.summary}</p>
                </section>
              )}
              <section>
                <h3 className={h3}>Product details</h3>
                <dl className="mt-3 divide-y divide-tint/10 border-y border-tint/10">
                  {facts.map((f) => (
                    <Row key={f.label} label={f.label} value={f.value} />
                  ))}
                </dl>
              </section>
            </div>
            {p.specs.length > 0 && (
              <section className="min-w-0">
                <h3 className={h3}>Specifications</h3>
                <dl className="mt-3 divide-y divide-tint/10 border-y border-tint/10">
                  {p.specs.map((s) => (
                    <Row key={s.label} label={s.label} value={s.value} />
                  ))}
                </dl>
              </section>
            )}
          </div>

          {similar.length > 0 && (
            <section className="mt-12 border-t border-tint/10 pt-10" aria-label="Similar in this store">
              <h3 className={h3}>Similar in this store</h3>
              <ul className="ss-hide-bar -mx-4 mt-5 flex snap-x gap-4 overflow-x-auto px-4 pb-3 md:-mx-8 md:px-8">
                {similar.map((o) => (
                  <li key={o.id} className="w-64 shrink-0 snap-start md:w-72">
                    <ProductTile product={o} actions={actions} compact />
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>
      </div>

      {/* Add bar */}
      <div className="shrink-0 border-t border-tint/10 bg-void px-4 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-3 md:px-8">
        <div className="mx-auto flex max-w-[1500px] flex-wrap items-center justify-between gap-3">
          <div className="hidden min-w-0 sm:block">
            <p className="truncate text-sm font-semibold text-dim">{p.brand}</p>
            <p className="truncate text-base font-bold text-chalk md:text-lg">{p.title}</p>
          </div>
          {room > 0 ? (
            <div className="flex w-full items-center gap-3 sm:w-auto">
              <Stepper value={qty} min={1} max={room} onChange={(n) => setQty(Math.max(1, Math.min(n, room)))} label={p.title} />
              <button type="button" data-autofocus onClick={() => onAdd(qty)} className={`${ui.primary} min-h-14 flex-1 sm:flex-none sm:px-8`}>
                <Plus size={20} aria-hidden />
                {inOrder > 0 ? "Add more" : "Add to order"}
                <span className="tnum">· {rupees(p.price * qty)}</span>
              </button>
            </div>
          ) : (
            <div className="flex w-full items-center justify-between gap-3 sm:w-auto">
              <p className="text-base font-medium text-ash">All {inOrder} available are in your order.</p>
              <button type="button" data-autofocus onClick={onViewOrder} className={ui.primary}>
                <ShoppingBag size={20} aria-hidden /> View order
              </button>
            </div>
          )}
        </div>
      </div>
    </Layer>
  );
}
