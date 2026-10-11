import Image from "next/image";
import { Icon } from "@/components/ui/Icon";
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
