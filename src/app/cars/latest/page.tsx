import type { Metadata } from "next";
import Link from "next/link";
import { PageHero } from "@/components/layout/PageHero";
import { ListingCard } from "@/components/inventory/ListingCard";
import { SectionHead } from "@/components/ui/Section";
import { Icon } from "@/components/ui/Icon";
import { toCardData } from "@/lib/inventory/card-data";
import { BUCKET_LABEL, bucketFor, formatIST, type Bucket } from "@/lib/inventory/freshness";
import { latestFirst, SNAPSHOT } from "@/lib/inventory/store";
import { LIVE_SOURCES } from "@/lib/inventory/sources";
import { whatsapp } from "@/lib/data/site";

export const metadata: Metadata = {
  title: "Latest Used Cars — Just Listed",
  description:
    "The newest cars in the Riderzpro marketplace, ordered by when they were last verified. Delhi NCR and every other city we cover, with the verification timestamp shown on every listing.",
  alternates: { canonical: "/cars/latest" },
};

const ORDER: Bucket[] = ["today", "yesterday", "this-week", "older"];

export default function LatestCarsPage() {
  const listings = latestFirst();
  const now = Date.now();

  const grouped = ORDER.map((bucket) => ({
    bucket,
    items: listings.filter((l) => bucketFor(l.discoveredAt, now) === bucket).map(toCardData),
  })).filter((g) => g.items.length > 0);

  return (
    <>
      <PageHero
        eyebrow="Latest cars"
        title="JUST LISTED."
        blurb="Ordered by the most recently verified listing. Every card carries the time we last checked it, in IST — so you know how fresh the price is before you call."
        media="luxurySaloonMotion"
        size="sm"
      >
        <dl className="mt-8 grid max-w-2xl grid-cols-2 gap-x-6 gap-y-5 border-t border-tint/12 pt-6 md:grid-cols-4">
          <Stat value={String(SNAPSHOT.totals.listings)} label="Cars listed" />
          <Stat value={String(SNAPSHOT.totals.newToday)} label="Added today" />
          <Stat value={String(SNAPSHOT.totals.priceDrops)} label="Price drops" />
          <Stat value={String(SNAPSHOT.totals.riderzproVerified)} label="Riderzpro verified" />
        </dl>
        <p className="mt-4 text-xs text-dim">Inventory snapshot: {formatIST(SNAPSHOT.generatedAt)}</p>
      </PageHero>

      {/* Sourcing position, stated plainly rather than buried. */}
      <section className="border-b border-tint/8 bg-carbon">
        <div className="shell py-6">
          <div className="card border-gold/25 bg-gold/5 p-5">
            <p className="flex items-center gap-2 font-display text-sm font-extrabold uppercase text-gold">
              <Icon name="shield" size={16} />
              Where these cars come from
            </p>
            <p className="mt-2 max-w-3xl text-xs leading-relaxed text-chalk/85">
              Riderzpro runs its own vehicle network. Inventory comes directly from dealers, fleets,
              private sellers and our own stock — people who choose to put their cars in front of our
              buyers — rather than being copied from another marketplace. Dealers upload the file
              their system already exports, or push straight into our API.
            </p>
            <p className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-xs text-dim">
              <span>Live channels: {LIVE_SOURCES.map((s) => s.name).join(" · ")}</span>
              <Link href="/partners" className="text-accent underline underline-offset-4">
                Have cars to sell?
              </Link>
            </p>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="shell space-y-12">
          {grouped.map((group) => (
            <div key={group.bucket}>
              <SectionHead
                eyebrow={`${group.items.length} car${group.items.length === 1 ? "" : "s"}`}
                title={BUCKET_LABEL[group.bucket].toUpperCase()}
              />
              <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {group.items.map((l) => (
                  <li key={l.id}>
                    <ListingCard listing={l} />
                  </li>
                ))}
              </ul>
            </div>
          ))}

          {grouped.length === 0 && (
            <div className="card p-10 text-center">
              <p className="font-display text-xl uppercase">No inventory published yet</p>
              <p className="mx-auto mt-2 max-w-md text-sm text-ash">
                No source with the necessary rights has supplied vehicles. Onboard a dealer feed or
                add cars directly, and they appear here immediately.
              </p>
            </div>
          )}

          <div className="card flex flex-col items-start justify-between gap-4 p-6 md:flex-row md:items-center">
            <div>
              <p className="font-display text-lg font-extrabold uppercase">Looking for something specific?</p>
              <p className="mt-1 text-sm text-ash">
                Tell us the spec and budget. We source to order across Delhi NCR and our other cities.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <a
                href={whatsapp("Hi Riderzpro, I'm looking for a car. My requirement is: ")}
                target="_blank"
                rel="noreferrer noopener"
                className="btn btn-whatsapp btn-sm"
              >
                <Icon name="whatsapp" size={15} />
                Tell us what you want
              </a>
              <Link href="/cars" className="btn btn-outline btn-sm">
                Browse all with filters
              </Link>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div>
      <dd className="font-display text-2xl font-extrabold tnum md:text-3xl">{value}</dd>
      <dt className="mt-1 text-[11px] uppercase tracking-[0.14em] text-dim">{label}</dt>
    </div>
  );
}
