import Image from "next/image";
import { Photo } from "@/components/ui/Photo";
import type { ProductImage } from "@/lib/store/types";

/** Backdrop class for an image: light studio photos sit on the same light ground the cards use. */
export function imageBackdrop(image: ProductImage | undefined | null): string {
  return image?.kind === "remote" && image.tone === "light" ? "bg-[#f3f4f5]" : "bg-graphite";
}

/** Fills its (relative, sized) parent with the image, exactly as catalogue cards do. */
export function ProductImageView({
  image,
  sizes,
  priority = false,
}: {
  image: ProductImage;
  sizes: string;
  priority?: boolean;
}) {
  if (image.kind === "media") {
    return <Photo media={image.key} sizes={sizes} alt={image.alt} priority={priority} className="opacity-90" />;
  }
  return (
    <Image
      src={image.src}
      alt={image.alt}
      fill
      sizes={sizes}
      priority={priority}
      className={image.fit === "contain" ? "object-contain p-3" : "object-cover opacity-90"}
    />
  );
}
