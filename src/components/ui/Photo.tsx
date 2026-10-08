import Image from "next/image";
import { MEDIA, type MediaKey } from "@/lib/media";

type Props = {
  media: MediaKey;
  /** Responsive sizes hint — always pass one so mobile never fetches a desktop frame. */
  sizes: string;
  className?: string;
  priority?: boolean;
  quality?: number;
  /** Overrides the catalogue alt text when the surrounding copy needs specifics. */
  alt?: string;
  position?: string;
};

/**
 * Fill-mode automotive photo. The parent must be `relative` and sized.
 */
export function Photo({
  media,
  sizes,
  className = "",
  priority = false,
  quality = 68,
  alt,
  position = "center",
}: Props) {
  const asset = MEDIA[media];
  return (
    <Image
      src={asset.src}
      alt={alt ?? asset.alt}
      fill
      sizes={sizes}
      quality={quality}
      priority={priority}
      loading={priority ? undefined : "lazy"}
      className={`object-cover ${className}`}
      style={{ objectPosition: position }}
    />
  );
}
