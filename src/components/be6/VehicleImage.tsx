import Image from "next/image";
import type { Colour } from "@/lib/data/be6/factory";

/**
 * The BE 6, in the colour you picked.
 *
 * These are Mahindra's own product renders, taken from the official BE 6
 * configurator and self-hosted so the page does not depend on Mahindra's CDN
 * or on hashed asset URLs that change without notice.
 *
 * Two things travel with every one of them and are not optional:
 *   - attribution to Mahindra, because the image is theirs;
 *   - Mahindra's own caveat that its vehicle imagery is a creative
 *     visualisation and that on-screen colour may differ from the paint.
 *
 * They are PNGs on a transparent ground, which is why nothing here paints a
 * background — the page's own surface shows through, and that is the point.
 */

type Props = {
  colour: Colour;
  /** Responsive sizes hint — always pass one. */
  sizes: string;
  priority?: boolean;
  className?: string;
};

export function VehicleImage({ colour, sizes, priority = false, className = "" }: Props) {
  return (
    <Image
      src={colour.image}
      alt={`Mahindra BE 6 SPORTEQ in ${colour.name}, ${colour.finish.toLowerCase()} finish — official Mahindra render`}
      width={1366}
      height={600}
      sizes={sizes}
      priority={priority}
      loading={priority ? undefined : "lazy"}
      className={`h-auto w-full object-contain ${className}`}
    />
  );
}

/** The credit line. Required wherever a Mahindra render appears. */
export function ImageCredit({ className = "" }: { className?: string }) {
  return (
    <p className={`text-[0.5625rem] leading-relaxed text-dim ${className}`}>
      Official Mahindra render. Mahindra states its vehicle imagery is a creative visualisation and that colour may
      differ from the actual paint.
    </p>
  );
}
