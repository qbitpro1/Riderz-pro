import type { Metadata } from "next";
import Link from "next/link";
import { Icon } from "@/components/ui/Icon";
import { BLOCKERS, READINESS, type Blocker } from "@/lib/catalog/readiness";
import { SOURCES } from "@/lib/inventory/sources";

export const metadata: Metadata = {
  title: "Launch Readiness",
  description: "Internal report: what is live, what is held back, and what unblocks it.",
  robots: { index: false, follow: false, nocache: true },
};

const OWNER_TONE: Record<Blocker["owner"], string> = {
  Manufacturer: "text-gold",
  "Source document": "text-accent",
  "Internal decision": "text-ash",
};

export default function LaunchReadinessPage() {
  return (
    <section className="section pt-24 md:pt-32">
      <div className="shell">
        <p className="eyebrow mb-3">Internal · not indexed</p>
        <h1 className="display-2">LAUNCH READINESS</h1>
        <p className="mt-4 max-w-2xl text-sm leading-relaxed text-ash">
          {READINESS.live.total} products are live across three brands. A further {READINESS.heldBack}{" "}
          are already imported and already priced, but held back by a data gap rather than by a gap in
          the range. Each one below names what would release it.
        </p>

        {/* live ---------------------------------------------------- */}
        <ul className="mt-8 grid grid-cols-2 gap-3 md:grid-cols-4">
          {[
            { label: "Live products", value: READINESS.live.total },
            { label: "Held back", value: READINESS.heldBack },
            { label: "RECOIL coming soon", value: READINESS.recoil.comingSoon },
            { label: "Cars listed", value: READINESS.cars.listed },
          ].map((s) => (
            <li key={s.label} className="card p-4">
              <p className="font-display text-2xl font-extrabold tnum">{s.value}</p>
              <p className="mt-1 text-[11px] uppercase tracking-[0.12em] text-dim">{s.label}</p>
            </li>
          ))}
        </ul>

        <ul className="mt-3 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <Brand
            name="Motorbotz"
            live={READINESS.live.motorbotz}
            note="House range. Grows when we add our own products — no external source involved."
          />
          <Brand
            name="RECOIL"
            live={READINESS.live.recoil}
            note={`${READINESS.recoil.imported} SKUs imported from the price list · ${READINESS.recoil.ready} ready · ${READINESS.recoil.queue} in the verification queue.`}
          />
          <Brand
            name="Autoform"
            live={READINESS.live.autoform}
            note={`${READINESS.autoform.designsLive} designs live, ${READINESS.autoform.designsAwaiting} priced but never illustrated · ${READINESS.autoform.accessoriesHeld} accessory rows unnamed.`}
          />
          <Brand
            name="Blaupunkt"
            live={READINESS.live.blaupunkt}
            note={`${READINESS.blaupunkt.parsed} models parsed from the ${READINESS.blaupunkt.source} · ${READINESS.blaupunkt.held} held, nearly all for want of a photograph of their own.`}
          />
        </ul>

        {/* blockers ------------------------------------------------ */}
        <h2 className="display-2 mt-16">WHAT'S HOLDING PRODUCTS BACK.</h2>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-ash">
          Grouped by what would fix it, not by which brand it belongs to — one document usually
          clears a whole group at once.
        </p>

        <div className="mt-8 space-y-4">
          {BLOCKERS.filter((b) => b.items.length > 0).map((b) => (
            <details key={b.id} className="card p-5">
              <summary className="flex cursor-pointer flex-wrap items-center gap-x-4 gap-y-2">
                <span className="font-display text-lg font-extrabold uppercase tracking-[-0.02em]">
                  {b.title}
                </span>
                <span className="chip tnum">{b.items.length}</span>
                <span className={`ml-auto text-[11px] uppercase tracking-[0.12em] ${OWNER_TONE[b.owner]}`}>
                  {b.owner}
                </span>
              </summary>

              <p className="mt-4 flex items-start gap-2 border-l-2 border-accent/40 pl-3 text-sm leading-relaxed text-chalk/85">
                <Icon name="arrow" size={14} className="mt-1 shrink-0 text-accent" />
                {b.need}
              </p>

              <div className="mt-4 overflow-x-auto">
                <table className="w-full min-w-[620px] border-collapse text-sm">
                  <thead>
                    <tr className="border-b border-white/10 text-left text-[11px] uppercase tracking-[0.12em] text-dim">
                      <th className="py-2 pr-4 font-medium">Brand</th>
                      <th className="py-2 pr-4 font-medium">Reference</th>
                      <th className="py-2 pr-4 font-medium">Product</th>
                      <th className="py-2 font-medium">Why it's held</th>
                    </tr>
                  </thead>
                  <tbody>
                    {b.items.map((i) => (
                      <tr key={`${i.brand}-${i.ref}-${i.name}`} className="border-b border-white/6 align-top">
                        <td className="py-2 pr-4 text-[11px] uppercase tracking-[0.1em] text-accent">{i.brand}</td>
                        <td className="py-2 pr-4 font-mono text-xs">{i.ref}</td>
                        <td className="py-2 pr-4 text-ash">{i.name}</td>
                        <td className="py-2 text-xs leading-relaxed text-dim">{i.note}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </details>
          ))}
        </div>

        {/* cars ---------------------------------------------------- */}
        <h2 className="display-2 mt-16">CARS.</h2>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-ash">
          {READINESS.cars.listed} listings, {READINESS.cars.liveSources} permitted sources and{" "}
          {READINESS.cars.blockedSources} sources blocked for want of a licence. Listings only ever
          arrive through a source the registry permits — there is no path that adds cars without one.
        </p>

        <ul className="mt-6 space-y-2">
          {SOURCES.map((s) => (
            <li key={s.id} className="card flex flex-wrap items-center gap-x-4 gap-y-2 p-4">
              <span className="font-display text-sm font-extrabold uppercase">{s.name}</span>
              <span
                className={`chip ${
                  s.status === "LIVE" ? "border-accent/40 text-accent" : "border-danger/40 text-danger"
                }`}
              >
                {s.status === "LIVE" ? "Permitted" : "No licence"}
              </span>
              <span className="w-full text-xs leading-relaxed text-dim md:w-auto md:flex-1">
                {s.evidence.note}
              </span>
            </li>
          ))}
        </ul>

        <div className="card mt-6 border-accent/30 bg-accent/5 p-5">
          <p className="font-display text-sm font-extrabold uppercase text-accent">
            The two ways the car count goes up
          </p>
          <ol className="mt-3 space-y-2 text-sm leading-relaxed text-chalk/85">
            <li>
              <span className="font-semibold">1. Own inventory.</span> Cars Motorbotz owns, has
              consigned, or has inspected and photographed. Goes in through the{" "}
              <code className="text-xs text-accent">motorbotz-direct</code> connector with no
              third-party rights involved.
            </li>
            <li>
              <span className="font-semibold">2. Partner dealers.</span> Sign the Dealer Inventory
              Agreement, put its reference in{" "}
              <code className="text-xs text-accent">data/inventory/dealer-feed.json</code>, and the
              dealer pushes stock. Per-vehicle image rights are explicit.
            </li>
          </ol>
          <p className="mt-4 text-xs leading-relaxed text-dim">
            The aggregators above are blocked on cited robots.txt rules and the absence of any data
            agreement. That position is enforced in code by{" "}
            <code className="text-accent">src/lib/inventory/compliance.ts</code>, not by convention.
          </p>
        </div>

        <p className="mt-10 flex flex-wrap items-center gap-4 text-xs text-dim">
          <Link href="/admin/catalog" className="text-accent underline underline-offset-4">
            RECOIL import report
          </Link>
          <Link href="/admin/inventory" className="text-accent underline underline-offset-4">
            Inventory report
          </Link>
          <Link href="/brands" className="text-accent underline underline-offset-4">
            Brands
          </Link>
        </p>
      </div>
    </section>
  );
}

function Brand({ name, live, note }: { name: string; live: number; note: string }) {
  return (
    <li className="card p-4">
      <p className="flex items-baseline gap-2">
        <span className="font-display text-lg font-extrabold uppercase">{name}</span>
        <span className="text-xs text-dim tnum">{live} live</span>
      </p>
      <p className="mt-2 text-xs leading-relaxed text-ash">{note}</p>
    </li>
  );
}
