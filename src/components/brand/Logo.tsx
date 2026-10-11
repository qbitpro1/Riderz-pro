import { LOGO_INK, LOGO_RED, LOGO_VIEWBOX } from "./logo-paths";

/** The red of the registered logo. Fixed: the mark keeps its own colour in both themes. */
const LOGO_RED_COLOUR = "#f03030";

/**
 * The registered Riderzpro logo as a vector: the car emblem and wordmark,
 * traced from the supplied artwork. The ink follows the text colour, so it is
 * dark on light surfaces and light on dark ones (including dark photo bands);
 * the red never changes.
 *
 * `tagline` adds the "Car & Bike Accessories" line, set in type — at the
 * artwork's size that line is too small to trace, and too small to read in a
 * header. Size the logo through `className` (a height); the default is the header's.
 */
export function Logo({ className = "h-10 md:h-12", tagline = false }: { className?: string; tagline?: boolean }) {
  const mark = (
    <svg
      viewBox={LOGO_VIEWBOX}
      role="img"
      aria-label="Riderzpro"
      className={`w-auto text-chalk ${tagline ? "h-full" : className}`}
    >
      <path fill="currentColor" fillRule="evenodd" d={LOGO_INK} />
      <path fill={LOGO_RED_COLOUR} fillRule="evenodd" d={LOGO_RED} />
    </svg>
  );
  if (!tagline) return mark;
  return (
    <span className="inline-flex flex-col items-center">
      <span className={`block ${className}`}>{mark}</span>
      <span className="mt-1.5 font-display text-[10px] font-semibold uppercase tracking-[0.28em] text-ash">
        Car &amp; Bike Accessories
      </span>
    </span>
  );
}
