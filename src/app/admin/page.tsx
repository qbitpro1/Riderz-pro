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
  Bike,
  Route,
  Wallet,
  PackageCheck,
  Rocket,
  ShoppingBag,
  Store,
  Users,
  UserCog,
  TicketPercent,
  Contact,
  ChartColumn,
  ScrollText,
  type LucideIcon,
} from "lucide-react";
import { adminCounts } from "@/lib/server/admin-vendors";
import { openCustomerTickets } from "@/lib/server/admin-customers";
import { riderCounts } from "@/lib/server/riders";
import { adminPage } from "@/lib/server/admin-auth";
import { can, ROLE_LABELS, type AdminPerm } from "@/lib/admin/roles";
import { AdminSignOut } from "@/components/admin/team/AdminSignOut";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Admin",
  description: "Internal hub for every admin tool.",
  robots: { index: false, follow: false, nocache: true },
};

type Tile = { href: string; title: string; text: string; icon: LucideIcon; perm: AdminPerm; count?: number | null };

export default async function AdminHub({ searchParams }: { searchParams: Promise<{ denied?: string }> }) {
  const me = await adminPage(null, "/admin");
  const { denied } = await searchParams;
  const [counts, customerMessages, riders] = await Promise.all([adminCounts(), openCustomerTickets(), riderCounts()]);
  const marketplace: Tile[] = [
    { href: "/admin/vendors", perm: "sellers", title: "Seller KYC", text: "Applications, documents, approve or reject.", icon: Users, count: counts?.kyc },
    { href: "/admin/vendor-products", perm: "sellers", title: "Seller products", text: "Approve new products and edits to live ones.", icon: PackageCheck, count: counts?.products },
    { href: "/admin/change-requests", perm: "sellers", title: "Bank changes", text: "Verify and approve payout account changes.", icon: Landmark, count: counts?.changeRequests },
    { href: "/admin/orders", perm: "orders.view", title: "Seller orders", text: "Orders split by seller, cancellations, returns.", icon: ShoppingBag },
    { href: "/admin/payouts", perm: "payouts", title: "Payouts", text: "Settlements due and payments made to sellers.", icon: Banknote },
    { href: "/admin/support", perm: "support", title: "Seller support", text: "Tickets raised from the seller portal.", icon: LifeBuoy, count: counts?.tickets },
    { href: "/admin/customers", perm: "customers", title: "Customers", text: "Accounts, their orders, addresses and messages.", icon: Contact },
    { href: "/admin/reports", perm: "reports", title: "Reports", text: "Sales, commission, payments and riders by date; orders CSV.", icon: ChartColumn },
    { href: "/admin/coupons", perm: "coupons", title: "Coupons", text: "Checkout codes and the public Offers page.", icon: TicketPercent },
    { href: "/admin/customer-support", perm: "support", title: "Customer messages", text: "Help-desk messages from shoppers.", icon: MessagesSquare, count: customerMessages },
  ];
  const delivery: Tile[] = [
    { href: "/admin/riders", perm: "riders", title: "Riders", text: "Rider applications, approvals and suspensions.", icon: Bike, count: riders?.applied },
    { href: "/admin/dispatch", perm: "dispatch", title: "Dispatch", text: "Give Delhi NCR seller orders to riders.", icon: Route, count: riders?.ready },
    { href: "/admin/rider-payouts", perm: "payouts", title: "Rider payouts", text: "Earnings due and payments made to riders.", icon: Wallet },
  ];
  const team: Tile[] = [
    { href: "/admin/team", perm: "team", title: "Team", text: "Team logins, roles, invites and password resets.", icon: UserCog },
    { href: "/admin/audit", perm: "audit", title: "Audit log", text: "Every sign-in, decision and change, newest first.", icon: ScrollText },
  ];
  const site: Tile[] = [
    { href: "/admin/catalog", perm: "catalog", title: "Catalogue report", text: "House catalogue import and data quality.", icon: ClipboardList },
    { href: "/admin/inventory", perm: "catalog", title: "Inventory", text: "Used-car sources, freshness and compliance.", icon: Boxes },
    { href: "/admin/launch", perm: "catalog", title: "Launch readiness", text: "What is live, held back, and what unblocks it.", icon: Rocket },
    { href: "/admin/ppf", perm: "catalog", title: "PPF", text: "Paint protection film tools.", icon: BadgeCheck },
    { href: "/admin/be-6", perm: "catalog", title: "BE 6 programme", text: "Flagship programme admin.", icon: CarFront },
    { href: "/admin/shopify", perm: "catalog", title: "Shopify export", text: "Product CSV for the Shopify import.", icon: FileSearch },
  ];

  const mine = (tiles: Tile[]) => tiles.filter((t) => can(me.role, t.perm));
  const section = (title: React.ReactNode, tiles: Tile[]) =>
    mine(tiles).length > 0 ? (
      <>
        <h2 className="mt-10 flex items-center gap-2 font-display text-sm font-extrabold uppercase tracking-[0.08em] text-ash">{title}</h2>
        {grid(mine(tiles))}
      </>
    ) : null;

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
        <p className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-ash">
          <span>
            Signed in as <span className="font-semibold text-chalk">{me.name}</span> · {ROLE_LABELS[me.role]}
            {me.source === "dev" ? " (development, no login set)" : ""}
          </span>
          {me.source !== "dev" && <AdminSignOut />}
        </p>
        {denied ? (
          <p role="alert" className="mt-4 rounded-sm border border-gold/40 p-3 text-sm text-gold">
            Your role ({ROLE_LABELS[me.role]}) doesn&apos;t include that page. Ask the owner if you need it.
          </p>
        ) : null}
        {counts === null ? <p className="mt-4 text-sm text-gold">The marketplace database is not reachable, so queue counts are hidden.</p> : null}

        {section(<><Store size={16} aria-hidden /> Marketplace</>, marketplace)}
        {section(<><Bike size={16} aria-hidden /> Riders (Delhi NCR)</>, delivery)}
        {section(<><UserCog size={16} aria-hidden /> Team</>, team)}
        {section("Site", site)}
      </div>
    </section>
  );
}
