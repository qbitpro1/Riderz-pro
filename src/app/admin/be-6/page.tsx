import type { Metadata } from "next";
import Link from "next/link";
import { Icon } from "@/components/ui/Icon";
import { lakh, rupees } from "@/lib/format";
import {
  BATTERIES,
  BE6,
  COLOURS,
  PRINTED_PARTS,
  OPEN_FLAGS,
  RESOLVED_FLAGS,
  SOURCES,
  STAGE_COPY,
  STAGE_ORDER,
  UPGRADES,
  VARIANTS,
  source,
  type Stage,
} from "@/lib/data/be6";

export const metadata: Metadata = {
  title: "BE 6 Programme — Admin",
  description: "Internal control board for the BE 6 factory data, Motorbotz products and Limited Edition concept.",
  robots: { index: false, follow: false, nocache: true },
};

/**
 * BE 6 admin board.
 *
 * Read-only, like the other admin routes here — this project has no auth yet,
 * so the dashboard reports state rather than editing it. The most useful thing
 * it does is put the open factual questions at the top, where they cannot be
 * ignored, instead of leaving them buried in a source file.
 */
export default function Be6AdminPage() {
  const stageCounts = STAGE_ORDER.map((s) => ({
    stage: s,
    upgrades: UPGRADES.filter((u) => u.stage === s).length,
    parts: PRINTED_PARTS.filter((p) => p.stage === s).length,
  }));

  const sellable = UPGRADES.filter((u) => STAGE_COPY[u.stage].sellable && u.price !== null);
  const unpriced = UPGRADES.filter((u) => u.price === null);

  return (
    <section className="section pt-24 md:pt-32">
      <div className="shell">
        <p className="eyebrow mb-3">Internal · not indexed</p>
        <h1 className="display-2">BE 6 PROGRAMME</h1>
        <p className="mt-4 max-w-2xl text-sm leading-relaxed text-ash">
          {BE6.lineup} lineup, introduced {BE6.lineupFrom}, deliveries from {BE6.deliveriesFrom}. Factory data last
          verified {BE6.dataVerified}.{" "}
          <Link href="/be-6" className="text-accent underline underline-offset-2">
            View the public page
          </Link>
          .
        </p>

        {/* --- OPEN QUESTIONS — top of the page, deliberately ---------- */}
        <div className="card mt-6 border-gold/30 p-4 md:p-5">
          <p className="flex items-center gap-2 font-display text-sm font-extrabold uppercase text-gold">
            <Icon name="shield" size={16} />
            {OPEN_FLAGS.length} open questions for human review
          </p>
          <p className="mt-2 text-xs leading-relaxed text-chalk/85">
            Where sources disagree, or where a figure is widely quoted but never by Mahindra, the discrepancy is
            recorded rather than reconciled. Nothing below has been silently resolved in code. {RESOLVED_FLAGS.length}{" "}
            further questions were settled by the official brochure and are listed underneath.
          </p>

          <div className="mt-4 space-y-3">
            {OPEN_FLAGS.map((f) => (
              <div key={f.id} className="border border-white/10 bg-white/[0.02] p-3">
                <h3 className="font-display text-xs font-bold uppercase tracking-[0.12em] text-chalk">{f.field}</h3>
                <p className="mt-1.5 text-[0.6875rem] leading-relaxed text-ash">{f.issue}</p>

                {f.positions.length > 0 && (
                  <ul className="mt-2 space-y-1">
                    {f.positions.map((p, i) => {
                      const s = source(p.sourceId);
                      return (
                        <li key={i} className="flex flex-wrap items-baseline gap-2 text-[0.6875rem]">
                          <span
                            className={`shrink-0 border px-1.5 py-0.5 font-display text-[0.5rem] font-bold uppercase tracking-[0.12em] ${
                              s?.kind === "official"
                                ? "border-accent/45 bg-accent/10 text-accent"
                                : "border-white/20 text-dim"
                            }`}
                          >
                            {s?.kind ?? "source"}
                          </span>
                          <span className="text-chalk">{p.claim}</span>
                          <span className="text-dim">— {s?.label ?? p.sourceId}</span>
                        </li>
                      );
                    })}
                  </ul>
                )}

                <p className="mt-2 border-l-2 border-accent/40 pl-2.5 text-[0.6875rem] leading-relaxed text-dim">
                  <strong className="text-accent">Handling:</strong> {f.handling}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* --- SETTLED BY THE BROCHURE -------------------------------- */}
        <div className="card mt-4 border-accent/25 p-4 md:p-5">
          <p className="flex items-center gap-2 font-display text-sm font-extrabold uppercase text-accent">
            <Icon name="check" size={16} />
            {RESOLVED_FLAGS.length} settled by the official brochure
          </p>
          <p className="mt-2 text-xs leading-relaxed text-chalk/85">
            Kept rather than deleted — a question that has been answered is worth more on the record than one that was
            quietly dropped. Two of these were figures we had published wrongly from media reporting.
          </p>
          <ul className="mt-3 space-y-2">
            {RESOLVED_FLAGS.map((f) => (
              <li key={f.id} className="border-l-2 border-accent/40 pl-3">
                <p className="font-display text-[0.6875rem] font-bold uppercase tracking-[0.1em] text-chalk">
                  {f.field}
                </p>
                <p className="mt-0.5 text-[0.6875rem] leading-relaxed text-ash">{f.resolved}</p>
              </li>
            ))}
          </ul>
        </div>

        {/* --- SUMMARY ------------------------------------------------ */}
        <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {[
            ["Factory variants", String(VARIANTS.length)],
            ["Battery packs", String(BATTERIES.length)],
            ["Factory colours", String(COLOURS.length)],
            ["Price range", `${lakh(Math.min(...VARIANTS.flatMap((v) => v.prices.map((p) => p.exShowroom))))} – ${lakh(Math.max(...VARIANTS.flatMap((v) => v.prices.map((p) => p.exShowroom))))}`],
            ["Motorbotz products", String(UPGRADES.length)],
            ["On sale now", String(sellable.length)],
            ["Not yet priced", String(unpriced.length)],
            ["3D-printed parts", String(PRINTED_PARTS.length)],
          ].map(([k, v]) => (
            <div key={k} className="card p-4">
              <p className="font-display text-[0.5625rem] uppercase tracking-[0.16em] text-dim">{k}</p>
              <p className="tnum mt-1 font-display text-xl font-extrabold text-chalk">{v}</p>
            </div>
          ))}
        </div>

        {/* --- FACTORY VEHICLES --------------------------------------- */}
        <Board title="FACTORY VEHICLES" note="Mahindra's lineup. Read-only — changes belong in src/lib/data/be6/factory.ts with a source.">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[40rem] border-collapse text-left">
              <thead>
                <tr className="border-b border-white/10">
                  {["Variant", "Rung", "Battery", "Ex-showroom", "BaaS", "Exclusive paint", "Source"].map((h) => (
                    <th key={h} className="p-2 font-display text-[0.5625rem] uppercase tracking-[0.14em] text-dim">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {VARIANTS.flatMap((v) =>
                  v.prices.map((p, i) => (
                    <tr key={`${v.slug}-${p.batteryId}`} className="border-b border-white/[0.06]">
                      <td className="p-2 text-[0.6875rem] font-semibold text-chalk">
                        {i === 0 ? v.name : ""}
                        {i === 0 && v.edition && <span className="ml-1.5 text-[0.5625rem] text-gold">EDITION</span>}
                      </td>
                      <td className="p-2 text-[0.6875rem] text-ash">{i === 0 ? v.ladderLabel : ""}</td>
                      <td className="tnum p-2 text-[0.6875rem] text-chalk">{p.batteryId} kWh</td>
                      <td className="tnum p-2 text-[0.6875rem] text-chalk">{lakh(p.exShowroom)}</td>
                      <td className="tnum p-2 text-[0.6875rem] text-accent">{p.baas ? lakh(p.baas) : "—"}</td>
                      <td className="p-2 text-[0.6875rem] text-gold">
                        {i === 0 ? (v.exclusiveColourSlug ?? "—") : ""}
                      </td>
                      <td className="p-2 text-[0.5625rem] text-dim">{i === 0 ? v.sourceId : ""}</td>
                    </tr>
                  )),
                )}
              </tbody>
            </table>
          </div>

          <div className="mt-4 grid gap-3 md:grid-cols-2">
            <div>
              <h4 className="font-display text-[0.625rem] uppercase tracking-[0.14em] text-dim">Battery packs</h4>
              <ul className="mt-2 space-y-1">
                {BATTERIES.map((b) => (
                  <li key={b.id} className="tnum text-[0.6875rem] text-ash">
                    <span className="text-chalk">{b.label}</span> — {b.certifiedRangeKm} km {b.rangeCycle} ·{" "}
                    {b.powerKw} kW · {b.torqueNm} Nm · DC to {b.dcPeakKw} kW
                    {b.ac72Hours === null && <span className="ml-1.5 text-gold">AC time not published</span>}
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="font-display text-[0.625rem] uppercase tracking-[0.14em] text-dim">Colours</h4>
              <ul className="mt-2 flex flex-wrap gap-1.5">
                {COLOURS.map((c) => (
                  <li key={c.slug} className="chip !text-[0.5625rem]">
                    <span className="h-2.5 w-2.5 border border-white/25" style={{ background: c.hex }} />
                    {c.name}
                    {c.exclusiveTo && <span className="text-gold">·</span>}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </Board>

        {/* --- MOTORBOTZ PRODUCTS -------------------------------------- */}
        <Board title="MOTORBOTZ PRODUCTS" note="Modification, price, availability and development stage.">
          <div className="mb-4 flex flex-wrap gap-2">
            {stageCounts.map((s) => (
              <div key={s.stage} className="border border-white/10 bg-white/[0.02] px-3 py-2">
                <p className="font-display text-[0.5625rem] uppercase tracking-[0.14em] text-dim">{s.stage}</p>
                <p className="tnum mt-0.5 font-display text-sm font-bold text-chalk">
                  {s.upgrades + s.parts}
                  <span className="ml-1.5 text-[0.625rem] font-normal text-dim">
                    {s.upgrades} products · {s.parts} parts
                  </span>
                </p>
              </div>
            ))}
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[40rem] border-collapse text-left">
              <thead>
                <tr className="border-b border-white/10">
                  {["Product", "Group", "Provenance", "Stage", "Price", "Validation"].map((h) => (
                    <th key={h} className="p-2 font-display text-[0.5625rem] uppercase tracking-[0.14em] text-dim">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {UPGRADES.map((u) => (
                  <tr key={u.slug} className="border-b border-white/[0.06]">
                    <td className="p-2 text-[0.6875rem] font-semibold text-chalk">{u.name}</td>
                    <td className="p-2 text-[0.6875rem] text-ash">{u.group}</td>
                    <td className="p-2 text-[0.5625rem] text-dim">{u.provenance}</td>
                    <td className={`p-2 text-[0.6875rem] ${STAGE_COPY[u.stage].sellable ? "text-accent" : "text-gold"}`}>
                      {u.stage}
                    </td>
                    <td className="tnum p-2 text-[0.6875rem] text-chalk">
                      {u.price !== null ? rupees(u.price) : <span className="text-dim">{u.priceNote}</span>}
                    </td>
                    <td className="p-2 text-[0.5625rem] text-danger">{u.validation?.join(", ") ?? "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Board>

        {/* --- LIMITED EDITION ------------------------------------------ */}
        <Board title="LIMITED EDITION" note="Concept status, component status and development stage.">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[40rem] border-collapse text-left">
              <thead>
                <tr className="border-b border-white/10">
                  {["Part", "Ver", "Placement", "Material", "Weight", "Price", "Stage"].map((h) => (
                    <th key={h} className="p-2 font-display text-[0.5625rem] uppercase tracking-[0.14em] text-dim">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {PRINTED_PARTS.map((p) => (
                  <tr key={p.slug} className="border-b border-white/[0.06]">
                    <td className="p-2 text-[0.6875rem] font-semibold text-chalk">{p.name}</td>
                    <td className="tnum p-2 text-[0.6875rem] text-ash">{p.version}</td>
                    <td className="p-2 text-[0.6875rem] text-ash">{p.placement}</td>
                    <td className="p-2 text-[0.6875rem] text-ash">{p.material}</td>
                    <td className="tnum p-2 text-[0.6875rem] text-chalk">
                      {p.weightG !== null ? `${p.weightG} g` : <span className="text-dim">—</span>}
                    </td>
                    <td className="tnum p-2 text-[0.6875rem] text-chalk">
                      {p.price !== null ? rupees(p.price) : <span className="text-dim">—</span>}
                    </td>
                    <td className={`p-2 text-[0.6875rem] ${STAGE_COPY[p.stage].sellable ? "text-accent" : "text-gold"}`}>
                      {p.stage}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <p className="mt-3 text-[0.6875rem] leading-relaxed text-dim">
            Expected launch: not set. Production quantity: not decided, and not advertised anywhere on the public
            pages.
          </p>
        </Board>

        {/* --- LEADS ---------------------------------------------------- */}
        <Board
          title="LEADS"
          note="Test drive, purchase enquiry, build enquiry and Limited Edition waitlist."
        >
          <div className="border border-gold/25 bg-gold/[0.05] p-4">
            <p className="font-display text-xs font-bold uppercase tracking-[0.14em] text-gold">
              No leads store yet
            </p>
            <p className="mt-2 max-w-2xl text-[0.6875rem] leading-relaxed text-ash">
              The waitlist and quote forms currently hand the enquiry to WhatsApp, which is where Motorbotz enquiries
              actually land. Nothing is written to a database, so there is nothing to list here. When a leads
              endpoint exists, this board reads from it — the four lead types below are the ones the BE 6 pages
              generate.
            </p>
            <ul className="mt-3 flex flex-wrap gap-1.5">
              {["Test drive", "Purchase enquiry", "Build enquiry", "Limited Edition waitlist"].map((l) => (
                <li key={l} className="chip !text-[0.5625rem]">
                  {l}
                </li>
              ))}
            </ul>
          </div>
        </Board>

        {/* --- SOURCES --------------------------------------------------- */}
        <Board title="SOURCES" note="Every factory figure traces to one of these.">
          <ul className="space-y-2">
            {SOURCES.map((s) => (
              <li key={s.id} className="flex flex-wrap items-baseline gap-2">
                <span
                  className={`shrink-0 border px-1.5 py-0.5 font-display text-[0.5rem] font-bold uppercase tracking-[0.12em] ${
                    s.kind === "official" ? "border-accent/45 bg-accent/10 text-accent" : "border-white/20 text-dim"
                  }`}
                >
                  {s.kind}
                </span>
                <code className="text-[0.625rem] text-dim">{s.id}</code>
                <a
                  href={s.url}
                  target="_blank"
                  rel="noopener noreferrer nofollow"
                  className="min-w-0 break-words text-[0.6875rem] text-ash underline decoration-white/25 underline-offset-2 hover:text-accent"
                >
                  {s.label}
                </a>
                <span className="text-[0.625rem] text-dim">read {s.retrieved}</span>
              </li>
            ))}
          </ul>
        </Board>
      </div>
    </section>
  );
}

function Board({ title, note, children }: { title: string; note: string; children: React.ReactNode }) {
  return (
    <div className="card mt-6 p-4 md:p-5">
      <h2 className="font-display text-sm font-extrabold uppercase tracking-[0.14em] text-chalk">{title}</h2>
      <p className="mb-4 mt-1 text-[0.6875rem] leading-relaxed text-dim">{note}</p>
      {children}
    </div>
  );
}
