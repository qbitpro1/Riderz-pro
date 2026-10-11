import type { Metadata } from "next";
import Link from "next/link";
import { PageHero, Breadcrumbs } from "@/components/layout/PageHero";
import { Photo } from "@/components/ui/Photo";
import { CATALOG } from "@/lib/catalog";
import { COLLECTIONS } from "@/lib/data/collections";

export const metadata: Metadata = {
  title: "Collections — Car Accessories by Price and Offer",
  description: "Bestsellers, price-capped picks, biggest savings, Riderzpro Originals and products we fit for you.",
  alternates: { canonical: "/collections" },
};

export default function CollectionsPage() {
  const collections = COLLECTIONS.map((c) => ({ c, count: CATALOG.filter(c.match).length })).filter((x) => x.count > 0);

  return (
    <>
      <PageHero
        eyebrow="Collections"
        title="SHOP BY PRICE AND OFFER."
        blurb="Curated views of the catalogue. Every count is the number of products in it today."
        media="heroWorkshopNight"
        size="sm"
      />
      <section className="section">
        <div className="shell">
          <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Collections" }]} />
          <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 md:gap-4">
            {collections.map(({ c, count }) => (
              <li key={c.slug}>
                <Link
                  data-theme="dark"
                  href={`/collections/${c.slug}`}
                  className="card card-hover relative flex aspect-[16/10] flex-col justify-end overflow-hidden bg-graphite"
                >
                  <Photo media={c.image} sizes="(min-width:1024px) 32vw, (min-width:640px) 48vw, 92vw" className="zoom opacity-75" />
                  <div className="absolute inset-0 scrim-soft" />
                  <div className="relative p-4">
                    <p className="font-display text-xl font-extrabold leading-tight">{c.name}</p>
                    <p className="mt-1 text-xs text-ash">{c.tagline}</p>
                    <p className="mt-2 text-xs text-accent tnum">
                      {count} product{count === 1 ? "" : "s"}
                    </p>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </>
  );
}
