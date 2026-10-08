/**
 * The Riderzpro wordmark. A typeset placeholder until the registered logo
 * artwork is supplied — swap the markup here and every placement follows.
 *
 * Size it through `className` (a font size); the default is the header's.
 */
export function Logo({ className = "text-[19px] md:text-[22px]" }: { className?: string }) {
  return (
    <span className={`flex items-baseline font-display font-extrabold tracking-[-0.04em] ${className}`}>
      RIDERZ
      <span className="text-accent">PRO</span>
    </span>
  );
}
