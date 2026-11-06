import Image from "next/image";
import Link from "next/link";
import { Icon } from "@/components/ui/Icon";
import { Photo } from "@/components/ui/Photo";
import { Stars } from "@/components/ui/Section";
import { rupees } from "@/lib/format";
import { storeHref } from "@/lib/vendor/types";
import type { ShopItem } from "@/lib/catalog/types";
import { itemSpeakerSize, SPEAKER_SIZE_LABELS } from "@/lib/catalog/speaker-size";
import { CatalogQuickAction } from "./CatalogQuickAction";
import { WishlistButton } from "@/components/wishlist/WishlistButton";
import { wishlistItem } from "./CatalogCard";

/**
 * The product card on listing pages. Every image sits on the same light fill; product cut-outs are
 * shown whole (contain) and our own photography fills the square. Below 768px the card is image,
 * brand, name and price only.
 */
export function ListingCard({
  item,
  showBrand = true,
  fitsModel = null,
  sizes = "(min-width:1280px) 20vw, (min-width:768px) 30vw, 46vw",
}: {
  item: ShopItem;
  showBrand?: boolean;
  /** The saved car's model name when this item fits it, for the "Fits your …" tag. */
  fitsModel?: string | null;
  sizes?: string;
}) {
  const off =
    item.buyable && item.price && item.mrp && item.mrp > item.price ? Math.round(((item.mrp - item.price) / item.mrp) * 100) : 0;
  const size = itemSpeakerSize(item);
  const tags = [size ? SPEAKER_SIZE_LABELS[size] : null, item.sub].filter((t): t is string => Boolean(t));
  const priced = !(item.price === null || (!item.buyable && !item.seller));

  return (
    <article className="relative flex h-full flex-col overflow-hidden rounded-[var(--radius-cl)] border border-cl-line bg-cl-surface text-cl-ink">
      <Link href={item.href} className="relative block aspect-square overflow-hidden bg-cl-fill" tabIndex={-1} aria-hidden="true">
        <ListingImage item={item} sizes={sizes} />
        {off > 0 && (
          <span className="absolute left-3 top-3 rounded-[6px] bg-cl-sale px-2 py-1 text-[12px] font-bold leading-none text-white">
            {off}% OFF
          </span>
        )}
        {item.availability === "coming-soon" && (
          <span className="absolute left-3 top-3 rounded-[6px] bg-cl-ink px-2 py-1 text-[12px] font-bold leading-none text-cl-on-ink">
            Coming soon
          </span>
        )}
      </Link>
      <WishlistButton variant="card" item={wishlistItem(item)} className="absolute right-3 top-3" />

      <div className="flex flex-1 flex-col gap-1.5 p-3 md:p-4">
        {fitsModel && (
          <p className="inline-flex w-fit items-center gap-1 rounded-full bg-cl-fit-bg px-2.5 py-1 text-[12px] font-semibold text-cl-fit">
            <Icon name="check" size={13} />
            Fits your {fitsModel}
          </p>
        )}
        {showBrand && <p className="truncate text-[12px] font-semibold uppercase tracking-[0.08em] text-cl-muted">{item.brandName}</p>}
        <h3 className="line-clamp-2 text-[14px] font-semibold leading-snug md:text-[15px]">
          <Link href={item.href} className="hover:underline hover:underline-offset-2">
            {item.title}
          </Link>
        </h3>
        {item.rating !== null && (
          <p className="flex items-center gap-1.5">
            <Stars rating={item.rating} size={12} className="text-cl-ink" />
            <span className="text-[12px] text-cl-muted tnum">({item.reviews ?? 0})</span>
          </p>
        )}
        {item.seller && (
          <p className="truncate text-[12px] text-cl-muted">
            Sold by{" "}
            <Link href={storeHref(item.seller.slug)} className="font-semibold text-cl-ink hover:underline">
              {item.seller.name}
            </Link>
          </p>
        )}
        {tags.length > 0 && (
          <ul className="hidden flex-wrap gap-1.5 md:flex" aria-label="Specs">
            {tags.map((t) => (
              <li key={t} className="rounded-full bg-cl-fill-2 px-2.5 py-0.5 text-[12px] text-cl-muted">
                {t}
              </li>
            ))}
          </ul>
        )}

        <div className="mt-auto pt-2">
          {priced ? (
            <p className="flex flex-wrap items-baseline gap-x-2">
              {item.priceFrom && <span className="text-[12px] text-cl-muted">from</span>}
              <span className="text-[18px] font-bold tnum">{rupees(item.price!)}</span>
              {item.mrp && item.mrp > item.price! && (
                <span className="text-[13px] text-cl-muted line-through tnum">
                  <span className="sr-only">MRP </span>
                  {rupees(item.mrp)}
                </span>
              )}
            </p>
          ) : (
            <p className="text-[14px] font-semibold text-cl-muted">
              {item.availability === "coming-soon" ? "Launching soon" : "Price on request"}
            </p>
          )}
          {item.seller && !item.buyable && <p className="text-[12px] text-cl-muted">Out of stock</p>}
        </div>

        <div className="hidden pt-2 md:block">
          <CatalogQuickAction item={item} className="cl-btn cl-btn-outline w-full" />
        </div>
      </div>
    </article>
  );
}

function ListingImage({ item, sizes }: { item: ShopItem; sizes: string }) {
  if (item.image.kind === "media") {
    return <Photo media={item.image.key} sizes={sizes} alt={item.image.alt ?? item.title} />;
  }
  if (item.image.kind === "remote") {
    return (
      <Image
        src={item.image.src}
        alt={item.image.alt}
        fill
        sizes={sizes}
        className={item.image.fit === "contain" ? "object-contain p-4" : "object-cover"}
      />
    );
  }
  return (
    <div className="flex h-full w-full flex-col items-center justify-center gap-2 p-4 text-center text-cl-muted">
      <Icon name="search" size={22} />
      <span className="text-[12px] uppercase tracking-[0.08em]">Image coming soon</span>
    </div>
  );
}
