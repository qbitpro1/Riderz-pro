import type { Metadata } from "next";
import Link from "next/link";
import { PageHero } from "@/components/layout/PageHero";
import { Icon, type IconName } from "@/components/ui/Icon";
import { Reveal } from "@/components/ui/Reveal";
import { SectionHead } from "@/components/ui/Section";
import { pageMeta } from "@/lib/data/seo";

export const metadata: Metadata = pageMeta({
  title: "Sell on Riderzpro: Become a Vendor for Car & Bike Accessories",
  description:
    "List your car and bike accessories on Riderzpro. Reach owners across India, get a KYC-verified seller badge, manage catalogue, orders and payouts from one dashboard, and be paid to your bank after delivery.",
  path: "/vendor",
});

const BENEFITS: { icon: IconName; title: string; body: string }[] = [
  {
    icon: "car",
    title: "Reach car and bike owners across India",
    body: "Your products sit beside the Riderzpro range in the shop, with fitment search by vehicle, so buyers find the part that fits their car.",
  },
  {
    icon: "shield",
    title: "A KYC-verified marketplace",
    body: "Every seller passes a six-step KYC check before listing. Shoppers see a verified seller badge on your store and your products.",
  },
  {
    icon: "build",
    title: "A seller dashboard of your own",
    body: "Manage your catalogue, stock, prices and orders in one place, with packing slips, invoices and payout statements.",
  },
  {
    icon: "bag",
    title: "Payouts after delivery",
    body: "Once an order is delivered and the return window has passed, your earnings are paid to your bank account, with the commission and GST shown line by line.",
  },
];

const STEPS = [
  { n: "01", t: "Sign up", b: "Create your seller account with an email and mobile number." },
  { n: "02", t: "Complete KYC", b: "Six short steps: tax details, store, pickup address, bank account and documents." },
  { n: "03", t: "Get approved", b: "Our team reviews applications in 1 to 2 working days and tells you if anything needs fixing." },
  { n: "04", t: "List products", b: "Add your products with photos, price, stock and the cars they fit. We review each before it goes live." },
  { n: "05", t: "Ship orders", b: "Accept new orders, pack them and hand them to your courier within your dispatch time." },
  { n: "06", t: "Get paid", b: "Delivered orders settle to your bank account after the return window." },
];

const NEEDS = [
  "A GSTIN, or a PAN if you are not GST-registered",
  "A bank account in the name of your business (or yours)",
  "A cancelled cheque or bank statement for that account",
  "A pickup address where couriers can collect orders",
];

export default function VendorLandingPage() {
  return (
    <>
      <PageHero
        eyebrow="Sell on Riderzpro"
        title="SELL YOUR ACCESSORIES TO INDIA'S CAR AND BIKE OWNERS."
        blurb="Open a verified store on Riderzpro. We bring the buyers and the checkout; you bring the products and ship the orders."
        media="heroWorkshopNight"
        size="md"
        actions={[
          { href: "/vendor/auth?mode=signup", label: "Become a vendor", variant: "primary" },
          { href: "/vendor/auth", label: "Vendor sign in", variant: "outline" },
        ]}
      />

      <section className="section">
        <div className="shell">
          <SectionHead eyebrow="Why sell here" title="BUILT FOR SELLERS WHO SHIP." />
          <ul className="grid gap-3 sm:grid-cols-2">
            {BENEFITS.map((b, i) => (
              <li key={b.title}>
                <Reveal delay={i * 55} className="h-full">
                  <div className="card h-full p-5 md:p-6">
                    <span className="grid h-10 w-10 place-items-center border border-tint/15 text-accent">
                      <Icon name={b.icon} size={20} />
                    </span>
                    <h3 className="mt-4 font-display text-lg font-bold uppercase tracking-[0.03em]">{b.title}</h3>
                    <p className="mt-2 text-sm leading-relaxed text-ash">{b.body}</p>
                  </div>
                </Reveal>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="section border-y border-tint/8 bg-carbon">
        <div className="shell">
          <SectionHead eyebrow="How it works" title="FROM SIGN-UP TO FIRST PAYOUT." />
          <ol className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {STEPS.map((s, i) => (
              <li key={s.n}>
                <Reveal delay={i * 45} className="h-full">
                  <div className="card h-full p-5">
                    <p className="font-display text-3xl font-extrabold text-accent tnum">{s.n}</p>
                    <h3 className="mt-2 font-display text-lg font-bold uppercase tracking-[0.03em]">{s.t}</h3>
                    <p className="mt-2 text-sm leading-relaxed text-ash">{s.b}</p>
                  </div>
                </Reveal>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="section">
        <div className="shell grid gap-8 lg:grid-cols-2 lg:gap-12">
          <div>
            <SectionHead eyebrow="Before you start" title="WHAT YOU NEED." />
            <ul className="space-y-3 text-sm text-ash md:text-base">
              {NEEDS.map((n) => (
                <li key={n} className="flex gap-3">
                  <Icon name="check" size={18} className="mt-0.5 shrink-0 text-accent" />
                  {n}
                </li>
              ))}
            </ul>
          </div>
          <div className="card self-start p-5 md:p-6">
            <p className="eyebrow mb-2">Commission</p>
            <p className="text-sm leading-relaxed text-ash md:text-base">
              There is no fee to open a store. Riderzpro takes a commission on each delivered order, and the rate is agreed with you
              at approval. GST at 18% applies to the commission. Your payout statement shows both.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link href="/vendor/auth?mode=signup" className="btn btn-primary">
                Become a vendor
              </Link>
              <Link href="/vendor/auth" className="btn btn-outline">
                Vendor sign in
              </Link>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
