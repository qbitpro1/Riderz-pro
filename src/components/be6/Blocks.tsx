import Link from "next/link";
import { Reveal } from "@/components/ui/Reveal";
import { Icon } from "@/components/ui/Icon";
import { ProvenanceTag, StageTag, ValidationNotice } from "./Label";
import { rupees } from "@/lib/format";
import { SOURCES, source } from "@/lib/data/be6/sources";
import { SPEC_GROUPS, TEQ_SUITES, FACTORY_FEATURES, MANUAL_STATUS } from "@/lib/data/be6/specs";
import { PIPELINE, PRINTED_PARTS, type ConceptModule, type PrintedPart } from "@/lib/data/be6/limited-edition";
import { COMPARISON, COMPARISON_NOTICE } from "@/lib/data/be6/limited-edition";

/**
 * Static presentation blocks shared by the BE 6 page and the Limited Edition
 * page. Server components — none of these need state.
 */

/* ------------------------------------------------------------------ */
/* FACTORY SPECIFICATIONS                                              */
/* ------------------------------------------------------------------ */

export function SpecTables() {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      {SPEC_GROUPS.map((g, i) => (
        <Reveal key={g.slug} delay={i * 40} className="card p-4 md:p-5">
          <div className="mb-1 flex items-center justify-between gap-3">
            <h3 className="font-display text-sm font-extrabold uppercase tracking-[0.12em] text-chalk">
              {g.title}
            </h3>
            <ProvenanceTag provenance="MAHINDRA FACTORY" />
          </div>
          <p className="mb-3 text-[0.6875rem] leading-relaxed text-dim">{g.caption}</p>

          <dl className="divide-y divide-tint/[0.06]">
            {g.rows.map((r) => (
              <div key={r.label} className="grid grid-cols-[9rem_1fr] gap-3 py-2.5 xs:grid-cols-[10rem_1fr]">
                <dt className="text-[0.6875rem] leading-snug text-dim">{r.label}</dt>
                <dd className="min-w-0">
                  {r.value.kind === "value" ? (
                    <>
                      <span className="tnum block text-xs font-semibold leading-snug text-chalk">
                        {r.value.value}
                      </span>
                      {r.note && <span className="mt-0.5 block text-[0.625rem] leading-relaxed text-dim">{r.note}</span>}
                    </>
                  ) : (
                    <>
                      <span className="block font-display text-[0.625rem] uppercase tracking-[0.12em] text-gold">
                        Awaiting official figure
                      </span>
                      <span className="mt-0.5 block text-[0.625rem] leading-relaxed text-dim">
                        {r.value.reason}
                      </span>
                    </>
                  )}
                </dd>
              </div>
            ))}
          </dl>
        </Reveal>
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* FEATURE EXPLAINERS                                                  */
/* ------------------------------------------------------------------ */

export function FeatureExplainers() {
  return (
    <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
      {FACTORY_FEATURES.map((f, i) => (
        <Reveal key={f.slug} delay={i * 30} className="card flex flex-col p-4">
          <div className="mb-2 flex items-start justify-between gap-2">
            <h3 className="font-display text-xs font-extrabold uppercase tracking-[0.08em] text-chalk">
              {f.name}
            </h3>
            <span className="chip shrink-0 !text-[0.5625rem]">{f.group}</span>
          </div>

          <Labelled title="What it does">{f.what}</Labelled>
          <Labelled title="Why it matters">{f.why}</Labelled>

          <div className="mt-auto pt-3">
            <p className="font-display text-[0.5625rem] uppercase tracking-[0.16em] text-dim">Available on</p>
            {f.availability.kind === "confirmed" ? (
              <p className="mt-0.5 text-[0.6875rem] text-accent">{f.availability.text}</p>
            ) : (
              <p className="mt-0.5 text-[0.6875rem] text-gold">{f.availability.text}</p>
            )}
          </div>
        </Reveal>
      ))}
    </div>
  );
}

function Labelled({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mt-2.5">
      <p className="font-display text-[0.5625rem] uppercase tracking-[0.16em] text-dim">{title}</p>
      <p className="mt-0.5 text-[0.6875rem] leading-relaxed text-ash">{children}</p>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* MAHINDRA'S OWN SOFTWARE                                             */
/* ------------------------------------------------------------------ */

export function TeqSuites() {
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {TEQ_SUITES.map((t, i) => (
        <Reveal key={t.slug} delay={i * 30} className="card p-4">
          <div className="mb-2 flex items-center justify-between gap-2">
            <h3 className="font-display text-sm font-extrabold text-chalk">{t.name}</h3>
            <ProvenanceTag provenance="MAHINDRA FACTORY" />
          </div>
          <p className="text-[0.6875rem] leading-relaxed text-ash">{t.summary}</p>
          <ul className="mt-2.5 space-y-1">
            {t.points.map((p) => (
              <li key={p} className="flex gap-2 text-[0.6875rem] leading-relaxed text-dim">
                <Icon name="check" size={12} className="mt-0.5 shrink-0 text-accent" />
                {p}
              </li>
            ))}
          </ul>
        </Reveal>
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* THE LAB                                                             */
/* ------------------------------------------------------------------ */

export function Pipeline() {
  return (
    <ol className="rail -mx-[1.125rem] px-[1.125rem] pb-2 md:mx-0 md:grid md:grid-cols-7 md:gap-2 md:overflow-visible md:px-0">
      {PIPELINE.map((p, i) => (
        <li
          key={p.slug}
          className="relative w-[11rem] shrink-0 border border-tint/10 bg-tint/[0.02] p-3 md:w-auto"
        >
          <span className="font-display text-[0.5625rem] uppercase tracking-[0.16em] text-dim">
            {String(i + 1).padStart(2, "0")}
          </span>
          <h3 className="mt-1 font-display text-xs font-extrabold uppercase tracking-[0.08em] text-chalk">
            {p.name}
          </h3>
          <p className="mt-1.5 text-[0.625rem] leading-relaxed text-ash">{p.blurb}</p>
          <span className="mt-2 block font-display text-[0.5625rem] uppercase tracking-[0.14em] text-accent">
            {PRINTED_PARTS.filter((x) => p.stages.includes(x.stage)).length} parts
          </span>
        </li>
      ))}
    </ol>
  );
}

export function PrintedPartCard({ part }: { part: PrintedPart }) {
  const rows: [string, string][] = [
    ["Version", part.version],
    ["Material", part.material],
    ["Finish", part.finish],
    ["Installation", part.installation],
    ["Weight", part.weightG !== null ? `${part.weightG} g` : "Not printed — no measured weight"],
    ["Price", part.price !== null ? rupees(part.price) : "No price — not on sale"],
  ];

  return (
    <div className="card flex flex-col p-4">
      <div className="mb-2 flex items-start justify-between gap-2">
        <h3 className="font-display text-xs font-extrabold uppercase tracking-[0.08em] text-chalk">{part.name}</h3>
        <StageTag stage={part.stage} className="shrink-0" />
      </div>

      <dl className="divide-y divide-tint/[0.06]">
        {rows.map(([k, v]) => (
          <div key={k} className="grid grid-cols-[5.5rem_1fr] gap-2 py-1.5">
            <dt className="text-[0.625rem] text-dim">{k}</dt>
            <dd className="text-[0.6875rem] leading-snug text-chalk">{v}</dd>
          </div>
        ))}
      </dl>

      {part.note && <p className="mt-2 text-[0.625rem] leading-relaxed text-ash">{part.note}</p>}
      {part.validation && part.validation.length > 0 && (
        <ValidationNotice domains={part.validation} className="mt-auto pt-0 [&]:mt-3" />
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* CONCEPT MODULES                                                     */
/* ------------------------------------------------------------------ */

export function ConceptModuleBlock({ module: m }: { module: ConceptModule }) {
  return (
    <div className="card p-5 md:p-7">
      <div className="flex flex-wrap items-center gap-2">
        <ProvenanceTag provenance="RIDERZPRO CONCEPT" />
        <span className="verified !border-gold/40 !bg-gold/10 !text-gold">{m.status}</span>
      </div>

      <h3 className="display-3 mt-3">{m.name}</h3>
      <p className="mt-1.5 font-display text-xs uppercase tracking-[0.14em] text-gold">{m.tagline}</p>
      <p className="mt-3 max-w-2xl text-sm leading-relaxed text-ash">{m.body}</p>

      <div className="mt-5 grid gap-4 md:grid-cols-2">
        <div className="border border-danger/25 bg-danger/[0.05] p-4">
          <h4 className="font-display text-[0.625rem] font-bold uppercase tracking-[0.16em] text-danger">
            What we are not claiming
          </h4>
          <ul className="mt-2 space-y-1.5">
            {m.notClaiming.map((n) => (
              <li key={n} className="text-[0.6875rem] leading-relaxed text-ash">
                {n}
              </li>
            ))}
          </ul>
        </div>

        <div className="border border-tint/10 bg-tint/[0.02] p-4">
          <h4 className="font-display text-[0.625rem] font-bold uppercase tracking-[0.16em] text-chalk">
            Engineering &amp; certification required
          </h4>
          <ul className="mt-2 space-y-1.5">
            {m.requirements.map((r) => (
              <li key={r} className="flex gap-2 text-[0.6875rem] leading-relaxed text-ash">
                <span className="mt-1.5 h-1 w-1 shrink-0 bg-gold" />
                {r}
              </li>
            ))}
          </ul>
        </div>
      </div>

      <ValidationNotice domains={m.validation} className="mt-4" />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* FACTORY vs RIDERZPRO                                                */
/* ------------------------------------------------------------------ */

export function ComparisonTable() {
  return (
    <div>
      <div className="card overflow-x-auto">
        <table className="w-full min-w-[34rem] border-collapse text-left">
          <thead>
            <tr className="border-b border-tint/10">
              <th className="p-3 font-display text-[0.625rem] uppercase tracking-[0.16em] text-dim">&nbsp;</th>
              <th className="p-3 font-display text-[0.625rem] uppercase tracking-[0.16em] text-chalk">
                Factory BE 6
              </th>
              <th className="p-3 font-display text-[0.625rem] uppercase tracking-[0.16em] text-accent">
                RIDERZPRO Edition
              </th>
            </tr>
          </thead>
          <tbody>
            {COMPARISON.map((r) => (
              <tr key={r.label} className="border-b border-tint/[0.06] last:border-0">
                <td className="p-3 align-top text-[0.6875rem] leading-snug text-ash">{r.label}</td>
                <td className="p-3 align-top text-[0.6875rem] leading-snug text-chalk">{r.factory}</td>
                <td
                  className={`p-3 align-top text-[0.6875rem] leading-snug ${
                    r.conceptual ? "text-gold" : "text-accent"
                  }`}
                >
                  {r.riderzpro}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="mt-3 text-[0.6875rem] leading-relaxed text-dim">{COMPARISON_NOTICE}</p>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* PROVENANCE                                                          */
/* ------------------------------------------------------------------ */

export function SourceList() {
  return (
    <div className="card p-4 md:p-5">
      <h3 className="font-display text-xs font-bold uppercase tracking-[0.16em] text-chalk">
        Where the factory figures came from
      </h3>
      <p className="mt-1.5 text-[0.6875rem] leading-relaxed text-dim">
        Primary source is Mahindra&apos;s official BE 6 SPORTEQ brochure, V1 dated 14.08.26, read on 16 August 2026.
        Mahindra can change specification and price without telling us — confirm with an authorised dealer before you
        buy.
      </p>
      <ul className="mt-3 space-y-2">
        {SOURCES.map((s) => (
          <li key={s.id} className="flex flex-wrap items-baseline gap-2">
            <span
              className={`shrink-0 border px-1.5 py-0.5 font-display text-[0.5rem] font-bold uppercase tracking-[0.14em] ${
                s.kind === "official" ? "border-accent/45 bg-accent/10 text-accent" : "border-tint/20 text-dim"
              }`}
            >
              {s.kind}
            </span>
            <a
              href={s.url}
              target="_blank"
              rel="noopener noreferrer nofollow"
              className="min-w-0 break-words text-[0.6875rem] text-ash underline decoration-tint/25 underline-offset-2 transition-colors hover:text-accent"
            >
              {s.label}
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function ManualNotice() {
  return (
    <div className="card border-gold/25 p-4 md:p-5">
      <div className="flex items-center gap-2">
        <Icon name="shield" size={16} className="text-gold" />
        <h3 className="font-display text-xs font-bold uppercase tracking-[0.16em] text-gold">
          {MANUAL_STATUS.headline}
        </h3>
      </div>
      <p className="mt-2 text-[0.6875rem] leading-relaxed text-ash">{MANUAL_STATUS.body}</p>
      <ul className="mt-3 flex flex-wrap gap-1.5">
        {MANUAL_STATUS.covers.map((c) => (
          <li key={c} className="chip !text-[0.5625rem]">
            {c}
          </li>
        ))}
      </ul>
    </div>
  );
}

/** Cross-link used at the foot of concept sections. */
export function ConceptCta({ href = "/be-6/limited-edition" }: { href?: string }) {
  return (
    <Link href={href} className="btn btn-outline mt-5">
      SEE THE FULL LIMITED EDITION CONCEPT
      <Icon name="arrow" size={15} />
    </Link>
  );
}

export { source };
