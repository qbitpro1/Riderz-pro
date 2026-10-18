import Image from "next/image";
import Link from "next/link";
import { Icon } from "@/components/ui/Icon";
import { Photo } from "@/components/ui/Photo";
import { Stars } from "@/components/ui/Section";
import { rupees } from "@/lib/format";
import { storeHref } from "@/lib/vendor/types";
import type { ShopItem } from "@/lib/catalog/types";
import { CatalogQuickAction } from "./CatalogQuickAction";
import { WishlistButton } from "@/components/wishlist/WishlistButton";
import type { WishlistInput } from "@/components/wishlist/wishlistStore";

/**
 * One card for every brand. Two things vary and both are carried by the item
 * rather than by a per-brand component: how the image wants to be framed, and
 * whether there is a firm price to show.
 */
export function CatalogCard({
  item,
  sizes = "(min-width:1280px) 22vw, (min-width:768px) 30vw, 46vw",
  showBrand = true,
}: {
  item: ShopItem;
  sizes?: string;
  showBrand?: boolean;
}) {
  const off = item.buyable && item.price && item.mrp && item.mrp > item.price ? Math.round(((item.mrp - item.price) / item.mrp) * 100) : 0;

  return (
    <article className="card card-hover relative flex h-full flex-col">
      <Link
        href={item.href}
        className={`relative block aspect-square overflow-hidden ${
          item.image.kind === "remote" && item.image.tone === "light" ? "bg-[#f3f4f5]" : "bg-graphite"
        }`}
      >
        <CardImage item={item} sizes={sizes} />
        {off > 0 && (
          <span className="absolute left-2.5 top-2.5 bg-accent px-1.5 py-0.5 font-display text-[10px] font-bold tracking-[0.08em] text-on-accent">
            {off}% OFF
          </span>
        )}
        {item.availability === "coming-soon" && (
          <span className="chip absolute left-2.5 top-2.5 border-gold/50 bg-gold/90 text-[10px] text-on-gold">
            Coming soon
          </span>
        )}
        {item.seller && (
          <span className="chip absolute bottom-2.5 left-2.5 border-accent/40 bg-void/80 text-[10px] text-accent">
            Verified seller
          </span>
        )}
        {item.bestseller && (
          <span className="chip absolute bottom-2.5 left-2.5 border-gold/40 bg-void/70 text-gold">Bestseller</span>
        )}
      </Link>
      <WishlistButton variant="overlay" item={wishlistItem(item)} className="absolute right-2.5 top-2.5" />

      <div className="flex flex-1 flex-col p-3.5">
        <p className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.14em]">
          {showBrand && <span className="text-accent">{item.brandName}</span>}
          {showBrand && <span className="text-dim">·</span>}
          <span className="truncate text-dim">{item.code ?? item.sub}</span>
        </p>

        <h3 className="mt-1 line-clamp-2 text-sm font-semibold leading-snug">
          <Link href={item.href} className="transition-colors hover:text-accent">
            {item.title}
          </Link>
        </h3>

        {item.seller && (
          <p className="mt-1 truncate text-[11px] text-dim">
            Sold by{" "}
            <Link href={storeHref(item.seller.slug)} className="font-semibold text-ash underline-offset-2 hover:text-accent hover:underline">
              {item.seller.name}
            </Link>
          </p>
        )}

        {item.rating !== null ? (
          <div className="mt-2 flex items-center gap-2">
            <Stars rating={item.rating} size={11} />
            <span className="text-[11px] text-dim tnum">({item.reviews ?? 0})</span>
          </div>
        ) : (
          <p className="mt-2 truncate text-[11px] text-dim">{item.sub}</p>
        )}

        <div className="mt-auto pt-3">
          {item.price === null || (!item.buyable && !item.seller) ? (
            <p className="font-display text-sm font-bold uppercase tracking-[0.1em] text-gold">
              {item.availability === "coming-soon" ? "Launching soon" : "Price on request"}
            </p>
          ) : (
            <p className="flex items-baseline gap-2">
              {item.priceFrom && <span className="text-[10px] uppercase tracking-[0.12em] text-dim">from</span>}
              <span className="font-display text-lg font-extrabold tnum">{rupees(item.price)}</span>
              {item.mrp && item.mrp > item.price && (
                <span className="text-xs text-dim line-through tnum">{rupees(item.mrp)}</span>
              )}
            </p>
          )}
          {(item.buyable || item.seller) && (
            <p className="mt-1 flex items-center gap-1 text-[11px] text-dim">
              {item.seller ? (
                <>
                  <Icon name="check" size={11} className="text-accent" />
                  {item.buyable ? "In stock" : "Out of stock"}
                </>
              ) : item.installation ? (
                <>
                  <Icon name="wrench" size={11} className="text-accent" />
                  Installation available
                </>
              ) : (
                <>
                  <Icon name="check" size={11} className="text-accent" />
                  {item.availability === "made-to-order" ? "Made to order" : "In stock"}
                </>
              )}
            </p>
          )}
        </div>

        <div className="pt-3">
          <CatalogQuickAction item={item} />
        </div>
      </div>
    </article>
  );
}

function wishlistItem(item: ShopItem): WishlistInput {
  const img = item.image;
  return {
    slug: item.slug,
    href: item.href,
    title: item.title,
    brandName: item.brandName,
    price: item.buyable ? item.price : null,
    mrp: item.buyable ? item.mrp : null,
    hasOptions: item.hasOptions,
    image:
      img.kind === "media"
        ? { kind: "media", key: img.key, alt: img.alt ?? item.title }
        : img.kind === "remote"
          ? { kind: "remote", src: img.src, alt: img.alt, fit: img.fit, tone: img.tone }
          : undefined,
  };
}

export function CardImage({ item, sizes }: { item: ShopItem; sizes: string }) {
  if (item.image.kind === "media") {
    return <Photo media={item.image.key} sizes={sizes} alt={item.image.alt} className="zoom opacity-90" />;
  }
  if (item.image.kind === "remote") {
    return (
      <Image
        src={item.image.src}
        alt={item.image.alt}
        fill
        sizes={sizes}
        className={item.image.fit === "contain" ? "object-contain p-3" : "zoom object-cover opacity-90"}
      />
    );
  }
  return (
    <div className="flex h-full w-full flex-col items-center justify-center gap-2 p-4 text-center">
      <Icon name="search" size={22} className="text-dim" />
      <span className="text-[10px] uppercase tracking-[0.14em] text-dim">Image verification required</span>
    </div>
  );
}
