import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AdminSignInForm } from "@/components/admin/team/AdminSignInForm";
import { currentAdmin } from "@/lib/server/admin-auth";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Admin sign in", robots: { index: false, follow: false, nocache: true } };

export default async function AdminSignInPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const { next } = await searchParams;
  const me = await currentAdmin();
  if (me && me.source !== "dev") redirect("/admin");
  return (
    <section className="section pt-24 md:pt-32">
      <div className="shell max-w-md">
        <p className="eyebrow mb-3">Internal · not indexed</p>
        <h1 className="display-2">ADMIN SIGN IN</h1>
        <p className="mt-3 text-sm text-ash">For the Riderzpro team. Sellers sign in at the seller portal.</p>
        <div className="mt-6">
          <AdminSignInForm next={next ?? null} />
        </div>
      </div>
    </section>
  );
}
