/**
 * The Riderzpro wordmark, set in type after the registered logo: wide-spaced
 * capitals with the logo's red, over the "Car & Bike Accessories" line.
 *
 * The supplied artwork (public/brand/riderzpro-logo.png) is 184px on a white
 * ground — right for the favicon, too small and too opaque for a header in two
 * themes. Swap this markup for the vector logo when it is available.
 *
 * Size it through `className` (a font size); the default is the header's.
 */
export function Logo({ className = "text-[17px] md:text-[20px]" }: { className?: string }) {
  return (
    <span className={`flex flex-col leading-none ${className}`}>
      <span className="flex items-baseline font-display font-bold tracking-[0.14em]">
        RIDERZ
        <span className="text-accent">PRO</span>
      </span>
      <span className="mt-[0.3em] flex items-center gap-[0.5em] text-[0.38em] font-semibold uppercase tracking-[0.22em] text-ash">
        <span aria-hidden className="h-px w-[1.2em] bg-accent" />
        Car &amp; Bike Accessories
      </span>
    </span>
  );
}
