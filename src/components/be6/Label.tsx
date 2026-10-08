import type { Provenance, Stage, ValidationDomain } from "@/lib/data/be6/motorbotz";
import { STAGE_COPY, VALIDATION_COPY } from "@/lib/data/be6/motorbotz";

/**
 * The labels that keep the three layers apart.
 *
 * These are the most load-bearing components on the BE 6 pages. A factory
 * feature and a Motorbotz concept must never be able to look like the same
 * kind of thing, so each provenance gets its own colour, and nothing else in
 * the BE 6 section is allowed to borrow those colours.
 *
 *   MAHINDRA FACTORY — steel/white. What Mahindra sells.
 *   MOTORBOTZ CUSTOM — accent cyan. What we fit.
 *   MOTORBOTZ CONCEPT — gold. What we have only imagined.
 */

const PROVENANCE_STYLE: Record<Provenance, string> = {
  "MAHINDRA FACTORY": "border-white/35 bg-white/10 text-chalk",
  "MOTORBOTZ CUSTOM": "border-accent/45 bg-accent/12 text-accent",
  "MOTORBOTZ CONCEPT": "border-gold/45 bg-gold/12 text-gold",
};

export function ProvenanceTag({
  provenance,
  className = "",
}: {
  provenance: Provenance;
  className?: string;
}) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 border px-2 py-1 font-display text-[0.5625rem] font-bold uppercase leading-none tracking-[0.16em] ${PROVENANCE_STYLE[provenance]} ${className}`}
    >
      {provenance}
    </span>
  );
}

const STAGE_STYLE: Record<Stage, string> = {
  CONCEPT: "border-gold/40 text-gold",
  PROTOTYPE: "border-gold/40 text-gold",
  TESTING: "border-gold/40 text-gold",
  READY: "border-white/30 text-ash",
  "COMING SOON": "border-gold/50 bg-gold/10 text-gold",
  AVAILABLE: "border-accent/45 bg-accent/10 text-accent",
};

export function StageTag({ stage, className = "" }: { stage: Stage; className?: string }) {
  return (
    <span
      title={STAGE_COPY[stage].meaning}
      className={`inline-flex items-center gap-1.5 border px-2 py-1 font-display text-[0.5625rem] font-bold uppercase leading-none tracking-[0.16em] ${STAGE_STYLE[stage]} ${className}`}
    >
      {stage === "AVAILABLE" && <span className="h-1 w-1 rounded-full bg-accent pulse-dot" />}
      {STAGE_COPY[stage].label}
    </span>
  );
}

/** The "not a Mahindra product" line, in the two lengths we use it. */
export function ConceptNotice({ long = false, className = "" }: { long?: boolean; className?: string }) {
  return (
    <p className={`border-l-2 border-gold/50 bg-gold/[0.06] px-4 py-3 text-xs leading-relaxed text-ash ${className}`}>
      {long ? (
        <>
          <strong className="text-gold">MOTORBOTZ Limited Edition</strong> is an independent customization concept by
          MOTORBOTZ and is not a factory Mahindra variant. It carries no Mahindra endorsement, certification or
          partnership.
        </>
      ) : (
        <>
          <strong className="text-gold">Independent concept.</strong> Not a factory Mahindra variant, and not endorsed
          or certified by Mahindra.
        </>
      )}
    </p>
  );
}

/**
 * Engineering and regulatory notices. Rendered wherever a modification could
 * touch something that matters — never collapsed behind a "learn more".
 */
export function ValidationNotice({
  domains,
  className = "",
}: {
  domains: ValidationDomain[];
  className?: string;
}) {
  if (!domains.length) return null;
  const needsRegulatory = domains.includes("road-legality") || domains.includes("glass");
  return (
    <div className={`border border-danger/25 bg-danger/[0.05] p-3 ${className}`}>
      <p className="font-display text-[0.5625rem] font-bold uppercase tracking-[0.16em] text-danger">
        Professional engineering validation required
      </p>
      <ul className="mt-2 space-y-1">
        {domains.map((d) => (
          <li key={d} className="text-[0.6875rem] leading-relaxed text-ash">
            {VALIDATION_COPY[d]}
          </li>
        ))}
      </ul>
      {needsRegulatory && (
        <p className="mt-2 text-[0.6875rem] leading-relaxed text-dim">
          Subject to applicable Indian regulations and certification requirements.
        </p>
      )}
    </div>
  );
}

/**
 * Marks a figure we could not verify. Used instead of quietly omitting the
 * row, so the gap is visible rather than invisible.
 */
export function PendingValue({ reason }: { reason: string }) {
  return (
    <span className="inline-flex flex-col gap-0.5">
      <span className="font-display text-xs uppercase tracking-[0.12em] text-dim">Awaiting official figure</span>
      <span className="text-[0.6875rem] leading-relaxed text-dim">{reason}</span>
    </span>
  );
}
