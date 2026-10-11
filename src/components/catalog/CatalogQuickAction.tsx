"use client";

import Link from "next/link";
import { useCart } from "@/components/cart/CartContext";
import { cartLineId, type ProductImage } from "@/lib/store/types";
import type { CatalogItem } from "@/lib/catalog/types";

/**
 * The one action row at the foot of a catalogue card. It is the only client
 * part of the card, so the rest stays server-rendered wherever the card is used.
 *
 *   firm price, nothing to choose → Add to cart
 *   a choice is needed first      → Choose options  (opens the product page)
 *   no price / coming soon        → View details
 */
export function CatalogQuickAction({ item }: { item: CatalogItem }) {
  const { add } = useCart();
  const cls = "btn btn-outline btn-sm btn-block min-h-10";

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

function toImage(item: CatalogItem): ProductImage | undefined {
  const img = item.image;
  if (img.kind === "media") return { kind: "media", key: img.key, alt: img.alt ?? item.title };
  if (img.kind === "remote") {
    return { kind: "remote", src: img.src, alt: img.alt, fit: img.fit, tone: img.tone };
  }
  return undefined;
}
