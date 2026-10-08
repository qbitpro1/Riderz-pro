import type { Metadata } from "next";
import { PageHero } from "@/components/layout/PageHero";
import { CompareTool, type CompareRow } from "@/components/recoil/CompareTool";
import { COMPARE_FIELDS, COMING_SOON, PRODUCTS } from "@/lib/data/recoil";

export const metadata: Metadata = {
  title: "Compare RECOIL Products",
  description:
    "Put any RECOIL amplifiers, speakers or subwoofers side by side. Only specifications published by the manufacturer are compared — nothing is estimated to fill a gap.",
  alternates: { canonical: "/compare" },
};

export default function ComparePage() {
  // The table values are resolved server-side so the browser never receives the
  // full catalogue — or the dealer pricing attached to it.
  const rows: CompareRow[] = PRODUCTS.concat(COMING_SOON).map((p) => ({
    sku: p.sku,
    slug: p.slug,
    name: p.priceListName,
    category: p.category,
    image: p.images[0]?.url ?? null,
    fields: Object.fromEntries(COMPARE_FIELDS.map((f) => [f.label, f.get(p)])),
  }));

  return (
    <>
      <PageHero
        eyebrow="Compare"
        title="SPEC AGAINST SPEC."
        blurb="RLX65 against RX65 against RM65-4P. SPL4200.4 against DII1400.5. Up to four products, side by side, using only the figures RECOIL publishes."
        media="studioMonitors"
        size="sm"
      />

      <section className="section">
        <div className="shell">
          <CompareTool rows={rows} fieldOrder={COMPARE_FIELDS.map((f) => f.label)} />
        </div>
      </section>
    </>
  );
}
