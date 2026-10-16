"use client";

import Link from "next/link";
import { useCart } from "@/components/cart/CartContext";
import { cartLineId, type ProductImage } from "@/lib/store/types";
import { vendorLineSlug } from "@/lib/vendor/types";
import type { ShopItem } from "@/lib/catalog/types";

/**
 * The one action row at the foot of a catalogue card. It is the only client
 * part of the card, so the rest stays server-rendered wherever the card is used.
 *
 *   firm price, nothing to choose → Add to cart
 *   a choice is needed first      → Choose options  (opens the product page)
 *   no price / coming soon / held back → View details
 */
export function CatalogQuickAction({ item }: { item: ShopItem }) {
  const { add } = useCart();
  const cls = "btn btn-outline btn-sm btn-block min-h-10";

  /* Marketplace item: sold by an approved vendor. Added under a prefixed line slug so it never
     collides with a house product; out of stock cannot be added. */
  if (item.seller) {
    const seller = item.seller;
    const price = item.price;
    if (price === null || !item.buyable) {
      return (
        <button type="button" className={cls} disabled>
          Out of stock
        </button>
      );
    }
    const line = vendorLineSlug(item.slug);
    return (
      <button
        type="button"
        className={cls}
        onClick={() =>
          add({ id: line, slug: line, href: item.href, name: item.title, image: toImage(item), price, seller }, 1)
        }
      >
        Add to cart
      </button>
    );
  }

  if (!item.buyable) {
    return (
      <Link href={item.href} className={cls}>
        View details
      </Link>
    );
  }

  if (item.hasOptions) {
    return (
      <Link href={item.href} className={cls}>
        Choose options
      </Link>
    );
  }

  const price = item.price;
  if (price === null || item.availability === "coming-soon") {
    return (
      <Link href={item.href} className={cls}>
        View details
      </Link>
    );
  }

  return (
    <button
      type="button"
      className={cls}
      onClick={() =>
        add(
          {
            id: cartLineId(item.slug),
            slug: item.slug,
            href: item.href,
            name: item.title,
            image: toImage(item),
            price,
          },
          1,
        )
      }
    >
      Add to cart
    </button>
  );
}

function toImage(item: ShopItem): ProductImage | undefined {
  const img = item.image;
  if (img.kind === "media") return { kind: "media", key: img.key, alt: img.alt ?? item.title };
  if (img.kind === "remote") {
    return { kind: "remote", src: img.src, alt: img.alt, fit: img.fit, tone: img.tone };
  }
  return undefined;
}
