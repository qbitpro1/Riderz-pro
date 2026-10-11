"use client";

import Link from "next/link";
import { useState } from "react";
import { useCart } from "@/components/cart/CartContext";
import { CartThumb } from "@/components/cart/CartThumb";
import { rupees } from "@/lib/format";
import { cartLineId } from "@/lib/store/types";
import { useWishlist } from "./wishlistStore";

const date = new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "short", year: "numeric" });

export function WishlistView() {
  const { items, ready, remove, clear } = useWishlist();
  const { add } = useCart();
  const [confirming, setConfirming] = useState(false);

  if (!ready) {
    return (
      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3" aria-hidden="true">
        {[0, 1, 2].map((i) => (
          <div key={i} className="card h-32 animate-pulse bg-carbon" />
        ))}
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="card mt-8 p-8 text-center">
        <p className="font-display text-lg font-bold">Nothing saved yet</p>
        <p className="mx-auto mt-2 max-w-md text-sm text-ash">
          Tap the heart on any product to keep it here. Your list is stored on this device only.
        </p>
        <div className="mt-5 flex flex-wrap justify-center gap-3">
          <Link href="/shop" className="btn btn-primary">
            Browse the shop
          </Link>
          <Link href="/collections/bestsellers" className="btn btn-outline">
            See bestsellers
          </Link>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-ash">
          Open a product for its current price — each price below is the one shown when you saved it. Your list is
          stored on this device only.
        </p>
        {confirming ? (
          <div className="flex items-center gap-2">
            <span className="text-sm">Remove all {items.length}?</span>
            <button
              type="button"
              className="btn btn-primary btn-sm min-h-10"
              onClick={() => {
                clear();
                setConfirming(false);
              }}
            >
              Yes, clear
            </button>
            <button type="button" className="btn btn-outline btn-sm min-h-10" onClick={() => setConfirming(false)}>
              Keep
            </button>
          </div>
        ) : (
          <button type="button" className="btn btn-outline btn-sm min-h-10" onClick={() => setConfirming(true)}>
            Clear wishlist
          </button>
        )}
      </div>

      <ul className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((it) => {
          const price = it.price;
          return (
            <li key={it.slug} className="card flex flex-col gap-3 p-3.5">
              <div className="flex gap-3">
                <Link href={it.href} aria-hidden="true" tabIndex={-1}>
                  <CartThumb image={it.image} size={88} />
                </Link>
                <div className="min-w-0 flex-1">
                  <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-accent">{it.brandName}</p>
                  <h2 className="mt-1 line-clamp-2 text-sm font-semibold leading-snug">
                    <Link href={it.href} className="transition-colors hover:text-accent">
                      {it.title}
                    </Link>
                  </h2>
                  <p className="mt-1.5 flex items-baseline gap-2">
                    {price === null ? (
                      <span className="text-xs text-dim">Price on request</span>
                    ) : (
                      <>
                        <span className="font-display text-base font-extrabold tnum">{rupees(price)}</span>
                        {it.mrp !== null && it.mrp > price && (
                          <span className="text-xs text-dim line-through tnum">{rupees(it.mrp)}</span>
                        )}
                      </>
                    )}
                  </p>
                  <p className="mt-0.5 text-[11px] text-dim">
                    Price saved on {date.format(new Date(it.savedAt))}
                  </p>
                </div>
              </div>
              <div className="mt-auto flex items-center gap-2">
                {price !== null && !it.hasOptions ? (
                  <button
                    type="button"
                    className="btn btn-primary btn-sm min-h-10 flex-1"
                    onClick={() =>
                      add(
                        {
                          id: cartLineId(it.slug),
                          slug: it.slug,
                          href: it.href,
                          name: it.title,
                          image: it.image,
                          price,
                        },
                        1,
                      )
                    }
                  >
                    Add to cart
                  </button>
                ) : (
                  <Link href={it.href} className="btn btn-outline btn-sm min-h-10 flex-1">
                    {it.hasOptions ? "Choose options" : "View details"}
                  </Link>
                )}
                <button
                  type="button"
                  className="min-h-10 px-3 text-sm font-semibold text-ash transition-colors hover:text-accent focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent"
                  onClick={() => remove(it.slug)}
                  aria-label={`Remove ${it.title} from wishlist`}
                >
                  Remove
                </button>
              </div>
            </li>
          );
        })}
      </ul>
    </>
  );
}
