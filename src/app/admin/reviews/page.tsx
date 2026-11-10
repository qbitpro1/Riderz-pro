import type { Metadata } from "next";
import Link from "next/link";
import { adminPage } from "@/lib/server/admin-auth";
import { listReviewsAdmin } from "@/lib/server/reviews";
import { ReviewModeration } from "@/components/admin/reviews/ReviewModeration";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Reviews", robots: { index: false, follow: false, nocache: true } };

const TABS = [
  ["pending", "Waiting"],
  ["approved", "Approved"],
  ["rejected", "Rejected"],
] as const;

export default async function AdminReviewsPage({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  await adminPage("support", "/admin/reviews");
  const sp = await searchParams;
  const status = sp.status === "approved" || sp.status === "rejected" ? sp.status : "pending";
  const { items, counts } = await listReviewsAdmin(status);
  return (
    <section className="section pt-24 md:pt-32">
      <div className="shell max-w-4xl">
        <Link href="/admin" className="text-xs text-ash underline underline-offset-4 hover:text-accent">Admin</Link>
        <p className="eyebrow mb-3 mt-4">Internal · not indexed</p>
        <h1 className="display-2">REVIEWS</h1>
        <p className="mt-3 text-sm text-ash">
          Written by signed-in customers about orders they received. Nothing is shown on the site until you approve it; approved
          reviews set the products&apos; star ratings and the site&apos;s average rating.
        </p>
        <p className="mt-5 flex flex-wrap gap-4 text-sm">
          {TABS.map(([s, label]) => (
            <Link key={s} href={`/admin/reviews?status=${s}`} className={s === status ? "font-bold text-chalk" : "text-accent underline underline-offset-4"}>
              {label} ({counts[s] ?? 0})
            </Link>
          ))}
        </p>
        <div className="mt-6 space-y-3">
          {items.length === 0 ? <p className="text-sm text-ash">Nothing here.</p> : items.map((r) => <ReviewModeration key={r.id} item={r} />)}
        </div>
      </div>
    </section>
  );
}
