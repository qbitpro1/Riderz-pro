import { LOGO_INK, LOGO_RED, LOGO_VIEWBOX } from "./logo-paths";

/** The red of the registered logo. Fixed: the mark keeps its own colour in both themes. */
const LOGO_RED_COLOUR = "#f03030";

/* The traced artwork is 165 × 58; the tagline band sits under it, as on the original. */
const [, , MARK_W, MARK_H] = LOGO_VIEWBOX.split(" ").map(Number);
const FULL_H = MARK_H + 13;

/**
 * The complete registered Riderzpro logo as one vector: the car emblem, the
 * wordmark and the "Car & Bike Accessories" line beneath, between its two red
 * dots. The emblem and wordmark are traced from the supplied artwork; the
 * tagline is set as text inside the same drawing (it is too small on the
 * artwork to trace), so the whole lockup scales as one piece.
 *
 * The ink follows the text colour — dark on light surfaces, light on dark ones
 * — and the red never changes. Size it through `className` (a height).
 */
export function Logo({ className = "h-12 md:h-[60px]" }: { className?: string }) {
  return (
    <svg
      viewBox={`0 0 ${MARK_W} ${FULL_H}`}
      role="img"
      aria-label="Riderzpro — Car & Bike Accessories"
      className={`w-auto text-chalk ${className}`}
    >
      <path fill="currentColor" fillRule="evenodd" d={LOGO_INK} />
      <path fill={LOGO_RED_COLOUR} fillRule="evenodd" d={LOGO_RED} />
      <circle cx="27" cy={MARK_H + 6.4} r="1" fill={LOGO_RED_COLOUR} />
      <circle cx={MARK_W - 27} cy={MARK_H + 6.4} r="1" fill={LOGO_RED_COLOUR} />
      <text
        x={MARK_W / 2}
        y={MARK_H + 8.6}
        textAnchor="middle"
        textLength="100"
        lengthAdjust="spacing"
        fill="currentColor"
        fontSize="6.2"
        fontWeight="700"
        style={{ fontFamily: "var(--font-display)" }}
      >
        CAR &amp; BIKE ACCESSORIES
      </text>
    </svg>
  );
}
