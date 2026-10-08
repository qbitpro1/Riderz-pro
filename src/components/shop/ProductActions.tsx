"use client";

import Link from "next/link";
import { useState } from "react";
import { Icon } from "@/components/ui/Icon";
import { useCart } from "@/components/cart/CartContext";
import { rupees } from "@/lib/format";
import { whatsapp } from "@/lib/data/site";
import type { Product } from "@/lib/data/products";

export function ProductActions({ product }: { product: Product }) {
  const { add } = useCart();
  const [qty, setQty] = useState(1);
  const [withInstall, setWithInstall] = useState(false);
  const [added, setAdded] = useState(false);

  const installPrice = product.installPrice ?? 0;
  const unit = product.price + (withInstall ? installPrice : 0);

  function addToCart() {
    add(
      {
        slug: product.slug,
        name: product.name,
        price: product.price,
        install: withInstall ? installPrice : 0,
      },
      qty,
    );
    setAdded(true);
    window.setTimeout(() => setAdded(false), 2200);
  }

  return (
    <div className="mt-6 space-y-4">
      {product.installation && (
        <label className="flex cursor-pointer items-start gap-3 border border-white/10 bg-white/3 p-4">
          <input
            type="checkbox"
            checked={withInstall}
            onChange={(e) => setWithInstall(e.target.checked)}
            className="mt-0.5 h-4 w-4 accent-[var(--color-accent)]"
          />
          <span className="text-sm">
            <span className="font-semibold">
              Add professional installation
              {installPrice > 0 ? ` — ${rupees(installPrice)}` : " — free"}
            </span>
            <span className="mt-0.5 block text-xs text-ash">
              Fitted at any Motorbotz garage in about {product.installTime}. Workmanship warranted for
              12 months.
            </span>
          </span>
        </label>
      )}

      <div className="flex items-center gap-3">
        <div className="flex items-center border border-white/12">
          <button
            type="button"
            aria-label="Decrease quantity"
            onClick={() => setQty((q) => Math.max(1, q - 1))}
            className="grid h-12 w-11 place-items-center text-ash transition-colors hover:text-accent"
          >
            <Icon name="minus" size={15} />
          </button>
          <span className="w-9 text-center font-display text-base font-bold tnum">{qty}</span>
          <button
            type="button"
            aria-label="Increase quantity"
            onClick={() => setQty((q) => Math.min(product.stock, q + 1))}
            className="grid h-12 w-11 place-items-center text-ash transition-colors hover:text-accent"
          >
            <Icon name="plus" size={15} />
          </button>
        </div>
        <p className="text-sm text-ash tnum">
          Subtotal <span className="font-display font-bold text-chalk">{rupees(unit * qty)}</span>
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <Link href="/cart" onClick={addToCart} className="btn btn-primary">
          Buy now
        </Link>
        <button type="button" onClick={addToCart} className="btn btn-outline">
          {added ? (
            <>
              <Icon name="check" size={15} /> Added
            </>
          ) : (
            "Add to cart"
          )}
        </button>
        <a
          href={whatsapp(`Hi Motorbotz, will the ${product.name} fit my car? My car is: `)}
          target="_blank"
          rel="noreferrer noopener"
          className="btn btn-whatsapp"
        >
          <Icon name="whatsapp" size={16} />
          Ask on WhatsApp
        </a>
        <Link href={`/garage?service=${encodeURIComponent(product.category)}`} className="btn btn-outline">
          <Icon name="wrench" size={15} />
          Book installation
        </Link>
      </div>
    </div>
  );
}
