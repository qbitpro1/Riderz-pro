import type { Metadata } from "next";
import Link from "next/link";
import { PageHero } from "@/components/layout/PageHero";
import { Icon, type IconName } from "@/components/ui/Icon";
import { Reveal } from "@/components/ui/Reveal";
import { SectionHead } from "@/components/ui/Section";
import { pageMeta } from "@/lib/data/seo";

export const metadata: Metadata = pageMeta({
  title: "Sell on Riderzpro: Online Across India and in Your Own Shop",
  description:
    "Get verified on Riderzpro, sell your car and bike accessories online to customers across India, and show your stock in your own shop on a tablet or TV with the Offline Store screen.",
  path: "/vendor",
});

type Card = { icon: IconName; title: string; body: string };

const ONLINE: Card[] = [
  {
    icon: "bag",
    title: "Listed on the Riderzpro website",
    body: "Your approved products appear in the shop and department pages, with a storefront of your own and your name on every product: Sold by your store.",
  },
  {
    icon: "map",
    title: "Customers across India",
    body: "Shoppers order from anywhere in India through the Riderzpro checkout. You pack and ship; the dashboard tracks every order and payout.",
  },
  {
    icon: "shield",
    title: "A verified seller badge",
    body: "Every seller passes a six-step KYC check, and our team approves each product before it goes live.",
  },
];

const OFFLINE: Card[] = [
  {
    icon: "car",
    title: "An order screen for your shop",
    body: "Show your available stock on a tablet or TV in your store. Customers browse by category, add products to an order and show it at your counter.",
  },
  {
    icon: "build",
    title: "One catalogue, two places",
    body: "The products you list for the website appear on the screen too. A product that runs out of stock leaves both by itself.",
  },
  {
    icon: "wrench",
    title: "Locked to your store",
    body: "The screen runs full screen and only your password closes it, so customers never reach your dashboard. An unattended order clears itself.",
  },
];

const STEPS = [
  { n: "01", t: "Sign up", b: "Create your seller account with an email and mobile number." },
  { n: "02", t: "Complete KYC", b: "Six short steps: tax details, store, pickup address, bank account and documents." },
  { n: "03", t: "Get approved", b: "Our team reviews applications in 1 to 2 working days and tells you if anything needs fixing." },
  { n: "04", t: "List products", b: "Add your products with photos, price, stock and the cars they fit. We review each before it goes live." },
  { n: "05", t: "Sell online", b: "Approved products go on the Riderzpro website. Accept orders, pack, ship and get paid after delivery." },
  { n: "06", t: "Open your Offline Store", b: "Sign in on your shop's tablet or TV and tap Open Offline Store to show your stock to walk-in customers." },
];

function CardGrid({ cards }: { cards: Card[] }) {
  return (
    <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {cards.map((b, i) => (
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
  );
}

const NEEDS = [
  "A GSTIN, or a PAN if you are not GST-registered",
  "A bank account in the name of your business (or yours)",
  "A cancelled cheque or bank statement for that account",
  "Your shop or pickup address",
];

export default function VendorLandingPage() {
  return (
    <>
      <PageHero
        eyebrow="Sell on Riderzpro"
        title="SELL ONLINE. SERVE WALK-INS."
        blurb="Get verified once. Sell your accessories to customers across India on Riderzpro, and show your stock in your own shop on a tablet or TV with the Offline Store screen."
        media="heroWorkshopNight"
        size="md"
        actions={[
          { href: "/vendor/auth?mode=signup", label: "Become a vendor", variant: "primary" },
          { href: "/vendor/auth", label: "Vendor sign in", variant: "outline" },
        ]}
      />

      <section className="section">
        <div className="shell">
          <SectionHead eyebrow="1. Sell online" title="YOUR PRODUCTS ON RIDERZPRO, ACROSS INDIA." />
          <CardGrid cards={ONLINE} />
        </div>
      </section>

      <section className="section border-t border-tint/8">
        <div className="shell">
          <SectionHead eyebrow="2. Offline Store screen" title="YOUR STOCK ON A SCREEN IN YOUR SHOP." />
          <CardGrid cards={OFFLINE} />
        </div>
      </section>

      <section className="section border-y border-tint/8 bg-carbon">
        <div className="shell">
          <SectionHead eyebrow="How it works" title="FROM SIGN-UP TO YOUR FIRST ORDER." />
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
              There is no fee to open a store. On orders placed on the Riderzpro website, Riderzpro takes a commission on each delivered
              order at a rate agreed with you at approval, plus 18% GST on the commission.
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
