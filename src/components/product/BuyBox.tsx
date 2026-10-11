"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useCart } from "@/components/cart/CartContext";
import { Icon } from "@/components/ui/Icon";
import { Stars } from "@/components/ui/Section";
import { whatsapp } from "@/lib/data/site";
import { rupees } from "@/lib/format";
import { FREE_SHIPPING_OVER } from "@/lib/store/shipping";
import { cartLineId, productHref, type ProductDetail } from "@/lib/store/types";

/** Stock is only called out when the source's own number is this low. */
const LOW_STOCK = 5;

export function BuyBox({ detail }: { detail: ProductDetail }) {
  const { add } = useCart();
  const router = useRouter();

  const [choices, setChoices] = useState<Record<string, string>>(() => {
    const init: Record<string, string> = {};
    for (const o of detail.options) {
      const first = o.values.find((v) => v.available) ?? o.values[0];
      if (first) init[o.id] = first.id;
    }
    return init;
  });
  const [qty, setQty] = useState(1);
  const [withInstall, setWithInstall] = useState(false);
  const [showBar, setShowBar] = useState(false);
  const actionsRef = useRef<HTMLDivElement>(null);

  const selected = useMemo(
    () =>
      detail.options.map((o) => ({
        option: o,
        value: o.values.find((v) => v.id === choices[o.id]) ?? null,
      })),
    [detail.options, choices],
  );

  const optionUnavailable = selected.some((s) => !s.value || !s.value.available);
  const unitPrice =
    detail.price === null ? null : detail.price + selected.reduce((n, s) => n + (s.value?.priceDelta ?? 0), 0);
  const unitMrp =
    detail.mrp === null ? null : detail.mrp + selected.reduce((n, s) => n + (s.value?.mrpDelta ?? 0), 0);
  const saving = unitPrice !== null && unitMrp !== null && unitMrp > unitPrice ? unitMrp - unitPrice : 0;
  const savingPct = saving > 0 && unitMrp ? Math.round((saving / unitMrp) * 100) : 0;

  const installPrice = detail.installation && typeof detail.installation.price === "number" ? detail.installation.price : null;
  const canBuy =
    unitPrice !== null && !optionUnavailable && detail.availability !== "coming-soon" && detail.indexable;

  const variant = selected
    .map((s) => s.value?.label)
    .filter(Boolean)
    .join(" · ");

  const askLink = whatsapp(
    `Hi Riderzpro, I'm interested in ${detail.title}${detail.code ? ` (${detail.code})` : ""}${
      variant ? `, ${variant}` : ""
    }. Could you share the price and availability?`,
  );

  const line = () => ({
    id: cartLineId(detail.slug, choices),
    slug: detail.slug,
    href: productHref(detail.slug),
    name: detail.title,
    variant: variant || undefined,
    image: detail.images[0],
    price: unitPrice ?? 0,
    install: withInstall && installPrice !== null ? installPrice : undefined,
  });

  const addToCart = () => {
    if (canBuy) add(line(), qty);
  };
  const buyNow = () => {
    if (!canBuy) return;
    add(line(), qty, { open: false });
    router.push("/cart");
  };

  // Show the phone bar once the real buttons have scrolled up out of view.
  useEffect(() => {
    const el = actionsRef.current;
    if (!el || typeof IntersectionObserver === "undefined") return;
    const io = new IntersectionObserver(
      ([entry]) => setShowBar(!entry.isIntersecting && entry.boundingClientRect.top < 0),
      { threshold: 0 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const availabilityText =
    detail.availability === "in-stock"
      ? "In stock"
      : detail.availability === "made-to-order"
        ? "Made to order"
        : "Coming soon";
  const lowStock =
    detail.availability === "in-stock" && detail.stock !== null && detail.stock > 0 && detail.stock <= LOW_STOCK
      ? `Only ${detail.stock} left`
      : null;

  return (
    <div>
      <p className="eyebrow">{detail.brandName}</p>
      <h1 className="display-3 mt-2 text-balance">{detail.title}</h1>
      {detail.code && (
        <p className="mt-2 text-xs text-dim">
          Model no. <span className="font-display font-bold tracking-[0.06em] text-chalk">{detail.code}</span>
        </p>
      )}
      {detail.rating !== null && detail.reviews !== null && (
        <div className="mt-3 flex items-center gap-2">
          <Stars rating={detail.rating} />
          <span className="text-xs text-ash tnum">
            {detail.rating.toFixed(1)} ({detail.reviews} {detail.reviews === 1 ? "review" : "reviews"})
          </span>
        </div>
      )}

      {/* Price */}
      <div className="mt-5">
        {unitPrice === null ? (
          <p className="font-display text-2xl font-extrabold uppercase tracking-[-0.02em] text-gold">
            {detail.availability === "coming-soon" ? "Launching soon" : "Price on request"}
          </p>
        ) : (
          <>
            <p className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
              {detail.priceFrom && <span className="text-xs uppercase tracking-[0.12em] text-dim">From</span>}
              <span className="font-display text-3xl font-extrabold tnum">{rupees(unitPrice)}</span>
              {saving > 0 && unitMrp !== null && (
                <>
                  <span className="text-base text-dim line-through tnum">{rupees(unitMrp)}</span>
                  <span className="text-sm font-semibold text-accent tnum">
                    Save {rupees(saving)} ({savingPct}%)
                  </span>
                </>
              )}
            </p>
            <p className="mt-1 text-xs text-dim">Inclusive of all taxes</p>
          </>
        )}
      </div>

      {/* Options */}
      {selected.map(({ option, value }) => (
        <fieldset key={option.id} className="mt-5">
          <legend className="label">
            {option.name}
            {value && <span className="ml-2 normal-case tracking-normal text-ash">{value.label}</span>}
          </legend>
          <div className="mt-2 flex flex-wrap gap-2">
            {option.values.map((v) => {
              const on = value?.id === v.id;
              return (
                <button
                  key={v.id}
                  type="button"
                  disabled={!v.available}
                  aria-pressed={on}
                  onClick={() => setChoices((c) => ({ ...c, [option.id]: v.id }))}
                  className={`chip min-h-11 px-4 text-sm disabled:cursor-not-allowed disabled:opacity-50 ${on ? "chip-active" : ""}`}
                >
                  {v.label}
                  {!v.available && <span className="ml-1.5 text-[10px] uppercase tracking-[0.1em]">price on request</span>}
                </button>
              );
            })}
          </div>
        </fieldset>
      ))}

      {/* Installation */}
      {installPrice !== null && detail.installation && (
        <label className="mt-5 flex min-h-11 cursor-pointer items-start gap-3 border border-tint/10 p-3">
          <input
            type="checkbox"
            checked={withInstall}
            onChange={(e) => setWithInstall(e.target.checked)}
            className="mt-0.5 h-5 w-5 shrink-0 accent-accent"
          />
          <span className="text-sm">
            <span className="font-semibold">Add installation at our garage</span>
            <span className="ml-1.5 text-ash tnum">+ {rupees(installPrice)}</span>
            {detail.installation.time && <span className="block text-xs text-dim">Takes about {detail.installation.time}</span>}
          </span>
        </label>
      )}

      {/* Quantity + actions */}
      <div ref={actionsRef} className="mt-6">
        {canBuy ? (
          <>
            <div className="flex items-center gap-4">
              <span className="label">Quantity</span>
              <div className="inline-flex items-center border border-tint/15">
                <button
                  type="button"
                  aria-label="Decrease quantity"
                  onClick={() => setQty((q) => Math.max(1, q - 1))}
                  disabled={qty <= 1}
                  className="flex h-11 w-11 items-center justify-center disabled:opacity-40"
                >
                  <Icon name="minus" size={16} />
                </button>
                <span className="w-10 text-center text-sm font-semibold tnum" aria-live="polite">
                  {qty}
                </span>
                <button
                  type="button"
                  aria-label="Increase quantity"
                  onClick={() => setQty((q) => Math.min(20, q + 1))}
                  className="flex h-11 w-11 items-center justify-center"
                >
                  <Icon name="plus" size={16} />
                </button>
              </div>
            </div>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <button type="button" onClick={addToCart} className="btn btn-primary btn-block">
                Add to cart
              </button>
              <button type="button" onClick={buyNow} className="btn btn-outline btn-block">
                Buy now
              </button>
            </div>
          </>
        ) : (
          <a href={askLink} target="_blank" rel="noopener noreferrer" className="btn btn-whatsapp btn-block">
            <Icon name="whatsapp" size={16} />
            Ask on WhatsApp
          </a>
        )}
      </div>

      {/* Availability */}
      <p className="mt-4 flex flex-wrap items-center gap-x-3 text-sm">
        <span className="flex items-center gap-1.5 font-semibold">
          <Icon name="check" size={14} className="text-accent" />
          {availabilityText}
        </span>
        {lowStock && <span className="font-semibold text-danger">{lowStock}</span>}
      </p>

      {/* Trust row, from facts only */}
      <ul className="mt-4 grid gap-2 text-xs text-ash">
        <TrustItem icon="check" text={`Free shipping on orders over ${rupees(FREE_SHIPPING_OVER)}`} />
        {detail.delivery && <TrustItem icon="arrow" text={detail.delivery} />}
        {detail.warranty && <TrustItem icon="shield" text={detail.warranty} />}
        {detail.installation && <TrustItem icon="wrench" text="Fitted at our garages" />}
      </ul>

      {/* Phone-only sticky bar */}
      <div
        className={`fixed inset-x-0 bottom-[calc(64px+env(safe-area-inset-bottom))] z-40 border-t border-tint/10 bg-void px-4 py-2.5 transition-transform duration-200 lg:hidden ${
          showBar ? "translate-y-0" : "pointer-events-none translate-y-full"
        }`}
        aria-hidden={!showBar}
      >
        <div className="mx-auto flex max-w-xl items-center gap-3">
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs font-semibold">{detail.title}</p>
            <p className="text-sm font-bold tnum">
              {unitPrice === null ? "Price on request" : `${detail.priceFrom ? "From " : ""}${rupees(unitPrice)}`}
            </p>
          </div>
          {canBuy ? (
            <button type="button" tabIndex={showBar ? 0 : -1} onClick={addToCart} className="btn btn-primary shrink-0">
              Add to cart
            </button>
          ) : (
            <a
              href={askLink}
              tabIndex={showBar ? 0 : -1}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-whatsapp shrink-0"
            >
              Ask on WhatsApp
            </a>
          )}
        </div>
      </div>
    </div>
  );
}

function TrustItem({ icon, text }: { icon: "check" | "arrow" | "shield" | "wrench"; text: string }) {
  return (
    <li className="flex items-start gap-2">
      <Icon name={icon} size={14} className="mt-0.5 shrink-0 text-accent" />
      <span>{text}</span>
    </li>
  );
}
