import type { Metadata } from "next";
import Link from "next/link";
import { CouponsBoard } from "@/components/admin/coupons/CouponsBoard";
import { adminPage } from "@/lib/server/admin-auth";
import { listCoupons } from "@/lib/server/coupons";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Coupons", robots: { index: false, follow: false, nocache: true } };

export default async function AdminCouponsPage() {
  await adminPage("coupons", "/admin/coupons");
  const coupons = await listCoupons();
  return (
    <section className="section pt-24 md:pt-32">
      <div className="shell max-w-3xl">
        <Link href="/admin" className="text-xs text-ash underline underline-offset-4 hover:text-accent">Admin</Link>
        <p className="eyebrow mb-3 mt-4">Internal · not indexed</p>
        <h1 className="display-2">COUPONS</h1>
        <p className="mt-3 text-sm text-ash">
          Codes for checkout. Public ones are listed on <Link href="/offers" className="underline hover:text-accent">/offers</Link>. Cancelled orders don&apos;t count towards the limits.
        </p>
        <div className="mt-8">
          <CouponsBoard coupons={coupons} />
        </div>
      </div>
    </section>
  );
}
