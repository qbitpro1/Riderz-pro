"use client";

import Link from "next/link";
import { useState } from "react";
import { Icon } from "@/components/ui/Icon";
import { useCart } from "@/components/cart/CartContext";
import { rupees } from "@/lib/format";
import { whatsapp } from "@/lib/data/site";
import type { PublicProduct } from "@/lib/data/recoil";

const COMPARE_KEY = "motorbotz.compare.v1";

export function RecoilActions({ product }: { product: PublicProduct }) {
  const { add } = useCart();
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);
  const [compared, setCompared] = useState(false);

  const comingSoon = product.status === "COMING_SOON";
  const price = product.sellingPrice;

  function addToCart() {
    if (!price) return;
    add({ slug: product.slug, name: `RECOIL ${product.sku} — ${product.priceListName}`, price }, qty);
    setAdded(true);
    window.setTimeout(() => setAdded(false), 2200);
  }

  function addToCompare() {
    try {
      const raw = localStorage.getItem(COMPARE_KEY);
      const list: string[] = raw ? JSON.parse(raw) : [];
      if (!list.includes(product.sku)) list.push(product.sku);
      localStorage.setItem(COMPARE_KEY, JSON.stringify(list.slice(-4)));
      setCompared(true);
      window.setTimeout(() => setCompared(false), 2200);
    } catch {
      /* storage blocked — the compare page also accepts SKUs in the URL */
    }
  }

  if (comingSoon) {
    return (
      <div className="mt-6 space-y-3">
        <a
          href={whatsapp(
            `Hi Motorbotz, please hold a RECOIL ${product.sku} (${product.priceListName}) from the first shipment. My car is: `,
          )}
          target="_blank"
          rel="noreferrer noopener"
          className="btn btn-accent btn-block"
        >
          <Icon name="whatsapp" size={16} />
          Notify me / pre-book
        </a>
        <p className="text-xs leading-relaxed text-dim">
          Listed as Coming Soon in the RECOIL price list. We do not take payment for stock we cannot
          date, and we will confirm the final price before it lands.
        </p>
      </div>
    );
  }

  return (
    <div className="mt-6 space-y-4">
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
            onClick={() => setQty((q) => Math.min(99, q + 1))}
            className="grid h-12 w-11 place-items-center text-ash transition-colors hover:text-accent"
          >
            <Icon name="plus" size={15} />
          </button>
        </div>
        {price && (
          <p className="text-sm text-ash tnum">
            Subtotal <span className="font-display font-bold text-chalk">{rupees(price * qty)}</span>
          </p>
        )}
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
          href={whatsapp(`Hi Motorbotz, will the RECOIL ${product.sku} fit my car? My car is: `)}
          target="_blank"
          rel="noreferrer noopener"
          className="btn btn-whatsapp"
        >
          <Icon name="whatsapp" size={16} />
          Check fitment
        </a>
        <Link href="/garage?service=Car%20audio" className="btn btn-outline">
          <Icon name="wrench" size={15} />
          Book installation
        </Link>
      </div>

      <button
        type="button"
        onClick={addToCompare}
        className="text-xs text-ash underline underline-offset-4 transition-colors hover:text-accent"
      >
        {compared ? "Added to comparison" : "Add to comparison"}
      </button>
    </div>
  );
}
