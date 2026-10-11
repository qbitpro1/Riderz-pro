import Image from "next/image";
import { Photo } from "@/components/ui/Photo";
import type { ProductImage } from "@/lib/store/types";

/** Square thumbnail for a cart line; a neutral block when the line has no image. */
export function CartThumb({ image, size = 72 }: { image?: ProductImage; size?: number }) {
  const bg = image?.kind === "remote" && image.tone === "light" ? "bg-[#f3f4f5]" : "bg-graphite";
  return (
    <div
      className={`relative shrink-0 overflow-hidden border border-tint/8 ${bg}`}
      style={{ width: size, height: size }}
    >
      {image?.kind === "media" && <Photo media={image.key} alt={image.alt} sizes={`${size}px`} />}
      {image?.kind === "remote" && (
        <Image
          src={image.src}
          alt={image.alt}
          fill
          sizes={`${size}px`}
          className={image.fit === "contain" ? "object-contain p-1.5" : "object-cover"}
        />
      )}
    </div>
  );
}
