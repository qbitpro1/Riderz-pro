import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Photo } from "@/components/ui/Photo";
import { Icon } from "@/components/ui/Icon";
import { Breadcrumbs } from "@/components/layout/PageHero";
import { SectionHead } from "@/components/ui/Section";
import { ProductCard } from "@/components/shop/ProductCard";
import { BuildCard } from "@/components/community/Cards";
import { BUILDS, getBuild } from "@/lib/data/community";
import { getProduct } from "@/lib/data/products";
import { rupees } from "@/lib/format";
import { whatsapp } from "@/lib/data/site";
import { MEDIA } from "@/lib/media";

export function generateStaticParams() {
  return BUILDS.map((b) => ({ slug: b.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const build = getBuild(slug);
  if (!build) return {};
  return {
    title: `${build.title} — ${build.vehicle} Build`,
    description: `${build.brief} Full modification list and a build cost of ${rupees(build.cost)}.`,
    alternates: { canonical: `/builds/${build.slug}` },
    openGraph: { title: build.title, description: build.brief, images: [MEDIA[build.image].src] },
  };
}

export default async function BuildDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const build = getBuild(slug);
  if (!build) notFound();

  const shopItems = build.shop.map(getProduct).filter(Boolean);
  const others = BUILDS.filter((b) => b.slug !== build.slug).slice(0, 3);

  return (
    <>
      <section data-theme="dark" className="relative min-h-[70svh] overflow-hidden pt-14 md:pt-[68px]">
        <div className="absolute inset-0">
          <Photo media={build.image} sizes="100vw" priority />
          <div className="absolute inset-0 scrim" />
        </div>
        <div className="shell relative flex min-h-[calc(70svh-56px)] flex-col justify-end pb-12 pt-16">
          <span className="chip mb-4 self-start border-accent/35 bg-accent/12 text-accent">{build.tag}</span>
          <h1 className="display-1">{build.title}</h1>
          <p className="mt-3 text-base text-ash">{build.vehicle}</p>
          <dl className="mt-8 grid max-w-xl grid-cols-2 gap-x-6 gap-y-4 border-t border-tint/12 pt-6 sm:grid-cols-4">
            <Stat label="Build cost" value={rupees(build.cost)} />
            <Stat label="Time in shop" value={`${build.weeks} weeks`} />
            <Stat label="Owner" value={build.owner} />
            <Stat label="City" value={build.city} />
          </dl>
        </div>
      </section>

      <section className="section">
        <div className="shell">
          <Breadcrumbs
            items={[
              { label: "Home", href: "/" },
              { label: "Builds", href: "/builds" },
              { label: build.title },
            ]}
          />

          <div className="grid gap-10 lg:grid-cols-[1.5fr_1fr] lg:items-start">
            <div>
              <h2 className="display-3">THE BRIEF</h2>
              <p className="mt-3 max-w-xl text-sm leading-relaxed text-ash md:text-base">{build.brief}</p>

              <h2 className="display-3 mt-10">MODIFICATIONS</h2>
              <ul className="mt-4 divide-y divide-tint/8 border-y border-tint/8">
                {build.mods.map((group) => (
                  <li key={group.group} className="flex flex-col gap-2 py-4 sm:flex-row sm:gap-8">
                    <span className="w-36 shrink-0 font-display text-[11px] font-bold uppercase tracking-[0.14em] text-accent">
                      {group.group}
                    </span>
                    <ul className="flex-1 space-y-1.5">
                      {group.items.map((item) => (
                        <li key={item} className="flex items-start gap-2 text-sm text-ash">
                          <Icon name="check" size={13} className="mt-1 shrink-0 text-accent/70" />
                          {item}
                        </li>
                      ))}
                    </ul>
                  </li>
                ))}
              </ul>

              <h2 className="display-3 mt-10">GALLERY</h2>
              <ul className="mt-4 grid grid-cols-2 gap-3">
                {build.gallery.map((g, i) => (
                  <li key={`${g}-${i}`} className="relative aspect-[4/3] overflow-hidden bg-graphite">
                    <Photo media={g} sizes="(min-width:768px) 33vw, 46vw" />
                  </li>
                ))}
              </ul>
            </div>

            <aside className="lg:sticky lg:top-24">
              <div className="card p-5">
                <p className="label mb-1">Total build cost</p>
                <p className="font-display text-4xl font-extrabold tracking-[-0.04em] tnum">
                  {rupees(build.cost)}
                </p>
                <p className="mt-1 text-xs text-dim">Parts, labour and GST, as invoiced.</p>

                <Link href="/build" className="btn btn-accent btn-block mt-5">
                  Build something like this
                  <Icon name="arrow" size={15} />
                </Link>
                <a
                  href={whatsapp(`Hi Riderzpro, I want a build like ${build.title} (${build.vehicle}). My car is: `)}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="btn btn-whatsapp btn-block mt-3"
                >
                  <Icon name="whatsapp" size={16} />
                  Ask about this build
                </a>
              </div>
            </aside>
          </div>
        </div>
      </section>

      {shopItems.length > 0 && (
        <section className="section border-y border-tint/8 bg-carbon">
          <div className="shell">
            <SectionHead eyebrow="Shop the build" title="THE PARTS ON THIS CAR." href="/shop" hrefLabel="Shop all" />
            <ul className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4">
              {shopItems.map((p) => (
                <li key={p!.slug}>
                  <ProductCard product={p!} />
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}

      <section className="section">
        <div className="shell">
          <SectionHead eyebrow="More builds" title="KEEP SCROLLING." href="/builds" />
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {others.map((b) => (
              <li key={b.slug}>
                <BuildCard build={b} />
              </li>
            ))}
          </ul>
        </div>
      </section>
    </>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dd className="font-display text-lg font-extrabold tracking-[-0.02em] tnum">{value}</dd>
      <dt className="mt-1 text-[10px] uppercase tracking-[0.14em] text-dim">{label}</dt>
    </div>
  );
}
