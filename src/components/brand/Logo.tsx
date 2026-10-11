import { LOGO_INK, LOGO_RED, LOGO_VIEWBOX } from "./logo-paths";

/** The red of the registered logo. Fixed: the mark keeps its own colour in both themes. */
const LOGO_RED_COLOUR = "#f03030";

/**
 * The complete registered Riderzpro logo as a vector, traced from the supplied
 * artwork: car emblem, wordmark and the "Car & Bike Accessories" line in the
 * original proportions.
 *
 * The ink follows the text colour — dark on light surfaces, light on dark ones
 * — and the red never changes. Size it through `className` (a height).
 */
export function Logo({ className = "h-12 md:h-[58px]" }: { className?: string }) {
  return (
    <svg
      viewBox={LOGO_VIEWBOX}
      role="img"
      aria-label="Riderzpro — Car & Bike Accessories"
      className={`w-auto text-chalk ${className}`}
    >
      <path fill="currentColor" fillRule="evenodd" d={LOGO_INK} />
      <path fill={LOGO_RED_COLOUR} fillRule="evenodd" d={LOGO_RED} />
    </svg>
  );
}
