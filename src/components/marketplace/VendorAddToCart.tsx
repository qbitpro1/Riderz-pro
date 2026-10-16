"use client";

import { useState } from "react";
import { MAX_QTY, useCart } from "@/components/cart/CartContext";
import { Icon } from "@/components/ui/Icon";
import { vendorLineSlug } from "@/lib/vendor/types";
import type { CartLine } from "@/lib/store/types";

/**
 * Quantity and "Add to cart" for one marketplace product. The quantity is capped at the units the
 * seller has; an out-of-stock product shows a disabled button. The cart line carries the seller so
 * checkout can split the order by store.
 */
export function VendorAddToCart({
  slug,
  href,
  title,
  price,
  stock,
  image,
  seller,
}: {
  slug: string;
  href: string;
  title: string;
  price: number;
  stock: number;
  image: { src: string; alt: string } | null;
  seller: { id: string; name: string; slug: string };
}) {
  const { add } = useCart();
  const cap = Math.min(stock, MAX_QTY);
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);

  if (stock <= 0) {
    return (
      <button type="button" className="btn btn-outline btn-block min-h-12" disabled>
        Out of stock
      </button>
    );
  }

  const line: Omit<CartLine, "qty"> = {
    id: vendorLineSlug(slug),
    slug: vendorLineSlug(slug),
    href,
    name: title,
    image: image ? { kind: "remote", src: image.src, alt: image.alt, fit: "contain", tone: "light" } : undefined,
    price,
    seller,
  };

  return (
    <div className="flex flex-wrap items-stretch gap-3">
      <div className="inline-flex min-h-12 items-center border border-tint/15" role="group" aria-label="Quantity">
        <button
          type="button"
          onClick={() => setQty((q) => Math.max(1, q - 1))}
          disabled={qty <= 1}
          aria-label="Decrease quantity"
          className="grid h-12 w-11 place-items-center text-ash transition-colors hover:text-accent disabled:opacity-40"
        >
          <Icon name="minus" size={14} />
        </button>
        <span className="min-w-8 text-center font-display text-base font-bold tnum" aria-live="polite">
          {qty}
        </span>
        <button
          type="button"
          onClick={() => setQty((q) => Math.min(cap, q + 1))}
          disabled={qty >= cap}
          aria-label="Increase quantity"
          className="grid h-12 w-11 place-items-center text-ash transition-colors hover:text-accent disabled:opacity-40"
        >
          <Icon name="plus" size={14} />
        </button>
      </div>
      <button
        type="button"
        className="btn btn-primary min-h-12 flex-1"
        onClick={() => {
          add(line, qty);
          setAdded(true);
          window.setTimeout(() => setAdded(false), 2000);
        }}
      >
        {added ? "Added to cart" : "Add to cart"}
      </button>
    </div>
  );
}
