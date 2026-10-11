import Image from "next/image";

/**
 * The registered Riderzpro logo. Two renderings of the supplied artwork with
 * the white ground removed: dark ink for the light theme, light ink for the
 * dark theme (the red is the same in both). CSS shows the one that matches the
 * page theme, so it is right before hydration.
 *
 * The source artwork is small (184px); replace the two files in public/brand
 * with exports from the vector logo when it is available.
 *
 * Size it through `className` (a height); the default is the header's.
 */
export function Logo({ className = "h-12 md:h-14" }: { className?: string }) {
  return (
    <>
      <Image
        src="/brand/logo-light.png"
        alt="Riderzpro — Car & Bike Accessories"
        width={660}
        height={288}
        priority
        className={`when-light w-auto ${className}`}
      />
      <Image
        src="/brand/logo-dark.png"
        alt="Riderzpro — Car & Bike Accessories"
        width={660}
        height={288}
        priority
        className={`when-dark w-auto ${className}`}
      />
    </>
  );
}
