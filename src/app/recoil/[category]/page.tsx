import type { Metadata } from "next";
import { pageMeta } from "@/lib/data/seo";
import { notFound } from "next/navigation";
import { PageHero, Breadcrumbs } from "@/components/layout/PageHero";
import { CatalogBrowser } from "@/components/catalog/CatalogBrowser";
import { itemsBySlug } from "@/components/shop/catalogLookup";
import { filtersFromQuery, type CatalogQuery } from "@/lib/catalog";
import { SectionHead } from "@/components/ui/Section";
import { CATEGORIES, getCategory, productsInCategory } from "@/lib/data/recoil";
import type { MediaKey } from "@/lib/media";

export function generateStaticParams() {
  return CATEGORIES.map((c) => ({ category: c.slug }));
}

const HERO: Record<string, { media: MediaKey; line: string }> = {
  amplifiers: { media: "speakerEnclosure", line: "MORE POWER, UNDER CONTROL." },
  speakers: { media: "speakerCone", line: "HEAR EVERY DETAIL." },
  subwoofers: { media: "speakerEnclosure", line: "THE BOTTOM TWO OCTAVES." },
  processors: { media: "studioMonitors", line: "TUNE IT, DON'T GUESS IT." },
  damping: { media: "cockpitScreen", line: "SILENCE FIRST." },
  wiring: { media: "engineBay", line: "THE HALF NOBODY SEES." },
  power: { media: "engineBay", line: "VOLTAGE THAT HOLDS." },
  signal: { media: "studioMonitors", line: "A CLEAN SIGNAL TO START WITH." },
  installation: { media: "mechanicEngine", line: "FITTED PROPERLY." },
  tools: { media: "mechanicEngine", line: "THE RIGHT TOOL." },
  electrical: { media: "engineBay", line: "SWITCHED, FUSED, SAFE." },
  marine: { media: "defenderSaltFlat", line: "BUILT TO GET WET." },
  soundbars: { media: "speakerEnclosure", line: "ONE BOX, DONE." },
  "two-wheeler": { media: "cityNightRain", line: "SOUND ON TWO WHEELS." },
  display: { media: "garageSpotlit", line: "RETAIL DISPLAY." },
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ category: string }>;
}): Promise<Metadata> {
  const { category } = await params;
  const cat = getCategory(category);
  if (!cat) return {};
  return pageMeta({
    title: `RECOIL ${cat.name} — ${cat.count} Models`,
    description: `Buy RECOIL ${cat.name.toLowerCase()} at Riderzpro: ${cat.subcategories
      .slice(0, 6)
      .map((s) => s.name)
      .join(", ")}. Authorised reseller, genuine product, installation available across India.`,
    path: `/recoil/${cat.slug}`,
  });
}

export default async function RecoilCategoryPage({
  params,
  searchParams,
}: {
  params: Promise<{ category: string }>;
  searchParams: Promise<CatalogQuery>;
}) {
  const { category } = await params;
  const query = await searchParams;
  const cat = getCategory(category);
  if (!cat) notFound();

  const items = itemsBySlug(productsInCategory(cat.slug).map((p) => p.slug));
  const filters = { ...filtersFromQuery(query), brands: ["recoil" as const] };
  const hero = HERO[cat.slug] ?? { media: "studioMonitors" as MediaKey, line: cat.name.toUpperCase() };

  return (
    <>
      <PageHero
        eyebrow={`RECOIL ${cat.name}`}
        title={hero.line}
        blurb={`${cat.count} model numbers across ${cat.subcategories.length} product types, imported from the RECOIL May 2026 price list.`}
        media={hero.media}
        size="sm"
      />

      <section className="section">
        <div className="shell">
          <Breadcrumbs
            items={[
              { label: "Home", href: "/" },
              { label: "RECOIL", href: "/recoil" },
              { label: cat.name },
            ]}
          />
          <CatalogBrowser items={items} initial={filters} locked={["brands"]} showBrandOnCards={false} />
        </div>
      </section>

      <section className="section border-t border-tint/8 bg-carbon">
        <div className="shell">
          <SectionHead eyebrow="In this category" title="EVERY PRODUCT TYPE." />
          <ul className="flex flex-wrap gap-2">
            {cat.subcategories.map((s) => (
              <li key={s.slug} className="chip">
                {s.name}
                <span className="tnum opacity-60">{s.count}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </>
  );
}
