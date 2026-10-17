import type { Metadata } from "next";
import Link from "next/link";
import { CopyCode } from "@/components/offers/CopyCode";
import { publicCoupons } from "@/lib/server/coupons";
import { couponOffer, type PublicCoupon } from "@/lib/coupons/types";
import { rupees } from "@/lib/format";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Offers and coupon codes",
  description: "Current Riderzpro coupon codes for car accessories, installation and delivery.",
  alternates: { canonical: "/offers" },
};

const endDate = (iso: string) => new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric", timeZone: "Asia/Kolkata" });

export default async function OffersPage() {
  let offers: PublicCoupon[] = [];
  try {
    offers = await publicCoupons();
  } catch {
    offers = [];
  }

  return (
    <section className="section pt-24 md:pt-32">
      <div className="shell max-w-3xl">
        <p className="eyebrow mb-3">Save on your build</p>
        <h1 className="display-2">OFFERS</h1>
        <p className="mt-3 text-sm text-ash">
          Enter a code in your cart. Codes work on Riderzpro&apos;s own products, installation and delivery; marketplace sellers&apos; items keep their price.
        </p>

        {offers.length === 0 ? (
          <div className="card mt-8 p-6 text-sm text-ash">
            <p>No offers running right now. Check back soon.</p>
            <Link href="/shop" className="mt-3 inline-block font-semibold text-accent underline underline-offset-4">Shop accessories</Link>
          </div>
        ) : (
          <ul className="mt-8 space-y-3">
            {offers.map((o) => (
              <li key={o.code} className="card flex flex-wrap items-center justify-between gap-4 p-5">
                <div className="min-w-0">
                  <p className="font-display text-lg font-extrabold uppercase tracking-[0.04em] text-chalk">{couponOffer(o)}</p>
                  <p className="mt-1 text-sm text-chalk">{o.title}</p>
                  {o.description && <p className="mt-1 text-xs text-ash">{o.description}</p>}
                  <p className="mt-2 text-xs text-dim">
                    {o.minOrder > 0 ? `On orders of ${rupees(o.minOrder)} or more` : "No minimum order"}
                    {o.endsAt ? ` · until ${endDate(o.endsAt)}` : ""}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="rounded-sm border border-dashed border-accent px-3 py-1.5 font-mono text-sm font-bold tracking-[0.12em] text-accent">{o.code}</span>
                  <CopyCode code={o.code} />
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
