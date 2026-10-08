import Link from "next/link";
import { Photo } from "@/components/ui/Photo";
import { Icon } from "@/components/ui/Icon";
import { Stars } from "@/components/ui/Section";
import { rupees } from "@/lib/format";
import type { Product } from "@/lib/data/products";

export function ProductCard({
  product,
  sizes = "(min-width:1024px) 25vw, (min-width:640px) 33vw, 64vw",
}: {
  product: Product;
  sizes?: string;
}) {
  const off = Math.round(((product.mrp - product.price) / product.mrp) * 100);

  return (
    <article className="card card-hover flex h-full flex-col">
      <Link href={`/product/${product.slug}`} className="relative block aspect-square overflow-hidden bg-graphite">
        <Photo media={product.image} sizes={sizes} className="zoom opacity-90" />
        <div className="absolute inset-0 bg-gradient-to-t from-void/80 via-transparent to-void/25" />
        {off > 0 && (
          <span className="absolute left-2.5 top-2.5 bg-accent px-1.5 py-0.5 font-display text-[10px] font-bold tracking-[0.08em] text-[#04161d]">
            {off}% OFF
          </span>
        )}
        {/* Bottom-left, so it never collides with the discount flag on a
            narrow card. */}
        {product.bestseller && (
          <span className="absolute bottom-2.5 left-2.5 chip border-gold/40 bg-void/70 text-gold">
            Bestseller
          </span>
        )}
      </Link>

      <div className="flex flex-1 flex-col p-3.5">
        <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-dim">{product.sub}</p>
        <h3 className="mt-1 line-clamp-2 text-sm font-semibold leading-snug">
          <Link href={`/product/${product.slug}`} className="transition-colors hover:text-accent">
            {product.name}
          </Link>
        </h3>

        <div className="mt-2 flex items-center gap-2">
          <Stars rating={product.rating} size={11} />
          <span className="text-[11px] text-dim tnum">({product.reviews})</span>
        </div>

        <div className="mt-auto pt-3">
          <p className="flex items-baseline gap-2">
            <span className="font-display text-lg font-extrabold tnum">{rupees(product.price)}</span>
            <span className="text-xs text-dim line-through tnum">{rupees(product.mrp)}</span>
          </p>
          <p className="mt-1 flex items-center gap-1 text-[11px] text-dim">
            {product.installation ? (
              <>
                <Icon name="wrench" size={11} className="text-accent" />
                Installation available
              </>
            ) : (
              <>
                <Icon name="check" size={11} className="text-accent" />
                {product.delivery}
              </>
            )}
          </p>
        </div>
      </div>
    </article>
  );
}
