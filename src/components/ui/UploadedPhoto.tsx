import Image from "next/image";

/**
 * A photo the team or a seller uploaded (served from /api/files/…), filling its positioned parent.
 * Served as stored: the upload is already checked and sized, and the route sets its own caching.
 */
export function UploadedPhoto({ src, alt, sizes, priority = false, className = "" }: { src: string; alt: string; sizes: string; priority?: boolean; className?: string }) {
  return <Image src={src} alt={alt} fill sizes={sizes} priority={priority} unoptimized className={`object-cover ${className}`} />;
}
