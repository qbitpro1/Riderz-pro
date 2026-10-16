import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { VendorAuth } from "@/components/vendor/auth/VendorAuth";
import { currentVendor } from "@/lib/server/session";
import { vendorHome } from "@/lib/vendor/types";

export const metadata: Metadata = {
  title: "Seller sign in",
  description: "Sign in to or create your Riderzpro seller account.",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

type Search = { mode?: string | string[]; next?: string | string[] };
const first = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);

export default async function VendorAuthPage({ searchParams }: { searchParams: Promise<Search> }) {
  const sp = await searchParams;
  const vendor = await currentVendor();
  if (vendor) redirect(vendorHome(vendor.status));

  const next = first(sp.next);
  return (
    <main className="shell pb-16 pt-28 md:pb-24 md:pt-36">
      <VendorAuth initialMode={first(sp.mode) === "signup" ? "signup" : "signin"} next={next && next.startsWith("/vendor/") ? next : null} />
    </main>
  );
}
