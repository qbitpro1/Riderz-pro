import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PageHero, Breadcrumbs } from "@/components/layout/PageHero";
import { RecoilBrowser } from "@/components/recoil/RecoilBrowser";
import { SectionHead } from "@/components/ui/Section";
import { CATEGORIES, getCategory, productsInCategory, toPublic } from "@/lib/data/recoil";
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
  return {
    title: `RECOIL ${cat.name} — ${cat.count} Models`,
    description: `Buy RECOIL ${cat.name.toLowerCase()} at Riderzpro: ${cat.subcategories
      .slice(0, 6)
      .map((s) => s.name)
      .join(", ")}. Authorised reseller, genuine product, installation available across India.`,
    alternates: { canonical: `/recoil/${cat.slug}` },
  };
}

export default async function RecoilCategoryPage({ params }: { params: Promise<{ category: string }> }) {
  const { category } = await params;
  const cat = getCategory(category);
  if (!cat) notFound();

  const products = productsInCategory(cat.slug).map(toPublic);
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
          <RecoilBrowser products={products} />
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
