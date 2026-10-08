import Image from "next/image";
import Link from "next/link";
import { Icon } from "@/components/ui/Icon";
import { rupees } from "@/lib/format";
import type { CatalogProduct, PublicProduct } from "@/lib/data/recoil";

type Card = CatalogProduct | PublicProduct;

/**
 * Manufacturer product shots are studio cut-outs on white. They sit on a light
 * tile so they read as retail photography rather than a hole in the page.
 */
export function ProductShot({
  product,
  sizes,
  priority = false,
  index = 0,
}: {
  product: Card;
  sizes: string;
  priority?: boolean;
  index?: number;
}) {
  const image = product.images[index];
  if (!image) {
    return (
      <div className="flex h-full w-full flex-col items-center justify-center gap-2 bg-graphite p-4 text-center">
        <Icon name="search" size={22} className="text-dim" />
        <span className="text-[10px] uppercase tracking-[0.14em] text-dim">Image verification required</span>
      </div>
    );
  }
  return (
    <Image
      src={image.url}
      alt={image.alt}
      fill
      sizes={sizes}
      priority={priority}
      className="object-contain p-3"
      unoptimized={false}
    />
  );
}

export function RecoilCard({
  product,
  sizes = "(min-width:1024px) 25vw, (min-width:640px) 33vw, 46vw",
}: {
  product: Card;
  sizes?: string;
}) {
  const comingSoon = product.status === "COMING_SOON";

  return (
    <article className="card card-hover flex h-full flex-col">
      <Link href={`/products/${product.slug}`} className="relative block aspect-square overflow-hidden bg-[#f3f4f5]">
        <ProductShot product={product} sizes={sizes} />
        {comingSoon && (
          <span className="absolute left-2.5 top-2.5 chip border-gold/50 bg-gold/90 text-[10px] text-[#1a1204]">
            Coming soon
          </span>
        )}
        {!comingSoon && product.discountPct ? (
          <span className="absolute left-2.5 top-2.5 bg-accent px-1.5 py-0.5 font-display text-[10px] font-bold tracking-[0.08em] text-[#04161d]">
            {product.discountPct}% OFF
          </span>
        ) : null}
      </Link>

      <div className="flex flex-1 flex-col p-3.5">
        <p className="font-display text-[10px] font-bold uppercase tracking-[0.16em] text-accent">{product.sku}</p>
        <h3 className="mt-1 line-clamp-2 text-sm font-semibold leading-snug">
          <Link href={`/products/${product.slug}`} className="transition-colors hover:text-accent">
            {product.priceListName}
          </Link>
        </h3>
        <p className="mt-1 text-[11px] text-dim">
          {product.series ? `${product.series} · ` : ""}
          {product.subcategory}
        </p>

        <div className="mt-auto pt-3">
          {comingSoon ? (
            <p className="font-display text-sm font-bold uppercase tracking-[0.1em] text-gold">Launching soon</p>
          ) : (
            <p className="flex items-baseline gap-2">
              <span className="font-display text-lg font-extrabold tnum">
                {product.sellingPrice ? rupees(product.sellingPrice) : "—"}
              </span>
              {product.mrp && product.sellingPrice && product.mrp > product.sellingPrice && (
                <span className="text-xs text-dim line-through tnum">{rupees(product.mrp)}</span>
              )}
            </p>
          )}
          <p className="mt-1 flex items-center gap-1 text-[10px] text-dim">
            <Icon name="shield" size={11} className="text-accent" />
            Authentic RECOIL
          </p>
        </div>
      </div>
    </article>
  );
}
