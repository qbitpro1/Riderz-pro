import type { Metadata } from "next";
import Link from "next/link";
import { PageHero } from "@/components/layout/PageHero";
import { AutoformSelector, type DesignCard } from "@/components/autoform/AutoformSelector";
import { BrandShopBar } from "@/components/catalog/BrandShopBar";
import { SectionHead } from "@/components/ui/Section";
import { Icon } from "@/components/ui/Icon";
import {
  ACCESSORIES,
  BOOT_MATS,
  CATALOGUE_SUMMARY,
  DESIGNS,
  DESIGNS_AWAITING_CATALOGUE,
  DESIGN_FEATURES,
  MATS,
  NOT_IN_SOURCE,
  PRICE_BANDS,
  PRICE_NOTES,
  accessoryPublishable,
  accessorySellingPrice,
  bandFor,
  priceFor,
} from "@/lib/autoform/catalog";
import { rupees } from "@/lib/format";
import { whatsapp } from "@/lib/data/site";

export const metadata: Metadata = {
  title: "Autoform Seat Covers — Car-Specific Designs & Prices",
  description:
    "Genuine Autoform seat covers at Riderzpro. 20 designs across the Eco and Signature series, priced for 5-seater and 7-seater cars, with fitting at our workshops.",
  alternates: { canonical: "/autoform" },
};

