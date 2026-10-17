import type { Metadata } from "next";
import Link from "next/link";
import {
  BadgeCheck,
  Banknote,
  Boxes,
  CarFront,
  ClipboardList,
  FileSearch,
  Landmark,
  LifeBuoy,
  MessagesSquare,
  PackageCheck,
  Rocket,
  ShoppingBag,
  Store,
  Users,
  type LucideIcon,
} from "lucide-react";
import { adminCounts } from "@/lib/server/admin-vendors";
import { openCustomerTickets } from "@/lib/server/admin-customers";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Admin",
  description: "Internal hub for every admin tool.",
  robots: { index: false, follow: false, nocache: true },
};

type Tile = { href: string; title: string; text: string; icon: LucideIcon; count?: number | null };

export default async function AdminHub() {
  const [counts, customerMessages] = await Promise.all([adminCounts(), openCustomerTickets()]);
  const marketplace: Tile[] = [
    { href: "/admin/vendors", title: "Seller KYC", text: "Applications, documents, approve or reject.", icon: Users, count: counts?.kyc },
    { href: "/admin/vendor-products", title: "Seller products", text: "Approve new products and edits to live ones.", icon: PackageCheck, count: counts?.products },
    { href: "/admin/change-requests", title: "Bank changes", text: "Verify and approve payout account changes.", icon: Landmark, count: counts?.changeRequests },
    { href: "/admin/orders", title: "Seller orders", text: "Orders split by seller, cancellations, returns.", icon: ShoppingBag },
    { href: "/admin/payouts", title: "Payouts", text: "Settlements due and payments made to sellers.", icon: Banknote },
    { href: "/admin/support", title: "Seller support", text: "Tickets raised from the seller portal.", icon: LifeBuoy, count: counts?.tickets },
    { href: "/admin/customer-support", title: "Customer messages", text: "Help-desk messages from shoppers.", icon: MessagesSquare, count: customerMessages },
  ];
  const site: Tile[] = [
    { href: "/admin/catalog", title: "Catalogue report", text: "House catalogue import and data quality.", icon: ClipboardList },
    { href: "/admin/inventory", title: "Inventory", text: "Used-car sources, freshness and compliance.", icon: Boxes },
    { href: "/admin/launch", title: "Launch readiness", text: "What is live, held back, and what unblocks it.", icon: Rocket },
    { href: "/admin/ppf", title: "PPF", text: "Paint protection film tools.", icon: BadgeCheck },
    { href: "/admin/be-6", title: "BE 6 programme", text: "Flagship programme admin.", icon: CarFront },
    { href: "/admin/shopify", title: "Shopify export", text: "Product CSV for the Shopify import.", icon: FileSearch },
  ];

  const grid = (tiles: Tile[]) => (
    <ul className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {tiles.map((t) => (
        <li key={t.href}>
          <Link href={t.href} className="card card-hover flex h-full gap-3 p-4 hover:border-accent/40">
            <t.icon size={22} className="mt-0.5 shrink-0 text-accent" aria-hidden />
            <span className="min-w-0 flex-1">
              <span className="flex items-center justify-between gap-2">
                <span className="font-display text-sm font-extrabold uppercase tracking-[0.04em]">{t.title}</span>
                {t.count ? (
                  <span className="tnum rounded-[2px] bg-accent px-1.5 py-0.5 text-[11px] font-bold text-on-accent" aria-label={`${t.count} waiting`}>{t.count}</span>
                ) : null}
              </span>
              <span className="mt-1 block text-xs leading-relaxed text-ash">{t.text}</span>
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );

  return (
    <section className="section pt-24 md:pt-32">
      <div className="shell">
        <p className="eyebrow mb-3">Internal · not indexed</p>
        <h1 className="display-2">ADMIN</h1>
        {counts === null ? <p className="mt-4 text-sm text-gold">The marketplace database is not reachable, so queue counts are hidden.</p> : null}

        <h2 className="mt-10 flex items-center gap-2 font-display text-sm font-extrabold uppercase tracking-[0.08em] text-ash">
          <Store size={16} aria-hidden /> Marketplace
        </h2>
        {grid(marketplace)}

        <h2 className="mt-10 font-display text-sm font-extrabold uppercase tracking-[0.08em] text-ash">Site</h2>
        {grid(site)}
      </div>
    </section>
  );
}
