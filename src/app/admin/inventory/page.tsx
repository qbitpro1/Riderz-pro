import type { Metadata } from "next";
import Link from "next/link";
import { Icon } from "@/components/ui/Icon";
import { SNAPSHOT } from "@/lib/inventory/store";
import { SOURCES, getSource } from "@/lib/inventory/sources";
import { formatIST, priceChange, refreshPriority } from "@/lib/inventory/freshness";
import { ACTIVE_DEALERS, DEALERS } from "@/lib/inventory/dealers";
import { FUTURE_PARTNERS, INVENTORY_TYPES, SUPPLY_CHANNELS } from "@/lib/inventory/network";
import { ENRICHMENT_POLICY, ENRICHMENT_PROVIDERS } from "@/lib/inventory/providers";
import { lakh } from "@/lib/format";
import type { Listing } from "@/lib/inventory/types";

export const metadata: Metadata = {
  title: "Inventory Dashboard",
  description: "Internal inventory, source and compliance dashboard.",
  robots: { index: false, follow: false, nocache: true },
};

export default function InventoryAdminPage() {
  const { totals, listings, importLog } = SNAPSHOT;
  const now = Date.now();

  return (
    <section className="section pt-24 md:pt-32">
      <div className="shell">
        <p className="eyebrow mb-3">Internal · not indexed</p>
        <h1 className="display-2">INVENTORY DASHBOARD</h1>
        <p className="mt-4 max-w-2xl text-sm leading-relaxed text-ash">
          Snapshot generated {formatIST(SNAPSHOT.generatedAt)}. Rebuilt on every deploy; run{" "}
          <code className="text-accent">npm run inventory:refresh</code> to pull partner feeds and
          re-check source compliance.
        </p>

        {/* headline counters ---------------------------------------- */}
        <ul className="mt-8 grid grid-cols-2 gap-3 md:grid-cols-4">
          {[
            { label: "Total cars", value: totals.listings },
            { label: "Live inventory", value: totals.live },
            { label: "Sample records", value: totals.demo },
            { label: "New today", value: totals.newToday },
            { label: "Price drops", value: totals.priceDrops },
            { label: "Needs verification", value: totals.stale },
            { label: "Sold / removed", value: totals.soldOrRemoved },
            { label: "Source errors", value: totals.sourceErrors },
            { label: "Duplicates merged", value: totals.duplicatesMerged },
            { label: "Motorbotz verified", value: totals.motorbotzVerified },
          ].map((s) => (
            <li key={s.label} className="card p-4">
              <p className="font-display text-2xl font-extrabold tnum">{s.value}</p>
              <p className="mt-1 text-[11px] uppercase tracking-[0.12em] text-dim">{s.label}</p>
            </li>
          ))}
        </ul>

        {totals.live === 0 && (
          <div className="card mt-6 border-gold/30 bg-gold/6 p-5">
            <p className="flex items-center gap-2 font-display text-sm font-extrabold uppercase text-gold">
              <Icon name="shield" size={16} />
              No live inventory published
            </p>
            <p className="mt-2 max-w-3xl text-xs leading-relaxed text-chalk/85">
              Every record currently in the system is a sample from the design build. No third-party
              marketplace has granted a data licence, and no dealer feed is connected, so nothing has
              been imported. Onboard a dealer through <code className="text-accent">data/inventory/dealer-feed.json</code>{" "}
              or add cars directly, and they appear on the storefront immediately.
            </p>
          </div>
        )}

        {/* supply network -------------------------------------------- */}
        <h2 className="display-3 mt-12">SUPPLY NETWORK</h2>
        <p className="mt-2 max-w-3xl text-sm text-ash">
          Inventory comes from suppliers who choose to give it to us. {ACTIVE_DEALERS.length} partner
          {ACTIVE_DEALERS.length === 1 ? "" : "s"} onboarded of {DEALERS.length} registered.
        </p>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[820px] border-collapse text-sm">
            <thead>
              <tr className="border-b border-white/12 text-left text-[10px] uppercase tracking-[0.14em] text-dim">
                <th className="p-2.5">Channel</th>
                <th className="p-2.5">Inventory type</th>
                <th className="p-2.5">Phase</th>
                <th className="p-2.5">Intake</th>
                <th className="p-2.5">Status</th>
                <th className="p-2.5">Blocking requirement</th>
              </tr>
            </thead>
            <tbody>
              {SUPPLY_CHANNELS.map((c) => (
                <tr key={c.id} className="border-b border-white/8 align-top">
                  <td className="p-2.5 text-xs">{c.name}</td>
                  <td className="p-2.5 text-[11px] text-ash">{INVENTORY_TYPES[c.inventoryType].label}</td>
                  <td className="p-2.5 text-[11px] text-dim tnum">{c.phase}</td>
                  <td className="p-2.5 text-[10px] text-dim">{c.intake.join(", ")}</td>
                  <td className="p-2.5">
                    <span
                      className={`chip ${
                        c.status === "LIVE"
                          ? "border-accent/35 text-accent"
                          : c.status === "READY_TO_ONBOARD"
                            ? "border-white/20"
                            : "border-gold/35 text-gold"
                      }`}
                    >
                      {c.status.replace(/_/g, " ").toLowerCase()}
                    </span>
                  </td>
                  <td className="max-w-md p-2.5 text-[11px] leading-relaxed text-ash">{c.requirement}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* enrichment ------------------------------------------------ */}
        <h2 className="display-3 mt-12">DATA ENRICHMENT PROVIDERS</h2>
        <p className="mt-2 max-w-3xl text-sm text-ash">
          Fills gaps once a supplier has given us a car. Researched, not connected — each needs an
          account and a data-protection review first.
        </p>
        <ul className="mt-4 space-y-3">
          {ENRICHMENT_PROVIDERS.map((p) => (
            <li key={p.id} className="card p-4">
              <p className="flex flex-wrap items-center gap-2 font-display text-sm font-extrabold uppercase">
                {p.name}
                <span
                  className={`chip ${
                    p.status === "CONNECTED"
                      ? "border-accent/35 text-accent"
                      : p.status === "AVAILABLE"
                        ? "border-white/20"
                        : "border-gold/35 text-gold"
                  }`}
                >
                  {p.status.replace(/_/g, " ").toLowerCase()}
                </span>
                <span className="chip text-[10px]">{p.kind.replace(/-/g, " ")}</span>
              </p>
              <p className="mt-2 text-xs leading-relaxed text-ash">{p.note}</p>
              <p className="mt-2 flex flex-wrap gap-x-5 gap-y-1 text-[11px] text-dim">
                <span>Returns: {p.returns.join(", ")}</span>
                {p.pricingNote && <span>{p.pricingNote}</span>}
                <a href={p.homepage} target="_blank" rel="noreferrer noopener" className="text-accent underline">
                  {new URL(p.homepage).host}
                </a>
              </p>
            </li>
          ))}
        </ul>
        <ul className="mt-4 space-y-1.5">
          {ENRICHMENT_POLICY.map((line) => (
            <li key={line} className="flex items-start gap-2 text-xs text-dim">
              <Icon name="shield" size={12} className="mt-0.5 shrink-0 text-accent" />
              {line}
            </li>
          ))}
        </ul>

        {/* future partners ------------------------------------------- */}
        <h2 className="display-3 mt-12">FUTURE PARTNERS</h2>
        <p className="mt-2 max-w-3xl text-sm text-ash">
          Kept in the system as prospects, not sources. The connector architecture takes a new source
          without touching the marketplace — the day one of these offers an API or an affiliate feed,
          it is a registry entry and a connector file.
        </p>
        <ul className="mt-4 grid gap-2 md:grid-cols-2 lg:grid-cols-3">
          {FUTURE_PARTNERS.map((p) => (
            <li key={p.id} className="border border-white/8 bg-white/2 p-3">
              <p className="font-display text-xs font-bold uppercase tracking-[0.1em]">{p.name}</p>
              <p className="mt-1 text-[11px] leading-relaxed text-dim">{p.note}</p>
            </li>
          ))}
        </ul>

        {/* sources --------------------------------------------------- */}
        <h2 className="display-3 mt-12">SOURCES & COMPLIANCE</h2>
        <div className="mt-4 space-y-3">
          {SOURCES.map((source) => {
            const row = SNAPSHOT.sources.find((s) => s.id === source.id);
            const live = source.status === "LIVE";
            return (
              <div key={source.id} className={`card p-5 ${live ? "" : "border-white/6"}`}>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="flex flex-wrap items-center gap-2 font-display text-base font-extrabold uppercase">
                      {source.name}
                      <span className={`chip ${live ? "border-accent/40 bg-accent/12 text-accent" : "border-gold/40 bg-gold/10 text-gold"}`}>
                        {live ? "Live" : "Blocked — no licence"}
                      </span>
                      <span className="chip">Level {source.level}</span>
                    </p>
                    <p className="mt-2 max-w-3xl text-xs leading-relaxed text-ash">{source.evidence.note}</p>
                  </div>
                  <p className="shrink-0 text-right">
                    <span className="block font-display text-2xl font-extrabold tnum">{row?.imported ?? 0}</span>
                    <span className="text-[10px] uppercase tracking-[0.12em] text-dim">imported</span>
                  </p>
                </div>

                <dl className="mt-4 grid gap-x-6 gap-y-1.5 text-xs sm:grid-cols-2 lg:grid-cols-3">
                  <Rule label="Import" ok={source.rules.canImport} />
                  <Rule label="Display images" ok={source.rules.canDisplayImages} />
                  <Rule label="Reproduce descriptions" ok={source.rules.canReproduceDescriptions} />
                  <Rule label="Commercial use" ok={source.rules.commercialUse} />
                  <Rule label="Attribution required" ok={source.rules.attributionRequired} neutral />
                  <Rule label="Original URL required" ok={source.rules.originalUrlRequired} neutral />
                </dl>

                {source.evidence.blockingRules.length > 0 && (
                  <div className="mt-4 border-t border-white/8 pt-3">
                    <p className="text-[10px] uppercase tracking-[0.14em] text-dim">
                      robots.txt checked {new Date(source.evidence.checkedAt).toLocaleDateString("en-IN")} —{" "}
                      {source.evidence.robotsUrl && (
                        <a href={source.evidence.robotsUrl} target="_blank" rel="noreferrer noopener" className="text-accent underline">
                          view
                        </a>
                      )}
                    </p>
                    <ul className="mt-2 space-y-0.5">
                      {source.evidence.blockingRules.map((r) => (
                        <li key={r} className="font-mono text-[11px] text-gold">
                          {r}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                <dl className="mt-3 flex flex-wrap gap-x-6 gap-y-1 text-[11px] text-dim">
                  <span>Licence: {source.licence ?? "none on file"}</span>
                  <span>Rate limit: {source.rateLimitPerMin ? `${source.rateLimitPerMin}/min` : "n/a"}</span>
                  <span>
                    Refresh:{" "}
                    {source.refreshHours
                      ? `${source.refreshHours.high}h / ${source.refreshHours.normal}h / ${source.refreshHours.stale}h`
                      : "n/a"}
                  </span>
                </dl>
              </div>
            );
          })}
        </div>

        {/* import log ------------------------------------------------ */}
        <h2 className="display-3 mt-12">IMPORT LOG</h2>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[1000px] border-collapse text-sm">
            <thead>
              <tr className="border-b border-white/12 text-left text-[10px] uppercase tracking-[0.14em] text-dim">
                <th className="p-2.5">Vehicle</th>
                <th className="p-2.5">Source</th>
                <th className="p-2.5">Imported</th>
                <th className="p-2.5">Last checked</th>
                <th className="p-2.5 text-right">Last price</th>
                <th className="p-2.5 text-right">Current</th>
                <th className="p-2.5">Status</th>
                <th className="p-2.5">Images</th>
                <th className="p-2.5">Confidence</th>
                <th className="p-2.5">Priority</th>
              </tr>
            </thead>
            <tbody>
              {importLog.map((entry) => {
                const listing = listings.find((l) => l.id === entry.listingId)!;
                const drop = priceChange(listing.priceHistory);
                return (
                  <tr key={entry.listingId} className="border-b border-white/8 align-top">
                    <td className="p-2.5 text-xs">
                      <Link href={`/cars/${listing.slug}`} className="text-accent hover:underline">
                        {listing.year} {listing.make} {listing.model}
                      </Link>
                      <span className="block text-dim">{listing.variant ?? "variant not specified"}</span>
                      {entry.notes.map((n) => (
                        <span key={n} className="mt-1 block text-[10px] text-gold">
                          {n}
                        </span>
                      ))}
                    </td>
                    <td className="p-2.5 text-xs text-ash">{getSource(entry.sourceId)?.name ?? entry.sourceId}</td>
                    <td className="p-2.5 text-[11px] text-dim">{formatIST(entry.importedAt)}</td>
                    <td className="p-2.5 text-[11px] text-dim">{formatIST(entry.lastCheckedAt)}</td>
                    <td className="p-2.5 text-right text-xs tnum">{entry.lastPrice ? lakh(entry.lastPrice) : "—"}</td>
                    <td className="p-2.5 text-right text-xs tnum">
                      {entry.currentPrice ? lakh(entry.currentPrice) : "—"}
                      {drop?.direction === "drop" && <span className="block text-[10px] text-accent">price drop</span>}
                    </td>
                    <td className="p-2.5 text-xs">
                      <StatusPill status={listing.status} />
                    </td>
                    <td className="p-2.5 text-[11px] text-ash">{entry.imagePermission.replace(/-/g, " ")}</td>
                    <td className="p-2.5 text-[11px]">
                      <span className={entry.confidence === "HIGH" ? "text-accent" : entry.confidence === "MEDIUM" ? "text-ash" : "text-gold"}>
                        {entry.confidence}
                      </span>
                    </td>
                    <td className="p-2.5 text-[11px] text-dim">{refreshPriority(listing, now)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="card mt-12 p-5">
          <p className="font-display text-sm font-extrabold uppercase">Operating the pipeline</p>
          <ol className="mt-3 space-y-1.5 text-xs text-ash">
            <li>1. <code className="text-accent">npm run inventory:check-robots</code> — re-reads each source&apos;s robots.txt and reports drift from the recorded evidence.</li>
            <li>2. <code className="text-accent">npm run inventory:refresh</code> — pulls connected dealer feeds, validates them and writes the feed file.</li>
            <li>3. Rebuild or restart — the snapshot is assembled at server start.</li>
          </ol>
          <div className="mt-5 flex flex-wrap gap-3">
            <Link href="/cars/latest" className="btn btn-outline btn-sm">
              Latest cars
            </Link>
            <Link href="/admin/catalog" className="btn btn-outline btn-sm">
              Catalogue report
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

function Rule({ label, ok, neutral = false }: { label: string; ok: boolean; neutral?: boolean }) {
  return (
    <div className="flex items-center gap-2">
      <span className={neutral ? "text-dim" : ok ? "text-accent" : "text-danger"}>{ok ? "✓" : "✗"}</span>
      <span className="text-ash">{label}</span>
    </div>
  );
}

function StatusPill({ status }: { status: Listing["status"] }) {
  const tone: Record<Listing["status"], string> = {
    ACTIVE: "border-accent/40 bg-accent/10 text-accent",
    PRICE_UPDATED: "border-accent/40 bg-accent/10 text-accent",
    STALE: "border-gold/40 bg-gold/10 text-gold",
    SOURCE_ERROR: "border-danger/40 bg-danger/10 text-danger",
    SOLD_UNAVAILABLE: "border-white/20 text-ash",
    ARCHIVED: "border-white/20 text-dim",
  };
  return <span className={`chip ${tone[status]}`}>{status.replace(/_/g, " ")}</span>;
}