export default function AutoformPage() {
  const cards: DesignCard[] = DESIGNS.map((d) => {
    const band = bandFor(d);
    const two = priceFor(d, 2);
    const three = priceFor(d, 3);
    return {
      code: d.code,
      slug: d.slug,
      tagline: d.tagline,
      series: band.series,
      seriesGroup: band.seriesGroup,
      image: d.image,
      price: {
        two: { mrp: two.mrp, selling: two.sellingPrice },
        three: { mrp: three.mrp, selling: three.sellingPrice },
      },
    };
  });

  const cheapest = Math.min(...cards.map((c) => c.price.two.selling));

  return (
    <>
      <PageHero
        eyebrow="Genuine Autoform · Authorised Riderzpro reseller"
        title="SEATS THAT LOOK BUILT IN."
        blurb={`Twenty Autoform designs across the Eco and Signature series, cut to your car rather than pulled over it. From ${rupees(cheapest)} for a 5-seater set, fitted at a Riderzpro workshop.`}
        media="cockpitScreen"
        actions={[
          { href: "#designs", label: "Browse designs", variant: "primary" },
          {
            href: whatsapp("Hi Riderzpro, I want Autoform seat covers for my "),
            label: "Get a quote",
            variant: "outline",
            external: true,
          },
        ]}
      />

      <BrandShopBar brand="autoform" />

      <section className="section" id="designs">
        <div className="shell">
          <AutoformSelector designs={cards} />
        </div>
      </section>

      {/* what the manufacturer states ------------------------------- */}
      <section className="section border-y border-white/8 bg-carbon">
        <div className="shell grid gap-8 lg:grid-cols-2 lg:items-start">
          <div>
            <SectionHead eyebrow="From the Autoform catalogue" title="WHAT EVERY DESIGN CARRIES." />
            <ul className="grid gap-2 sm:grid-cols-2">
              {DESIGN_FEATURES.map((f) => (
                <li key={f} className="flex items-center gap-2 border border-white/8 bg-white/2 p-3 text-sm text-ash">
                  <Icon name="check" size={14} className="shrink-0 text-accent" />
                  {f}
                </li>
              ))}
            </ul>
            <p className="mt-4 text-xs leading-relaxed text-dim">
              These are the feature marks printed on every design page of the Autoform 2024
              catalogue, reproduced as stated.
            </p>
          </div>

          <div className="card border-gold/25 bg-gold/5 p-5">
            <p className="flex items-center gap-2 font-display text-sm font-extrabold uppercase text-gold">
              <Icon name="shield" size={16} />
              What we do not publish
            </p>
            <p className="mt-2 text-xs leading-relaxed text-chalk/85">
              Neither the catalogue nor the price list states the following, so we show them as
              &ldquo;not specified by manufacturer&rdquo; rather than filling them in:
            </p>
            <ul className="mt-3 flex flex-wrap gap-1.5">
              {NOT_IN_SOURCE.map((n) => (
                <li key={n} className="chip text-[10px] text-dim">
                  {n}
                </li>
              ))}
            </ul>
            <p className="mt-3 text-xs leading-relaxed text-chalk/85">
              Airbag compatibility in particular is a safety question. Ask us and we will confirm it
              with Autoform for your exact car before anything is fitted.
            </p>
          </div>
        </div>
      </section>

      {/* series pricing --------------------------------------------- */}
      <section className="section">
        <div className="shell">
          <SectionHead
            eyebrow="Pricing"
            title="PRICED BY SERIES AND SEAT ROWS."
            blurb="Autoform prices by design series and by how many rows your car has. That is the whole of it — no hidden vehicle loading."
          />
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] border-collapse text-sm">
              <thead>
                <tr className="border-b border-white/12 text-left text-[10px] uppercase tracking-[0.14em] text-dim">
                  <th className="p-2.5">Series</th>
                  <th className="p-2.5">Designs</th>
                  <th className="p-2.5 text-right">5-seater MRP</th>
                  <th className="p-2.5 text-right">Riderzpro</th>
                  <th className="p-2.5 text-right">7-seater MRP</th>
                  <th className="p-2.5 text-right">Riderzpro</th>
                </tr>
              </thead>
              <tbody>
                {PRICE_BANDS.map((band) => {
                  const sample = DESIGNS.find((d) => d.bandId === band.id);
                  const two = sample ? priceFor(sample, 2) : null;
                  const three = sample ? priceFor(sample, 3) : null;
                  return (
                    <tr key={band.id} className="border-b border-white/8 align-top">
                      <td className="p-2.5 text-xs">{band.series}</td>
                      <td className="max-w-sm p-2.5 text-[11px] text-dim">{band.designsListed.join(", ")}</td>
                      <td className="p-2.5 text-right text-xs tnum">{rupees(band.twoRow.mrp)}</td>
                      <td className="p-2.5 text-right text-xs font-semibold tnum">
                        {two ? rupees(two.sellingPrice) : "—"}
                      </td>
                      <td className="p-2.5 text-right text-xs tnum">{rupees(band.threeRow.mrp)}</td>
                      <td className="p-2.5 text-right text-xs font-semibold tnum">
                        {three ? rupees(three.sellingPrice) : "—"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <ul className="mt-4 space-y-1.5">
            {PRICE_NOTES.map((n) => (
              <li key={n} className="flex items-start gap-2 text-xs text-dim">
                <Icon name="check" size={12} className="mt-0.5 shrink-0 text-accent" />
                {n}
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* mats -------------------------------------------------------- */}
      <section className="section border-y border-white/8 bg-carbon" id="mats">
        <div className="shell">
          <SectionHead
            eyebrow="Also from Autoform"
            title="MATS AND BOOT LINERS."
            blurb="Same price list, same logic — by design and row count. Boot mats are the one place Autoform publishes real per-model sizing."
          />
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] border-collapse text-sm">
              <thead>
                <tr className="border-b border-white/12 text-left text-[10px] uppercase tracking-[0.14em] text-dim">
                  <th className="p-2.5">Design</th>
                  <th className="p-2.5">Colours</th>
                  <th className="p-2.5 text-right">2-row MRP</th>
                  <th className="p-2.5 text-right">3-row MRP</th>
                </tr>
              </thead>
              <tbody>
                {MATS.map((m) => (
                  <tr key={m.sno} className="border-b border-white/8">
                    <td className="p-2.5 text-xs">
                      {m.design}
                      <span className="ml-2 text-[10px] text-dim">{m.category}</span>
                    </td>
                    <td className="p-2.5 text-[11px] text-ash">
                      {m.colours.length ? m.colours.join(", ") : <span className="text-dim">Not specified</span>}
                    </td>
                    <td className="p-2.5 text-right text-xs tnum">
                      {m.twoRow.mrp ? rupees(m.twoRow.mrp) : <span className="text-dim">Not specified</span>}
                    </td>
                    <td className="p-2.5 text-right text-xs tnum">
                      {m.threeRow.mrp ? rupees(m.threeRow.mrp) : <span className="text-dim">Not specified</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="card mt-6 p-5">
            <p className="font-display text-sm font-extrabold uppercase">Boot mat sizing</p>
            <p className="mt-2 text-xs text-dim">{BOOT_MATS.note}</p>
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <div>
                <p className="label">Small</p>
                <p className="text-[11px] leading-relaxed text-ash">{BOOT_MATS.sizing.SMALL}</p>
              </div>
              <div>
                <p className="label">Big</p>
                <p className="text-[11px] leading-relaxed text-ash">{BOOT_MATS.sizing.BIG}</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* accessories -------------------------------------------------- */}
      <section className="section" id="accessories">
        <div className="shell">
          <SectionHead
            eyebrow="Autoform accessories"
            title="THE REST OF THE CABIN."
            blurb={`${CATALOGUE_SUMMARY.accessoriesPublishable} of ${CATALOGUE_SUMMARY.accessories} accessory lines are listed. The rest carry a price in the sheet but no product name — we are not guessing what they are.`}
          />
          <ul className="grid grid-cols-2 gap-3 md:grid-cols-4">
            {ACCESSORIES.filter(accessoryPublishable).map((a) => (
              <li key={a.sno} className="card p-4">
                <p className="text-[10px] uppercase tracking-[0.12em] text-dim">{a.category}</p>
                <p className="mt-1 text-sm font-semibold leading-snug">{a.productName}</p>
                <p className="mt-2 flex items-baseline gap-2">
                  <span className="font-display text-base font-extrabold tnum">{rupees(accessorySellingPrice(a))}</span>
                  <span className="text-[11px] text-dim line-through tnum">{rupees(a.mrp)}</span>
                </p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* awaiting ---------------------------------------------------- */}
      <section className="section border-t border-white/8 bg-carbon">
        <div className="shell grid gap-8 lg:grid-cols-2 lg:items-start">
          <div>
            <SectionHead eyebrow="Not listed yet" title="TEN MORE DESIGNS." />
            <p className="text-sm leading-relaxed text-ash">
              These are named and priced in the Autoform price list but do not appear in the 2024
              catalogue we have read. They are almost certainly in the Brand Store Exclusive
              catalogue. Until we have the design page and an image, we will not list them — asking
              for one by name works today.
            </p>
            <ul className="mt-4 flex flex-wrap gap-2">
              {DESIGNS_AWAITING_CATALOGUE.map((d) => (
                <li key={d.listedAs} className="chip text-dim">
                  {d.listedAs}
                </li>
              ))}
            </ul>
          </div>

          <div className="card p-6">
            <p className="font-display text-lg font-extrabold uppercase">Book a fitting</p>
            <p className="mt-2 text-sm text-ash">
              Autoform sets are made to order for your car. We take the order, confirm the pattern for
              your exact variant, and fit it at the workshop — usually about two hours.
            </p>
            <a
              href={whatsapp("Hi Riderzpro, I want to book Autoform seat cover fitting. My car is: ")}
              target="_blank"
              rel="noreferrer noopener"
              className="btn btn-whatsapp btn-block mt-5"
            >
              <Icon name="whatsapp" size={16} />
              Book Autoform installation
            </a>
            <Link href="/garage" className="btn btn-outline btn-block mt-3">
              Workshop and locations
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
